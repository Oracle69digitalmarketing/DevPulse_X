// src/codeListener.ts

import * as vscode from 'vscode';
import { parse, ParserOptions } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import { trackCodingActivity, cleanupDocumentState } from './activityTracker';
import { checkFeature, FeatureSupportResult } from './baselineEngine';
import { suggestFix } from './suggestionEngine';
import { autoScaffold } from './scaffolder';
import { addFeatureWarning, applyDecorations, clearDecorations } from './ui/tooltipManager';

// --- Constants for better maintainability ---

const SUPPORTED_LANGUAGE_IDS = [
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact',
];

const BABEL_PARSER_OPTIONS: ParserOptions = {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true, // Crucial for parsing code as the user types
};

const debounceTimers = new Map<string, NodeJS.Timeout>();

/**
 * Activates the core event listeners for DevPulse X.
 */
export function activateCodeListener(context: vscode.ExtensionContext) {
    // === 1️⃣ Listen for text changes to trigger analysis ===
    const changeListener = vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
        const { document } = event;
        if (document.uri.scheme !== 'file' || !SUPPORTED_LANGUAGE_IDS.includes(document.languageId)) {
            return;
        }

        trackCodingActivity(event);

        const uriString = document.uri.toString();
        if (debounceTimers.has(uriString)) {
            clearTimeout(debounceTimers.get(uriString)!);
        }

        const newTimer = setTimeout(() => {
            runAstAnalysis(document);
            debounceTimers.delete(uriString);
        }, 500);

        debounceTimers.set(uriString, newTimer);
    });

    // === 2️⃣ Listen for document closure to clean up state ===
    const closeListener = vscode.workspace.onDidCloseTextDocument((document: vscode.TextDocument) => {
        cleanupDocumentState(document);
        const uriString = document.uri.toString();
        if (debounceTimers.has(uriString)) {
            clearTimeout(debounceTimers.get(uriString)!);
            debounceTimers.delete(uriString);
        }
        clearDecorations(document.uri);
    });

    // === 3️⃣ Register the Auto-Scaffold Command ===
    const scaffoldCmd = vscode.commands.registerCommand('devpulse.autoScaffold', async () => {
        try {
            const componentName = await vscode.window.showInputBox({
                prompt: 'Enter the name for the new component',
                placeHolder: 'MyNewComponent',
                validateInput: (value) => (value?.trim() ? null : 'Component name cannot be empty.'),
            });

            if (componentName) {
                await autoScaffold(componentName.trim());
                vscode.window.showInformationMessage(`✅ Auto-scaffold created: ${componentName.trim()}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`❌ Auto-scaffold failed: ${errorMessage}`);
            console.error('[DevPulse X] Auto-scaffold error:', error);
        }
    });

    context.subscriptions.push(changeListener, closeListener, scaffoldCmd);
}

/**
 * Parses the document, traverses the AST, and applies decorations.
 * This is the heavy lifting function that is debounced for performance.
 */
function runAstAnalysis(doc: vscode.TextDocument) {
    clearDecorations(doc.uri);

    try {
        const ast = parse(doc.getText(), BABEL_PARSER_OPTIONS);

        // Use specific visitor methods for better performance than a generic 'enter'.
        traverse(ast, {
            Identifier(path) {
                // Check for global identifiers that are not part of a member expression.
                if (path.parent.type !== 'MemberExpression' && !path.scope.hasBinding(path.node.name)) {
                    checkForFeature(path.node.name, path);
                }
            },
            MemberExpression(path) {
                // Reconstruct the feature name, e.g., 'Array.prototype.flat'
                const featureName = getFeatureNameFromMemberExpression(path);
                if (featureName) {
                    checkForFeature(featureName, path);
                }
            },
        });
    } catch (err) {
        if (err instanceof Error && err.name !== 'SyntaxError') {
            console.error('[DevPulse X] AST parse error:', err);
        }
    }

    const editor = vscode.window.activeTextEditor;
    if (editor?.document.uri.toString() === doc.uri.toString()) {
        applyDecorations(editor);
    }
}

/**
 * A helper to check a feature and add a warning if it's not baseline-supported.
 */
function checkForFeature(featureName: string, path: NodePath) {
    const support = checkFeature(featureName);

    if (!support.isBaseline && path.node.loc) {
        const fix = suggestFix(featureName);
        const range = new vscode.Range(
            path.node.loc.start.line - 1,
            path.node.loc.start.column,
            path.node.loc.end.line - 1,
            path.node.loc.end.column
        );
        const docUri = path.hub.file.opts.filename ? vscode.Uri.file(path.hub.file.opts.filename) : vscode.window.activeTextEditor!.document.uri;
        addFeatureWarning(docUri, range, support, fix);
    }
}

/**
 * A utility to reconstruct a potential feature name from a MemberExpression path.
 * This is a simplified example and can be expanded.
 */
function getFeatureNameFromMemberExpression(path: NodePath): string | null {
    const property = path.get('property');
    if (property.isIdentifier()) {
        // This is a naive implementation. A more robust solution would
        // try to resolve the type of the object.
        // For now, we'll check for common prototype methods.
        return `Array.prototype.${property.node.name}`;
    }
    return null;
}
