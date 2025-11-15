/* /// PROVENANCE
   /// Created: 2025-11-15
   /// Prompt: PROMPTS/PLANNING_PROMPT_v2.md (Phase 2 frontend)
   /// Author: Claude Code (via ChatGPT relay)
   /// Updated: 2025-11-15 (Phase 2.5 - Recharts Integration)
*/

import React, { useEffect, useState, useMemo } from "react";
import ChartWrapper from "../components/ChartWrapper";

/**
 * SimulatePage.jsx
 *
 * Responsibilities:
 * - Fetch accounts + opportunities
 * - Accept form input (available cash, date range, select opportunities/accounts)
 * - POST to /api/simulate
 * - Render results: summary, opportunity list, float usage table, timeline sparkline, warnings
 *
 * Notes:
 * - All monetary user inputs are accepted in dollars (strings/numbers) and converted to cents
 * - Backend expects cents for numeric money fields
 * - The component uses simple inline styling consistent with existing pages
 */

/* ---------- Helpers ---------- */

const dollarsToCents = (d) => {
  if (d === "" || d === null || d === undefined) return 0;
  const num = Number(String(d).replace(/[^0-9.\-]/g, ""));
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
};

const centsToDollars = (c) => {
  if (c === null || c === undefined) return "0.00";
  return (c / 100).toFixed(2);
};

const isoToday = () => new Date().toISOString().slice(0, 10);

/* ---------- Main Component ---------- */

