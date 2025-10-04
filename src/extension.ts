import * as vscode from 'vscode';
import { activateCodeListener } from './codeListener';
import { showDashboard, getDashboardWebview } from './ui/dashboard'; // Assuming getDashboardWebview exists
import { registerQuickFix } from './suggestionEngine';
import { initActivityTracker } from './activityTracker'; // Import the new initializer

// Create a single output channel for the extension for better logging
const outputChannel = vscode.window.createOutputChannel('DevPulse X');

/**
 * Activate DevPulse X extension
 */
export function activate(context: vscode.ExtensionContext) {
    try {
        outputChannel.appendLine('✅ Activating DevPulse X...');

        // Initialize the activity tracker and provide a way to send metrics to the dashboard
        initActivityTracker((metric) => {
            // Get the dashboard's webview and post a message to it
            const dashboard = getDashboardWebview();
            if (dashboard) {
                dashboard.postMessage({
                    command: 'updateMetric',
                    data: metric,
                });
            }
        });

        // Start the main code listener which now handles activity tracking
        activateCodeListener(context);

        // Register Flow Dashboard command
        const dashboardCmd = vscode.commands.registerCommand(
            'devpulse.showDashboard',
            () => {
                showDashboard(context);
            }
        );
        context.subscriptions.push(dashboardCmd);

        // Register Quick Fix provider
        registerQuickFix(context);

        outputChannel.appendLine('🚀 DevPulse X activated successfully!');

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to activate DevPulse X: ${errorMessage}`);
        outputChannel.appendLine(`[ERROR] Activation failed: ${errorMessage}`);
    }
}

/**
 * Deactivate DevPulse X extension
 */
export function deactivate() {
    outputChannel.appendLine('🛑 DevPulse X deactivated');
}
