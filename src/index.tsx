// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
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
