// src/index.tsx
import ReactDOM from "react-dom/client";
import "./ui/dashboardStyles.css"; // Dashboard CSS
import { DevPulseDashboard, mountDashboard } from "./ui/dashboard";

// Create root element if it doesn't exist
let rootElement = document.getElementById("root");
if (!rootElement) {
  rootElement = document.createElement("div");
  rootElement.id = "root";
  document.body.appendChild(rootElement);
}

// Create and show loading screen
let loadingScreen = document.getElementById("loading-screen");
if (!loadingScreen) {
  loadingScreen = document.createElement("div");
  loadingScreen.id = "loading-screen";
  loadingScreen.innerHTML = "<h1>Loading DevPulse_X...</h1>";
  document.body.appendChild(loadingScreen);
}

// Mount React dashboard
const root = ReactDOM.createRoot(rootElement);
root.render(<DevPulseDashboard vscodeApi={(window as any).vscodeApi} />);

// Remove loading screen when DOM content is loaded and dashboard is mounted
document.addEventListener("DOMContentLoaded", () => {
  mountDashboard?.();
  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }
});
