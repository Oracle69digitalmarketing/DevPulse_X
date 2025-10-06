// src/index.tsx
import React from 'react';
import ReactDOM f// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './ui/dashboardStyles.css';
import { DevPulseDashboard } from './ui/dashboard';
import { WebviewApi } from "vscode-webview";

// --- 1. Define a Shared Communication Protocol ---
// It's crucial to have a single source of truth for the message shapes
// that both the extension and the webview will use.

// Example type for the data you'll be tracking.
// You should customize this to fit your project's needs.
export interface ActivityMetric {
  id: string;
  type: 'fileSave' | 'lineChange' | 'terminalCommand';
  timestamp: number;
  value: any; // e.g., number of lines changed, command executed
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
// This provides type safety for the `acquireVsCodeApi` function.
// It's best to place this in a separate `src/webview/types/global.d.ts` file.
declare global {
  const vscodeApi: WebviewApi<WebviewMessage>;
}

/**
 * A wrapper component to manage the application's root state and
 * communication with the VS Code extension.
 */
const App: React.FC = () => {
  // Use a reducer for more complex state, but useState is fine for this.
  const [isReady, setIsReady] = React.useState(false);
  const [metrics, setMetrics] = React.useState<ActivityMetric[]>([]);

  // --- 3. Establish Communication Handshake ---
  React.useEffect(() => {
    // Set up a listener for messages coming FROM the extension
    const handleMessage = (event: MessageEvent<ExtensionMessage>) => {
      const message = event.data;
      console.log('Webview received message:', message);

      switch (message.command) {
        case 'initialDataLoaded':
          setMetrics(message.payload.initialMetrics);
          setIsReady(true); // Data is loaded, we are ready to render the dashboard
          break;
        case 'updateMetric':
          // Add the new metric to our state, ensuring no duplicates if needed
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
  // Pass down the API for sending messages and the initial data.
  // This fixes the 'initialMetrics' prop error from your compiler.
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
rom 'react-dom/client';
import './ui/dashboardStyles.css';
import { DevPulseDashboard } from './ui/dashboard';

// --- Type-safe access to the VS Code API ---
// It's a best practice to define the shape of the API provided by the extension.
// This can be placed in a separate `global.d.ts` file for global access.
declare global {
  interface Window {
    vscodeApi: {
      postMessage: (message: { command: string; text: string }) => void;
      // Add other methods provided by your extension's backend
    };
  }
}

/**
 * A wrapper component to manage the application's root state,
 * such as loading or error boundaries.
 */
const App: React.FC = () => {
  // The loading state is now managed within React.
  // This could be expanded to fetch initial data from the extension.
  const [isLoading, setIsLoading] = React.useState(true);

  // This effect simulates the app finishing its setup.
  // In a real app, you might wait for a message from the extension
  // or for an initial data fetch to complete.
  React.useEffect(() => {
    // Simulate loading is complete after a short delay
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div id="loading-screen">
        <h1>Loading DevPulse_X...</h1>
      </div>
    );
  }

  return <DevPulseDashboard vscodeApi={window.vscodeApi} />;
};

// --- Application Mount Point ---
const rootElement = document.getElementById('root');

if (!rootElement) {
  // This check is a safeguard. The root element should always exist in your HTML template.
  console.error('Fatal Error: Root element not found. The application cannot be mounted.');
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
