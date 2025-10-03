import React from "react";
import ReactDOM from "react-dom/client";
import { DevPulseDashboard, mountDashboard } from "./dashboard";

// Mount the dashboard
document.addEventListener("DOMContentLoaded", () => {
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  mountDashboard();
});
