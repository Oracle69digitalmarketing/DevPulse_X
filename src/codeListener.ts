import * as vscode from 'vscode';
import { parse, ParserOptions } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import { trackCodingActivity } from './activityTracker'; // Corrected import name
import { checkFeature } from './baselineEngine';
import { suggestFix } from './suggestionEngine';
import { autoScaffold } from './scaffolder';
import { decorateTooltip, clearAllTooltips } from './ui/tooltipManager'; // Added clearAllTooltips

// --- Constants for better maintainability ---

// A list of language IDs we want to analyze.
const SUPPORTED_LANGUAGE_IDS = [
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact',
];

// Configuration for Babel parser.
const BABEL_PARSER_OPTIONS: ParserOptions = {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: true, // Attempt to parse even with syntax errors
};

/**
 * Main code listener for DevPulse X.
 * Handles:
 *  - Typing activity tracking
 *  - Debounced AST analysis for feature compatibility checks
 *  - Inline fixes + tooltips
 *  - Auto-scaffolding command
 */
export function activateCodeListener(context: vscode.ExtensionContext) {
    // A timer for debouncing the heavy AST analysis.
    let debounceTimer: NodeJS.Timeout;

    // === 1️⃣ Listen for text changes in active editor ===
    const changeListener = vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
        const { document } = event;

        // --- A: Instantaneous Actions (run on every keystroke) ---

        // Only run on supported languages.
        if (!SUPPORTED_LANGUAGE_IDS.includes(document.languageId)) {
            return;
        }

        // Track typing activity immediately. This is lightweight and should not be debounced.
        trackCodingActivity(event);

        // --- B: Debounced Actions (heavy analysis) ---

        // Clear the previous timer to reset the debounce period.
        clearTimeout(debounceTimer);

        // Set a new timer. The analysis will run only if the user stops typing for 300ms.
        debounceTimer = setTimeout(() => {
            runAstAnalysis(document);
        }, 300); // 300ms is a good starting point for debounce delay.
    });

    context.subscriptions.push(changeListener);

    // === 2️⃣ Auto-Scaffold Command ===
    const scaffoldCmd = vscode.commands.registerCommand(
        'devpulse.autoScaffold', // Note: Command IDs usually follow 'extensionName.commandName'
        async () => {
            try {
                const componentName = await vscode.window.showInputBox({
                    prompt: 'Enter the name for the new component',
                    placeHolder: 'MyNewComponent',
                    validateInput: (value) => {
                        // Add validation to prevent empty or invalid names.
                        return value && value.trim().length > 0 ? null : 'Component name cannot be empty.';
                    },
                });

                if (componentName) {
                    const trimmedName = componentName.trim();
                    await autoScaffold(trimmedName); // Assuming autoScaffold might be async
                    vscode.window.showInformationMessage(`✅ Auto-scaffold created: ${trimmedName}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`❌ Auto-scaffold failed: ${errorMessage}`);
                console.error('Auto-scaffold error:', error);
            }
        }
    );

    context.subscriptions.push(scaffoldCmd);
}

/**
 * Parses the document, traverses the AST, and applies decorations.
 * This is the heavy lifting function that is debounced.
 * @param doc The document to analyze.
 */
function runAstAnalysis(doc: vscode.TextDocument) {
    const code = doc.getText();
    // It's good practice to clear previous decorations before applying new ones.
    clearAllTooltips(doc.uri);

    try {
        const ast = parse(code, BABEL_PARSER_OPTIONS);

        traverse(ast, {
            // More specific traversal can improve performance.
            // Example: only check CallExpressions or Identifiers in certain contexts.
            enter(path: NodePath) {
                if (path.isIdentifier() || path.isMemberExpression()) {
                    // This logic remains, but now it runs far less often.
                    const feature = path.toString();
                    const support = checkFeature(feature);

                    if (!support.fullySupported) {
                        const fix = suggestFix(feature);
                        // Ensure location exists before trying to access it.
                        if (path.node.loc) {
                            const line = path.node.loc.start.line;
                            decorateTooltip(doc.uri, line, support, fix);
                        }
                    }
                }
            },
        });
    } catch (err) {
        // Errors are expected while the user is typing.
        // We log it quietly without bothering the user.
        if (err instanceof Error && err.name !== 'SyntaxError') {
             console.error('⚠️ AST parse error in DevPulse:', err);
        }
    }
}
