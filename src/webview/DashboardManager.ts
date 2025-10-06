export class DashboardManager implements vscode.Disposable {
  public static currentManager: DashboardManager | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  // ... (createOrShow method is fine) ...

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial HTML content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message: DashboardMessage) => {
        // ... message handling logic ...
      },
      null,
      this._disposables
    );
  }

  /**
   * Cleans up resources. This method is called when the panel is disposed.
   * It's public to allow for manual disposal if needed.
   */
  public dispose() {
    // 1. Clean up the singleton instance
    if (DashboardManager.currentManager === this) {
      DashboardManager.currentManager = undefined;
    }

    // 2. Dispose of all disposables
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) {
        d.dispose();
      }
    }
    
    // 3. The panel is disposed automatically by VS Code when the user closes it,
    // which triggers the onDidDispose event. If you need to close it programmatically,
    // you would call this._panel.dispose(), but it's often not needed inside
    // the dispose method itself to avoid recursion.
  }

  /**
   * Sets the webview's HTML content.
   */
  private _update() {
    this._panel.webview.html = getWebviewContent(this._panel.webview, this._extensionUri);
  }

  // ... (postMessage method is fine) ...
}
