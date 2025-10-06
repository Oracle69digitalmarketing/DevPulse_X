// src/index.tsx

// Add this directive to the very top of the file.
// It tells TypeScript to include the type definitions for the VS Code webview API.
/// <reference types="vscode-webview" />

import React from 'react';
import ReactDOM from 'react-dom/client';
import './ui/dashboardStyles.css';
import { DevPulseDashboard } from './ui/dashboard';
import { WebviewApi } from "vscode-webview";

// --- 1. Define a Shared Communication Protocol ---
// This creates a single source of truth for message shapes between the
// extension and the webview, preventing typos and bugs.

export interface ActivityMetric {
  id: string;
  type: 'fileSave' | 'lineChange' | 'terminalCommand';
  timestamp: number;
  value: any; // Customize this with a more specific type, e.g., { charCount: number }
}

// Messages sent FROM the webview TO the extension
export type WebviewMessage = {
  command: 'webviewReady';
} | {
  command: 'showInformationMessage';
  payload: string;
};

// Messages sent FROM the extension TO the webview
export type ExtensionMessage = {
  command: 'initialDataLoaded';
  payload: {
    initialMetrics: ActivityMetric[];
  };
} | {
  command: 'updateMetric';
  payload: ActivityMetric;
};

// --- 2. Type-Safe Access to the VS Code API ---
// This provides global, type-safe access to the `acquireVsCodeApi` function.
// While this works here, moving it to a separate `src/webview/types/global.d.ts`
// file is a common practice for better organization.
declare global {
  const vscodeApi: WebviewApi<WebviewMessage>;
}

/**
 * A root component to manage the application's state and communication
 * with the VS Code extension backend.
 */
const App: React.FC = () => {
  const [isReady, setIsReady] = React.useState(false);
  const [metrics, setMetrics] = React.useState<ActivityMetric[]>([]);

  // --- 3. Establish Communication Handshake ---
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;
      console.log('Webview received message:', message);

      switch (message.command) {
        case 'initialDataLoaded':
          setMetrics(message.payload.initialMetrics);
          setIsReady(true); // Data is loaded, we can now render the main dashboard
          break;
        case 'updateMetric':
          // Add the new metric to our state
          setMetrics(prevMetrics => [...prevMetrics, message.payload]);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Inform the extension that the webview is ready to receive data
    vscodeApi.postMessage({ command: 'webviewReady' });

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // The empty dependency array ensures this effect runs only once

  if (!isReady) {
    return (
      <div id="loading-screen">
        <h1>Loading DevPulse_X...</h1>
      </div>
    );
  }

  // --- 4. Pass API and State to the Dashboard ---
  return <DevPulseDashboard vscodeApi={vscodeApi} initialMetrics={metrics} />;
};

// --- Application Mount Point ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Fatal Error: Root element not found. The application cannot be mounted.');
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
