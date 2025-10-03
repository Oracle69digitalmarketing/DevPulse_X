import * as vscode from 'vscode';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import { trackEmotion } from './emotionTracker';
import { checkFeature } from './baselineEngine';
import { suggestFix } from './suggestionEngine';
import { autoScaffold } from './scaffolder';
import { decorateTooltip } from './ui/tooltipManager';

/**
 * Main code listener for DevPulse X.
 * Handles:
 *  - Typing activity & emotion tracking
 *  - Baseline feature compatibility checks
 *  - Inline fixes + tooltips
 *  - Auto-scaffolding command
 */
export function activateCodeListener(context: vscode.ExtensionContext) {
    // === 1️⃣ Listen for text changes in active editor ===
    const disposable = vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
        const doc = event.document;

        if (
            doc.languageId !== 'javascript' &&
            doc.languageId !== 'typescript' &&
            doc.languageId !== 'javascriptreact' &&
            doc.languageId !== 'typescriptreact'
        ) {
            return; // Only run on JS/TS/React code
        }

        const code = doc.getText();

        // --- Track Emotion & Flow ---
        trackEmotion(event);

        // --- AST Parse + Feature Checks ---
        try {
            const ast = parse(code, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript'],
            });

            traverse(ast, {
                enter(path: NodePath) {
                    if (path.isIdentifier() || path.isMemberExpression()) {
                        const feature = path.toString();
                        const support = checkFeature(feature);

                        if (!support.fullySupported) {
                            const fix = suggestFix(feature);
                            const line = path.node.loc?.start.line ?? 0;

                            decorateTooltip(
                                doc.uri,
                                line,
                                support,
                                fix
                            );
                        }
                    }
                },
            });
        } catch (err) {
            console.error('⚠️ AST parse error in DevPulse:', err);
        }
    });

    context.subscriptions.push(disposable);

    // === 2️⃣ Auto-Scaffold Command ===
    const scaffoldCmd = vscode.commands.registerCommand(
        'devpulse:autoScaffold',
        async () => {
            const componentName = await vscode.window.showInputBox({
                prompt: 'Enter component name',
                placeHolder: 'MyNewComponent',
            });

            if (componentName && componentName.trim() !== '') {
                autoScaffold(componentName.trim());
                vscode.window.showInformationMessage(
                    `✅ Auto-scaffold created: ${componentName.trim()}`
                );
            } else {
                vscode.window.showWarningMessage('❌ Invalid component name.');
            }
        }
    );

    context.subscriptions.push(scaffoldCmd);
}
