import * as vscode from 'vscode';
import { activateCodeListener } from './codeListener';
import { showDashboard } from './ui/dashboard';
import { registerQuickFix } from './suggestionEngine';

// It's good practice to create a single output channel for your extension
const outputChannel = vscode.window.createOutputChannel('DevPulse X');

/**
 * Activate DevPulse X extension
 */
export function activate(context: vscode.ExtensionContext) {
    try {
        outputChannel.appendLine('✅ Activating DevPulse X...');

        // Start the main code listener
        activateCodeListener(context);

        // Register Flow Dashboard command
        const dashboardCmd = vscode.commands.registerCommand(
            'devpulse.showDashboard',
            () => {
                // It's also good to wrap command executions in try/catch
                try {
                    showDashboard(context);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(`Failed to show DevPulse X Dashboard: ${errorMessage}`);
                    outputChannel.appendLine(`[ERROR] Failed to show Dashboard: ${errorMessage}`);
                }
            }
        );
        context.subscriptions.push(dashboardCmd);

        // Register Quick Fix provider
        registerQuickFix(context);

        outputChannel.appendLine('🚀 DevPulse X activated successfully!');

    } catch (error) {
        // If activation fails, show an error message and log the details
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to activate DevPulse X: ${errorMessage}`);
        outputChannel.appendLine(`[ERROR] Activation failed: ${errorMessage}`);
    }
}

/**
 * Deactivate DevPulse X extension
 */
export function deactivate() {
    // The output channel will be disposed of automatically by VS Code,
    // but you can log a final message here if you wish.
    outputChannel.appendLine('🛑 DevPulse X deactivated');
}
