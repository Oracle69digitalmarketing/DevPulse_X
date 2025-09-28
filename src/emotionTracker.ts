import * as vscode from 'vscode';

export function trackEmotion(event: vscode.TextDocumentChangeEvent) {
    // Very simple stub: counts rapid undo/redo as frustration
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // For demo: log typing speed or idle metrics
    console.log('Typing detected at', new Date().toISOString());
}
