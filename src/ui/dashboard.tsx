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

// Type for VS Code Webview API
interface WebviewApi<T = any> {
    postMessage(message: T): void;
}

// Dashboard metrics and message types
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

// Make vscodeApi optional to allow browser bundling
export const DevPulseDashboard: React.FC<{ vscodeApi?: WebviewApi<DashboardMessage> }> = ({ vscodeApi }) => {
    const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
    const [timeLabels, setTimeLabels] = useState<string[]>([]);

    // Listen to messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent<DashboardMessage>) => {
            const message = event.data;
            if (message.command === 'updateDashboard' && message.payload) {
                setMetrics(prev => [...prev, message.payload]);
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

    // Remove loading screen
    useEffect(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.transition = 'opacity 0.3s ease';
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.remove(), 300);
        }
    }, []);

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
                        if (e.key === 'Enter' && vscodeApi) {
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
                    onClick={() => vscodeApi?.postMessage({ command: 'autoScaffoldRequest' })}
                    style={{ padding: '10px 20px', fontSize: 14 }}
                >
                    Trigger Auto-Scaffold
                </button>
            </div>
        </div>
    );
};

// Show dashboard in VS Code Webview
export function showDashboard(context: any) {
    const panel = (window as any).vscodeWindow?.createWebviewPanel
        ? (window as any).vscodeWindow.createWebviewPanel(
              'devpulseDashboard',
              'DevPulse X Dashboard',
              1,
              { enableScripts: true }
          )
        : null;

    const vscodeApiScript = `
        const vscodeApi = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : undefined;
        window.vscodeApi = vscodeApi;
    `;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>DevPulse X Dashboard</title>
        <style>
            #loading-screen {
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                background: #fff;
                z-index: 9999;
                font-family: sans-serif;
                font-size: 2rem;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div id="loading-screen">Loading DevPulse_X...</div>
        <div id="root"></div>
        <script>${vscodeApiScript}</script>
        <script type="module" src="${panel ? panel.webview.asWebviewUri(
        context.extensionUri + '/out/ui/dashboard.js'
    ) : ''}"></script>
    </body>
    </html>
    `;

    if (panel) panel.webview.html = html;
}

// Mount React dashboard safely
export function mountDashboard() {
    const root = document.getElementById('root');
    const vscodeApi = (window as any).vscodeApi;
    if (root) {
        const reactRoot = ReactDOM.createRoot(root);
        reactRoot.render(<DevPulseDashboard vscodeApi={vscodeApi} />);
    }
}
