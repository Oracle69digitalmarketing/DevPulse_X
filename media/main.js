// media/main.js

// This script will be run within the webview itself
(function () {
    const vscode = acquireVsCodeApi();
    const activityList = document.getElementById('activity-list');

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const metric = event.data; // The JSON data that the extension sent

        const listItem = document.createElement('li');
        let content = `[${new Date(metric.timestamp).toLocaleTimeString()}] <strong>${metric.type}</strong>: ${metric.file}`;

        if (metric.type === 'keystroke') {
            content += ` (${metric.keystrokeCount > 0 ? '+' : ''}${metric.keystrokeCount} chars)`;
        }

        listItem.innerHTML = content;
        // Add new items to the top of the list
        activityList.prepend(listItem);
    });
}());
