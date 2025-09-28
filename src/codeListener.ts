import * as vscode from 'vscode';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { checkFeature } from './baselineEngine';
import { suggestFix } from './suggestionEngine';
import { trackEmotion } from './emotionTracker';
import { decorateTooltip } from './ui/tooltipManager';

export function listenToCode(context: vscode.ExtensionContext) {
    vscode.workspace.onDidChangeTextDocument((event) => {
        const code = event.document.getText();
        const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

        traverse(ast, {
            enter(path) {
                // Detect API usage (simplified example)
                if (path.isMemberExpression()) {
                    const feature = path.toString();
                    const support = checkFeature(feature);
                    if (!support.fullySupported) {
                        const fix = suggestFix(feature);
                        decorateTooltip(event.document.uri, path.node.loc.start.line, support, fix);
                    }
                }
            }
        });

        // Track optional emotion metrics
        trackEmotion(event);
    });
}
