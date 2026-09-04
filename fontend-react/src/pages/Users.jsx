import { useEffect, useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { UserPlus, Users, Shield, KeyRound, Activity, Settings, Eye, Lock, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import Modal from "../components/Modal";
import { apiFetch } from "../api";
import {
  COLORS, CHART_COLORS, PageShell, KPI, KpiRow, Panel, ChartGrid,
  Badge, FilterBar, TextInput, Select, Table, RowAction,
} from "../components/shared";

const API = "/api";

const ROLES = [
  { value: "admin", label: "Super Admin" },
  { value: "principal", label: "Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
  { value: "class_president", label: "Class President" },
  { value: "parent", label: "Parent" },
  { value: "accountant", label: "Accountant" },
  { value: "librarian", label: "Librarian" },
  { value: "receptionist", label: "Receptionist" },
  { value: "staff", label: "Staff" },
];

const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

const STATUS_TONE = { active: "sage", pending: "amber", suspended: "coral", inactive: "slate" };

const EMPTY_FORM = {
  name: "", email: "", password: "", confirm_password: "", phone: "",
  role: "student", username: "", is_active: true,
  force_password_change: false, send_welcome_email: true,
  email_verified: false, phone_verified: false,
};

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: Activity },
  { id: "users", label: "All Users", icon: Users },
  { id: "create", label: "Create User", icon: UserPlus },
  { id: "roles", label: "Roles & Permissions", icon: Shield },
  { id: "security", label: "Login & Security", icon: KeyRound },
  { id: "activity", label: "Activity Logs", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

const roleGroups = [
  { id: "students", label: "Students", permissions: ["students.view", "students.create", "students.edit", "students.delete"] },
  { id: "teachers", label: "Teachers", permissions: ["teachers.view", "teachers.create", "teachers.edit", "teachers.delete"] },
  { id: "parents", label: "Parents", permissions: ["parents.view", "parents.create", "parents.edit", "parents.delete"] },
  { id: "homework", label: "Homework", permissions: ["homework.view", "homework.create", "homework.edit", "homework.delete"] },
  { id: "exams", label: "Exams", permissions: ["exams.view", "exams.create", "exams.edit", "exams.delete"] },
  { id: "grades", label: "Grades", permissions: ["grades.view", "grades.create", "grades.edit", "grades.export"] },
  { id: "fees", label: "Fees", permissions: ["fees.view", "fees.create", "fees.edit", "fees.delete"] },
  { id: "payroll", label: "Payroll", permissions: ["payroll.view", "payroll.create", "payroll.edit", "payroll.delete"] },
  { id: "attendance", label: "Attendance", permissions: ["attendance.view", "attendance.create", "attendance.edit"] },
  { id: "settings", label: "Settings", permissions: ["settings.view", "settings.edit"] },
];

const inputCls = "px-3 py-2 text-[13px] w-full border border-hairline bg-white text-ink focus:outline-none focus:border-ink transition";
const labelCls = "text-[12px] text-slate font-medium block mb-1";

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleDateString();
}

function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function UserManagement() {
  const [tab, setTab] = useState("dashboard");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });

  const [permsByGroup, setPermsByGroup] = useState({});
  const [roleSel, setRoleSel] = useState("admin");
  const [rolePerms, setRolePerms] = useState([]);

  const [loginStats, setLoginStats] = useState(null);
  const [loginHistory, setLoginHistory] = useState(null);
  const [activityLogs, setActivityLogs] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [viewing, setViewing] = useState(null);
  const [viewTab, setViewTab] = useState("overview");
  const [detailUser, setDetailUser] = useState(null);
  const [detailLogs, setDetailLogs] = useState(null);
  const [detailHistory, setDetailHistory] = useState(null);

  const [resetOpen, setResetOpen] = useState(null);
  const [resetPw, setResetPw] = useState("");

  const flash = (text, type = "success") => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 5000);
  };

  // ── All Users ───────────────────────────────────────────────
  const loadUsers = (pg = userPage) => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set("page", pg);
    apiFetch(`${API}/users?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => {
        setUsers(res.data || []);
        setMeta({ current_page: res.current_page, last_page: res.last_page, from: res.from, to: res.to, total: res.total });
      })
      .catch(() => flash("Failed to load users", "error"))
      .finally(() => setLoading(false));
  };

  const loadPermissions = () => {
    apiFetch(`${API}/permissions/by-group`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => setPermsByGroup(res || {}))
      .catch(() => {});
  };

  const loadRolePerms = (role = roleSel) => {
    apiFetch(`${API}/permissions/role/${role}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => setRolePerms((res || []).map((p) => p.id)))
      .catch(() => setRolePerms([]));
  };

  const loadLoginStats = () => {
    apiFetch(`${API}/login-history/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setLoginStats)
      .catch(() => {});
  };

  const loadSecurity = () => {
    apiFetch(`${API}/login-history/all?per_page=12`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => setLoginHistory(res.data || []))
      .catch(() => {});
    apiFetch(`${API}/activity-logs/recent`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setActivityLogs)
      .catch(() => {});
    loadLoginStats();
  };

  useEffect(() => {
    loadUsers(1);
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers(1);
    if (tab === "roles") { loadPermissions(); loadRolePerms(); }
    if (tab === "security") loadSecurity();
  }, [tab]);

  // ── KPIs for dashboard ─────────────────────────────────────
  const totalUsers = meta?.total ?? 0;
  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = users.filter((u) => !u.is_active).length;
  const roleCounts = useMemo(() => {
    const counts = {};
    users.forEach((u) => { counts[u.role] = (counts[u.role] || 0) + 1; });
    return counts;
  }, [users]);

  const roleChartData = useMemo(
    () => ROLES.filter((r) => roleCounts[r.value]).map((r) => ({ name: r.label, value: roleCounts[r.value] })),
    [roleCounts]
  );

  const recentUsers = users.slice(0, 6);

  const statusOf = (u) => (!u.is_active ? "inactive" : "active");

  // ── CRUD actions ───────────────────────────────────────────
  const setStatus = async (u, active) => {
    const res = await apiFetch(`${API}/users/${u.id}/${active ? "activate" : "deactivate"}`, { method: "POST" });
    if (res.ok) { flash(`${active ? "Activated" : "Deactivated"} ${u.name}`); loadUsers(userPage); }
    else flash("Action failed", "error");
  };

  const deleteUser = async (u) => {
    const res = await apiFetch(`${API}/users/${u.id}`, { method: "DELETE" });
    if (res.ok) { flash(`Deleted ${u.name}`); loadUsers(userPage); setViewing(null); }
    else { const d = await res.json().catch(() => ({})); flash(d.message || "Cannot delete user", "error"); }
  };

  const submitReset = async () => {
    const res = await apiFetch(`${API}/users/${resetOpen.id}/reset-password`, {
      method: "POST", body: JSON.stringify({ password: resetPw }),
    });
    if (res.ok) { flash("Password reset successfully"); setResetOpen(null); setResetPw(""); }
    else flash("Reset failed — must be at least 8 chars", "error");
  };

  const openDetail = async (u) => {
    const res = await apiFetch(`${API}/users/${u.id}`);
    if (!res.ok) return;
    const d = await res.json();
    setViewing(u);
    setDetailUser(d);
    setViewTab("overview");
    apiFetch(`${API}/activity-logs?user_id=${u.id}&per_page=15`)
      .then((r) => (r.ok ? r.json() : Promise.reject())).then((r) => setDetailLogs(r.data || [])).catch(() => setDetailLogs([]));
    apiFetch(`${API}/login-history/user/${u.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject())).then(setDetailHistory).catch(() => setDetailHistory([]));
  };

  const submitCreate = async () => {
    setSaving(true);
    if (form.password !== form.confirm_password) { flash("Passwords do not match", "error"); setSaving(false); return; }
    const res = await apiFetch(`${API}/users`, {
      method: "POST",
      body: JSON.stringify({
        name: form.name, email: form.email, password: form.password, role: form.role, is_active: form.is_active,
      }),
    });
    setSaving(false);
    if (res.ok) {
      flash("User created successfully");
      setForm(EMPTY_FORM);
      setCreateOpen(false);
      loadUsers(1);
    } else {
      const d = await res.json().catch(() => ({}));
      const err = d.errors ? Object.values(d.errors).flat().join("; ") : (d.message || "Failed to create user");
      flash(err, "error");
    }
  };

  const submitRolePerms = async () => {
    const res = await apiFetch(`${API}/permissions/assign`, {
      method: "POST", body: JSON.stringify({ role: roleSel, permission_ids: rolePerms }),
    });
    if (res.ok) flash(`Saved permissions for ${ROLE_LABEL[roleSel]}`);
    else flash("Failed to save permissions", "error");
  };

  const togglePerm = (id) =>
    setRolePerms((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Map backend permission names → ids so the matrix can present known keys.
  const permKeyToId = useMemo(() => {
    const m = {};
    Object.values(permsByGroup).flat().forEach((p) => { m[p.name] = p.id; });
    return m;
  }, [permsByGroup]);

  const colTone = (role) => (role === "admin" ? "coral" : role === "teacher" ? "amber" : "slate");

  return (
    <PageShell
      title="User Management"
      sub="Manage login accounts, roles, permissions, and security"
      action={tab !== "create" ? "Add User" : undefined}
      onAction={() => { setForm(EMPTY_FORM); setCreateOpen(true); }}
    >
      {msg.text && (
        <div className="mb-4 px-4 py-2 text-[13px] rounded-sm" style={{ background: msg.type === "error" ? `${COLORS.coral}22` : `${COLORS.sage}22`, color: msg.type === "error" ? COLORS.coral : COLORS.sage, border: `1px solid ${msg.type === "error" ? COLORS.coral : COLORS.sage}` }}>
          {msg.text}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 flex-wrap" style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-3 py-2.5 text-[13px]"
              style={{ color: active ? COLORS.ink : COLORS.slate, borderBottom: active ? `2px solid ${COLORS.ink}` : "2px solid transparent", fontWeight: active ? 600 : 400 }}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── DASHBOARD ─── */}
      {tab === "dashboard" && (
        <>
          <KpiRow cols={4}>
            <KPI label="Total Users" value={totalUsers.toLocaleString()} tone="ink" />
            <KPI label="Active" value={activeUsers.toLocaleString()} tone="sage" />
            <KPI label="Inactive" value={inactiveUsers.toLocaleString()} tone="slate" />
            <KPI label="Failed Logins Today" value={loginStats?.failed_today ?? "—"} tone="coral" sub={`${loginStats?.total_today ?? 0} attempts today`} />
          </KpiRow>

          <ChartGrid>
            <Panel title="Users by Role" span={2}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={roleChartData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {roleChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Today's Login Activity">
              <div className="space-y-2">
                <div className="flex justify-between text-[13px]" style={{ color: COLORS.ink }}><span>Attempts</span><span className="font-semibold">{loginStats?.total_today ?? "—"}</span></div>
                <div className="flex justify-between text-[13px]" style={{ color: COLORS.sage }}><span>Successful</span><span className="font-semibold">{loginStats?.successful_today ?? "—"}</span></div>
                <div className="flex justify-between text-[13px]" style={{ color: COLORS.coral }}><span>Failed</span><span className="font-semibold">{loginStats?.failed_today ?? "—"}</span></div>
                <div className="flex justify-between text-[13px]" style={{ color: COLORS.slate }}><span>Unique IPs</span><span className="font-semibold">{loginStats?.unique_ips_today ?? "—"}</span></div>
              </div>
              {loginStats?.recent_failures?.length > 0 && (
                <div className="mt-4">
                  <p className="text-[12px] font-medium mb-2" style={{ color: COLORS.coral }}>Recent failed attempts</p>
                  {loginStats.recent_failures.slice(0, 4).map((f) => (
                    <div key={f.id} className="text-[12px] py-1" style={{ color: COLORS.slate }}>
                      {f.user?.name || "Unknown"} · {f.ip_address} · {fmtDateTime(f.created_at)}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </ChartGrid>

          <Panel title="Recent Users">
            <Table
              columns={["Name", "Email", "Role", "Status", "Created", ""]}
              rows={recentUsers}
              renderRow={(u) => (
                <>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{ROLE_LABEL[u.role] || u.role}</td>
                  <td className="px-4 py-3"><Badge text={statusOf(u)} tone={STATUS_TONE[statusOf(u)]} /></td>
                  <td className="px-4 py-3">{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-3"><RowAction tone="ink" onClick={() => openDetail(u)}>View</RowAction></td>
                </>
              )}
            />
          </Panel>
        </>
      )}

      {/* ─── ALL USERS ─── */}
      {tab === "users" && (
        <>
          <FilterBar>
            <TextInput placeholder="Search by name or email..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            <Select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
              <option value="">All roles</option>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
            <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </Select>
            <button className="px-4 py-2 text-[13px] text-white" style={{ background: COLORS.ink }} onClick={() => loadUsers(1)}>Apply</button>
          </FilterBar>

          <Table
            columns={["ID", "User", "Email", "Role", "Status", "Last Login", "Created", "Actions"]}
            rows={loading ? [] : users}
            emptyText={loading ? "Loading..." : "No users found"}
            renderRow={(u) => (
              <>
                <td className="px-4 py-3" style={{ color: COLORS.slate }}>#{u.id}</td>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3"><Badge text={ROLE_LABEL[u.role] || u.role} tone={colTone(u.role)} /></td>
                <td className="px-4 py-3"><Badge text={statusOf(u)} tone={STATUS_TONE[statusOf(u)]} /></td>
                <td className="px-4 py-3">{fmtDateTime(u.last_login_at)}</td>
                <td className="px-4 py-3">{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <RowAction tone="ink" onClick={() => openDetail(u)}><Eye size={14} className="inline mr-1" />View</RowAction>
                  <RowAction tone="ink" onClick={() => setResetOpen(u)}><Lock size={14} className="inline mr-1" />Reset</RowAction>
                  <RowAction tone={u.is_active ? "coral" : "sage"} onClick={() => setStatus(u, !u.is_active)}>
                    {u.is_active ? <><ShieldOff size={14} className="inline mr-1" />Suspend</> : <><ShieldCheck size={14} className="inline mr-1" />Activate</>}
                  </RowAction>
                  {u.role !== "admin" && u.role !== "principal" && (
                    <RowAction tone="coral" onClick={() => deleteUser(u)}><Trash2 size={14} className="inline mr-1" /></RowAction>
                  )}
                </td>
              </>
            )}
          />
          {meta && meta.last_page > 1 && (
            <div className="flex justify-between items-center mt-4 text-[13px]" style={{ color: COLORS.slate }}>
              <span>Showing {meta.from}–{meta.to} of {meta.total}</span>
              <div className="flex gap-2">
                <button disabled={meta.current_page === 1} onClick={() => { setUserPage(meta.current_page - 1); loadUsers(meta.current_page - 1); }} className="px-3 py-1.5 border" style={{ borderColor: COLORS.hairline }}>Prev</button>
                <span className="px-3 py-1.5">Page {meta.current_page} / {meta.last_page}</span>
                <button disabled={meta.current_page === meta.last_page} onClick={() => { setUserPage(meta.current_page + 1); loadUsers(meta.current_page + 1); }} className="px-3 py-1.5 border" style={{ borderColor: COLORS.hairline }}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── CREATE USER (inline tab) ─── */}
      {tab === "create" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel title="Account Information">
            <div className="space-y-3">
              <div><label className={labelCls}>Full Name *</label><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Username</label><input className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
                <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div><label className={labelCls}>Email *</label><input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Password *</label><input className={inputCls} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                <div><label className={labelCls}>Confirm Password</label><input className={inputCls} type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} /></div>
              </div>
            </div>
          </Panel>
          <Panel title="Role & Account Settings">
            <div className="space-y-3">
              <div><label className={labelCls}>Role *</label>
                <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Select>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /><span className="text-[13px]" style={{ color: COLORS.ink }}>Active account</span></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.force_password_change} onChange={(e) => setForm({ ...form, force_password_change: e.target.checked })} /><span className="text-[13px]" style={{ color: COLORS.ink }}>Force password change on first login</span></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.send_welcome_email} onChange={(e) => setForm({ ...form, send_welcome_email: e.target.checked })} /><span className="text-[13px]" style={{ color: COLORS.ink }}>Send welcome email</span></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.email_verified} onChange={(e) => setForm({ ...form, email_verified: e.target.checked })} /><span className="text-[13px]" style={{ color: COLORS.ink }}>Mark email verified</span></div>
            </div>
          </Panel>
          <div className="md:col-span-2">
            <button onClick={submitCreate} disabled={saving} className="px-6 py-2.5 text-[13px] text-white font-semibold" style={{ background: COLORS.ink }}>
              {saving ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      )}

      {/* ─── ROLES & PERMISSIONS ─── */}
      {tab === "roles" && (
        <>
          <FilterBar>
            <span className="text-[13px]" style={{ color: COLORS.slate }}>Editing permissions for:</span>
            <Select value={roleSel} onChange={(e) => { setRoleSel(e.target.value); loadRolePerms(e.target.value); }} className="w-56">
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
            <button className="px-4 py-2 text-[13px] text-white" style={{ background: COLORS.ink }} onClick={submitRolePerms}>Save Permissions</button>
          </FilterBar>

          {roleSel === "admin" || roleSel === "principal" ? (
            <Panel title={`${ROLE_LABEL[roleSel]} — Full Access`}>
              <p className="text-[13px]" style={{ color: COLORS.slate }}>
                {ROLE_LABEL[roleSel]} users have unrestricted access to every module. This cannot be modified to preserve system integrity.
              </p>
            </Panel>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: COLORS.slate, borderBottom: `1px solid ${COLORS.hairline}` }}>
                    <th className="text-left px-4 py-3 font-medium">Module</th>
                    {["View", "Create", "Edit", "Delete", "Export"].map((h) => <th key={h} className="text-center px-4 py-3 font-medium">{h}</th>)}
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {roleGroups.map((g) => (
                    <tr key={g.id} style={{ borderBottom: `1px solid ${COLORS.hairline}`, color: COLORS.ink }}>
                      <td className="px-4 py-3 font-medium">{g.label}</td>
                      {g.permissions.map((key) => {
                        const id = permKeyToId[key];
                        const on = id != null && rolePerms.includes(id);
                        const enabled = id != null;
                        return (
                          <td key={key} className="text-center px-4 py-3">
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={!enabled}
                              onChange={() => togglePerm(id)}
                              className="w-4 h-4 accent-[#1E2A4A]"
                              title={enabled ? "" : "Backend permission key not present"}
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center" style={{ color: COLORS.slate }}>+</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[12px] mt-2" style={{ color: COLORS.slate }}>
                Permissions are keyed to backend permission names. A disabled checkbox means that exact permission is not yet created in the backend — create it under the permission list or assign a matching name.
              </p>
            </div>
          )}
        </>
      )}

      {/* ─── LOGIN & SECURITY ─── */}
      {tab === "security" && (
        <>
          <KpiRow cols={4}>
            <KPI label="Attempts Today" value={loginStats?.total_today ?? "—"} tone="ink" />
            <KPI label="Successful" value={loginStats?.successful_today ?? "—"} tone="sage" />
            <KPI label="Failed" value={loginStats?.failed_today ?? "—"} tone="coral" />
            <KPI label="Unique IPs" value={loginStats?.unique_ips_today ?? "—"} tone="amber" />
          </KpiRow>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel title="Recent Login History">
              <Table
                columns={["User", "Status", "Time"]}
                rows={loginHistory || []}
                emptyText="No login records"
                renderRow={(r) => (
                  <>
                    <td className="px-4 py-3">{r.user?.name || "Unknown"}<div className="text-[11px]" style={{ color: COLORS.slate }}>{r.ip_address}</div></td>
                    <td className="px-4 py-3"><Badge text={r.is_success ? "Success" : "Failed"} tone={r.is_success ? "sage" : "coral"} /></td>
                    <td className="px-4 py-3">{fmtDateTime(r.created_at)}</td>
                  </>
                )}
              />
            </Panel>
            <Panel title="Recent Failed Attempts">
              <Table
                columns={["User", "Reason", "Time"]}
                rows={(loginStats?.recent_failures || []).slice(0, 10)}
                emptyText="No failed attempts"
                renderRow={(f) => (
                  <>
                    <td className="px-4 py-3">{f.user?.name || "Unknown"}</td>
                    <td className="px-4 py-3">{f.failure_reason || f.ip_address}</td>
                    <td className="px-4 py-3">{fmtDateTime(f.created_at)}</td>
                  </>
                )}
              />
            </Panel>
          </div>

          <Panel title="Security Policies">
            <p className="text-[13px]" style={{ color: COLORS.slate }}>
              Passwords are stored as secure hashes and can never be viewed by admins. Admins can reset a password to set a new value. Account lockout after repeated failed logins is enforced by the login throttle (10 attempts / minute).
            </p>
          </Panel>
        </>
      )}

      {/* ─── ACTIVITY LOGS ─── */}
      {tab === "activity" && (
        <Panel title="Activity Logs">
          <Table
            columns={["User", "Action", "Created"]}
            rows={activityLogs || []}
            emptyText="No activity recorded yet"
            renderRow={(l) => (
              <>
                <td className="px-4 py-3">{l.user?.name || "System"}</td>
                <td className="px-4 py-3"><Badge text={l.action} tone="ink" /></td>
                <td className="px-4 py-3">{fmtDateTime(l.created_at)}</td>
              </>
            )}
          />
          <p className="text-[12px] mt-3" style={{ color: COLORS.slate }}>
            Backend currently logs authentication events (login, logout, password change, 2FA). User CRUD / role-change audit logging is not yet written server-side — contact to enable up-front warnings when that lands.
          </p>
        </Panel>
      )}

      {/* ─── SETTINGS ─── */}
      {tab === "settings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Panel title="Account Registration">
            <p className="text-[13px]" style={{ color: COLORS.slate }}>Self-registration and pending-account approvals are not enabled on this backend. New accounts are created by admins only.</p>
          </Panel>
          <Panel title="Password Policy">
            <p className="text-[13px]" style={{ color: COLORS.slate }}>Minimum 8 characters. Hashing handled by Laravel. Force-change-on-first-login is a UI-level flag (backend enforcement not yet wired).</p>
          </Panel>
        </div>
      )}

      {/* ─── CREATE MODAL ─── */}
      {createOpen && (
        <Modal title="Create User" icon={UserPlus} onClose={() => setCreateOpen(false)} wide footer={
          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 text-[13px] border" style={{ borderColor: COLORS.hairline }} onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="px-4 py-2 text-[13px] text-white" style={{ background: COLORS.ink }} onClick={submitCreate} disabled={saving}>{saving ? "Creating..." : "Create"}</button>
          </div>
        }>
          <div className="grid grid-cols-2 gap-4">
            <div style={{ gridColumn: "1 / -1" }}><label className={labelCls}>Full Name *</label><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className={labelCls}>Email *</label><input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className={labelCls}>Role *</label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full">
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </div>
            <div><label className={labelCls}>Password *</label><input className={inputCls} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div><label className={labelCls}>Confirm Password</label><input className={inputCls} type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} /></div>
            <div className="flex items-end gap-2 pb-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /><span className="text-[13px]">Active</span></div>
            <div className="flex items-end gap-2 pb-2"><input type="checkbox" checked={form.send_welcome_email} onChange={(e) => setForm({ ...form, send_welcome_email: e.target.checked })} /><span className="text-[13px]">Send welcome email</span></div>
          </div>
        </Modal>
      )}

      {/* ─── RESET PASSWORD MODAL ─── */}
      {resetOpen && (
        <Modal title={`Reset Password — ${resetOpen.name}`} icon={Lock} onClose={() => setResetOpen(null)} footer={
          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 text-[13px] border" style={{ borderColor: COLORS.hairline }} onClick={() => setResetOpen(null)}>Cancel</button>
            <button className="px-4 py-2 text-[13px] text-white" style={{ background: COLORS.ink }} onClick={submitReset}>Reset</button>
          </div>
        }>
          <label className={labelCls}>New Password (min 8 chars)</label>
          <input className={inputCls} type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)} />
          <p className="text-[12px] mt-2" style={{ color: COLORS.slate }}>Passwords are stored as hashes and cannot be viewed. This sets a fresh value for the user.</p>
        </Modal>
      )}

      {/* ─── USER DETAIL MODAL ─── */}
      {viewing && (
        <Modal title={`${viewing.name}`} icon={Users} onClose={() => setViewing(null)} wide>
          <div className="flex items-center gap-4 mb-5 pb-4" style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[18px] font-bold" style={{ background: COLORS.ink }}>{viewing.name.charAt(0)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[15px]" style={{ color: COLORS.ink }}>{detailUser?.name || viewing.name}</span>
                <Badge text={statusOf(viewing)} tone={STATUS_TONE[statusOf(viewing)]} />
              </div>
              <div className="text-[12px]" style={{ color: COLORS.slate }}>
                {ROLE_LABEL[detailUser?.role || viewing.role]} · #{detailUser?.id || viewing.id} · Last login {fmtDateTime(detailUser?.last_login_at)}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-[12px] border" style={{ borderColor: COLORS.hairline }} onClick={() => setResetOpen(viewing)}><Lock size={12} className="inline mr-1" />Reset</button>
              <button className="px-3 py-1.5 text-[12px]" style={{ color: COLORS.coral }} onClick={() => deleteUser(viewing)}>Delete</button>
            </div>
          </div>

          <div className="flex gap-1 mb-4" style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
            {["overview", "account", "security", "activity"].map((t) => (
              <button key={t} onClick={() => setViewTab(t)} className="px-3 py-2 text-[13px] capitalize"
                style={{ color: viewTab === t ? COLORS.ink : COLORS.slate, borderBottom: viewTab === t ? `2px solid ${COLORS.ink}` : "2px solid transparent", fontWeight: viewTab === t ? 600 : 400 }}>
                {t}
              </button>
            ))}
          </div>

          {viewTab === "overview" && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
              {[
                ["Full Name", detailUser?.name], ["Email", detailUser?.email], ["Role", ROLE_LABEL[detailUser?.role]],
                ["Status", detailUser?.is_active ? "Active" : "Inactive"], ["Created", fmtDate(detailUser?.created_at)],
                ["Last Login", fmtDateTime(detailUser?.last_login_at)],
                ["Linked Student", detailUser?.student ? `#${detailUser.student.id}` : "—"],
                ["Linked Teacher", detailUser?.teacher ? `#${detailUser.teacher.id}` : "—"],
                ["Linked Guardian", detailUser?.guardian ? `#${detailUser.guardian.id}` : "—"],
                ["2FA", detailUser?.two_factor_enabled ? "Enabled" : "Disabled"],
              ].map(([k, v]) => (
                <div key={k}><span className="text-[12px] block" style={{ color: COLORS.slate }}>{k}</span><span style={{ color: COLORS.ink }}>{v || "—"}</span></div>
              ))}
            </div>
          )}
          {viewTab === "account" && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
              {[
                ["Username", detailUser?.name], ["Email", detailUser?.email], ["Role", ROLE_LABEL[detailUser?.role]],
                ["Status", detailUser?.is_active ? "Active" : "Inactive"], ["Email Verified", detailUser?.email_verified_at ? "Yes" : "No"],
                ["2FA", detailUser?.two_factor_enabled ? "Enabled" : "Disabled"],
              ].map(([k, v]) => (
                <div key={k}><span className="text-[12px] block" style={{ color: COLORS.slate }}>{k}</span><span style={{ color: COLORS.ink }}>{v || "—"}</span></div>
              ))}
            </div>
          )}
          {viewTab === "security" && (
            <Table
              columns={["Time", "IP", "Status"]}
              rows={detailHistory || []}
              emptyText="No login history"
              renderRow={(h) => (
                <>
                  <td className="px-4 py-3">{fmtDateTime(h.created_at)}</td>
                  <td className="px-4 py-3" style={{ color: COLORS.slate }}>{h.ip_address}</td>
                  <td className="px-4 py-3"><Badge text={h.is_success ? "Success" : "Failed"} tone={h.is_success ? "sage" : "coral"} /></td>
                </>
              )}
            />
          )}
          {viewTab === "activity" && (
            <Table
              columns={["Action", "Created"]}
              rows={detailLogs || []}
              emptyText="No activity"
              renderRow={(l) => (
                <>
                  <td className="px-4 py-3"><Badge text={l.action} tone="ink" /></td>
                  <td className="px-4 py-3">{fmtDateTime(l.created_at)}</td>
                </>
              )}
            />
          )}
        </Modal>
      )}
    </PageShell>
  );
}
