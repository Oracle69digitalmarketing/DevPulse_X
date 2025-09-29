import * as vscode from 'vscode';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { checkFeature } from './baselineEngine';

/**
 * Mapping of features → fixes + optional polyfill imports
 */
const FIX_MAPPINGS: Record<
    string,
    { suggestion: string; polyfill?: string }
> = {
    fetch: {
        suggestion: 'Replace with axios or polyfill fetch.',
        polyfill: `import 'whatwg-fetch';`
    },
    'Array.flat': {
        suggestion: 'Use flatMap() or polyfill Array.flat.',
        polyfill: `import 'core-js/features/array/flat';`
    },
    'Promise.allSettled': {
        suggestion: 'Polyfill Promise.allSettled.',
        polyfill: `import 'core-js/features/promise/all-settled';`
    },
    '?.': {
        suggestion: 'Use lodash.get or transpile with Babel.',
        polyfill: undefined // usually handled by Babel transpilation
    }
};

/**
 * Returns suggestion text (and optional polyfill).
 */
export function suggestFix(featureName: string) {
    return FIX_MAPPINGS[featureName]?.suggestion || 'No automated suggestion available.';
}

/**
 * Quick Fix Provider that injects polyfills when possible.
 */
export class DevPulseQuickFixProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection
    ): vscode.CodeAction[] | undefined {
        const code = document.getText();
        let suggestions: vscode.CodeAction[] = [];

        try {
            const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

            traverse(ast, {
                enter(path) {
                    let feature = '';

                    if (path.isMemberExpression()) {
                        feature = path.toString(); // e.g. Array.flat
                    } else if (path.isIdentifier()) {
                        feature = path.node.name; // e.g. fetch
                    }

                    if (feature && FIX_MAPPINGS[feature]) {
                        const support = checkFeature(feature);

                        if (!support.fullySupported) {
                            const { suggestion, polyfill } = FIX_MAPPINGS[feature];
                            const loc = path.node.loc;

                            if (loc) {
                                const start = new vscode.Position(loc.start.line - 1, loc.start.column);
                                const end = new vscode.Position(loc.end.line - 1, loc.end.column);
                                const fixRange = new vscode.Range(start, end);

                                // === 1️⃣ Lightbulb Action: Suggest Fix (inline comment) ===
                                const commentAction = new vscode.CodeAction(
                                    `DevPulse X: ${suggestion}`,
                                    vscode.CodeActionKind.QuickFix
                                );
                                commentAction.edit = new vscode.WorkspaceEdit();
                                commentAction.edit.replace(
                                    document.uri,
                                    fixRange,
                                    `${feature} /* ${suggestion} */`
                                );
                                suggestions.push(commentAction);

                                // === 2️⃣ Lightbulb Action: Inject Polyfill (if available) ===
                                if (polyfill) {
                                    const polyfillAction = new vscode.CodeAction(
                                        `DevPulse X: Inject Polyfill → ${polyfill}`,
                                        vscode.CodeActionKind.QuickFix
                                    );

                                    polyfillAction.edit = new vscode.WorkspaceEdit();
                                    polyfillAction.edit.insert(
                                        document.uri,
                                        new vscode.Position(0, 0), // top of file
                                        `${polyfill}\n`
                                    );
                                    suggestions.push(polyfillAction);
                                }
                            }
                        }
                    }
                }
            });
        } catch (err) {
            console.error('AST parsing failed in QuickFix:', err);
        }

        return suggestions;
    }
}

/**
 * Register Quick Fix provider
 */
export function registerQuickFix(context: vscode.ExtensionContext) {
    const provider = new DevPulseQuickFixProvider();

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: 'file', language: 'javascript' },
            provider,
            { providedCodeActionKinds: DevPulseQuickFixProvider.providedCodeActionKinds }
        )
    );

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { scheme: 'file', language: 'typescript' },
            provider,
            { providedCodeActionKinds: DevPulseQuickFixProvider.providedCodeActionKinds }
        )
    );
}
