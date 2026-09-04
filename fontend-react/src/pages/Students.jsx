import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { apiFetch } from "../api";
import Modal from "../components/Modal";
import { KPI, Panel, KpiRow, ChartGrid } from "../components/shared";
import { Search, Eye, Edit3, Trash2, UserPlus } from "lucide-react";

const EMPTY_FORM = {
  student_id: "", name: "", gender: "Male", dob: "", phone: "", email: "",
  address: "", department: "", major: "", academic_year: "", semester: "",
  class_id: "", enrollment_date: "", status: "active",
  parent_name: "", parent_phone: "",
};

const CHART_PALETTE = ['#4F46E5', '#F59E0B', '#10B981', '#0284C7'];

const tooltipStyle = {
  backgroundColor: '#0F172A',
  borderRadius: '0.75rem',
  border: 'none',
  color: '#F8FAFC',
  fontSize: '12px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
};

function StatusBadge({ status }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    inactive: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    graduated: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
    suspended: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  };
  const cls = styles[status] || styles.inactive;
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${cls}`}>
      {status}
    </span>
  );
}

function AttendanceBadge({ value }) {
  const cls = value < 75
    ? "text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/50 dark:border-red-800"
    : value < 85
      ? "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-800"
      : "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${cls}`}>
      {value}%
    </span>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass = "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all";

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
      if (!res.ok) throw new Error(data.message || "Validation failed. Check required fields.");
      onSave(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 font-sans">
      {error && (
        <div className="p-3.5 text-xs font-semibold rounded-xl bg-red-50 text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required>
          <input className={inputClass} value={form.name} onChange={set("name")} required />
        </Field>
        <Field label="Gender" required>
          <select className={inputClass} value={form.gender} onChange={set("gender")}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Date of Birth" required>
          <input type="date" className={inputClass} value={form.dob} onChange={set("dob")} required />
        </Field>
        <Field label="Phone" required>
          <input className={inputClass} value={form.phone} onChange={set("phone")} required />
        </Field>
        <Field label="Email" required>
          <input type="email" className={inputClass} value={form.email} onChange={set("email")} required />
        </Field>
        <Field label="Address" required>
          <input className={inputClass} value={form.address} onChange={set("address")} required />
        </Field>
        <Field label="Class" required>
          <select className={inputClass} value={form.class_id} onChange={set("class_id")} required>
            <option value="">— Select Class —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        </Field>
        <Field label="Student ID">
          <input className={inputClass} value={form.student_id} onChange={set("student_id")} placeholder="Auto-generated if blank" />
        </Field>
        <Field label="Department">
          <input className={inputClass} value={form.department} onChange={set("department")} placeholder="e.g. Computer Science" />
        </Field>
        <Field label="Major">
          <input className={inputClass} value={form.major} onChange={set("major")} placeholder="e.g. Software Engineering" />
        </Field>
        <Field label="Academic Year">
          <input className={inputClass} value={form.academic_year} onChange={set("academic_year")} placeholder="e.g. 2025-2026" />
        </Field>
        <Field label="Semester">
          <input className={inputClass} value={form.semester} onChange={set("semester")} placeholder="e.g. Semester 1" />
        </Field>
        <Field label="Enrollment Date">
          <input type="date" className={inputClass} value={form.enrollment_date} onChange={set("enrollment_date")} />
        </Field>
        <Field label="Status">
          <select className={inputClass} value={form.status} onChange={set("status")}>
            {["active", "inactive", "graduated", "suspended"].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </Field>
        <Field label="Parent / Guardian Name" required>
          <input className={inputClass} value={form.parent_name} onChange={set("parent_name")} required />
        </Field>
        <Field label="Parent / Guardian Phone" required>
          <input className={inputClass} value={form.parent_phone} onChange={set("parent_phone")} required />
        </Field>
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="px-6 py-2.5 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] shadow-md shadow-indigo-600/20 transition-all">
          {saving ? "Saving..." : form.id ? "Update Record" : "Save Student"}
        </button>
      </div>
    </form>
  );
}

function StudentDetail({ student }) {
  const stats = student.attendance_stats || { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendance_rate: 0 };
  const statCards = [
    { label: "Total", value: stats.total, color: "text-slate-900" },
    { label: "Present", value: stats.present, color: "text-emerald-600" },
    { label: "Absent", value: stats.absent, color: "text-red-600" },
    { label: "Late", value: stats.late, color: "text-amber-600" },
    { label: "Excused", value: stats.excused, color: "text-slate-500" },
    { label: "Rate", value: `${stats.attendance_rate}%`, color: "text-indigo-600" },
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
    <div className="space-y-5 font-sans">
      <div className="flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-display font-bold text-slate-900">{student.name}</h3>
            <StatusBadge status={student.status} />
          </div>
          <p className="text-xs font-mono text-slate-500 mt-0.5">{student.student_id || "No Student ID"}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="p-3.5 text-center bg-slate-50/50 border border-slate-100 rounded-xl">
            <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 p-4 text-xs bg-white border border-slate-100 rounded-xl">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between border-b border-slate-100 py-1.5">
            <span className="text-slate-500 font-medium">{label}</span>
            <span className="font-semibold text-slate-900 text-right">{value || "—"}</span>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recent Attendance Logs</h4>
        {student.recent_attendances?.length ? (
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase bg-slate-50/50">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Subject</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {student.recent_attendances.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
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
          <p className="text-xs py-4 text-center text-slate-400 font-medium">No attendance history available</p>
        )}
      </div>
    </div>
  );
}

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
      <div className="min-h-screen bg-slate-50 font-sans p-8">
        <div className="max-w-6xl mx-auto text-center py-16">
          <p className="text-sm font-semibold text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans p-8">
        <div className="max-w-6xl mx-auto text-center py-16">
          <p className="text-sm font-semibold text-slate-400">Loading student directory...</p>
        </div>
      </div>
    );
  }

  const gradeDistribution = (Array.isArray(data.grade_distribution) ? data.grade_distribution : []).length
    ? data.grade_distribution
    : [];
  const genderRatio = (Array.isArray(data.gender_ratio) ? data.gender_ratio : []).filter((g) => g.value > 0);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{data.total} active registered students</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all"
        >
          <UserPlus size={16} /> Add New Student
        </button>
      </div>

      {msg && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${msg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      <KpiRow>
        <KPI label="Total Students" value={data.total} tone="ink" />
        <KPI label="Active Roster" value={data.active} sub={`${data.inactive} inactive`} tone="sage" />
        <KPI label="New This Month" value={data.new_this_month} tone="amber" />
        <KPI label="Avg Attendance" value={`${data.avg_attendance}%`} tone={data.avg_attendance < 80 ? "coral" : "sage"} />
      </KpiRow>

      <ChartGrid>
        <Panel title="Students by Grade">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gradeDistribution}>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="students" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Gender Ratio">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={genderRatio} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                {genderRatio.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </ChartGrid>

      {/* Filter Toolbar */}
      <div className="impeccable-card p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
          />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
          >
            {grades.map((g) => (
              <option key={g} value={g}>{g === "all" ? "All grades" : `Grade ${g}`}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="impeccable-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-100 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Guardian</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-600 dark:text-slate-400">{s.student_id || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{s.name}</td>
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{s.grade}{s.section}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.guardian || "—"}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.contact || "—"}</td>
                  <td className="px-4 py-3"><AttendanceBadge value={s.attendance} /></td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors" onClick={() => openView(s)} title="View profile">
                        <Eye size={15} />
                      </button>
                      <button className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors" onClick={() => openEdit(s)} title="Edit student">
                        <Edit3 size={15} />
                      </button>
                      <button className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors" onClick={() => setDeleting(s)} title="Delete student">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No students found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-800/30 text-xs font-semibold text-slate-600 dark:text-slate-400">
          Showing {filtered.length} of {students.length} students
        </div>
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
          <div className="py-12 text-center text-slate-400 font-medium">Loading profile details...</div>
        </Modal>
      )}

      {deleting && (
        <Modal title="Confirm Delete" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete <b className="text-slate-900">{deleting.name}</b>? This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setDeleting(null)} className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button onClick={confirmDelete} className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors">
              Delete Student
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
