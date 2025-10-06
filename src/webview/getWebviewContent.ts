import * as vscode from 'vscode';
import { getNonce } from './getNonce';

/**
 * Generates the complete HTML content for the webview panel.
 *
 * This function constructs the HTML document that will host the React application.
 * It includes security measures like a Content Security Policy (CSP) and uses
 * nonces to ensure that only trusted scripts and styles are loaded.
 *
 * @param webview The webview instance for which to generate content.
 * @param extensionUri The URI of the extension's root directory, used to resolve asset paths.
 * @returns A string containing the full HTML for the webview.
 */
export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  // A nonce is a random number used to allow specific scripts and styles to run.
  const nonce = getNonce();

  // Generate URIs for the local script and stylesheet files.
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.css'));

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      
      <!--
        Use a Content Security Policy to only allow loading specific scripts and styles.
        This helps prevent cross-site scripting (XSS) attacks.
      -->
      <meta http-equiv="Content-Security-Policy" content="
        default-src 'none';
        style-src 'nonce-${nonce}';
        script-src 'nonce-${nonce}';
      ">
      
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      
      <link href="${styleUri}" rel="stylesheet" nonce="${nonce}">
      
      <title>DevPulse X Dashboard</title>
    </head>
    <body>
      <!-- This is the root element where the React app will be mounted. -->
      <div id="root"></div>
      
      <!-- 
        The script for the React application. The 'nonce' attribute must match
        the one in the Content-Security-Policy.
      -->
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>
  `;
}
