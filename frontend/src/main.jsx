import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { config } from "./config";

// Apply accent color from config to the CSS variable at startup
document.documentElement.style.setProperty("--accent", config.accentColor);
// Also update the page title
document.title = config.projectName;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
