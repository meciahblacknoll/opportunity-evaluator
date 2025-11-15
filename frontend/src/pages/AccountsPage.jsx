/**
 * PROVENANCE
 * Created: 2025-11-14
 * Updated: 2025-11-14 (Step 4.1 - Added accounts list and fetch logic)
 * Author: Claude Code
 *
 * Accounts management page with full CRUD functionality.
 */

import React, { useState, useEffect } from "react";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bank_name: "",
    nickname: "",
    balance: "",
    status: "active"
  });

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editAccount, setEditAccount] = useState({
    bank_name: "",
    nickname: "",
    balance: "",
    status: "active",
  });

  // Cycle management state
  const [cycles, setCycles] = useState({}); // accountId -> [cycles]
  const [cyclesExpanded, setCyclesExpanded] = useState({}); // accountId -> boolean
  const [cycleForms, setCycleForms] = useState({}); // accountId -> form state
  const [cyclesLoading, setCyclesLoading] = useState({}); // accountId -> boolean

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/accounts');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      setError(`Failed to load accounts: ${err.message}`);
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Currency conversion helpers
  const dollarsToCents = (d) => {
    if (d === "" || d === null || d === undefined) return 0;
    const num = Number(d);
    if (Number.isNaN(num)) return 0;
    return Math.round(num * 100);
  };

  const centsToDollars = (c) => {
    if (c === null || c === undefined) return "";
    return (c / 100).toFixed(2);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccount(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create account - POST to backend
  const createAccount = async () => {
    try {
      setLoading(true);

      const payload = {
        bank_name: newAccount.bank_name.trim(),
        nickname: newAccount.nickname.trim() || null,
        balance: parseFloat(newAccount.balance),
        status: newAccount.status,
      };

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create account");
      }

      const created = await res.json();

      // Add the account to local list
      setAccounts((prev) => [...prev, created]);

      // Reset form
      setNewAccount({
        bank_name: "",
        nickname: "",
        balance: "",
        status: "active",
      });
      setShowCreateForm(false);
      setError(null);

    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission with validation
  const handleSubmitCreate = (e) => {
    e.preventDefault();

    // Validation
    if (!newAccount.bank_name.trim()) {
      setError("Bank name is required.");
      return;
    }
    if (isNaN(parseFloat(newAccount.balance))) {
      setError("Balance must be a valid number.");
      return;
    }

    createAccount();
  };

  // Open/close form handlers
  const handleOpenCreateForm = () => {
    setShowCreateForm(true);
    setError(null); // Clear any previous errors
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    // Reset form
    setNewAccount({
      bank_name: "",
      nickname: "",
      balance: "",
      status: "active"
    });
  };

  // Delete account - DELETE from backend
  const deleteAccount = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this account?");
    if (!confirmDelete) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete account");
      }

      // Remove from local state
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      setError(null);

    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Open edit form with pre-filled data
  const handleOpenEditForm = (account) => {
    setEditingId(account.id);
    setEditAccount({
      bank_name: account.bank_name || "",
      nickname: account.nickname || "",
      balance: account.balance?.toString() || "",
      status: account.status || "active",
    });
    setError(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditAccount({
      bank_name: "",
      nickname: "",
      balance: "",
      status: "active",
    });
    setError(null);
  };

  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditAccount((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update account - PUT to backend
  const updateAccount = async (id) => {
    try {
      setLoading(true);

      const payload = {
        bank_name: editAccount.bank_name.trim(),
        nickname: editAccount.nickname.trim() || null,
        balance: parseFloat(editAccount.balance),
        status: editAccount.status,
      };

      const res = await fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update account");
      }

      const updated = await res.json();

      // Update local list
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === id ? updated : acc))
      );

      handleCancelEdit();
      setError(null);

    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Cycle Management Functions

  const fetchCycles = async (accountId) => {
    setCyclesLoading(prev => ({ ...prev, [accountId]: true }));
    try {
      const res = await fetch(`/api/accounts/${accountId}/cycles`);
      if (!res.ok) throw new Error("Failed to load cycles");
      const data = await res.json();
      setCycles(prev => ({ ...prev, [accountId]: data }));
    } catch (err) {
      console.error("fetchCycles error", err);
      setError(err.message || "Error loading cycles");
    } finally {
      setCyclesLoading(prev => ({ ...prev, [accountId]: false }));
    }
  };

  const toggleShowCycles = (accountId) => {
    setCyclesExpanded(prev => {
      const newVal = !prev[accountId];
      if (newVal && (!cycles[accountId] || cycles[accountId].length === 0)) {
        fetchCycles(accountId);
      }
      return { ...prev, [accountId]: newVal };
    });
  };

  const openCreateCycleForm = (accountId) => {
    setCycleForms(prev => ({
      ...prev,
      [accountId]: {
        statement_start: "",
        statement_end: "",
        balance_at_statement: "",
        min_payment: "",
        due_date: ""
      }
    }));
    setCyclesExpanded(prev => ({ ...prev, [accountId]: true }));
    setError(null);
  };

  const handleCycleFormChange = (accountId, name, value) => {
    setCycleForms(prev => ({
      ...prev,
      [accountId]: {
        ...(prev[accountId] || {}),
        [name]: value
      }
    }));
  };

  const createCycle = async (accountId) => {
    const form = cycleForms[accountId] || {};
    if (!form.statement_start || !form.statement_end) {
      setError("Statement start and end are required.");
      return;
    }

    const payload = {
      account_id: accountId,
      statement_start: form.statement_start,
      statement_end: form.statement_end,
      balance_at_statement: dollarsToCents(form.balance_at_statement),
      min_payment: dollarsToCents(form.min_payment),
      due_date: form.due_date || null
    };

    try {
      setCyclesLoading(prev => ({ ...prev, [accountId]: true }));
      const res = await fetch(`/api/accounts/${accountId}/cycles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create cycle");
      }
      const created = await res.json();
      setCycles(prev => ({ ...prev, [accountId]: [...(prev[accountId] || []), created] }));
      setCycleForms(prev => ({ ...prev, [accountId]: null }));
      setError(null);
    } catch (err) {
      console.error("createCycle error", err);
      setError(err.message || "Failed to create cycle");
    } finally {
      setCyclesLoading(prev => ({ ...prev, [accountId]: false }));
    }
  };

  const deleteCycle = async (cycleId, accountId) => {
    const confirmed = window.confirm("Delete this cycle?");
    if (!confirmed) return;
    try {
      setCyclesLoading(prev => ({ ...prev, [accountId]: true }));
      const res = await fetch(`/api/cycles/${cycleId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete cycle");
      }
      setCycles(prev => ({
        ...prev,
        [accountId]: (prev[accountId] || []).filter(c => c.id !== cycleId)
      }));
      setError(null);
    } catch (err) {
      console.error("deleteCycle error", err);
      setError(err.message || "Failed to delete cycle");
    } finally {
      setCyclesLoading(prev => ({ ...prev, [accountId]: false }));
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Accounts</h1>
        <button
          onClick={handleOpenCreateForm}
          style={{
            padding: "10px 20px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          + Create New Account
        </button>
      </div>

      {/* Create Account Form */}
      {showCreateForm && (
        <div style={{
          marginBottom: "30px",
          padding: "20px",
          border: "2px solid #007bff",
          borderRadius: "8px",
          background: "#f8f9fa",
        }}>
          <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Create New Account</h2>

          <form onSubmit={handleSubmitCreate}>
            <div style={{ display: "grid", gap: "15px" }}>
              {/* Bank Name */}
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  Bank Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={newAccount.bank_name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Chase, Bank of America"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "16px",
                  }}
                />
              </div>

              {/* Nickname */}
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  Nickname (Optional)
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={newAccount.nickname}
                  onChange={handleInputChange}
                  placeholder="e.g., My Checking Account"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "16px",
                  }}
                />
              </div>

              {/* Balance */}
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  Balance <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="number"
                  name="balance"
                  value={newAccount.balance}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "16px",
                  }}
                />
              </div>

              {/* Status */}
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                  Status <span style={{ color: "red" }}>*</span>
                </label>
                <select
                  name="status"
                  value={newAccount.status}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "16px",
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={handleCancelCreate}
                  style={{
                    padding: "10px 20px",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div style={{
          padding: "15px",
          background: "#fee",
          border: "1px solid #fcc",
          borderRadius: "6px",
          marginBottom: "20px",
          color: "#c33",
        }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Loading accounts...
        </div>
      )}

      {!loading && !error && accounts.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          No accounts found. Create your first account to get started!
        </div>
      )}

      {!loading && !error && accounts.length > 0 && (
        <div style={{ display: "grid", gap: "20px" }}>
          {accounts.map((account) => (
            editingId === account.id ? (
              // EDIT FORM CARD
              <div
                key={account.id}
                style={{
                  padding: "20px",
                  border: "2px solid #ffc107",
                  borderRadius: "8px",
                  background: "#fffbf0",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: "20px" }}>Edit Account</h3>

                <div style={{ display: "grid", gap: "15px" }}>
                  {/* Bank Name */}
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Bank Name <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={editAccount.bank_name}
                      onChange={handleEditInputChange}
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "16px",
                      }}
                    />
                  </div>

                  {/* Nickname */}
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Nickname
                    </label>
                    <input
                      type="text"
                      name="nickname"
                      value={editAccount.nickname}
                      onChange={handleEditInputChange}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "16px",
                      }}
                    />
                  </div>

                  {/* Balance */}
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Balance <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="balance"
                      value={editAccount.balance}
                      onChange={handleEditInputChange}
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "16px",
                      }}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                      Status <span style={{ color: "red" }}>*</span>
                    </label>
                    <select
                      name="status"
                      value={editAccount.status}
                      onChange={handleEditInputChange}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "16px",
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button
                      onClick={() => updateAccount(account.id)}
                      style={{
                        padding: "10px 20px",
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: "10px 20px",
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // NORMAL VIEW CARD
              <div
                key={account.id}
                style={{
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  background: "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: "0 0 10px 0", fontSize: "20px" }}>
                      {account.nickname || account.bank_name}
                    </h3>
                    <div style={{ color: "#666", marginBottom: "5px" }}>
                      <strong>Bank:</strong> {account.bank_name}
                    </div>
                    {account.nickname && (
                      <div style={{ color: "#666", marginBottom: "5px" }}>
                        <strong>Nickname:</strong> {account.nickname}
                      </div>
                    )}
                    <div style={{ color: "#666", marginBottom: "5px" }}>
                      <strong>Balance:</strong> {formatCurrency(account.balance)}
                    </div>
                    <div style={{ marginTop: "10px" }}>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          background: account.status === 'active' ? '#d4edda' : '#f8d7da',
                          color: account.status === 'active' ? '#155724' : '#721c24',
                        }}
                      >
                        {account.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleOpenEditForm(account)}
                      style={{
                        padding: "8px 16px",
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAccount(account.id)}
                      style={{
                        padding: "8px 16px",
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Cycles Section */}
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee" }}>
                  <button
                    onClick={() => toggleShowCycles(account.id)}
                    style={{
                      padding: "6px 12px",
                      background: "#17a2b8",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    {cyclesExpanded[account.id] ? "Hide Cycles" : "Show Cycles"}
                  </button>

                  <button
                    onClick={() => openCreateCycleForm(account.id)}
                    style={{
                      marginLeft: "8px",
                      padding: "6px 12px",
                      background: "white",
                      color: "#17a2b8",
                      border: "1px solid #17a2b8",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    + New Cycle
                  </button>

                  {cyclesExpanded[account.id] && (
                    <div style={{ marginTop: "10px", padding: "10px", border: "1px solid #eee", borderRadius: "8px", background: "#f9f9f9" }}>
                      {cyclesLoading[account.id] && <p style={{ color: "#666" }}>Loading cycles...</p>}

                      {/* Cycles table */}
                      {cycles[account.id] && cycles[account.id].length > 0 ? (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                          <thead>
                            <tr style={{ background: "#e9ecef" }}>
                              <th style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Start</th>
                              <th style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>End</th>
                              <th style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Balance</th>
                              <th style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Min Payment</th>
                              <th style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>Due Date</th>
                              <th style={{ padding: "8px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cycles[account.id].map((c) => (
                              <tr key={c.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                                <td style={{ padding: "8px" }}>{c.statement_start}</td>
                                <td style={{ padding: "8px" }}>{c.statement_end}</td>
                                <td style={{ padding: "8px" }}>${c.balance_at_statement ? (c.balance_at_statement / 100).toFixed(2) : "0.00"}</td>
                                <td style={{ padding: "8px" }}>${c.min_payment ? (c.min_payment / 100).toFixed(2) : "0.00"}</td>
                                <td style={{ padding: "8px" }}>{c.due_date || "—"}</td>
                                <td style={{ padding: "8px", textAlign: "center" }}>
                                  <button
                                    onClick={() => deleteCycle(c.id, account.id)}
                                    style={{
                                      padding: "4px 8px",
                                      background: "#dc3545",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "12px",
                                    }}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        !cyclesLoading[account.id] && <p style={{ color: "#666" }}>No cycles found for this account.</p>
                      )}

                      {/* Create cycle form */}
                      {cycleForms[account.id] && (
                        <form
                          onSubmit={(e) => { e.preventDefault(); createCycle(account.id); }}
                          style={{
                            marginTop: "12px",
                            padding: "12px",
                            background: "white",
                            border: "1px solid #dee2e6",
                            borderRadius: "6px",
                          }}
                        >
                          <h4 style={{ marginTop: 0, marginBottom: "12px", fontSize: "16px" }}>Create New Cycle</h4>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px" }}>
                            <label style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ marginBottom: "4px", fontSize: "14px", fontWeight: "bold" }}>Statement Start <span style={{ color: "red" }}>*</span></span>
                              <input
                                type="date"
                                value={cycleForms[account.id].statement_start}
                                onChange={(e) => handleCycleFormChange(account.id, "statement_start", e.target.value)}
                                required
                                style={{
                                  padding: "8px",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                }}
                              />
                            </label>

                            <label style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ marginBottom: "4px", fontSize: "14px", fontWeight: "bold" }}>Statement End <span style={{ color: "red" }}>*</span></span>
                              <input
                                type="date"
                                value={cycleForms[account.id].statement_end}
                                onChange={(e) => handleCycleFormChange(account.id, "statement_end", e.target.value)}
                                required
                                style={{
                                  padding: "8px",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                }}
                              />
                            </label>

                            <label style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ marginBottom: "4px", fontSize: "14px", fontWeight: "bold" }}>Balance at Statement ($)</span>
                              <input
                                type="number"
                                step="0.01"
                                value={cycleForms[account.id].balance_at_statement}
                                onChange={(e) => handleCycleFormChange(account.id, "balance_at_statement", e.target.value)}
                                placeholder="0.00"
                                style={{
                                  padding: "8px",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                }}
                              />
                            </label>

                            <label style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ marginBottom: "4px", fontSize: "14px", fontWeight: "bold" }}>Min Payment ($)</span>
                              <input
                                type="number"
                                step="0.01"
                                value={cycleForms[account.id].min_payment}
                                onChange={(e) => handleCycleFormChange(account.id, "min_payment", e.target.value)}
                                placeholder="0.00"
                                style={{
                                  padding: "8px",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                }}
                              />
                            </label>

                            <label style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ marginBottom: "4px", fontSize: "14px", fontWeight: "bold" }}>Due Date (optional)</span>
                              <input
                                type="date"
                                value={cycleForms[account.id].due_date}
                                onChange={(e) => handleCycleFormChange(account.id, "due_date", e.target.value)}
                                style={{
                                  padding: "8px",
                                  border: "1px solid #ddd",
                                  borderRadius: "4px",
                                  fontSize: "14px",
                                }}
                              />
                            </label>
                          </div>

                          <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                            <button
                              type="submit"
                              style={{
                                padding: "8px 16px",
                                background: "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "bold",
                              }}
                            >
                              Create Cycle
                            </button>
                            <button
                              type="button"
                              onClick={() => setCycleForms(prev => ({ ...prev, [account.id]: null }))}
                              style={{
                                padding: "8px 16px",
                                background: "#6c757d",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "14px",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
