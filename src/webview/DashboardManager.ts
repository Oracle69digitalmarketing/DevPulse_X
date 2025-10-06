import * as vscode from 'vscode';
import { getWebviewContent } from './getWebviewContent';
// Correcting the path to be relative to the current directory, as discussed.
import { DashboardMessage } from './types';
import * as vscode from 'vscode';
// 1. Import both message types for a complete, two-way communication protocol.
import { ExtensionMessage, WebviewMessage } from './types';
import { getWebviewContent } from './getWebviewContent';

/**
 * Manages the lifecycle and communication of the DevPulse X dashboard webview.
 * This class implements a singleton pattern to ensure only one instance of the
 * dashboard exists at a time.
 */
export class DashboardManager implements vscode.Disposable {
  /**
   * Tracks the currently active dashboard panel. Only one panel can be open at a time.
   */
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
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : vscode.ViewColumn.One;

    if (DashboardManager.currentManager) {
      DashboardManager.currentManager.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'devpulseDashboard',      // Internal ID for the webview type.
      'DevPulse X Dashboard',   // Title shown to the user.
      column,                   // Show in the active column.
      {
        enableScripts: true,
        // 2. CRITICAL: This path must match your build output directory for the webview.
        // Let's align this with a standard 'out' directory structure.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')],
      }
    );

    DashboardManager.currentManager = new DashboardManager(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial HTML content by calling the helper.
    this._panel.webview.html = getWebviewContent(this._panel.webview, this._extensionUri);

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // 3. Implement the full communication handshake.
    this._panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => {
        switch (message.command) {
          case 'webviewReady':
            // The webview has loaded and is ready to receive data.
            // Send it any initial data it needs to render.
            console.log('DevPulse X: Webview is ready. Sending initial data.');
            this.postMessage({
              command: 'initialDataLoaded',
              payload: {
                initialMetrics: [] // TODO: Load historical metrics from storage if available.
              }
            });
            return;
          case 'showInformationMessage':
            // Handle requests from the webview to show notifications.
            vscode.window.showInformationMessage(message.payload);
            return;
          // Add other cases for messages from the webview here.
        }
      },
      null,
      this._disposables
    );
  }

  /**
   * Reveals the panel in a specific column.
   * @param column The view column to show the panel in.
   */
  public reveal(column?: vscode.ViewColumn) {
    this._panel.reveal(column);
  }

  /**
   * Safely posts a strongly-typed message to the webview panel.
   * @param message The message to send to the webview.
   */
  public postMessage(message: ExtensionMessage) {
    this._panel.webview.postMessage(message);
  }

  /**
   * Cleans up resources when the panel is closed.
   */
  public dispose() {
    DashboardManager.currentManager = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }
}

/**
 * Manages the lifecycle and communication of the DevPulse X dashboard webview.
 * This class implements a singleton pattern to ensure only one instance of the
 * dashboard exists at a time.
 */
export class DashboardManager implements vscode.Disposable {
  /**
   * Tracks the currently active dashboard panel. Only one panel can be open at a time.
   */
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
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : vscode.ViewColumn.One;

    // If we already have a panel, reveal it instead of creating a new one.
    // This uses the public `reveal` method to respect encapsulation.
    if (DashboardManager.currentManager) {
      DashboardManager.currentManager.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      'devpulseDashboard',      // Internal ID for the webview type.
      'DevPulse X Dashboard',   // Title shown to the user.
      column,                   // Show in the active column.
      {
        enableScripts: true,
        // For security, restrict the webview to only loading content
        // from a specific directory within your extension.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
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

    // Handle messages received from the webview.
    this._panel.webview.onDidReceiveMessage(
      (message: DashboardMessage) => {
        switch (message.command) {
          case 'logMood':
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
   * Reveals the panel in a specific column, respecting its private nature.
   * @param column The view column to show the panel in.
   */
  public reveal(column?: vscode.ViewColumn) {
    this._panel.reveal(column);
  }

  /**
   * Safely posts a message to the webview panel.
   * @param message The message to send to the webview.
   */
  public postMessage(message: DashboardMessage) {
    this._panel.webview.postMessage(message);
  }

  /**
   * Cleans up resources when the panel is closed.
   */
  public dispose() {
    DashboardManager.currentManager = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }

  /**
   * Sets the webview's HTML content by calling the helper function.
   */
  private _update() {
    this._panel.webview.html = getWebviewContent(this._panel.webview, this._extensionUri);
  }
}
