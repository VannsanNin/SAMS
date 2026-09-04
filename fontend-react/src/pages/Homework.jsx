import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import Modal from "../components/Modal";
import { apiFetch } from "../api";
import {
  COLORS, PageShell, KPI, KpiRow, Panel, ChartGrid,
  Badge, FilterBar, TextInput, Select, Table, RowAction,
} from "../components/shared";

const API = "/api";

const HOMEWORK_TYPES = [
  "Assignment", "Worksheet", "Reading", "Exercise", "Project",
  "Online task", "Research", "Creative work", "Practical/Lab",
];

const PRIORITIES = ["low", "medium", "high"];

const STATUS_TONE = {
  draft: "slate", scheduled: "slate", published: "sage",
  in_progress: "amber", due_soon: "amber", closed: "slate",
  overdue: "coral", completed: "sage", archived: "slate",
};
const SUB_STATUS_TONE = {
  not_started: "slate", submitted: "sage", late: "amber",
  graded: "ink", missing: "coral", excused: "slate",
};

const EMPTY_FORM = {
  title: "", description: "", instructions: "",
  subject_id: "", class_id: "", teacher_id: "",
  academic_year: "2025-2026", term: "Semester 1",
  assigned_date: "", due_date: "", due_time: "",
  type: "Assignment",
  total_marks: 100, priority: "medium",
  attachments: [], status: "draft",
  allow_late: true, allow_resubmission: true, max_attempts: 2,
};

const byDept = [
  { name: "Math", value: 8 }, { name: "Science", value: 6 },
  { name: "English", value: 5 }, { name: "History", value: 4 },
];

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-[12px] mb-1" style={{ color: COLORS.slate }}>
        {label}{required && <span style={{ color: COLORS.coral }}> *</span>}
      </span>
      {children}
    </label>
  );
}