export default function SimulatePage() {
  const [accounts, setAccounts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // Inputs
  const [startDate, setStartDate] = useState(isoToday());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [availableCashDollars, setAvailableCashDollars] = useState("1000.00");
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [selectedOpportunityIds, setSelectedOpportunityIds] = useState([]);
  const [organicSpendDollars, setOrganicSpendDollars] = useState("0.00");

  // Results
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // UI state
  const [limit, setLimit] = useState(25);

  useEffect(() => {
    async function fetchInitial() {
      setLoadingData(true);
      try {
        const [accRes, oppRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch(`/api/recommendations?mode=roi&limit=${limit}`),
        ]);
        if (!accRes.ok) throw new Error("Failed to load accounts");
        if (!oppRes.ok) throw new Error("Failed to load opportunities");

        const accJson = await accRes.json();
        const oppJson = await oppRes.json();

        setAccounts(accJson || []);
        setOpportunities(oppJson || []);
        setError(null);
      } catch (err) {
        console.error("Initial load error", err);
        setError(err.message || "Failed to load initial data");
      } finally {
        setLoadingData(false);
      }
    }

    fetchInitial();
  }, [limit]);

  // helpers to toggle selections
  const toggleAccountSelection = (id) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleOpportunitySelection = (id) => {
    setSelectedOpportunityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Prepare payload and call simulate
  const runSimulation = async () => {
    setSimLoading(true);
    setSimResult(null);
    setError(null);

    // Basic validation
    if (!startDate || !endDate) {
      setError("Please specify a valid start and end date.");
      setSimLoading(false);
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError("End date must be after start date.");
      setSimLoading(false);
      return;
    }

    const payload = {
      start_date: startDate,
      end_date: endDate,
      opportunity_ids: selectedOpportunityIds,
      account_ids: selectedAccountIds.length ? selectedAccountIds : null,
      available_cash: dollarsToCents(availableCashDollars),
      organic_spend: dollarsToCents(organicSpendDollars),
    };

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Simulation failed");
      }

      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error("Simulation error", err);
      setError(err.message || "Simulation failed");
    } finally {
      setSimLoading(false);
    }
  };

  // Derived metrics for summary
  const totalExpectedProfit = useMemo(() => {
    if (!simResult || !simResult.results) return 0;
    return simResult.results.reduce((s, r) => s + (r.expected_value || 0), 0);
  }, [simResult]);

  const totalAprCost = simResult?.total_apr_cost ?? 0;
  const projectedNet = simResult?.projected_net_profit ?? null;

  /* ---------- Render ---------- */

  return (
    <div style={{ padding: 20 }}>
      <h1>Simulation</h1>

      {loadingData && <p>Loading accounts and opportunities...</p>}
      {error && (
        <div style={{ marginBottom: 12, padding: 8, background: "var(--accent-danger)", color: "#fff", borderRadius: 4 }}>
          {error}
        </div>
      )}

      {/* Form */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-secondary)" }}>
          <h3>Simulation Inputs</h3>

          <div style={{ display: "grid", gap: 8 }}>
            <label>
              Start Date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>

            <label>
              End Date
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>

            <label>
              Available Cash ($)
              <input
                type="number"
                step="0.01"
                value={availableCashDollars}
                onChange={(e) => setAvailableCashDollars(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>

            <label>
              Organic Spend Capacity ($)
              <input
                type="number"
                step="0.01"
                value={organicSpendDollars}
                onChange={(e) => setOrganicSpendDollars(e.target.value)}
                style={{ width: "100%", padding: 8, marginTop: 6 }}
              />
            </label>

            <div>
              <strong>Accounts</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {accounts.map((a) => (
                  <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(a.id)}
                      onChange={() => toggleAccountSelection(a.id)}
                    />
                    <span style={{ marginLeft: 6 }}>
                      {a.nickname || a.name || a.bank_name || a.name} — ${centsToDollars(a.current_balance)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <strong>Opportunities</strong>
              <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                {opportunities.map((o) => (
                  <label key={o.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedOpportunityIds.includes(o.id)}
                      onChange={() => toggleOpportunitySelection(o.id)}
                    />
                    <div style={{ marginLeft: 6 }}>
                      <div style={{ fontWeight: 600 }}>{o.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        Est. profit: ${centsToDollars(o.expected_return || o.expected_profit || 0)}
                        {" • "}
                        Duration: {o.turnaround_days || o.duration || "—"} days
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                className="btn btn-primary"
                onClick={runSimulation}
                disabled={simLoading}
                style={{
                  padding: "10px 14px",
                  background: "var(--accent-primary)",
                  color: "#fff",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {simLoading ? "Simulating..." : "Run Simulation"}
              </button>

              <button
                className="btn"
                onClick={() => {
                  // reset selections
                  setSelectedAccountIds([]);
                  setSelectedOpportunityIds([]);
                  setSimResult(null);
                  setError(null);
                }}
                style={{
                  padding: "10px 14px",
                  background: "var(--bg-tertiary)",
                  borderRadius: 6,
                  border: "1px solid var(--border-color)",
                  cursor: "pointer"
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right summary box */}
        <aside style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-tertiary)" }}>
          <h3>Quick Summary</h3>

          <p>
            Selected opportunities: <b>{selectedOpportunityIds.length}</b>
          </p>
          <p>
            Selected accounts: <b>{selectedAccountIds.length}</b>
          </p>
          <p>
            Available cash: <b>${availableCashDollars}</b>
          </p>

          <hr />

          <p>
            Estimated total profit: <b>${centsToDollars(totalExpectedProfit || 0)}</b>
          </p>
          <p>
            Estimated APR cost: <b>${centsToDollars(totalAprCost || 0)}</b>
          </p>
          <p>
            Projected net profit:{" "}
            <b>
              {projectedNet !== null ? `${centsToDollars(projectedNet)}` : "—"}
            </b>
          </p>
        </aside>
      </div>

      {/* Results */}
      <div style={{ marginTop: 20 }}>
        {simResult && (
          <div>
            <h2>Simulation Results</h2>

            {/* Summary metrics */}
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ padding: 12, border: "1px solid var(--border-light)", borderRadius: 8, background: "var(--bg-secondary)" }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total APR Cost</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-heading)" }}>${centsToDollars(simResult.total_apr_cost || 0)}</div>
              </div>

              <div style={{ padding: 12, border: "1px solid var(--border-light)", borderRadius: 8, background: "var(--bg-secondary)" }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Projected Net Profit</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-heading)" }}>
                  {simResult.projected_net_profit !== undefined ? `${centsToDollars(simResult.projected_net_profit)}` : "—"}
                </div>
              </div>

              <div style={{ padding: 12, border: "1px solid var(--border-light)", borderRadius: 8, background: "var(--bg-secondary)" }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Opportunities Modeled</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-heading)" }}>{simResult.results?.length || 0}</div>
              </div>
            </div>

            {/* Opportunity table */}
            <div style={{ border: "1px solid var(--border-light)", borderRadius: 8, padding: 12, marginBottom: 12, background: "var(--bg-secondary)" }}>
              <h3>Opportunities</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
                    <th style={{ padding: "8px" }}>Name</th>
                    <th style={{ padding: "8px" }}>Expected Profit</th>
                    <th style={{ padding: "8px" }}>Float Required</th>
                    <th style={{ padding: "8px" }}>Duration</th>
                    <th style={{ padding: "8px" }}>Warnings</th>
                  </tr>
                </thead>
                <tbody>
                  {simResult.results?.map((r) => (
                    <tr key={r.opportunity_id} style={{ borderBottom: "1px solid #fafafa" }}>
                      <td style={{ padding: 8 }}>{r.name || `Opp ${r.opportunity_id}`}</td>
                      <td style={{ padding: 8 }}>${centsToDollars(r.expected_value || 0)}</td>
                      <td style={{ padding: 8 }}>${centsToDollars(r.float_required || r.required_float || 0)}</td>
                      <td style={{ padding: 8 }}>{r.duration_days || r.duration || "—"} days</td>
                      <td style={{ padding: 8, color: r.warnings && r.warnings.length ? "var(--accent-danger)" : "var(--text-secondary)" }}>
                        {r.warnings && r.warnings.length ? r.warnings.join("; ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Timeline + sparkline */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div style={{ padding: 12, border: "1px solid var(--border-light)", borderRadius: 8, background: "var(--bg-secondary)" }}>
                <h3>Daily Liquidity Timeline</h3>
                {simResult.timeline && simResult.timeline.length ? (
                  <>
                    {/* Build data points from timeline daily balance field */}
                    <ChartWrapper
                      data={simResult.timeline.map((d) => d.balance || d.available_cash || 0).map(Number)}
                      height={80}
                      stroke="var(--chart-line)"
                    />

                    {/* compact list of first 14 date rows */}
                    <div style={{ marginTop: 12, maxHeight: 220, overflow: "auto", fontSize: 13 }}>
                      {simResult.timeline.slice(0, 200).map((d, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #fafafa" }}>
                          <div>{d.date}</div>
                          <div>${centsToDollars(d.balance || d.available_cash || 0)}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p>No timeline data returned.</p>
                )}
              </div>

              <div style={{ padding: 12, border: "1px solid var(--border-light)", borderRadius: 8, background: "var(--bg-secondary)" }}>
                <h3>Float Usage</h3>
                {simResult.float_usage && simResult.float_usage.length ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: 6 }}>Account</th>
                        <th style={{ padding: 6 }}>Amount</th>
                        <th style={{ padding: 6 }}>APR</th>
                        <th style={{ padding: 6 }}>Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simResult.float_usage.map((u, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: 6 }}>{u.account_id}</td>
                          <td style={{ padding: 6 }}>${centsToDollars(u.amount_used || u.amount || 0)}</td>
                          <td style={{ padding: 6 }}>{u.apr_percent ? `${u.apr_percent}%` : "—"}</td>
                          <td style={{ padding: 6 }}>${centsToDollars(u.total_cost || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No float usage recorded.</p>
                )}

                <div style={{ marginTop: 12 }}>
                  <h4>Warnings</h4>
                  {simResult.warnings && simResult.warnings.length ? (
                    <ul>
                      {simResult.warnings.map((w, i) => (
                        <li key={i} style={{ color: "var(--accent-danger)" }}>
                          {w}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "var(--text-secondary)" }}>No warnings</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debug / Raw JSON (collapsible) */}
      <details style={{ marginTop: 18 }}>
        <summary style={{ color: "var(--text-primary)", cursor: "pointer" }}>Raw simulation output (debug)</summary>
        <pre style={{ maxHeight: 400, overflow: "auto", background: "var(--bg-tertiary)", padding: 12, color: "var(--text-primary)", borderRadius: 4 }}>
          {JSON.stringify(simResult || {}, null, 2)}
        </pre>
      </details>
    </div>
  );
}
