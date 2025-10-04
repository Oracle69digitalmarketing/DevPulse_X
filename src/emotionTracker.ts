import * as vscode from 'vscode';

// --- Constants ---
// It's better to use user configuration, but a constant is a good start.
const IDLE_THRESHOLD_SECONDS = 30;

// --- State Management ---

// Use a Map to store activity state for each document independently.
// The key is the document URI (as a string), and the value is the state.
interface DocumentActivityState {
    lastTypedTime: number;
}
const activityState = new Map<string, DocumentActivityState>();

// --- Dashboard Integration ---

// Optional: Callback to send metrics to a dashboard or other service.
let sendMetric: ((metric: any) => void) | null = null;

/**
 * Initializes the activity tracker with a callback for sending metrics.
 * @param dashboardCallback The function to call when a new metric is generated.
 */
export function initActivityTracker(dashboardCallback: (metric: any) => void) {
    sendMetric = dashboardCallback;
}

/**
 * Tracks user coding activity (typing, deletions, idle time) for a given document change event.
 * This function is designed to be called from a `vscode.workspace.onDidChangeTextDocument` listener.
 */
export function trackCodingActivity(event: vscode.TextDocumentChangeEvent) {
    const docUri = event.document.uri.toString();
    const currentTime = Date.now();

    // Get or create the state for the current document
    if (!activityState.has(docUri)) {
        activityState.set(docUri, { lastTypedTime: currentTime });
    }
    const state = activityState.get(docUri)!;

    // Calculate metrics
    const idleTime = (currentTime - state.lastTypedTime) / 1000; // in seconds
    const isIdle = idleTime > IDLE_THRESHOLD_SECONDS;

    // Use contentChanges for accurate character counting
    let addedChars = 0;
    let removedChars = 0;
    for (const change of event.contentChanges) {
        addedChars += change.text.length;
        removedChars += change.rangeLength;
    }

    // Don't count the initial "idle" period when a file is first opened
    if (isIdle && state.lastTypedTime !== currentTime) {
        console.log(`Idle time detected: ${idleTime.toFixed(1)}s. Suggesting a break.`);
    }

    // Send metrics to the dashboard if the callback is configured
    if (sendMetric) {
        sendMetric({
            timestamp: currentTime,
            documentUri: docUri,
            addedChars,
            removedChars,
            idleTime,
            isIdle,
        });
    }

    // Update the state for the current document
    state.lastTypedTime = currentTime;
}

/**
 * Cleans up the state for a closed document to prevent memory leaks.
 * This should be called from a `vscode.workspace.onDidCloseTextDocument` listener.
 * @param document The document that was closed.
 */
export function cleanupDocumentState(document: vscode.TextDocument) {
    activityState.delete(document.uri.toString());
}
