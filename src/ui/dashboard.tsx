import * as vscode from 'vscode';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';

export function showDashboard(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'devpulseDashboard',
        'DevPulse Flow Dashboard',
        vscode.ViewColumn.Two,
        { enableScripts: true }
    );

    const App = () => (
        <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
            <h1>DevPulse Flow Dashboard</h1>
            <p>Flow State: High</p>
            <p>Errors Flagged: 2</p>
            <p>Baseline Fixes Applied: 3</p>
            <p>Emotion Metrics: Typing Speed Optimal</p>
            <p>Coming Features: Zen Mode, Autonomous Scaffolding</p>
        </div>
    );

    panel.webview.html = ReactDOMServer.renderToStaticMarkup(<App />);
}
