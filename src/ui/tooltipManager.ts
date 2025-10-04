// In a new file, e.g., 'ui/tooltipManager.ts'

import * as vscode from 'vscode';
import { FeatureSupportResult } from '../baselineEngine'; // Assuming this is where checkFeature lives

// --- 1. Create the decoration type ONCE and export it ---
// This is the most important performance improvement.
const unsupportedFeatureDecorationType = vscode.window.createTextEditorDecorationType({
    // Use a subtle background color or an underline to be less intrusive.
    // A gutter icon is also a great option.
    backgroundColor: 'rgba(255, 180, 0, 0.2)',
    border: '1px dashed rgba(255, 180, 0, 0.8)',
    borderRadius: '2px',
});

// --- 2. Use a Map to manage decorations per document ---
// This allows us to collect all decorations before applying them.
const decorationsMap = new Map<string, vscode.DecorationOptions[]>();

/**
 * Adds a feature warning decoration to a collection for a specific document.
 * This function does NOT apply the decoration immediately.
 *
 * @param docUri The URI of the document to decorate.
 * @param range The precise range of the feature to highlight.
 * @param support The feature support result from our check.
 * @param fix An optional suggested fix string.
 */
export function addFeatureWarning(
    docUri: vscode.Uri,
    range: vscode.Range,
    support: FeatureSupportResult,
    fix?: string
) {
    const uriString = docUri.toString();

    // Create a rich hover message using MarkdownString
    const hoverMessage = new vscode.MarkdownString();
    hoverMessage.isTrusted = true; // Allows for command links
    hoverMessage.appendMarkdown(`**DevPulse X: Baseline Support**\n\n`);
    hoverMessage.appendMarkdown(`_${support.message}_\n\n`);

    if (fix) {
        hoverMessage.appendMarkdown(`**Suggested Fix:** \`${fix}\``);
    }

    const decoration: vscode.DecorationOptions = { range, hoverMessage };

    // Get existing decorations for this file or start a new array
    const existingDecorations = decorationsMap.get(uriString) || [];
    existingDecorations.push(decoration);
    decorationsMap.set(uriString, existingDecorations);
}

/**
 * Applies all collected decorations to the specified editor.
 * This should be called after the analysis (e.g., in a debounced function).
 *
 * @param editor The text editor to apply decorations to.
 */
export function applyDecorations(editor: vscode.TextEditor) {
    const uriString = editor.document.uri.toString();
    const decorations = decorationsMap.get(uriString) || [];
    
    // This single call is much more efficient.
    editor.setDecorations(unsupportedFeatureDecorationType, decorations);
}

/**
 * Clears all decorations for a specific document.
 * This should be called before re-running analysis.
 *
 * @param docUri The URI of the document to clear.
 */
export function clearDecorations(docUri: vscode.Uri) {
    decorationsMap.delete(docUri.toString());
    
    // Also clear them from the visible editor if it's the one we're clearing
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.uri.toString() === docUri.toString()) {
        editor.setDecorations(unsupportedFeatureDecorationType, []);
    }
}
