import * as vscode from 'vscode';
import { activateCodeListener } from './codeListener';
import { showDashboard } from './ui/dashboard';
import { registerQuickFix } from './suggestionEngine';

/**
 * Activate DevPulse X extension
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('✅ DevPulse X activated!');

    // Start the main code listener
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
}

/**
 * Deactivate DevPulse X extension
 */
export function deactivate() {
    console.log('🛑 DevPulse X deactivated');
}
