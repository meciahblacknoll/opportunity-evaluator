/**
 * PROVENANCE
 * Updated: 2025-11-15 (Phase 2.5 - Dark Mode)
 */

import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import TopOpportunities from "./pages/TopOpportunities.jsx";
import AccountsPage from "./pages/AccountsPage.jsx";
import SimulatePage from "./pages/SimulatePage.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";

export default function App() {
  return (
    <div>
      {/* Navigation bar with theme toggle */}
      <nav
        style={{
          padding: "10px 20px",
          background: "var(--bg-nav)",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "background-color 0.3s ease, border-color 0.3s ease"
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <Link
            to="/"
            style={{
              color: "var(--text-primary)",
              textDecoration: "none",
              fontWeight: 500
            }}
          >
            Opportunities
          </Link>
          <Link
            to="/accounts"
            style={{
              color: "var(--text-primary)",
              textDecoration: "none",
              fontWeight: 500
            }}
          >
            Accounts
          </Link>
          <Link
            to="/simulate"
            style={{
              color: "var(--text-primary)",
              textDecoration: "none",
              fontWeight: 500
            }}
          >
            Simulate
          </Link>
        </div>

        <ThemeToggle />
      </nav>

      <Routes>
        <Route path="/" element={<TopOpportunities />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/simulate" element={<SimulatePage />} />
      </Routes>
    </div>
  );
}
