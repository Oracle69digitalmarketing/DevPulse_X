import * as vscode from 'vscode';

// Last typing timestamp and character count
let lastTypedTime = Date.now();
let charCount = 0;

// Optional: send metrics to DevPulse dashboard
let sendMetric: ((metric: any) => void) | null = null;

/**
 * Initialize dashboard integration (optional)
 */
export function initEmotionTracker(dashboardCallback: (metric: any) => void) {
    sendMetric = dashboardCallback;
}

/**
 * Tracks typing activity, idle time, and emits metrics for DevPulse X.
 */
export function trackEmotion(event: vscode.TextDocumentChangeEvent) {
    const currentTime = Date.now();
    const docText = event.document.getText();
    const newCharCount = docText.length;

    const idleTime = (currentTime - lastTypedTime) / 1000; // seconds
    const typedChars = newCharCount - charCount;

    if (typedChars > 0) {
        console.log(`Typing detected: ${typedChars} chars typed.`);
    }

    if (idleTime > 30) {
        console.log('Idle detected — suggest break.');
    }

    // Send metrics to dashboard if hooked
    if (sendMetric) {
        sendMetric({
            timestamp: currentTime,
            typedChars,
            idleTime,
            isIdle: idleTime > 30,
        });
    }

    lastTypedTime = currentTime;
    charCount = newCharCount;
}
