// In: src/webview/getNonce.ts

/**
 * Generates a random string to be used as a nonce for Content Security Policy.
 * A nonce is a security feature that helps prevent cross-site scripting attacks
 * by ensuring that only authorized scripts are executed in the webview.
 * @returns A 32-character random string.
 */
export function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
