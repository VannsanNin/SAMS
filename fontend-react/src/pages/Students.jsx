import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { apiFetch } from "../api";
import Modal from "../components/Modal";
import { COLORS, CHART_COLORS, KPI, Panel, KpiRow, ChartGrid } from "../components/shared";

const EMPTY_FORM = {
  student_id: "", name: "", gender: "Male", dob: "", phone: "", email: "",
  address: "", department: "", major: "", academic_year: "", semester: "",
  class_id: "", enrollment_date: "", status: "active",
  parent_name: "", parent_phone: "",
};

const STATUS_META = {
  active: "sage",
  inactive: "slate",
  graduated: "amber",
  suspended: "coral",
};

const inputCls = (style) => ({
  ...style,
  width: "100%",
  paddingTop: "8px",
  paddingBottom: "8px",
  paddingLeft: "12px",
  paddingRight: "12px",
  fontSize: "13px",
  background: COLORS.card,
  color: COLORS.ink,
  border: `1px solid ${COLORS.hairline}`,
  outline: "none",
});

function StatusBadge({ status }) {
  const tone = COLORS[STATUS_META[status] || "slate"];
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded-sm capitalize"
      style={{ color: tone, border: `1px solid ${tone}` }}
    >
      {status}
    </span>
  );
}

function AttendanceBadge({ value }) {
  const tone = value < 75 ? COLORS.coral : value < 85 ? COLORS.amber : COLORS.sage;
  return <span style={{ color: tone }}>{value}%</span>;
}

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

