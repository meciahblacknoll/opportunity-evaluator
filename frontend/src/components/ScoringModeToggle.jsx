import React from "react";

export default function ScoringModeToggle({ mode, setMode }) {
  return (
    <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
      <button
        onClick={() => setMode("roi")}
        style={{
          padding: "10px",
          background: mode === "roi" ? "#333" : "#ddd",
          color: mode === "roi" ? "#fff" : "#000",
          borderRadius: "6px",
        }}
      >
        ROI
      </button>

      <button
        onClick={() => setMode("ice")}
        style={{
          padding: "10px",
          background: mode === "ice" ? "#333" : "#ddd",
          color: mode === "ice" ? "#fff" : "#000",
          borderRadius: "6px",
        }}
      >
        ICE
      </button>

      <button
        onClick={() => setMode("combined")}
        style={{
          padding: "10px",
          background: mode === "combined" ? "#333" : "#ddd",
          color: mode === "combined" ? "#fff" : "#000",
          borderRadius: "6px",
        }}
      >
        Combined
      </button>
    </div>
  );
}
