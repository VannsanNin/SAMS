import { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, SquarePen, GraduationCap, Upload, Download, Search, Trash2, Eye, X, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';

const EMPTY_FORM = {
  student_id: '', name: '', gender: 'Male', dob: '', phone: '', email: '',
  address: '', department: '', major: '', academic_year: '', semester: '',
  class_id: '', enrollment_date: '', status: 'active',
  parent_name: '', parent_phone: '', image: '',
};

const STATUS_META = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  graduated: 'bg-sky-50 text-sky-700 border-sky-200/60',
  suspended: 'bg-rose-50 text-rose-700 border-rose-200/60',
};

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all';

function Field({ label, required, children, className = '' }) {
  return (
      <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-slate-700 mb-1">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
        {children}
      </label>
  );
}

function Avatar({ student, size = 40 }) {
  if (student?.image) {
    return (
        <img
            src={student.image}
            alt={student.name}
            className="rounded-full object-cover shrink-0 border border-slate-200 shadow-xs"
            style={{ width: size, height: size }}
        />
    );
  }
  const initials = (student?.name || '?')
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  return (
      <div
          className="rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs"
          style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {initials}
      </div>
  );
}

function StatusPill({ status }) {
  return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${STATUS_META[status] || STATUS_META.inactive}`}>
      {status || 'active'}
    </span>
  );
}

function StudentForm({ initial, classes, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/students${form.id ? `/${form.id}` : ''}`, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Validation failed. Check the required fields.');
      }
      onSave(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
      <form onSubmit={submit} className="space-y-4">
        {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-xs bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
        )}

        <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl mb-2">
          <Avatar student={form} size={56} />
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Profile Photo</label>
            <input
                type="file"
                accept="image/*"
                onChange={onImageFile}
                className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 font-medium"
            />
            {form.image && (
                <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, image: '' }))}
                    className="text-[11px] font-semibold text-rose-600 hover:underline mt-1"
                >
                  Remove photo
                </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Full Name" required>
            <input className={inputCls} value={form.name} onChange={set('name')} required />
          </Field>
          <Field label="Gender" required>
            <select className={inputCls} value={form.gender} onChange={set('gender')}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Date of Birth" required>
            <input type="date" className={inputCls} value={form.dob} onChange={set('dob')} required />
          </Field>
          <Field label="Phone" required>
            <input className={inputCls} value={form.phone} onChange={set('phone')} required />
          </Field>
          <Field label="Email" required>
            <input type="email" className={inputCls} value={form.email} onChange={set('email')} required />
          </Field>
          <Field label="Address" required>
            <input className={inputCls} value={form.address} onChange={set('address')} required />
          </Field>
          <Field label="Student ID">
            <input className={inputCls} value={form.student_id} onChange={set('student_id')} placeholder="Auto-generated if blank" />
          </Field>
          <Field label="Department">
            <input className={inputCls} value={form.department} onChange={set('department')} placeholder="e.g. Computer Science" />
          </Field>
          <Field label="Major">
            <input className={inputCls} value={form.major} onChange={set('major')} placeholder="e.g. Software Engineering" />
          </Field>
          <Field label="Academic Year">
            <input className={inputCls} value={form.academic_year} onChange={set('academic_year')} placeholder="e.g. 2025-2026" />
          </Field>
          <Field label="Semester">
            <input className={inputCls} value={form.semester} onChange={set('semester')} placeholder="e.g. Semester 1" />
          </Field>
          <Field label="Class" required>
            <select className={inputCls} value={form.class_id} onChange={set('class_id')} required>
              <option value="">— Select Class —</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </Field>
          <Field label="Enrollment Date">
            <input type="date" className={inputCls} value={form.enrollment_date} onChange={set('enrollment_date')} />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={set('status')}>
              {['active', 'inactive', 'graduated', 'suspended'].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Parent / Guardian Name">
            <input className={inputCls} value={form.parent_name} onChange={set('parent_name')} />
          </Field>
          <Field label="Parent / Guardian Phone">
            <input className={inputCls} value={form.parent_phone} onChange={set('parent_phone')} />
          </Field>
        </div>

        <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition shadow-xs"
          >
            {saving ? 'Saving...' : form.id ? 'Update Record' : 'Save Student'}
          </button>
        </div>
      </form>
  );
}

