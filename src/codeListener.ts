import * as vscode from 'vscode';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { trackEmotion } from './emotionTracker';
import { checkFeature } from './baselineEngine';
import { suggestFix, suggestFixes } from './suggestionEngine';
import { autoScaffold } from './scaffolder';
import { decorateTooltip } from './ui/tooltipManager';

/**
 * Activates the main code listener for DevPulse X.
 * Tracks typing, checks Baseline features, provides inline suggestions, and integrates auto-scaffold.
 */
export function activateCodeListener(context: vscode.ExtensionContext) {

    // Listen for all text changes
    const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
        const code = event.document.getText();

        // === 1️⃣ Track Emotion & Flow ===
        trackEmotion(event);

        // === 2️⃣ Baseline Feature Checks + Inline Suggestions ===
        try {
            const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
            traverse(ast, {
                enter(path) {
                    if (path.isMemberExpression() || path.isIdentifier()) {
                        const feature = path.toString();
                        const support = checkFeature(feature);

                        if (!support.fullySupported) {
                            const fix = suggestFix(feature);
                            decorateTooltip(event.document.uri, path.node.loc?.start.line || 0, support, fix);
                        }
                    }
                }
            });
        } catch (err) {
            console.error('AST parse error:', err);
        }

        // === 3️⃣ Optional Inline Fix Suggestions ===
        suggestFixes(event.document);
    });

    context.subscriptions.push(disposable);

    // === 4️⃣ Auto-Scaffold Command ===
    const scaffoldCmd = vscode.commands.registerCommand('devpulse:autoScaffold', async () => {
        const componentName = await vscode.window.showInputBox({ prompt: 'Enter component name:' });
        if (componentName) {
            autoScaffold(componentName);
            vscode.window.showInformationMessage(`Auto-scaffold executed for: ${componentName}`);
        }
    });
    context.subscriptions.push(scaffoldCmd);

    // === 5️⃣ Optional: Additional commands or listeners can be added here ===
}