export default function Homework() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [options, setOptions] = useState({ subjects: [], classes: [], teachers: [] });
  const [subs] = useState([]);
  const [tab, setTab] = useState("dashboard");

  const [filters, setFilters] = useState({ search: "", subject_id: "", class_id: "", status: "" });
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [submissionOpen, setSubmissionOpen] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [calClass, setCalClass] = useState("all");

  const flash = (text, type = "success") => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const load = (pg = page) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set("page", pg);
    apiFetch(`${API}/homework?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => { setData(res.data); setMeta({ ...res, data: undefined }); })
      .catch(() => {});
  };

  const loadStats = () => {
    apiFetch(`${API}/homework/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStats)
      .catch(() => {});
  };

  const loadOptions = () => {
    Promise.all([
      apiFetch(`${API}/subjects`).then((r) => r.ok ? r.json() : { data: [] }),
      apiFetch(`${API}/classes`).then((r) => r.ok ? r.json() : { data: [] }),
      apiFetch(`${API}/teachers/summary`).then((r) => r.ok ? r.json() : {}),
    ]).then(([subj, cls, tch]) => {
      setOptions({
        subjects: subj.data || subj || [],
        classes: cls.data || cls || [],
        teachers: tch?.teachers || [],
      });
    }).catch(() => {});
  };

  useEffect(() => { loadStats(); loadOptions(); }, []);
  useEffect(() => { const t = setTimeout(() => load(1), 300); return () => clearTimeout(t); }, [filters]);
  useEffect(() => { if (tab === "dashboard") loadStats(); }, [tab]);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (h) => { setEditing(h); setFormOpen(true); };

  const openView = (h) => {
    setViewing(null);
    apiFetch(`${API}/homework/${h.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setViewing)
      .catch(() => flash("Failed to load homework details", "error"));
  };

  const openSubmissions = (h) => {
    setSubmissionOpen(null);
    apiFetch(`${API}/homework/${h.id}/submissions`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((list) => setSubmissionOpen({ homework: h, list }))
      .catch(() => flash("Failed to load submissions", "error"));
  };

  const handleSaved = () => {
    setFormOpen(false);
    setEditing(null);
    flash("Homework saved.");
    load(1);
    loadStats();
  };

  const confirmDelete = async () => {
    await apiFetch(`${API}/homework/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    flash(`Homework "${deleting.title}" deleted.`);
    load(1);
    loadStats();
  };

  const toggleStatus = (h) => {
    const next = h.is_active ? { is_active: false } : { is_active: true };
    apiFetch(`${API}/homework/${h.id}`, { method: "PUT", body: JSON.stringify(next) })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => { flash(h.is_active ? "Homework unpublished." : "Homework published."); load(meta?.current_page || 1); })
      .catch(() => flash("Update failed", "error"));
  };

  // ── Derived dashboard values ────────────────────────────────────────────────
  const published = data.filter((h) => h.is_active !== false).length;
  const overdue = data.filter((h) => h.due_date && new Date(h.due_date) < new Date()).length;
  const dueToday = data.filter((h) => {
    const d = h.due_date;
    if (!d) return false;
    const today = new Date(); const t = new Date(d);
    return t.toDateString() === today.toDateString();
  }).length;
  const gradedCount = subs.filter((s) => s.status === "graded").length;
  const gradedAvg = (() => {
    const g = subs.filter((s) => s.status === "graded" && s.marks_obtained != null);
    if (!g.length) return "—";
    return Math.round(g.reduce((a, s) => a + Number(s.marks_obtained), 0) / g.length);
  })();

  const statusOf = (h) => {
    if (h.is_active === false) return "archived";
    const d = new Date(h.due_date); const now = new Date();
    if (d < now) return "overdue";
    const diff = (d - now) / 86400000;
    if (diff <= 2) return "due_soon";
    return "published";
  };

  // ── Calendar data ───────────────────────────────────────────────────────────
  const [calDate, setCalDate] = useState(new Date());
  const calDays = useMemo(() => {
    const year = calDate.getFullYear(); const month = calDate.getMonth();
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calDate]);
  const calHomeworks = useMemo(
    () => data.filter((h) => (calClass === "all" || String(h.class_id) === String(calClass))),
    [data, calClass]
  );

  const gradeSubmission = async (s, marks, feedback) => {
    const res = await apiFetch(`${API}/homework/submissions/${s.id}/grade`, {
      method: "POST",
      body: JSON.stringify({ marks_obtained: marks, feedback }),
    });
    if (res.ok) {
      flash("Submission graded.");
      if (submissionOpen) {
        openSubmissions(submissionOpen.homework);
      }
      loadStats();
    } else {
      flash("Grading failed", "error");
    }
  };

  return (
    <PageShell title="Homework" sub="Manage assignments, submissions, and grading" action="Create Homework" onAction={openAdd}>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap" style={{ borderBottom: `1px solid ${COLORS.hairline}`, paddingBottom: "12px" }}>
        {[
          ["dashboard", "📊 Dashboard"],
          ["list", "📝 All Homework"],
          ["submissions", "📥 Submissions"],
          ["overdue", "⚠️ Overdue"],
          ["calendar", "📅 Calendar"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="px-4 py-1.5 text-[13px] rounded-sm"
            style={{
              background: tab === k ? COLORS.ink : "transparent",
              color: tab === k ? "#fff" : COLORS.slate,
              border: `1px solid ${tab === k ? COLORS.ink : COLORS.hairline}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {msg.text && (
        <div className="mb-4 p-3 text-[12px] flex items-center justify-between rounded-sm"
             style={{ background: msg.type === "error" ? "#FBF3EF" : "#F0F5EE", color: msg.type === "error" ? COLORS.coral : COLORS.sage, border: `1px solid ${msg.type === "error" ? COLORS.coral : COLORS.sage}` }}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: "", text: "" })} style={{ color: "inherit" }}>×</button>
        </div>
      )}

      {/* ══════════════════ DASHBOARD ══════════════════ */}
      {tab === "dashboard" && (
        <>
          <KpiRow cols={4}>
            <KPI label="Total Homework" value={stats?.total ?? data.length} tone="ink" />
            <KPI label="Published" value={published} tone="sage" />
            <KPI label="Due Today" value={dueToday} tone="amber" />
            <KPI label="Overdue" value={overdue} tone="coral" />
          </KpiRow>
          <KpiRow cols={4}>
            <KPI label="Submissions" value={subs.length} tone="slate" />
            <KPI label="Pending Grading" value={subs.filter((s) => s.status === "submitted" || s.status === "late").length} tone="amber" />
            <KPI label="Graded" value={gradedCount} tone="sage" />
            <KPI label="Average Score" value={gradedAvg} tone="ink" />
          </KpiRow>

          <ChartGrid>
            <Panel title="Homework by Subject">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byDept}>
                  <CartesianGrid stroke={COLORS.hairline} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.hairline }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS.indigo} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Submission Status">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name: "Submitted", value: subs.filter((s) => s.status === "submitted" || s.status === "late").length },
                    { name: "Graded", value: gradedCount },
                  ]} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                    <Cell fill={COLORS.sage} />
                    <Cell fill={COLORS.amber} />
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Panel>
          </ChartGrid>

          <Panel title="Recent Homework">
            <Table
              columns={["Title", "Subject", "Class", "Due Date", "Status"]}
              rows={data.slice(0, 5)}
              renderRow={(h) => {
                const st = statusOf(h);
                return (
                  <>
                    <td className="px-4 py-3">{h.title}</td>
                    <td className="px-4 py-3">{h.subject?.subject_name ?? "—"}</td>
                    <td className="px-4 py-3">{h.schoolClass?.class_name ?? "—"}</td>
                    <td className="px-4 py-3">{h.due_date ?? "—"}</td>
                    <td className="px-4 py-3"><Badge text={st} tone={STATUS_TONE[st] || "slate"} /></td>
                  </>
                );
              }}
            />
          </Panel>
        </>
      )}

      {/* ══════════════════ LIST ══════════════════ */}
      {tab === "list" && (
        <>
          <KpiRow cols={4}>
            <KPI label="Total" value={stats?.total ?? data.length} tone="ink" />
            <KPI label="Published" value={published} tone="sage" />
            <KPI label="Draft" value={data.filter((h) => h.is_active === false).length} tone="slate" />
            <KPI label="Due Soon" value={data.filter((h) => { const st = statusOf(h); return st === "due_soon"; }).length} tone="amber" />
          </KpiRow>

          <FilterBar>
            <TextInput placeholder="Search homework..." value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
            <Select value={filters.subject_id} onChange={(e) => setFilters((f) => ({ ...f, subject_id: e.target.value }))}>
              <option value="">All subjects</option>
              {options.subjects.map((s) => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
            </Select>
            <Select value={filters.class_id} onChange={(e) => setFilters((f) => ({ ...f, class_id: e.target.value }))}>
              <option value="">All classes</option>
              {options.classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </Select>
          </FilterBar>

          <Table
            columns={["Homework", "Subject", "Class", "Assigned", "Due", "Submissions", "Status", "Actions"]}
            rows={data}
            renderRow={(h) => {
              const st = statusOf(h);
              return (
                <>
                  <td className="px-4 py-3 font-semibold" style={{ color: COLORS.ink }}>{h.title}</td>
                  <td className="px-4 py-3">{h.subject?.subject_name ?? "—"}</td>
                  <td className="px-4 py-3">{h.schoolClass?.class_name ?? "—"}</td>
                  <td className="px-4 py-3">{h.assigned_date ?? "—"}</td>
                  <td className="px-4 py-3">{h.due_date ?? "—"}</td>
                  <td className="px-4 py-3">{h.submissions_count ?? h.submissions?.length ?? 0}</td>
                  <td className="px-4 py-3"><Badge text={st} tone={STATUS_TONE[st] || "slate"} /></td>
                  <td className="px-4 py-3">
                    <RowAction onClick={() => openView(h)}>View</RowAction>
                    <RowAction tone="slate" onClick={() => openEdit(h)}>Edit</RowAction>
                    <RowAction tone={h.is_active === false ? "sage" : "amber"} onClick={() => toggleStatus(h)}>
                      {h.is_active === false ? "Publish" : "Unpublish"}
                    </RowAction>
                    <RowAction tone="coral" onClick={() => setDeleting(h)}>Delete</RowAction>
                  </td>
                </>
              );
            }}
          />

          {meta && meta.last_page > 1 && (
            <div className="flex justify-end gap-2 mt-4">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-[12px] rounded-sm"
                style={{ border: `1px solid ${COLORS.hairline}`, color: COLORS.slate }}>Prev</button>
              <span className="px-3 py-1.5 text-[12px] self-center" style={{ color: COLORS.slate }}>Page {page} / {meta.last_page}</span>
              <button disabled={page >= meta.last_page} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-[12px] rounded-sm"
                style={{ border: `1px solid ${COLORS.hairline}`, color: COLORS.slate }}>Next</button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════ SUBMISSIONS ══════════════════ */}
      {tab === "submissions" && (
        <>
          <KpiRow cols={4}>
            <KPI label="Total Submissions" value={subs.length} tone="ink" />
            <KPI label="On Time" value={subs.filter((s) => s.status === "submitted").length} tone="sage" />
            <KPI label="Late" value={subs.filter((s) => s.status === "late").length} tone="amber" />
            <KPI label="Pending Grading" value={subs.filter((s) => s.status === "submitted" || s.status === "late").length} tone="coral" />
          </KpiRow>

          <Panel title="Submission Grading">
            <p className="text-[12px] mb-3" style={{ color: COLORS.slate }}>
              {data.length === 0
                ? "No homework yet — click a row to open submissions, or create homework first."
                : "Select a homework from the list to open its submissions and grade them."}
            </p>
            <Table
              columns={["Homework", "Subject", "Class", "Due", "View Submissions"]}
              rows={data}
              renderRow={(h) => (
                <>
                  <td className="px-4 py-3 font-semibold" style={{ color: COLORS.ink }}>{h.title}</td>
                  <td className="px-4 py-3">{h.subject?.subject_name ?? "—"}</td>
                  <td className="px-4 py-3">{h.schoolClass?.class_name ?? "—"}</td>
                  <td className="px-4 py-3">{h.due_date ?? "—"}</td>
                  <td className="px-4 py-3">
                    <RowAction onClick={() => openSubmissions(h)}>Open Submissions</RowAction>
                  </td>
                </>
              )}
            />
          </Panel>
        </>
      )}

      {/* ══════════════════ OVERDUE ══════════════════ */}
      {tab === "overdue" && (
        <>
          <KpiRow cols={3}>
            <KPI label="Overdue Homework" value={overdue} tone="coral" />
            <KPI label="Due Soon (≤2d)" value={data.filter((h) => { const st = statusOf(h); return st === "due_soon"; }).length} tone="amber" />
            <KPI label="Archived" value={data.filter((h) => h.is_active === false).length} tone="slate" />
          </KpiRow>

          <Panel title="Overdue Homework">
            <Table
              columns={["Homework", "Subject", "Class", "Due Date", "Assignment Status"]}
              rows={data.filter((h) => statusOf(h) === "overdue")}
              renderRow={(h) => (
                <>
                  <td className="px-4 py-3 font-semibold" style={{ color: COLORS.coral }}>{h.title}</td>
                  <td className="px-4 py-3">{h.subject?.subject_name ?? "—"}</td>
                  <td className="px-4 py-3">{h.schoolClass?.class_name ?? "—"}</td>
                  <td className="px-4 py-3">{h.due_date ?? "—"}</td>
                  <td className="px-4 py-3">
                    <RowAction onClick={() => openEdit(h)}>Extend Deadline</RowAction>
                    <RowAction tone="coral" onClick={() => setDeleting(h)}>Delete</RowAction>
                  </td>
                </>
              )}
            />
            {data.filter((h) => statusOf(h) === "overdue").length === 0 && (
              <p className="text-[12px] py-6 text-center" style={{ color: COLORS.slate }}>No overdue homework. 🎉</p>
            )}
          </Panel>
        </>
      )}

      {/* ══════════════════ CALENDAR ══════════════════ */}
      {tab === "calendar" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 items-center">
              <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))}
                className="px-3 py-1 text-[13px] rounded-sm" style={{ border: `1px solid ${COLORS.hairline}`, color: COLORS.slate }}>‹</button>
              <h2 className="text-[16px] font-serif" style={{ color: COLORS.ink }}>
                {calDate.toLocaleString("default", { month: "long", year: "numeric" })}
              </h2>
              <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))}
                className="px-3 py-1 text-[13px] rounded-sm" style={{ border: `1px solid ${COLORS.hairline}`, color: COLORS.slate }}>›</button>
            </div>
            <Select value={calClass} onChange={(e) => setCalClass(e.target.value)}>
              <option value="all">All classes</option>
              {options.classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </Select>
          </div>

          <div style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card, overflow: "hidden" }}>
            <div className="grid grid-cols-7 text-center py-2" style={{ background: COLORS.paper, color: COLORS.slate }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-[11px] font-semibold uppercase">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7" style={{ borderTop: `1px solid ${COLORS.hairline}` }}>
              {calDays.map((d, i) => {
                const day = d;
                const items = day == null ? [] : calHomeworks.filter((h) => {
                  if (!h.due_date) return false;
                  const hd = new Date(h.due_date);
                  return hd.getDate() === day && hd.getMonth() === calDate.getMonth() && hd.getFullYear() === calDate.getFullYear();
                });
                return (
                  <div key={i} className="min-h-[90px] p-1.5"
                    style={{ borderRight: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}` }}>
                    {day != null && (
                      <>
                        <div className="text-[11px] font-semibold" style={{ color: COLORS.slate }}>{day}</div>
                        {items.map((h, idx) => (
                          <button key={idx} onClick={() => openView(h)}
                            className="block w-full text-left mt-1 px-1.5 py-0.5 rounded-sm text-[10px] truncate"
                            style={{ background: COLORS.ink, color: "#fff" }}>
                            {h.title}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════ CREATE / EDIT MODAL ══════════════════ */}
      {formOpen && (
        <Modal title={editing ? `Edit Homework — ${editing.title}` : "Create Homework"} onClose={() => { setFormOpen(false); setEditing(null); }} wide>
          <HomeworkForm
            initial={{ ...EMPTY_FORM, ...editing }}
            options={options}
            onSave={handleSaved}
            onClose={() => { setFormOpen(false); setEditing(null); }}
          />
        </Modal>
      )}

      {/* ══════════════════ VIEW DETAIL MODAL ══════════════════ */}
      {viewing && (
        <Modal title="Homework Details" onClose={() => setViewing(null)} wide>
          <HomeworkDetail homework={viewing}
            onEdit={(h) => { setViewing(null); openEdit(h); }}
            onSubmissions={(h) => { setViewing(null); openSubmissions(h); }}
          />
        </Modal>
      )}

      {/* ══════════════════ SUBMISSIONS + GRADING MODAL ══════════════════ */}
      {submissionOpen && (
        <Modal title={`Submissions — ${submissionOpen.homework.title}`} onClose={() => setSubmissionOpen(null)} wide>
          <SubmissionsPanel homework={submissionOpen.homework} list={submissionOpen.list} onGrade={gradeSubmission} />
        </Modal>
      )}

      {/* ══════════════════ DELETE MODAL ══════════════════ */}
      {deleting && (
        <Modal title="Confirm Delete" onClose={() => setDeleting(null)}>
          <p className="text-[13px]" style={{ color: COLORS.slate }}>
            Are you sure you want to delete <b style={{ color: COLORS.ink }}>{deleting.title}</b>? This will remove all associated submissions.
          </p>
          <div className="mt-6 flex justify-end gap-2.5">
            <button onClick={() => setDeleting(null)} className="px-4 py-2 text-[12px] font-semibold rounded-sm text-white" style={{ background: COLORS.slate }}>
              Cancel
            </button>
            <button onClick={confirmDelete} className="px-5 py-2 text-[12px] font-semibold rounded-sm text-white" style={{ background: COLORS.coral }}>
              Delete Homework
            </button>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   CREATE / EDIT FORM
   ═══════════════════════════════════════════════════════════ */
function HomeworkForm({ initial, options, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [key]: v }));
  };

  const baseCls = {
    width: "100%", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "12px", paddingRight: "12px",
    fontSize: "13px", background: COLORS.card, color: COLORS.ink,
    border: `1px solid ${COLORS.hairline}`, outline: "none",
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.subject_id || !form.class_id || !form.teacher_id) { setError("Subject, class, and teacher are required."); return; }
    if (!form.assigned_date || !form.due_date) { setError("Assigned and due dates are required."); return; }

    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      description: form.description || form.instructions,
      subject_id: form.subject_id,
      class_id: form.class_id,
      teacher_id: form.teacher_id,
      assigned_date: form.assigned_date,
      due_date: form.due_date,
      total_marks: form.total_marks || 100,
      priority: form.priority || "medium",
      is_active: form.status === "draft" ? false : true,
    };
    try {
      const res = await apiFetch(`${API}/homework${form.id ? `/${form.id}` : ""}`, {
        method: form.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Validation failed.");
      onSave(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="p-3 text-[12px] rounded-sm" style={{ background: "#FBF3EF", color: COLORS.coral, border: `1px solid ${COLORS.coral}` }}>
          {error}
        </div>
      )}

      {/* Basic information */}
      <div>
        <h4 className="text-[12px] font-bold mb-2 uppercase tracking-wider" style={{ color: COLORS.slate }}>Basic Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <Field label="Homework Title" required>
              <input className="w-full" style={baseCls} value={form.title} onChange={set("title")} required />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description / Instructions">
              <textarea className="w-full" rows={3} style={{ ...baseCls, resize: "vertical" }} value={form.instructions || ""} onChange={set("instructions")} />
            </Field>
          </div>
          <Field label="Subject" required>
            <select className="w-full" style={baseCls} value={form.subject_id} onChange={set("subject_id")} required>
              <option value="">Select subject</option>
              {options.subjects.map((s) => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
            </select>
          </Field>
          <Field label="Class" required>
            <select className="w-full" style={baseCls} value={form.class_id} onChange={set("class_id")} required>
              <option value="">Select class</option>
              {options.classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </Field>
          <Field label="Teacher" required>
            <select className="w-full" style={baseCls} value={form.teacher_id} onChange={set("teacher_id")} required>
              <option value="">Select teacher</option>
              {options.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Homework Type">
            <select className="w-full" style={baseCls} value={form.type} onChange={set("type")}>
              {HOMEWORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Dates */}
      <div>
        <h4 className="text-[12px] font-bold mb-2 uppercase tracking-wider" style={{ color: COLORS.slate }}>Dates</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Assigned Date" required>
            <input type="date" className="w-full" style={baseCls} value={form.assigned_date} onChange={set("assigned_date")} required />
          </Field>
          <Field label="Due Date" required>
            <input type="date" className="w-full" style={baseCls} value={form.due_date} onChange={set("due_date")} required />
          </Field>
          <Field label="Due Time">
            <input type="time" className="w-full" style={baseCls} value={form.due_time} onChange={set("due_time")} />
          </Field>
          <Field label="Academic Year">
            <input className="w-full" style={baseCls} value={form.academic_year} onChange={set("academic_year")} />
          </Field>
        </div>
      </div>

      {/* Assignment & settings */}
      <div>
        <h4 className="text-[12px] font-bold mb-2 uppercase tracking-wider" style={{ color: COLORS.slate }}>Assignment & Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Maximum Marks" required>
            <input type="number" min="1" className="w-full" style={baseCls} value={form.total_marks} onChange={set("total_marks")} />
          </Field>
          <Field label="Priority">
            <select className="w-full" style={baseCls} value={form.priority} onChange={set("priority")}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="w-full" style={baseCls} value={form.status} onChange={set("status")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Submission settings */}
      <div>
        <h4 className="text-[12px] font-bold mb-2 uppercase tracking-wider" style={{ color: COLORS.slate }}>Submission Settings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}`, padding: "12px" }}>
          <label className="flex items-center gap-2 text-[13px]" style={{ color: COLORS.ink }}>
            <input type="checkbox" checked={form.allow_late} onChange={(e) => setForm((f) => ({ ...f, allow_late: e.target.checked }))} />
            Allow late submission
          </label>
          <label className="flex items-center gap-2 text-[13px]" style={{ color: COLORS.ink }}>
            <input type="checkbox" checked={form.allow_resubmission} onChange={(e) => setForm((f) => ({ ...f, allow_resubmission: e.target.checked }))} />
            Allow resubmission
          </label>
          <Field label="Maximum Attempts">
            <input type="number" min="1" className="w-full" style={baseCls} value={form.max_attempts} onChange={set("max_attempts")} />
          </Field>
        </div>
      </div>

      {/* Attachments (mock UI) */}
      <div>
        <h4 className="text-[12px] font-bold mb-2 uppercase tracking-wider" style={{ color: COLORS.slate }}>Attachments</h4>
        <div style={{ border: `1px dashed ${COLORS.hairline}`, padding: "16px", textAlign: "center" }}>
          <p className="text-[13px]" style={{ color: COLORS.slate }}>
            Drop files here or browse — PDF, Word, PowerPoint, Excel, Images, ZIP, Audio, Video
          </p>
          <p className="text-[11px] mt-1" style={{ color: COLORS.slate }}>
            (Multi-file upload preview will appear here)
          </p>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-2.5 border-t" style={{ borderColor: COLORS.hairline }}>
        <button type="button" onClick={onClose} className="px-4 py-2 text-[12px] font-semibold rounded-sm text-white" style={{ background: COLORS.slate }}>
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-6 py-2 text-[12px] font-semibold rounded-sm text-white" style={{ background: COLORS.ink, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : form.id ? "Update Homework" : "Create Homework"}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════
   DETAIL MODAL
   ═══════════════════════════════════════════════════════════ */
function HomeworkDetail({ homework, onEdit, onSubmissions }) {
  const rows = [
    ["Subject", homework.subject?.subject_name ?? "—"],
    ["Class", homework.schoolClass?.class_name ?? "—"],
    ["Teacher", homework.teacher?.name ?? "—"],
    ["Assigned Date", homework.assigned_date ?? "—"],
    ["Due Date", homework.due_date ?? "—"],
    ["Total Marks", homework.total_marks ?? "—"],
    ["Priority", homework.priority ?? "—"],
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-4" style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
        <div>
          <h3 className="text-lg font-serif font-bold" style={{ color: COLORS.ink }}>{homework.title}</h3>
          <p className="text-[12px]" style={{ color: COLORS.slate }}>#{homework.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 p-4 text-[12px]" style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card }}>
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between border-b py-1.5" style={{ borderColor: COLORS.hairline }}>
            <span style={{ color: COLORS.slate }}>{label}</span>
            <span className="font-semibold text-right" style={{ color: COLORS.ink }}>{value}</span>
          </div>
        ))}
      </div>

      {homework.description && (
        <div>
          <h4 className="text-[11px] font-bold mb-2 uppercase tracking-wider" style={{ color: COLORS.slate }}>Description</h4>
          <p className="text-[13px]" style={{ color: COLORS.ink }}>{homework.description}</p>
        </div>
      )}

      <div>
        <h4 className="text-[11px] font-bold mb-2 uppercase tracking-wider" style={{ color: COLORS.slate }}>Submissions ({homework.submissions?.length ?? 0})</h4>
        {(homework.submissions?.length) ? (
          <div style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card }}>
            {homework.submissions.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: i < homework.submissions.length - 1 ? `1px solid ${COLORS.hairline}` : "none" }}>
                <span style={{ color: COLORS.ink }}>{s.student?.name ?? `#${s.student_id}`}</span>
                <div className="flex items-center gap-3">
                  <Badge text={s.status} tone={SUB_STATUS_TONE[s.status] || "slate"} />
                  <span className="text-[12px] font-semibold" style={{ color: s.marks_obtained != null ? COLORS.ink : COLORS.slate }}>
                    {s.marks_obtained != null ? `${s.marks_obtained}/${homework.total_marks}` : "Not graded"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] py-3 text-center" style={{ color: COLORS.slate }}>No submissions yet.</p>
        )}
      </div>

      <div className="flex justify-end gap-2.5">
        <button onClick={() => onSubmissions(homework)} className="px-4 py-2 text-[12px] font-semibold rounded-sm text-white" style={{ background: COLORS.slate }}>
          View Submissions
        </button>
        <button onClick={() => onEdit(homework)} className="px-4 py-2 text-[12px] font-semibold rounded-sm text-white" style={{ background: COLORS.ink }}>
          Edit
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUBMISSIONS + GRADING PANEL
   ═══════════════════════════════════════════════════════════ */
function SubmissionsPanel({ homework, list, onGrade }) {
  const [grading, setGrading] = useState(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");

  const startGrade = (s) => {
    setGrading(s);
    setScore(s.marks_obtained ?? "");
    setFeedback(s.feedback ?? "");
  };

  const baseCls = {
    width: "100%", paddingTop: "8px", paddingBottom: "8px", paddingLeft: "12px", paddingRight: "12px",
    fontSize: "13px", background: COLORS.card, color: COLORS.ink,
    border: `1px solid ${COLORS.hairline}`, outline: "none",
  };

  return (
    <div className="space-y-4">
      <Table
        columns={["Student", "Submitted", "Status", "Score", "Feedback", "Actions"]}
        rows={list}
        renderRow={(s) => (
          <>
            <td className="px-4 py-3">{s.student?.name ?? `#${s.student_id}`}</td>
            <td className="px-4 py-3">{s.submitted_at ? String(s.submitted_at).slice(0, 10) : "—"}</td>
            <td className="px-4 py-3"><Badge text={s.status} tone={SUB_STATUS_TONE[s.status] || "slate"} /></td>
            <td className="px-4 py-3">{s.marks_obtained != null ? `${s.marks_obtained}/${homework.total_marks}` : "—"}</td>
            <td className="px-4 py-3 max-w-[220px] truncate">{s.feedback || "—"}</td>
            <td className="px-4 py-3"><RowAction onClick={() => startGrade(s)}>{s.status === "graded" ? "Re-grade" : "Grade"}</RowAction></td>
          </>
        )}
      />

      {grading && (
        <div style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.paper, padding: "16px" }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[13px] font-bold" style={{ color: COLORS.ink }}>Grade — {grading.student?.name ?? `#${grading.student_id}`}</h4>
            <button onClick={() => setGrading(null)} className="text-[12px]" style={{ color: COLORS.coral }}>Close</button>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <label className="block flex-1">
              <span className="block text-[12px] mb-1" style={{ color: COLORS.slate }}>Score</span>
              <input type="number" className="w-full" style={baseCls} value={score} onChange={(e) => setScore(e.target.value)} />
            </label>
            <button onClick={() => { if (grading.submission_text) alert(grading.submission_text); }} className="px-3 py-2 text-[12px] font-semibold rounded-sm" style={{ background: COLORS.sage, color: "#fff" }}>
              View Answer
            </button>
          </div>
          <label className="block mb-3">
            <span className="block text-[12px] mb-1" style={{ color: COLORS.slate }}>Feedback</span>
            <textarea className="w-full" rows={2} style={{ ...baseCls, resize: "vertical" }} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </label>
          <div className="flex justify-end gap-2.5">
            <button onClick={() => setGrading(null)} className="px-4 py-2 text-[12px] font-semibold rounded-sm text-white" style={{ background: COLORS.slate }}>Cancel</button>
            <button onClick={() => { onGrade(grading, score, feedback); setGrading(null); }} className="px-5 py-2 text-[12px] font-semibold rounded-sm text-white" style={{ background: COLORS.ink }}>
              Save Grade
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