/* ---------------------------------------------------------
   Add / Edit form
--------------------------------------------------------- */
function StudentForm({ initial, classes, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(`/api/students${form.id ? `/${form.id}` : ""}`, {
        method: form.id ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Validation failed. Check the required fields.");
      onSave(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const base = inputCls({});
  const baseCls = (extra) => ({ ...base, ...extra });

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="p-3 text-[12px] rounded-sm" style={{ background: "#FBF3EF", color: COLORS.coral, border: `1px solid ${COLORS.coral}` }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Field label="Full Name" required>
          <input className="w-full" style={baseCls({})} value={form.name} onChange={set("name")} required />
        </Field>
        <Field label="Gender" required>
          <select className="w-full" style={baseCls({})} value={form.gender} onChange={set("gender")}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Date of Birth" required>
          <input type="date" className="w-full" style={baseCls({})} value={form.dob} onChange={set("dob")} required />
        </Field>
        <Field label="Phone" required>
          <input className="w-full" style={baseCls({})} value={form.phone} onChange={set("phone")} required />
        </Field>
        <Field label="Email" required>
          <input type="email" className="w-full" style={baseCls({})} value={form.email} onChange={set("email")} required />
        </Field>
        <Field label="Address" required>
          <input className="w-full" style={baseCls({})} value={form.address} onChange={set("address")} required />
        </Field>
        <Field label="Class" required>
          <select className="w-full" style={baseCls({})} value={form.class_id} onChange={set("class_id")} required>
            <option value="">— Select Class —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        </Field>
        <Field label="Student ID">
          <input className="w-full" style={baseCls({})} value={form.student_id} onChange={set("student_id")} placeholder="Auto-generated if blank" />
        </Field>
        <Field label="Department">
          <input className="w-full" style={baseCls({})} value={form.department} onChange={set("department")} placeholder="e.g. Computer Science" />
        </Field>
        <Field label="Major">
          <input className="w-full" style={baseCls({})} value={form.major} onChange={set("major")} placeholder="e.g. Software Engineering" />
        </Field>
        <Field label="Academic Year">
          <input className="w-full" style={baseCls({})} value={form.academic_year} onChange={set("academic_year")} placeholder="e.g. 2025-2026" />
        </Field>
        <Field label="Semester">
          <input className="w-full" style={baseCls({})} value={form.semester} onChange={set("semester")} placeholder="e.g. Semester 1" />
        </Field>
        <Field label="Enrollment Date">
          <input type="date" className="w-full" style={baseCls({})} value={form.enrollment_date} onChange={set("enrollment_date")} />
        </Field>
        <Field label="Status">
          <select className="w-full" style={baseCls({})} value={form.status} onChange={set("status")}>
            {["active", "inactive", "graduated", "suspended"].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </Field>
        <Field label="Parent / Guardian Name" required>
          <input className="w-full" style={baseCls({})} value={form.parent_name} onChange={set("parent_name")} required />
        </Field>
        <Field label="Parent / Guardian Phone" required>
          <input className="w-full" style={baseCls({})} value={form.parent_phone} onChange={set("parent_phone")} required />
        </Field>
      </div>

      <div className="pt-4 flex justify-end gap-2.5 border-t" style={{ borderColor: COLORS.hairline }}>
        <button type="button" onClick={onClose}
                className="px-4 py-2 text-[12px] font-semibold rounded-sm text-white"
                style={{ background: COLORS.slate }}>
          Cancel
        </button>
        <button type="submit" disabled={saving}
                className="px-6 py-2 text-[12px] font-semibold rounded-sm text-white"
                style={{ background: COLORS.ink, opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving..." : form.id ? "Update Record" : "Save Student"}
        </button>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------
   View detail
--------------------------------------------------------- */
function StudentDetail({ student }) {
  const stats = student.attendance_stats || { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendance_rate: 0 };
  const statCards = [
    { label: "Total", value: stats.total },
    { label: "Present", value: stats.present, tone: COLORS.sage },
    { label: "Absent", value: stats.absent, tone: COLORS.coral },
    { label: "Late", value: stats.late, tone: COLORS.amber },
    { label: "Excused", value: stats.excused, tone: COLORS.slate },
    { label: "Rate", value: `${stats.attendance_rate}%`, tone: COLORS.amber },
  ];
  const rows = [
    ["Student ID", student.student_id],
    ["Email", student.email],
    ["Phone", student.phone],
    ["Gender", student.gender],
    ["Date of Birth", student.dob],
    ["Address", student.address],
    ["Department", student.department],
    ["Academic Year", student.academic_year],
    ["Class", student.class?.class_name],
    ["Enrollment Date", student.enrollment_date],
    ["Parent Name", student.parent_name],
    ["Parent Phone", student.parent_phone],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-4" style={{ background: COLORS.paper, border: `1px solid ${COLORS.hairline}` }}>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-serif font-bold" style={{ color: COLORS.ink }}>{student.name}</h3>
            <StatusBadge status={student.status} />
          </div>
          <p className="text-[12px]" style={{ color: COLORS.slate }}>{student.student_id || "No Student ID"}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {statCards.map((s) => (
          <div key={s.label} className="p-3 text-center" style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card }}>
            <p className="text-lg font-serif font-bold" style={{ color: s.tone || COLORS.ink }}>{s.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: COLORS.slate }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 p-4 text-[12px]" style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card }}>
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between border-b py-1.5" style={{ borderColor: COLORS.hairline }}>
            <span style={{ color: COLORS.slate }}>{label}</span>
            <span className="font-semibold text-right" style={{ color: COLORS.ink }}>{value || "—"}</span>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-[11px] font-bold mb-2 uppercase tracking-wider" style={{ color: COLORS.slate }}>Recent Attendance Logs</h4>
        {student.recent_attendances?.length ? (
          <div style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card }}>
            <table className="w-full text-[12px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.hairline}`, color: COLORS.slate }}>
                  <th className="text-left px-4 py-2.5 font-normal">Date</th>
                  <th className="text-left px-4 py-2.5 font-normal">Time</th>
                  <th className="text-left px-4 py-2.5 font-normal">Subject</th>
                  <th className="text-left px-4 py-2.5 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {student.recent_attendances.map((a) => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${COLORS.hairline}`, color: COLORS.ink }}>
                    <td className="px-4 py-2.5">{a.date}</td>
                    <td className="px-4 py-2.5">{a.time}</td>
                    <td className="px-4 py-2.5">{a.subject || "—"}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[12px] py-3 text-center" style={{ color: COLORS.slate }}>No attendance history available</p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Students page  (real data via GET /api/students/summary)
--------------------------------------------------------- */
export default function Students() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const [query, setQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    apiFetch("/api/students/summary")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load students"))))
      .then(setData)
      .catch((err) => setError(err.message));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    apiFetch("/api/classes?per_page=500")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load classes"))))
      .then((res) => setClasses(Array.isArray(res) ? res : res.data || []))
      .catch(() => {});
  }, []);

  const flash = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const students = useMemo(() => data?.students || [], [data]);
  const grades = useMemo(() => ["all", ...[...new Set(students.map((s) => s.grade))].sort()], [students]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = query.toLowerCase();
      const matchesQuery = !q || s.name.toLowerCase().includes(q) || (s.student_id || "").toLowerCase().includes(q);
      const matchesGrade = gradeFilter === "all" || String(s.grade) === gradeFilter;
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesQuery && matchesGrade && matchesStatus;
    });
  }, [students, query, gradeFilter, statusFilter]);

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (s) => { setEditing(s); setFormOpen(true); };

  const openView = (s) => {
    setViewing(null);
    setDetailLoading(true);
    apiFetch(`/api/students/${s.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load student details"))))
      .then(setViewing)
      .catch(() => flash("Failed to load student details", "error"))
      .finally(() => setDetailLoading(false));
  };

  const handleSaved = (saved) => {
    setFormOpen(false);
    flash(saved.name ? `Student "${saved.name}" saved.` : "Student saved.");
    load();
  };

  const confirmDelete = async () => {
    await apiFetch(`/api/students/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    flash(`Student "${deleting.name}" deleted.`);
    load();
  };

  if (error) {
    return (
      <div style={{ background: COLORS.paper, minHeight: "100vh" }} className="font-sans">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <p className="text-[15px]" style={{ color: COLORS.coral }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ background: COLORS.paper, minHeight: "100vh" }} className="font-sans">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <p className="text-[15px]" style={{ color: COLORS.slate }}>Loading students...</p>
        </div>
      </div>
    );
  }

  const gradeDistribution = data.grade_distribution || [];
  const genderRatio = (data.gender_ratio || []).filter((g) => g.value > 0);

  return (
    <div style={{ background: COLORS.paper, minHeight: "100vh" }} className="font-sans">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="flex items-end justify-between mb-8" style={{ borderBottom: `2px solid ${COLORS.ink}`, paddingBottom: "16px" }}>
          <div>
            <h1 className="font-serif text-[26px]" style={{ color: COLORS.ink }}>Students</h1>
            <p className="text-[13px]" style={{ color: COLORS.slate }}>{data.total} total records</p>
          </div>
          <button
            className="px-4 py-2 text-[13px] text-white"
            style={{ background: COLORS.ink }}
            onClick={openAdd}
          >
            Add Student
          </button>
        </header>

        {msg && (
          <div className="mb-4 p-3 text-[12px] flex items-center justify-between rounded-sm"
               style={{ background: msg.type === "error" ? "#FBF3EF" : "#F0F5EE", color: msg.type === "error" ? COLORS.coral : COLORS.sage, border: `1px solid ${msg.type === "error" ? COLORS.coral : COLORS.sage}` }}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} style={{ color: "inherit" }}>×</button>
          </div>
        )}

        <KpiRow>
          <KPI label="Total Students" value={data.total} tone="ink" />
          <KPI label="Active" value={data.active} sub={`${data.inactive} inactive`} tone="sage" />
          <KPI label="New This Month" value={data.new_this_month} tone="amber" />
          <KPI label="Avg Attendance" value={`${data.avg_attendance}%`} tone={data.avg_attendance < 80 ? "coral" : "sage"} />
        </KpiRow>

        <ChartGrid>
          <Panel title="Students by Grade">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid stroke={COLORS.hairline} vertical={false} />
                <XAxis dataKey="grade" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.hairline }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} width={32} />
                <Tooltip />
                <Bar dataKey="students" fill={COLORS.ink} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Gender Ratio">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={genderRatio} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                  {genderRatio.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </ChartGrid>

        {/* Filter bar */}
        <div className="flex gap-3 mb-3 items-center">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-3 py-2 text-[13px] flex-1"
            style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card, color: COLORS.ink }}
          />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 text-[13px]"
            style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card, color: COLORS.ink }}
          >
            {grades.map((g) => (
              <option key={g} value={g}>{g === "all" ? "All grades" : `Grade ${g}`}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-[13px]"
            style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card, color: COLORS.ink }}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card }}>
          <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.hairline}`, color: COLORS.slate }}>
                <th className="text-left px-4 py-3 font-normal">ID</th>
                <th className="text-left px-4 py-3 font-normal">Name</th>
                <th className="text-left px-4 py-3 font-normal">Grade</th>
                <th className="text-left px-4 py-3 font-normal">Guardian</th>
                <th className="text-left px-4 py-3 font-normal">Contact</th>
                <th className="text-left px-4 py-3 font-normal">Attendance</th>
                <th className="text-left px-4 py-3 font-normal">Status</th>
                <th className="text-left px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.hairline}`, color: COLORS.ink }}>
                  <td className="px-4 py-3">{s.student_id || "—"}</td>
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.grade}{s.section}</td>
                  <td className="px-4 py-3">{s.guardian || "—"}</td>
                  <td className="px-4 py-3">{s.contact || "—"}</td>
                  <td className="px-4 py-3"><AttendanceBadge value={s.attendance} /></td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3">
                    <button className="text-[12px] mr-3" style={{ color: COLORS.ink }} onClick={() => openView(s)}>View</button>
                    <button className="text-[12px] mr-3" style={{ color: COLORS.slate }} onClick={() => openEdit(s)}>Edit</button>
                    <button className="text-[12px]" style={{ color: COLORS.coral }} onClick={() => setDeleting(s)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center" style={{ color: COLORS.slate }}>
                    No students match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[12px] mt-3" style={{ color: COLORS.slate }}>
          Showing {filtered.length} of {students.length} students
        </p>
      </div>

      {/* Modals */}
      {formOpen && (
        <Modal title={editing ? `Edit Record — ${editing.name}` : "Add New Student"} onClose={() => setFormOpen(false)} wide>
          <StudentForm
            initial={{ ...EMPTY_FORM, ...editing }}
            classes={classes}
            onSave={handleSaved}
            onClose={() => setFormOpen(false)}
          />
        </Modal>
      )}

      {viewing && (
        <Modal title="Student Profile Overview" onClose={() => setViewing(null)} wide>
          <StudentDetail student={viewing} />
        </Modal>
      )}

      {detailLoading && (
        <Modal title="Student Profile" onClose={() => setDetailLoading(false)} wide>
          <div className="py-12 text-center" style={{ color: COLORS.slate }}>Loading profile details...</div>
        </Modal>
      )}

      {deleting && (
        <Modal title="Confirm Delete" onClose={() => setDeleting(null)}>
          <p className="text-[13px]" style={{ color: COLORS.slate }}>
            Are you sure you want to delete <b style={{ color: COLORS.ink }}>{deleting.name}</b>?
          </p>
          <div className="mt-6 flex justify-end gap-2.5">
            <button onClick={() => setDeleting(null)} className="px-4 py-2 text-[12px] font-semibold rounded-sm text-white" style={{ background: COLORS.slate }}>
              Cancel
            </button>
            <button onClick={confirmDelete} className="px-5 py-2 text-[12px] font-semibold rounded-sm text-white" style={{ background: COLORS.coral }}>
              Delete Student
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
