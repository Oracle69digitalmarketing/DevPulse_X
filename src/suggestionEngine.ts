import * as vscode from 'vscode';

export function suggestFix(featureName: string) {
    // Example mapping; can be extended
    const fixes: Record<string, string> = {
        'fetch': 'Use axios or check polyfill for fetch',
        'Array.flat': 'Use flatMap or polyfill for older browsers'
    };
    return fixes[featureName] || 'No suggestion available';
}

export function suggestFixes(document: vscode.TextDocument) {
    // Simple example: scan for unsupported features in the document
    const text = document.getText();
    const unsupportedFeatures = ['fetch', 'Array.flat']; // replace with dynamic check
    unsupportedFeatures.forEach(feature => {
        if (text.includes(feature)) {
            vscode.window.showInformationMessage(`DevPulse X Suggestion: ${suggestFix(feature)}`);
        }
    });
}
