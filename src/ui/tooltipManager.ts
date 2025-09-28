import * as vscode from 'vscode';

export function decorateTooltip(uri: vscode.Uri, line: number, support: any, fix: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,200,0,0.3)',
        border: '1px solid orange'
    });

    editor.setDecorations(decorationType, [new vscode.Range(line-1, 0, line-1, 100)]);

    vscode.window.showInformationMessage(`DevPulse X: ${fix} suggested. Unsupported in: ${support.browsers.join(', ')}`);
}