function StudentDetail({ student, onEdit }) {
  const stats = student.attendance_stats || { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendance_rate: 0 };
  const statCards = [
    { label: 'Total Records', value: stats.total, cls: 'text-slate-800' },
    { label: 'Present', value: stats.present, cls: 'text-emerald-600' },
    { label: 'Absent', value: stats.absent, cls: 'text-rose-600' },
    { label: 'Late', value: stats.late, cls: 'text-amber-600' },
    { label: 'Excused', value: stats.excused, cls: 'text-sky-600' },
    { label: 'Rate', value: `${stats.attendance_rate}%`, cls: 'text-indigo-600' },
  ];
  const rows = [
    ['Student ID', student.student_id],
    ['Email', student.email],
    ['Phone', student.phone],
    ['Gender', student.gender],
    ['Date of Birth', student.dob],
    ['Address', student.address],
    ['Department', student.department],
    ['Major', student.major],
    ['Academic Year', student.academic_year],
    ['Semester', student.semester],
    ['Class', student.class?.class_name],
    ['Enrollment Date', student.enrollment_date],
    ['Parent Name', student.parent_name],
    ['Parent Phone', student.parent_phone],
  ];

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <Avatar student={student} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{student.name}</h3>
              <StatusPill status={student.status} />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{student.student_id ?? 'No Student ID'}</p>
          </div>
          <button
              onClick={() => onEdit(student)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition"
          >
            <SquarePen size={14} />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {statCards.map((s) => (
              <div key={s.label} className="bg-white border border-slate-200/80 rounded-xl p-3 text-center shadow-xs">
                <p className={`text-lg font-bold ${s.cls}`}>{s.value}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{s.label}</p>
              </div>
          ))}
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">General Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-white border border-slate-200/80 rounded-2xl p-4 text-xs">
            {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500 font-medium">{label}</span>
                  <span className="font-semibold text-slate-900 text-right">{value || '—'}</span>
                </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Recent Attendance Logs</h4>
          {student.recent_attendances?.length ? (
              <div className="overflow-hidden rounded-xl border border-slate-200/80">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-slate-200 font-semibold uppercase">
                  <tr>
                    <th className="p-2.5 text-left">Date</th>
                    <th className="p-2.5 text-left">Time</th>
                    <th className="p-2.5 text-left">Subject</th>
                    <th className="p-2.5 text-left">Status</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                  {student.recent_attendances.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-900">{a.date}</td>
                        <td className="p-2.5">{a.time}</td>
                        <td className="p-2.5">{a.subject ?? '—'}</td>
                        <td className="p-2.5"><StatusPill status={a.status} /></td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          ) : (
              <p className="text-slate-400 text-xs py-3 text-center">No attendance history available</p>
          )}
        </div>
      </div>
  );
}

function ImportModal({ onClose, onImported }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiFetch(`${API}/students/import`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Import failed.');
      setResult(data);
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
      <Modal
          title="Import Records"
          icon={Upload}
          onClose={onClose}
          footer={
            <div className="flex justify-end gap-2.5">
              <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50">Close</button>
              <button
                  type="submit"
                  form="import-form"
                  disabled={busy}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-6 py-2 rounded-xl text-xs shadow-xs transition"
              >
                {busy ? 'Importing...' : 'Upload File'}
              </button>
            </div>
          }
      >
        <form id="import-form" onSubmit={submit} className="space-y-3">
          {error && <div className="p-3 rounded-xl text-xs bg-rose-50 text-rose-700 border border-rose-200">{error}</div>}
          {result && (
              <div className="p-3 rounded-xl text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                {result.message} {result.skipped > 0 && `Skipped ${result.skipped} row(s).`}
              </div>
          )}
          <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx"
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 font-medium"
          />
          <p className="text-xs text-slate-500">Supports <b>.csv</b> or <b>.xlsx</b> format.</p>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
            <p className="text-[11px] font-bold text-slate-600 mb-1">CSV Template Format</p>
            <pre className="text-[10px] text-slate-500 whitespace-pre-wrap font-mono">
            {'name,email,gender,dob,phone,class,parent_name,parent_phone,department,major\nSokha,sokha@student.edu,Male,2008-01-15,0110000001,10-A,Mr. Sokha Sr.,0120000001,Science,Mathematics'}
          </pre>
          </div>
        </form>
      </Modal>
  );
}

export default function Students() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', class_id: '', status: '', department: '', academic_year: '' });
  const [options, setOptions] = useState({ classes: [], departments: [], majors: [], academic_years: [], semesters: [], statuses: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = useCallback((page = 1) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', page);
    apiFetch(`${API}/students?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load students'))))
        .then((res) => { setData(res.data); setMeta({ ...res, data: undefined }); })
        .catch(() => {});
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    apiFetch(`${API}/students/filters`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load filter options'))))
        .then(setOptions)
        .catch(() => {});
  }, []);

  const flash = (text, type = 'success') => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (s) => { setEditing(s); setFormOpen(true); };

  const openView = (s) => {
    setViewing(null);
    setDetailLoading(true);
    apiFetch(`${API}/students/${s.id}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load student details'))))
        .then((d) => setViewing(d))
        .catch(() => flash('Failed to load student details', 'error'))
        .finally(() => setDetailLoading(false));
  };

  const handleSaved = (saved) => {
    setFormOpen(false);
    flash(`Student "${saved.name}" saved.`);
    load(meta?.current_page || 1);
  };

  const confirmDelete = async () => {
    await apiFetch(`${API}/students/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    flash(`Student "${deleting.name}" deleted.`);
    load(1);
  };

  const exportStudents = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await apiFetch(`${API}/students/export?${params.toString()}`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterSelect = (key, label) => (
      <select
          value={filters[key]}
          onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
          className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
      >
        <option value="">{label}</option>
        {key === 'class_id'
            ? (options.classes || []).map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)
            : (options[key] || []).map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
  );

  return (
      <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage student profiles, enrollments, and status</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
              <Upload size={15} /> Import
            </button>
            <button onClick={exportStudents} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
              <Download size={15} /> Export
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition">
              <UserPlus size={15} /> Add Student
            </button>
          </div>
        </div>

        {msg.text && (
            <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <span>{msg.text}</span>
              <button onClick={() => setMsg({ type: '', text: '' })}><X size={14} /></button>
            </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder="Search name, ID, email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            {filterSelect('class_id', 'All Classes')}
            {filterSelect('status', 'All Statuses')}
            {filterSelect('department', 'All Departments')}
            {filterSelect('academic_year', 'All Years')}
          </div>
          {(filters.search || filters.class_id || filters.status || filters.department || filters.academic_year) && (
              <button
                  onClick={() => setFilters({ search: '', class_id: '', status: '', department: '', academic_year: '' })}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear active filters
              </button>
          )}
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 text-left">Student</th>
                <th className="p-3.5 text-left">ID</th>
                <th className="p-3.5 text-left">Class</th>
                <th className="p-3.5 text-left hidden lg:table-cell">Department</th>
                <th className="p-3.5 text-left hidden md:table-cell">Major</th>
                <th className="p-3.5 text-left hidden sm:table-cell">Email</th>
                <th className="p-3.5 text-left">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar student={s} size={36} />
                        <div>
                          <p className="font-semibold text-slate-900">{s.name}</p>
                          <p className="text-[11px] text-slate-400 sm:hidden">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900">{s.student_id ?? '—'}</td>
                    <td className="p-3.5">{s.class?.class_name ?? '—'}</td>
                    <td className="p-3.5 hidden lg:table-cell text-slate-500">{s.department ?? '—'}</td>
                    <td className="p-3.5 hidden md:table-cell text-slate-500">{s.major ?? '—'}</td>
                    <td className="p-3.5 hidden sm:table-cell text-slate-500">{s.email}</td>
                    <td className="p-3.5"><StatusPill status={s.status} /></td>
                    <td className="p-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openView(s)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition" title="View Profile">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openEdit(s)} className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition" title="Edit Student">
                          <SquarePen size={13} />
                        </button>
                        <button onClick={() => setDeleting(s)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition" title="Delete Student">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              {data.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-slate-400 font-medium">No students found</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination meta={meta} onPageChange={load} />

        {/* Modals */}
        {formOpen && (
            <Modal title={editing ? `Edit Record — ${editing.name}` : 'Add New Student'} icon={editing ? SquarePen : UserPlus} onClose={() => setFormOpen(false)} wide>
              <StudentForm initial={{ ...EMPTY_FORM, ...editing }} classes={options.classes} onSave={handleSaved} onClose={() => setFormOpen(false)} />
            </Modal>
        )}

        {viewing && (
            <Modal title="Student Profile Overview" icon={GraduationCap} onClose={() => setViewing(null)} wide>
              <StudentDetail student={viewing} onEdit={(s) => { setViewing(null); openEdit(s); }} />
            </Modal>
        )}

        {detailLoading && (
            <Modal title="Student Profile" icon={GraduationCap} onClose={() => setDetailLoading(false)} wide>
              <div className="py-12 text-center text-slate-400 font-medium">Loading profile details...</div>
            </Modal>
        )}

        {importOpen && <ImportModal onClose={() => setImportOpen(false)} onImported={() => load(1)} />}

        {deleting && (
            <Modal title="Confirm Delete" icon={Trash2} onClose={() => setDeleting(null)}>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <b>{deleting.name}</b>? This action will permanently purge their profile and associated attendance records.
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition shadow-xs">Delete Student</button>
              </div>
            </Modal>
        )}
      </div>
  );
}