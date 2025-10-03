import * as vscode from 'vscode';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Type for VS Code Webview API exposed in Webview
interface WebviewApi<T = any> {
    postMessage(message: T): void;
}

// Types for VS Code messages
interface DashboardMetrics {
    charCount: number;
    idleTime: number;
    undoCount: number;
}

interface DashboardMessage {
    command: 'updateDashboard' | 'autoScaffoldRequest' | 'logMood';
    payload?: DashboardMetrics;
    value?: string;
}

// Main Dashboard component
export const DevPulseDashboard: React.FC<{ vscodeApi: WebviewApi<DashboardMessage> }> = ({ vscodeApi }) => {
    const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
    const [timeLabels, setTimeLabels] = useState<string[]>([]);

    // Listen to VS Code messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent<DashboardMessage>) => {
            const message = event.data;
            if (message.command === 'updateDashboard' && message.payload) {
                setMetrics(prev => [...prev, message.payload!]);
                setTimeLabels(prev => [...prev, new Date().toLocaleTimeString()]);
            }
        };

        window.addEventListener('message', handleMessage);

        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Chart data
    const data = {
        labels: timeLabels,
        datasets: [
            {
                label: 'Characters Typed',
                data: metrics.map(m => m.charCount),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.4
            },
            {
                label: 'Idle Time (ms)',
                data: metrics.map(m => m.idleTime),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.4
            },
            {
                label: 'Undo Count',
                data: metrics.map(m => m.undoCount),
                borderColor: 'rgb(255, 205, 86)',
                tension: 0.4
            }
        ]
    };

    return (
        <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
            <h2>DevPulse X Dashboard</h2>
            <Line data={data} />
            <p>Track your coding flow, idle times, and undo metrics live.</p>

            <div style={{ marginTop: 20 }}>
                <h3>Quick Mood Check-In</h3>
                <input
                    type="text"
                    placeholder="How do you feel right now?"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const value = (e.target as HTMLInputElement).value;
                            vscodeApi.postMessage({ command: 'logMood', value });
                            (e.target as HTMLInputElement).value = '';
                        }
                    }}
                    style={{ width: '100%', padding: 8, fontSize: 14 }}
                />
            </div>

            <div style={{ marginTop: 20 }}>
                <button
                    onClick={() => vscodeApi.postMessage({ command: 'autoScaffoldRequest' })}
                    style={{ padding: '10px 20px', fontSize: 14 }}
                >
                    Trigger Auto-Scaffold
                </button>
            </div>
        </div>
    );
};

// Show the Dashboard in a Webview panel
export function showDashboard(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'devpulseDashboard',
        'DevPulse X Dashboard',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    const vscodeApiScript = `
        const vscodeApi = acquireVsCodeApi();
        window.vscodeApi = vscodeApi;
    `;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>DevPulse X Dashboard</title>
    </head>
    <body>
        <div id="root"></div>
        <script>${vscodeApiScript}</script>
        <script type="module" src="${panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'out/ui/dashboard.js')
        )}"></script>
    </body>
    </html>
    `;

    panel.webview.html = html;

    // Handle messages from Webview
    panel.webview.onDidReceiveMessage((message: DashboardMessage) => {
        if (message.command === 'autoScaffoldRequest') {
            vscode.commands.executeCommand('devpulse:autoScaffold');
        }
        if (message.command === 'logMood' && message.value) {
            vscode.window.showInformationMessage(`Mood logged: ${message.value}`);
        }
    });
}

// Mount React to root element
export function mountDashboard() {
    const root = document.getElementById('root');
    if (root && (window as any).vscodeApi) {
        const reactRoot = ReactDOM.createRoot(root);
        reactRoot.render(<DevPulseDashboard vscodeApi={(window as any).vscodeApi} />);
    }
}
