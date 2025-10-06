// src/extension.ts

// ... other imports
import { DashboardManager } from './DashboardManager'; // Assuming this is the correct path

// ... outputChannel definition

// Create a global event emitter for metric updates
const onDidUpdateMetric = new vscode.EventEmitter<any>(); // Use a more specific type than 'any' if possible
export const metricUpdated = onDidUpdateMetric.event;

export function activate(context: vscode.ExtensionContext) {
    try {
        outputChannel.appendLine('✅ Activating DevPulse X...');

        // 1. Initialize the activity tracker to EMIT events
        initActivityTracker(onDidUpdateMetric); // Pass the emitter itself

        // 2. Listen for events and update the dashboard
        metricUpdated((metric) => {
            // Post a message to the dashboard if it exists
            if (DashboardManager.currentManager) {
                DashboardManager.currentManager.postMessage({
                    command: 'updateMetric',
                    payload: metric, // Use 'payload' to be consistent with your DashboardManager
                });
            }
        });

        // Start the main code listener
        activateCodeListener(context);

        // Register Dashboard command using the DashboardManager
        const dashboardCmd = vscode.commands.registerCommand(
            'devpulse.showDashboard',
            () => {
                // Use the static method from the class we reviewed
                DashboardManager.createOrShow(context.extensionUri);
            }
        );
        context.subscriptions.push(dashboardCmd);

        // Register Quick Fix provider
        registerQuickFix(context);

        outputChannel.appendLine('🚀 DevPulse X activated successfully!');

    } catch (error) {
        // ... error handling is good
    }
}
