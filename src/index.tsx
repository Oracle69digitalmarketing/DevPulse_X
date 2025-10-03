// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./ui/dashboardStyles.css"; // Your dashboard CSS
import { DevPulseDashboard, mountDashboard } from "./ui/dashboard"; // Adjust path if needed

// Create root if it doesn't exist
let rootElement = document.getElementById("root");
if (!rootElement) {
  rootElement = document.createElement("div");
  rootElement.id = "root";
  document.body.appendChild(rootElement);
}

// Mount React dashboard
const root = ReactDOM.createRoot(rootElement);
root.render(<DevPulseDashboard />);

// Optional: call mountDashboard if additional JS init is required
document.addEventListener("DOMContentLoaded", () => {
  mountDashboard?.();
});
