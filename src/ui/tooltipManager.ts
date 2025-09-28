import * as vscode from 'vscode';

/**
 * Highlights a line with a tooltip and optionally shows a suggested fix.
 * @param uri Document URI
 * @param line Line number (0-based)
 * @param support Feature support info
 * @param fix Suggested fix string
 */
export function decorateTooltip(
    uri: vscode.Uri,
    line: number,
    support: any,
    fix: string
) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== uri.toString()) return;

    // Decoration style
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,200,0,0.3)',
        border: '1px solid orange'
    });

    const range = new vscode.Range(line, 0, line, editor.document.lineAt(line).text.length);
    const hoverMessage = `Feature not fully supported. Suggested fix: ${fix}`;

    editor.setDecorations(decorationType, [{ range, hoverMessage }]);

    // Optional: show message once
    vscode.window.showInformationMessage(
        `DevPulse X Suggestion: ${fix}. Unsupported in: ${support.browsers?.join(', ') || 'unknown browsers'}`
    );
}
