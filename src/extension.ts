import * as vscode from 'vscode';
import { listenToCode } from './codeListener';
import { showDashboard } from './ui/dashboard';

export function activate(context: vscode.ExtensionContext) {
    console.log('DevPulse X activated!');

    // Start code listener
    listenToCode(context);

    // Register command to open Flow Dashboard
    context.subscriptions.push(
        vscode.commands.registerCommand('devpulse.showDashboard', () => {
            showDashboard(context);
        })
    );
}

export function deactivate() {
    console.log('DevPulse X deactivated');
}
