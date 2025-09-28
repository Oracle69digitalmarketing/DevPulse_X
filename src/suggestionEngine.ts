import * as vscode from 'vscode';

export function suggestFix(feature: string): string {
    // Map unsupported features to Baseline-safe alternatives
    const map: Record<string, string> = {
        'navigator.clipboard.readText': 'safeClipboardRead()',
        'document.pictureInPictureEnabled': 'checkPiP()'
    };
    return map[feature] || feature;
}

// Optional: register code action for quick fix
export function registerQuickFix(context: vscode.ExtensionContext) {
    vscode.languages.registerCodeActionsProvider('javascript', {
        provideCodeActions(document, range) {
            const fix = new vscode.CodeAction('Replace with Baseline-safe API', vscode.CodeActionKind.QuickFix);
            fix.edit = new vscode.WorkspaceEdit();
            fix.edit.replace(document.uri, range, suggestFix(document.getText(range)));
            return [fix];
        }
    });
}
