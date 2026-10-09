import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAdminArea,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  getAuditLogs,
} from "../../services/authApi";

const ROLES = ["crew", "officer", "admin"];
const PAGE_SIZE = 10;
const s = {
  page: { minHeight: "calc(100vh - 140px)", background: "#f1f5f9", padding: "38px 20px 70px" },
  container: { maxWidth: 1150, margin: "0 auto" },
  card: { background: "white", border: "1px solid #e2e8f0", borderRadius: 18, boxShadow: "0 5px 25px rgba(15,23,42,.05)" },
  button: { border: 0, borderRadius: 9, padding: "10px 15px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  input: { background: "#f8fafc", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 10, padding: "12px 14px", fontSize: 13, boxSizing: "border-box" },
  th: { padding: "15px 20px", fontSize: 11, color: "#64748b", borderBottom: "1px solid #e2e8f0", textAlign: "left", whiteSpace: "nowrap" },
  td: { padding: "16px 20px", borderBottom: "1px solid #f1f5f9", fontSize: 13 },
};

function StatCard({ icon, label, value, background }) {
  return <div style={{ ...s.card, padding: 22, display: "flex", gap: 14, alignItems: "center" }}>
    <div style={{ width: 49, height: 49, borderRadius: 13, background, display: "grid", placeItems: "center", fontSize: 23 }}>{icon}</div>
    <div><div style={{ fontSize: 12, color: "#64748b" }}>{label}</div><div style={{ fontSize: 27, fontWeight: 800, color: "#0f172a" }}>{value}</div></div>
  </div>;
}
function RoleBadge({ role }) {
  const colors = { admin: ["#ede9fe", "#6d28d9"], officer: ["#dbeafe", "#1d4ed8"], crew: ["#f1f5f9", "#475569"] };
  const [background, color] = colors[role] || colors.crew;
  return <span style={{ background, color, padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{role}</span>;
}
function StatusBadge({ active }) {
  return <span style={{ background: active ? "#dcfce7" : "#fee2e2", color: active ? "#15803d" : "#b91c1c", borderRadius: 20, padding: "6px 10px", fontSize: 11, fontWeight: 700 }}>{active ? "● Active" : "● Inactive"}</span>;
}
function ConfirmDialog({ action, loading, onCancel, onConfirm }) {
  if (!action) return null;
  const deactivating = action.type === "status" && !action.value;
  const title = action.type === "role" ? "Confirm Role Change" : deactivating ? "Deactivate User?" : "Activate User?";
  const description = action.type === "role"
    ? `Change ${action.username}'s role from ${action.previousRole} to ${action.value}?`
    : deactivating ? `Deactivate ${action.username}? This user will no longer be able to access SeaGuard AI until reactivated.` : `Reactivate ${action.username}'s account?`;
  return <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,.65)", zIndex: 1000, display: "grid", placeItems: "center", padding: 20 }}>
    <div role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" style={{ background: "white", width: "100%", maxWidth: 430, borderRadius: 18, padding: 28, boxShadow: "0 25px 70px rgba(0,0,0,.25)" }}>
      <div style={{ fontSize: 28 }}>{deactivating ? "⚠️" : "🔐"}</div>
      <h2 id="admin-confirm-title" style={{ color: "#0f172a", marginBottom: 8 }}>{title}</h2>
      <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>{description}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
        <button type="button" disabled={loading} onClick={onCancel} style={{ ...s.button, background: "#f1f5f9", color: "#334155" }}>Cancel</button>
        <button type="button" disabled={loading} onClick={onConfirm} style={{ ...s.button, background: deactivating ? "#dc2626" : "#0284c7", color: "white" }}>{loading ? "Processing..." : "Confirm"}</button>
      </div>
    </div>
  </div>;
}
function formatAuditTime(value) {
  if (!value) return "Not available";
  const text = String(value);
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text) ? text : `${text}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString();
}

export default function AdminArea() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditAction, setAuditAction] = useState("all");
  const [auditPage, setAuditPage] = useState(1);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const loadUsers = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      await getAdminArea();
      setAuthorized(true);
      const result = await getAllUsers();
      if (!Array.isArray(result)) throw new Error("Unexpected user list response.");
      setUsers(result);
    } catch (err) {
      setError(err.message || "Unable to load administrator data.");
      if (!refresh) setAuthorized(false);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true); setAuditError("");
    try {
      const result = await getAuditLogs(100);
      if (!Array.isArray(result)) throw new Error("Unexpected audit log response.");
      setAuditLogs(result);
    } catch (err) { setAuditError(err.message || "Unable to load security audit logs."); }
    finally { setAuditLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { if (authorized) loadAuditLogs(); }, [authorized, loadAuditLogs]);

  const statistics = useMemo(() => ({
    total: users.length,
    active: users.filter((x) => x.is_active).length,
    admins: users.filter((x) => x.role === "admin").length,
    officers: users.filter((x) => x.role === "officer").length,
    crew: users.filter((item) => item.role === "crew").length,
  }), [users]);
  const filteredUsers = useMemo(() => users.filter((x) =>
    (!search.trim() || `${x.username || ""} ${x.email || ""}`.toLowerCase().includes(search.trim().toLowerCase())) &&
    (roleFilter === "all" || x.role === roleFilter) &&
    (statusFilter === "all" || x.is_active === (statusFilter === "active"))
  ), [users, search, roleFilter, statusFilter]);
  const auditActions = useMemo(() => [...new Set(auditLogs.map((x) => x.action).filter(Boolean))].sort(), [auditLogs]);
  const filteredAuditLogs = useMemo(() => auditLogs.filter((x) =>
    (auditAction === "all" || x.action === auditAction) &&
    (!auditSearch.trim() || `${x.username || ""} ${x.action || ""}`.toLowerCase().includes(auditSearch.trim().toLowerCase()))
  ), [auditLogs, auditSearch, auditAction]);
  const totalAuditPages = Math.max(1, Math.ceil(filteredAuditLogs.length / PAGE_SIZE));
  const visibleAuditLogs = showAllLogs ? filteredAuditLogs.slice((auditPage - 1) * PAGE_SIZE, auditPage * PAGE_SIZE) : filteredAuditLogs.slice(0, PAGE_SIZE);
  const changeAuditSearch = (value) => { setAuditSearch(value); setAuditPage(1); };
  const changeAuditAction = (value) => { setAuditAction(value); setAuditPage(1); };

  const confirmAction = async () => {
    if (!pendingAction || saving) return;
    setSaving(true); setError(""); setSuccess("");
    const action = pendingAction;
    try {
      if (action.type === "role") {
        await updateUserRole(action.username, action.value);
        setSuccess(`${action.username}'s role was updated successfully.`);
      } else {
        await updateUserStatus(action.username, action.value);
        setSuccess(`${action.username}'s account was ${action.value ? "activated" : "deactivated"} successfully.`);
      }
      setPendingAction(null);
      await loadUsers(true);
      await loadAuditLogs();
    } catch (err) { setError(err.message || "Unable to update user."); setPendingAction(null); }
    finally { setSaving(false); }
  };

  return <div style={s.page}><div style={s.container}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
      <div><div style={{ color: "#0891b2", fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>SEAGUARD AI • SYSTEM ADMINISTRATION</div>
        <h1 style={{ color: "#0b1f3a", fontSize: 32, margin: "10px 0 6px" }}>Admin Dashboard</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Manage user accounts, access permissions and system security.</p>
      </div>
      <button type="button" disabled={loading || refreshing || saving} onClick={() => loadUsers(true)} style={{ ...s.button, background: "white", border: "1px solid #cbd5e1", color: "#0369a1" }}>{refreshing ? "Refreshing..." : "↻ Refresh Users"}</button>
    </div>
    <div style={{ ...s.card, padding: "17px 22px", marginTop: 25, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ background: "#e0e7ff", borderRadius: 12, width: 43, height: 43, display: "grid", placeItems: "center", fontSize: 22 }}>🛡️</div>
      <div style={{ flex: 1 }}><strong style={{ color: "#0f172a", fontSize: 14 }}>{user?.username || "Administrator"}</strong><div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>System Administrator</div></div>
      <span style={{ background: authorized ? "#dcfce7" : "#f1f5f9", color: authorized ? "#15803d" : "#64748b", borderRadius: 20, padding: "7px 12px", fontSize: 11, fontWeight: 800 }}>{authorized ? "✓ ACCESS VERIFIED" : "VERIFYING ACCESS"}</span>
    </div>
    {error && <p role="alert" style={{ background: "#fef2f2", color: "#b91c1c", padding: 15, borderRadius: 12 }}>{error}</p>}
    {success && <p role="status" style={{ background: "#ecfdf5", color: "#047857", padding: 15, borderRadius: 12 }}>✓ {success}</p>}
    {loading ? <div style={{ ...s.card, marginTop: 25, padding: 50, textAlign: "center" }}>Loading administrator dashboard...</div> : authorized ? <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 17, marginTop: 25 }}>
        <StatCard icon="👥" label="Total Users" value={statistics.total} background="#e0f2fe" />
        <StatCard icon="✓" label="Active Users" value={statistics.active} background="#d1fae5" />
        <StatCard icon="🛡️" label="Administrators" value={statistics.admins} background="#ffedd5" />
        <StatCard icon="⚓" label="Officers" value={statistics.officers} background="#e0e7ff" />
        <StatCard icon="👨‍✈️" label="Crew" value={statistics.crew} background="#f0f9ff" />
      </div>

      {/* User Management is intentionally before Audit Logs. */}
      <section style={{ ...s.card, marginTop: 25, overflow: "hidden" }}>
        <div style={{ padding: 25, borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ color: "#0f172a", margin: 0, fontSize: 20 }}>👥 User Management</h2>
          <p style={{ color: "#64748b", fontSize: 13, margin: "7px 0 0" }}>Search users and manage their assigned roles and account status.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <input type="search" aria-label="Search users" placeholder="Search username or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...s.input, flex: "1 1 250px" }} />
            <select aria-label="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={s.input}><option value="all">All Roles</option>{ROLES.map((role) => <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>)}</select>
            <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={s.input}><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8fafc" }}><tr>{["USER", "ROLE", "STATUS", "CHANGE ROLE", "ACCOUNT ACTION"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{filteredUsers.map((item) => {
            const isSelf = item.username === user?.username;
            return <tr key={item.username}>
              <td style={s.td}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 37, height: 37, borderRadius: 11, flexShrink: 0, background: "linear-gradient(135deg,#0369a1,#06b6d4)", color: "white", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12 }}>{(item.username || "U").slice(0, 2).toUpperCase()}</div><div><strong style={{ color: "#0f172a" }}>{item.username}</strong>{isSelf && <span style={{ color: "#0284c7", marginLeft: 6, fontSize: 11 }}>(You)</span>}<div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{item.email}</div></div></div></td>
              <td style={s.td}><RoleBadge role={item.role} /></td>
              <td style={s.td}><StatusBadge active={item.is_active} /></td>
              <td style={s.td}><select aria-label={`Change role for ${item.username}`} value={item.role} disabled={saving || isSelf} onChange={(e) => { if (e.target.value !== item.role) setPendingAction({ type: "role", username: item.username, previousRole: item.role, value: e.target.value }); }} style={{ ...s.input, padding: "9px 10px", opacity: isSelf ? .5 : 1, cursor: isSelf ? "not-allowed" : "pointer" }}>{ROLES.map((role) => <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>)}</select></td>
              <td style={s.td}><button type="button" disabled={saving || isSelf} onClick={() => setPendingAction({ type: "status", username: item.username, value: !item.is_active })} style={{ ...s.button, padding: "9px 13px", background: item.is_active ? "#fff1f2" : "#ecfdf5", color: item.is_active ? "#be123c" : "#047857", opacity: isSelf ? .5 : 1 }}>{item.is_active ? "Deactivate" : "Activate"}</button></td>
            </tr>;
          })}</tbody>
        </table>{filteredUsers.length === 0 && <p style={{ padding: 25, textAlign: "center", color: "#64748b" }}>No users match your search or filters.</p>}</div>
        <div style={{ padding: "14px 25px", borderTop: "1px solid #e2e8f0", color: "#64748b", fontSize: 12 }}>Showing {filteredUsers.length} of {users.length} users</div>
      </section>

      <section style={{ ...s.card, marginTop: 25, overflow: "hidden" }}>
        <div style={{ padding: 25, borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div><h2 style={{ color: "#0f172a", margin: 0, fontSize: 20 }}>🔐 Security Audit Logs</h2><p style={{ color: "#64748b", fontSize: 13, margin: "7px 0 0" }}>Recent authentication and administration events (latest 100).</p></div>
            <button type="button" disabled={auditLoading} onClick={loadAuditLogs} style={{ ...s.button, background: "#e0f2fe", color: "#0369a1" }}>{auditLoading ? "Refreshing..." : "↻ Refresh Logs"}</button>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <input type="search" aria-label="Search audit logs" placeholder="Search username or event..." value={auditSearch} onChange={(e) => changeAuditSearch(e.target.value)} style={{ ...s.input, flex: "1 1 240px" }} />
            <select aria-label="Filter audit event" value={auditAction} onChange={(e) => changeAuditAction(e.target.value)} style={{ ...s.input, maxWidth: "100%" }}><option value="all">All Events</option>{auditActions.map((a) => <option key={a} value={a}>{a}</option>)}</select>
          </div>
        </div>
        {auditError && <p role="alert" style={{ padding: "0 25px", color: "#b91c1c" }}>{auditError}</p>}
        {auditLoading && auditLogs.length === 0 ? <p style={{ padding: 25, color: "#64748b" }}>Loading security events...</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 650, borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8fafc" }}><tr>{["DATE & TIME", "USERNAME", "SECURITY EVENT", "RESULT"].map((h) => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{visibleAuditLogs.map((log, index) => {
            const action = String(log.action || "UNKNOWN");
            const failed = /FAIL|DENIED|ERROR|BLOCK/i.test(action);
            return <tr key={`${log.timestamp || "none"}-${log.username || "unknown"}-${action}-${index}`}>
              <td style={{ ...s.td, color: "#475569", fontSize: 12 }}>{formatAuditTime(log.timestamp)}</td>
              <td style={{ ...s.td, fontWeight: 700 }}>{log.username || "Unknown"}</td>
              <td style={{ ...s.td, overflowWrap: "anywhere" }}>{action.replaceAll("_", " ")}</td>
              <td style={s.td}><span style={{ borderRadius: 20, padding: "5px 10px", fontSize: 11, fontWeight: 700, background: failed ? "#fee2e2" : "#dcfce7", color: failed ? "#b91c1c" : "#15803d" }}>{failed ? "Failed" : "Recorded"}</span></td>
            </tr>;
          })}</tbody>
        </table>{filteredAuditLogs.length === 0 && <p style={{ padding: 25, textAlign: "center", color: "#64748b" }}>No matching security events.</p>}</div>}
        <div style={{ padding: "15px 25px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: "#64748b", fontSize: 12 }}>Showing {visibleAuditLogs.length} of {filteredAuditLogs.length} matching events ({auditLogs.length} retrieved)</span>
          {filteredAuditLogs.length > PAGE_SIZE && (!showAllLogs ? <button type="button" onClick={() => { setShowAllLogs(true); setAuditPage(1); }} style={{ ...s.button, background: "#e0f2fe", color: "#0369a1" }}>View All Logs →</button> : <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setAuditPage((p) => Math.max(1, p - 1))} disabled={auditPage === 1} style={{ ...s.button, background: "#f1f5f9", color: "#334155" }}>← Previous</button>
            <span style={{ color: "#475569", fontSize: 12 }}>Page {auditPage} of {totalAuditPages}</span>
            <button type="button" onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))} disabled={auditPage >= totalAuditPages} style={{ ...s.button, background: "#f1f5f9", color: "#334155" }}>Next →</button>
            <button type="button" onClick={() => { setShowAllLogs(false); setAuditPage(1); }} style={{ ...s.button, background: "#e0f2fe", color: "#0369a1" }}>Show Less</button>
          </div>)}
        </div>
      </section>
      <p style={{ marginTop: 22, padding: "16px 18px", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 12, color: "#155e75", fontSize: 13 }}>🔐 Administrative actions are protected by role-based access control and handled by the SeaGuard AI Security & Access Agent.</p>
    </> : null}
  </div><ConfirmDialog action={pendingAction} loading={saving} onCancel={() => setPendingAction(null)} onConfirm={confirmAction} /></div>;
}
