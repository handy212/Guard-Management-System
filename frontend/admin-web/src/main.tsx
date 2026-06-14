import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { applyTheme, getStoredTheme } from "./lib/theme";
import "./styles.css";

applyTheme(getStoredTheme());

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
