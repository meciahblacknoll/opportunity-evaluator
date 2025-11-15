import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import TopOpportunities from "./pages/TopOpportunities.jsx";
import AccountsPage from "./pages/AccountsPage.jsx";
import SimulatePage from "./pages/SimulatePage.jsx";

export default function App() {
  return (
    <div>
      {/* Simple nav bar */}
      <nav style={{ padding: "10px", background: "#f0f0f0" }}>
        <Link to="/" style={{ marginRight: "20px" }}>Opportunities</Link>
        <Link to="/accounts" style={{ marginRight: "20px" }}>Accounts</Link>
        <Link to="/simulate">Simulate</Link>
      </nav>

      <Routes>
        <Route path="/" element={<TopOpportunities />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/simulate" element={<SimulatePage />} />
      </Routes>
    </div>
  );
}
