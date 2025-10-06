// src/ui/dashboard.tsx

// Add this directive to the very top of the file.
/// <reference types="vscode-webview" />

import React from 'react';
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
import { WebviewApi } from 'vscode-webview';
import { ActivityMetric, WebviewMessage } from '../index'; // Import shared types from the entry point

// Register Chart.js components. This only needs to be done once.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- 1. Define Component Props ---
// This interface defines the "contract" for the dashboard, making it clear
// what data and functions it needs to operate.
export interface DevPulseDashboardProps {
  vscodeApi: WebviewApi<WebviewMessage>;
  initialMetrics: ActivityMetric[];
}

/**
 * The main dashboard component. It is now a "presentational" component
 * that receives all its data and functions via props.
 */
export const DevPulseDashboard: React.FC<DevPulseDashboardProps> = ({ vscodeApi, initialMetrics }) => {

    // --- 2. Derive Chart Data from Props ---
    // The component no longer manages its own state for metrics; it simply
    // computes the chart data from the `initialMetrics` prop.
    const timeLabels = initialMetrics.map(m => new Date(m.timestamp).toLocaleTimeString());
    
    // Example: This logic assumes your ActivityMetric 'value' is an object.
    // You will need to adjust this based on your final ActivityMetric shape.
    const charCounts = initialMetrics.map(m => (m.type === 'lineChange' ? m.value.charCount : 0));
    const idleTimes = initialMetrics.map(m => (m.type === 'lineChange' ? m.value.idleTime : 0));
    const undoCounts = initialMetrics.map(m => (m.type === 'lineChange' ? m.value.undoCount : 0));

    const chartData = {
        labels: timeLabels,
        datasets: [
            { label: 'Characters Typed', data: charCounts, borderColor: 'rgb(75, 192, 192)', tension: 0.4 },
            { label: 'Idle Time (ms)', data: idleTimes, borderColor: 'rgb(255, 99, 132)', tension: 0.4 },
            { label: 'Undo Count', data: undoCounts, borderColor: 'rgb(255, 205, 86)', tension: 0.4 }
        ]
    };

    // --- 3. Handlers for Sending Messages to the Extension ---
    const handleMoodLog = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const inputElement = e.target as HTMLInputElement;
            const moodText = inputElement.value;
            if (moodText) {
                // Use the strongly-typed message format defined in index.tsx
                vscodeApi.postMessage({ command: 'showInformationMessage', payload: `Mood logged: ${moodText}` });
                inputElement.value = ''; // Clear the input
            }
        }
    };

    return (
        <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
            <h2>DevPulse X Dashboard</h2>
            <Line data={chartData} />
            <p>Track your coding flow, idle times, and undo metrics live.</p>

            <div style={{ marginTop: 20 }}>
                <h3>Quick Mood Check-In</h3>
                <input
                    type="text"
                    placeholder="How do you feel right now?"
                    onKeyDown={handleMoodLog}
                    style={{ width: '100%', padding: 8, fontSize: 14 }}
                />
            </div>
        </div>
    );
};
