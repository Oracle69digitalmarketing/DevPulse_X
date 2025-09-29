import * as vscode from 'vscode';
import { listenToCode } from './codeListener';
import { showDashboard } from './ui/dashboard';
import { registerQuickFix } from './suggestionEngine';

export function activate(context: vscode.ExtensionContext) {
    console.log('DevPulse X activated!');

    // Start code listener
    listenToCode(context);

    // Register Flow Dashboard command
    context.subscriptions.push(
        vscode.commands.registerCommand('devpulse.showDashboard', () => {
            showDashboard(context);
        })
    );

    // Register Quick Fix provider
    registerQuickFix(context);
}

export function deactivate() {
    console.log('DevPulse X deactivated');
}
