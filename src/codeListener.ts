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

// Use a Map to manage debounce timers for each document independently.
const debounceTimers = new Map<string, NodeJS.Timeout>();

/**
 * Activates the core event listeners for DevPulse X.
 * Handles:
 *  - Typing activity tracking via `activityTracker`.
 *  - Debounced AST analysis for feature compatibility checks.
 *  - Inline fixes + tooltips via `tooltipManager`.
 *  - Auto-scaffolding command.
 */
export function activateCodeListener(context: vscode.ExtensionContext) {
    // === 1️⃣ Listen for text changes to trigger analysis ===
    const changeListener = vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
        const { document } = event;
        const docUri = document.uri;

        // Ignore unsupported languages and virtual documents
        if (docUri.scheme !== 'file' || !SUPPORTED_LANGUAGE_IDS.includes(document.languageId)) {
            return;
        }

        // --- A: Instantaneous Actions (run on every keystroke) ---
        trackCodingActivity(event);

        // --- B: Debounced Heavy Analysis (AST parsing) ---
        const uriString = docUri.toString();
        // Clear any existing timer for this document to reset the debounce period
        if (debounceTimers.has(uriString)) {
            clearTimeout(debounceTimers.get(uriString)!);
        }

        // Set a new timer. The analysis will only run if the user stops typing.
        const newTimer = setTimeout(() => {
            runAstAnalysis(document);
            debounceTimers.delete(uriString); // Clean up the timer after it runs
        }, 500); // A 500ms delay is a good balance between responsiveness and performance.

        debounceTimers.set(uriString, newTimer);
    });

    // === 2️⃣ Listen for document closure to clean up state ===
    const closeListener = vscode.workspace.onDidCloseTextDocument((document: vscode.TextDocument) => {
        // Clean up state from the activity tracker
        cleanupDocumentState(document);
        // Clean up any pending timers
        const uriString = document.uri.toString();
        if (debounceTimers.has(uriString)) {
            clearTimeout(debounceTimers.get(uriString)!);
            debounceTimers.delete(uriString);
        }
        // Clear any visible decorations
        clearDecorations(document.uri);
    });

    context.subscriptions.push(changeListener, closeListener);

    // === 3️⃣ Register the Auto-Scaffold Command ===
    const scaffoldCmd = vscode.commands.registerCommand('devpulse.autoScaffold', async () => {
        try {
            const componentName = await vscode.window.showInputBox({
                prompt: 'Enter the name for the new component',
                placeHolder: 'MyNewComponent',
                validateInput: (value) => (value?.trim() ? null : 'Component name cannot be empty.'),
            });

            if (componentName) {
                const trimmedName = componentName.trim();
                await autoScaffold(trimmedName);
                vscode.window.showInformationMessage(`✅ Auto-scaffold created: ${trimmedName}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`❌ Auto-scaffold failed: ${errorMessage}`);
            console.error('[DevPulse X] Auto-scaffold error:', error);
        }
    });

    context.subscriptions.push(scaffoldCmd);
}

/**
 * Parses the document, traverses the AST, and uses the tooltipManager to apply decorations.
 * This is the heavy lifting function that is debounced for performance.
 * @param doc The document to analyze.
 */
function runAstAnalysis(doc: vscode.TextDocument) {
    // 1. Clear any old decorations from the tooltip manager for this document.
    clearDecorations(doc.uri);

    try {
        const ast = parse(doc.getText(), BABEL_PARSER_OPTIONS);

        traverse(ast, {
            // Traverse more specific nodes for better performance if possible.
            // For now, Identifier and MemberExpression are good starting points.
            enter(path: NodePath) {
                if (path.isIdentifier() || path.isMemberExpression()) {
                    const featureName = path.toString(); // e.g., 'Object.hasOwn'
                    const support: FeatureSupportResult = checkFeature(featureName);

                    // 2. If the feature is not baseline-supported, collect a new decoration.
                    if (!support.isBaseline && path.node.loc) {
                        const fix = suggestFix(featureName);
                        const range = new vscode.Range(
                            path.node.loc.start.line - 1, // Babel lines are 1-based
                            path.node.loc.start.column,
                            path.node.loc.end.line - 1,
                            path.node.loc.end.column
                        );
                        addFeatureWarning(doc.uri, range, support, fix);
                    }
                }
            },
        });
    } catch (err) {
        // Silently log parsing errors, as they are expected while the user is typing.
        if (err instanceof Error && err.name !== 'SyntaxError') {
            console.error('[DevPulse X] AST parse error:', err);
        }
    }

    // 3. Apply all collected decorations at once.
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.uri.toString() === doc.uri.toString()) {
        applyDecorations(editor);
    }
}
