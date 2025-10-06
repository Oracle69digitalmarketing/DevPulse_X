// In src/activityTracker.ts

import * as vscode from 'vscode';

// The tracker now accepts an EventEmitter
export function initActivityTracker(metricEmitter: vscode.EventEmitter<any>) {
    // Inside your tracking logic...
    // When you have a new metric to report:
    const newMetric = { /* ... your metric data ... */ };
    metricEmitter.fire(newMetric);
}
