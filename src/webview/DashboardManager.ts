import * as vscode from 'vscode';
import { getWebviewContent } from './getWebviewContent';
import { DashboardMessage } from '../types'; // Assuming this is the path to your types

/**
 * Manages the lifecycle and communication of the DevPulse X dashboard webview.
 * This class implements a singleton pattern to ensure only one instance of the
 * dashboard exists at a time.
 */
export class DashboardManager implements vscode.Disposable {
  public static currentManager: DashboardManager | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  /**
   * Creates or reveals the dashboard webview. This is the public entry point
   * for creating and managing the singleton instance.
   * @param extensionUri The URI of the extension, needed to create the panel.
   */
  public static createOrShow(extensionUri: vscode.Uri) {
    // Use the active column or default to Column One
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : vscode.ViewColumn.One;

    // If we already have a panel, just reveal it.
    if (DashboardManager.currentManager) {
      DashboardManager.currentManager._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      'devpulseDashboard',      // Internal ID for the webview type.
      'DevPulse X Dashboard',   // Title shown to the user.
      column,                   // Show in the active column.
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out', 'webview')], // Be specific for security
      }
    );

    DashboardManager.currentManager = new DashboardManager(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial HTML content.
    this._update();

    // Listen for when the panel is disposed (e.g., when the user closes it).
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview.
    this._panel.webview.onDidReceiveMessage(
      (message: DashboardMessage) => {
        switch (message.command) {
          case 'logMood':
            // Ensure payload exists before using it
            if (message.payload) {
              vscode.window.showInformationMessage(`Current mood: ${message.payload}`);
            }
            return;
          case 'autoScaffoldRequest':
            vscode.window.showInformationMessage('Auto-scaffold request received');
            // Here you would trigger your scaffolding logic.
            return;
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Safely posts a message to the webview panel.
   * @param message The message to send to the webview.
   */
  public postMessage(message: DashboardMessage) {
    this._panel.webview.postMessage(message);
  }

  /**
   * Cleans up resources. This method is called when the panel is closed.
   */
  public dispose() {
    // 1. Clean up the singleton instance.
    DashboardManager.currentManager = undefined;

    // 2. Dispose of the panel. This will also trigger the onDidDispose event,
    // but the check in step 1 prevents infinite loops. It's important to
    // dispose of the panel to release its resources.
    this._panel.dispose();

    // 3. Dispose of all disposables (event listeners, etc.).
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }

  /**
   * Sets the webview's HTML content.
   */
  private _update() {
    this._panel.webview.html = getWebviewContent(this._panel.webview, this._extensionUri);
  }
}
