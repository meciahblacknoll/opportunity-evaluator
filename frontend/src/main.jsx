/**
 * PROVENANCE
 * Created: 2025-11-14
 * Prompt: PROMPTS/PLANNING_PROMPT.md (v1.1)
 * Author: Claude Code
 * Updated: 2025-11-14 (Step 2 - Added routing)
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
