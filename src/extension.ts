import * as vscode from 'vscode';
import { activateCodeListener } from './codeListener';
import { registerQuickFix } from './suggestionEngine';
import { initActivityTracker, ActivityMetric } from './activityTracker';
import { DashboardManager } from './webview/DashboardManager';

// Create a single, shared output channel for better logging
const outputChannel = vscode.window.createOutputChannel('DevPulse X');

// Create an event emitter to decouple the activity tracker from the UI
const onDidUpdateMetric = new vscode.EventEmitter<ActivityMetric>();
const metricUpdatedEvent = onDidUpdateMetric.event;

/**
 * Activates the DevPulse X extension.
 * This function is called once when the extension is first activated.
 */
export function activate(context: vscode.ExtensionContext) {
    try {
        outputChannel.appendLine('✅ Activating DevPulse X...');

        // 1. Initialize the activity tracker to emit events when metrics are updated.
        // We pass the emitter itself, so the tracker doesn't need to know about the UI.
        initActivityTracker(onDidUpdateMetric);

        // 2. Listen for metric update events and forward them to the dashboard if it's open.
        // This keeps the logic for UI updates centralized here.
        const metricListener = metricUpdatedEvent((metric: ActivityMetric) => {
            // DashboardManager.currentManager is the static accessor for the singleton instance.
            if (DashboardManager.currentManager) {
                DashboardManager.currentManager.postMessage({
                    command: 'updateMetric',
                    // The error log indicated the message type expects 'payload'.
                    // Let's ensure we use the correct property name.
                    payload: metric,
                });
            }
        });
        context.subscriptions.push(metricListener);

        // 3. Start the main code listener.
        activateCodeListener(context);

        // 4. Register the command to show the dashboard.
        // This uses the static `createOrShow` method, which is the correct way
        // to interact with the singleton DashboardManager.
        const showDashboardCommand = vscode.commands.registerCommand(
            'devpulse.showDashboard',
            () => {
                DashboardManager.createOrShow(context.extensionUri);
            }
        );
        context.subscriptions.push(showDashboardCommand);

        // 5. Register the Quick Fix provider.
        registerQuickFix(context);

        outputChannel.appendLine('🚀 DevPulse X activated successfully!');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to activate DevPulse X: ${errorMessage}`);
        outputChannel.appendLine(`[ERROR] Activation failed: ${errorMessage}`);
    }
}

/**
 * Deactivates the DevPulse X extension for cleanup.
 */
export function deactivate() {
    outputChannel.appendLine('🛑 DevPulse X deactivated');
    // VS Code will automatically handle cleanup for items in context.subscriptions,
    // including commands and event listeners.
}
