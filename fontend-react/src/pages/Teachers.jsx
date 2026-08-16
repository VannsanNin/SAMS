import { useState, useEffect, useCallback, useRef } from 'react';
import { UserPlus, SquarePen, UserRound, Upload, Download, Search, Trash2, BookOpen, GraduationCap, Eye, X, Check, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';

const EMPTY_FORM = {
  teacher_id: '', name: '', gender: 'Male', dob: '', phone: '', email: '',
  address: '', department: '', position: '', salary: '', hire_date: '',
  status: 'active', image: '', subject_ids: [], class_ids: [],
};

const STATUS_META = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  on_leave: 'bg-amber-50 text-amber-700 border-amber-200/60',
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

function Avatar({ teacher, size = 40 }) {
  if (teacher?.image) {
    return (
        <img
            src={teacher.image}
            alt={teacher.name}
            className="rounded-full object-cover shrink-0 border border-slate-200 shadow-xs"
            style={{ width: size, height: size }}
        />
    );
  }
  const initials = (teacher?.name || '?')
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
      {(status || 'active').replace('_', ' ')}
    </span>
  );
}

function MultiSelect({ label, options, value, onChange, labelKey = 'name' }) {
  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };
  return (
      <Field label={label}>
        <div className="max-h-36 overflow-y-auto border border-slate-200/80 rounded-xl p-2 space-y-1 bg-slate-50">
          {options.length === 0 && <p className="text-xs text-slate-400 p-1">No options available</p>}
          {options.map((opt) => {
            const active = value.includes(opt.id);
            return (
                <button
                    type="button"
                    key={opt.id}
                    onClick={() => toggle(opt.id)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium border text-left transition ${
                        active ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                >
                  <span>{opt[labelKey]}</span>
                  {active ? <Check size={13} className="text-indigo-600" /> : <span className="text-slate-300 text-sm leading-none">+</span>}
                </button>
            );
          })}
        </div>
      </Field>
  );
}

function TeacherForm({ initial, options, onSave, onClose }) {
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
      const res = await apiFetch(`${API}/teachers${form.id ? `/${form.id}` : ''}`, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Validation failed. Check required fields.');
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
          <Avatar teacher={form} size={56} />
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
          <Field label="Teacher ID">
            <input className={inputCls} value={form.teacher_id} onChange={set('teacher_id')} placeholder="Auto-generated if blank" />
          </Field>
          <Field label="Department">
            <input className={inputCls} value={form.department} onChange={set('department')} placeholder="e.g. Science & Tech" />
          </Field>
          <Field label="Position" required>
            <input className={inputCls} value={form.position} onChange={set('position')} placeholder="e.g. Senior Lecturer" required />
          </Field>
          <Field label="Salary ($)" required>
            <input type="number" step="0.01" min="0" className={inputCls} value={form.salary} onChange={set('salary')} required />
          </Field>
          <Field label="Hire Date" required>
            <input type="date" className={inputCls} value={form.hire_date} onChange={set('hire_date')} required />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={set('status')}>
              {['active', 'inactive', 'on_leave', 'suspended'].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
              ))}
            </select>
          </Field>
          <MultiSelect
              label="Assigned Subjects"
              options={options.subjects}
              value={form.subject_ids}
              onChange={(v) => setForm((f) => ({ ...f, subject_ids: v }))}
              labelKey="subject_name"
          />
          <MultiSelect
              label="Assigned Classes"
              options={options.classes}
              value={form.class_ids}
              onChange={(v) => setForm((f) => ({ ...f, class_ids: v }))}
              labelKey="class_name"
          />
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
            {saving ? 'Saving...' : form.id ? 'Update Record' : 'Save Teacher'}
          </button>
        </div>
      </form>
  );
}

function TeacherDetail({ teacher, onEdit }) {
  const stats = teacher.teaching_stats || {
    assigned_subjects: 0, assigned_classes: 0, homeroom_classes: 0,
    weekly_schedules: 0, weekly_hours: 0,
  };
  const statCards = [
    { label: 'Subjects', value: stats.assigned_subjects, cls: 'text-indigo-600' },
    { label: 'Classes', value: stats.assigned_classes, cls: 'text-sky-600' },
    { label: 'Homeroom', value: stats.homeroom_classes, cls: 'text-emerald-600' },
    { label: 'Schedules', value: stats.weekly_schedules, cls: 'text-amber-600' },
    { label: 'Hours / Wk', value: stats.weekly_hours, cls: 'text-purple-600' },
  ];
  const rows = [
    ['Teacher ID', teacher.teacher_id],
    ['Email', teacher.email],
    ['Phone', teacher.phone],
    ['Gender', teacher.gender],
    ['Date of Birth', teacher.dob],
    ['Address', teacher.address],
    ['Department', teacher.department],
    ['Position', teacher.position],
    ['Salary', teacher.salary ? `$${Number(teacher.salary).toLocaleString()}` : '—'],
    ['Hire Date', teacher.hire_date],
  ];

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <Avatar teacher={teacher} size={64} />
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{teacher.name}</h3>
              <StatusPill status={teacher.status} />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{teacher.teacher_id ?? 'No Teacher ID'}</p>
          </div>
          <button
              onClick={() => onEdit(teacher)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition"
          >
            <SquarePen size={14} />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {statCards.map((s) => (
              <div key={s.label} className="bg-white border border-slate-200/80 rounded-xl p-3 text-center shadow-xs">
                <p className={`text-lg font-bold ${s.cls}`}>{s.value}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{s.label}</p>
              </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Active Assignments</h4>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-indigo-600" /> Subjects
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {teacher.subjects?.length ? teacher.subjects.map((s) => (
                      <span key={s.id} className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                    {s.subject_name}
                  </span>
                  )) : <span className="text-xs text-slate-400">None assigned</span>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-sky-600" /> Classes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {teacher.assigned_classes?.length ? teacher.assigned_classes.map((c) => (
                      <span key={c.id} className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold">
                    {c.class_name}
                  </span>
                  )) : <span className="text-xs text-slate-400">None assigned</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Weekly Teaching Timetable</h4>
          {teacher.schedules?.length ? (
              <div className="overflow-hidden rounded-xl border border-slate-200/80">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-slate-200 font-semibold uppercase">
                  <tr>
                    <th className="p-2.5 text-left">Day</th>
                    <th className="p-2.5 text-left">Time</th>
                    <th className="p-2.5 text-left">Subject</th>
                    <th className="p-2.5 text-left">Class</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                  {teacher.schedules.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-900 capitalize">{s.day}</td>
                        <td className="p-2.5">{s.time_start} – {s.time_end}</td>
                        <td className="p-2.5">{s.subject?.subject_name ?? '—'}</td>
                        <td className="p-2.5">{s.class?.class_name ?? '—'}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          ) : (
              <p className="text-slate-400 text-xs py-3 text-center">No weekly schedule configured</p>
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
      const res = await apiFetch(`${API}/teachers/import`, { method: 'POST', body: fd });
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
          title="Import Teachers"
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
          <p className="text-xs text-slate-500">Supports <b>.csv</b> or <b>.xlsx</b> formats.</p>
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
            <p className="text-[11px] font-bold text-slate-600 mb-1">CSV Template Format</p>
            <pre className="text-[10px] text-slate-500 whitespace-pre-wrap font-mono">
            {'name,email,gender,dob,phone,department,position,salary,hire_date,status,courses,classes\n"Borey Kim",borey@school.edu,Male,1988-06-12,017223344,Languages,Teacher,1200,2021-09-01,active,"Mathematics; English","11-A"'}
          </pre>
          </div>
        </form>
      </Modal>
  );
}

export default function Teachers() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', department: '', position: '', status: '', subject_id: '', class_id: '' });
  const [options, setOptions] = useState({ subjects: [], classes: [], departments: [], positions: [], statuses: [] });
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
    apiFetch(`${API}/teachers?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load teachers'))))
        .then((res) => { setData(res.data); setMeta({ ...res, data: undefined }); })
        .catch(() => {});
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    apiFetch(`${API}/teachers/filters`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load filter options'))))
        .then(setOptions)
        .catch(() => {});
  }, []);

  const flash = (text, type = 'success') => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (t) => { setEditing(t); setFormOpen(true); };

  const openView = (t) => {
    setViewing(null);
    setDetailLoading(true);
    apiFetch(`${API}/teachers/${t.id}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load teacher details'))))
        .then((d) => setViewing(d))
        .catch(() => flash('Failed to load teacher details', 'error'))
        .finally(() => setDetailLoading(false));
  };

  const handleSaved = (saved) => {
    setFormOpen(false);
    flash(`Teacher "${saved.name}" saved.`);
    load(meta?.current_page || 1);
  };

  const confirmDelete = async () => {
    await apiFetch(`${API}/teachers/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    flash(`Teacher "${deleting.name}" deleted.`);
    load(1);
  };

  const exportTeachers = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await apiFetch(`${API}/teachers/export?${params.toString()}`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teachers.csv';
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
        {(key === 'subject_id'
                ? (options.subjects || []).map((s) => ({ id: s.id, name: s.subject_name }))
                : key === 'class_id'
                    ? (options.classes || []).map((c) => ({ id: c.id, name: c.class_name }))
                    : (options[key] || []).map((v) => ({ id: v, name: v }))
        ).map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
      </select>
  );

  return (
      <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserRound size={26} className="text-indigo-600" /> Teacher Directory
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage faculty profiles, course loads, and schedules</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
              <Upload size={15} /> Import
            </button>
            <button onClick={exportTeachers} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
              <Download size={15} /> Export
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition">
              <UserPlus size={15} /> Add Teacher
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder="Search name, ID, email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            {filterSelect('department', 'All Departments')}
            {filterSelect('position', 'All Positions')}
            {filterSelect('status', 'All Statuses')}
            {filterSelect('subject_id', 'All Subjects')}
            {filterSelect('class_id', 'All Classes')}
          </div>
          {(filters.search || filters.department || filters.position || filters.status || filters.subject_id || filters.class_id) && (
              <button
                  onClick={() => setFilters({ search: '', department: '', position: '', status: '', subject_id: '', class_id: '' })}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear active filters
              </button>
          )}
        </div>

        {/* Teacher Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 text-left">Teacher</th>
                <th className="p-3.5 text-left">ID</th>
                <th className="p-3.5 text-left hidden lg:table-cell">Department</th>
                <th className="p-3.5 text-left hidden md:table-cell">Position</th>
                <th className="p-3.5 text-left hidden sm:table-cell">Assignments</th>
                <th className="p-3.5 text-left">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar teacher={t} size={36} />
                        <div>
                          <p className="font-semibold text-slate-900">{t.name}</p>
                          <p className="text-[11px] text-slate-400 sm:hidden">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900">{t.teacher_id ?? '—'}</td>
                    <td className="p-3.5 hidden lg:table-cell text-slate-500">{t.department ?? '—'}</td>
                    <td className="p-3.5 hidden md:table-cell text-slate-500">{t.position ?? '—'}</td>
                    <td className="p-3.5 hidden sm:table-cell text-xs font-medium">
                      <span className="text-indigo-600">{t.subjects_count ?? 0} subjects</span>
                      <span className="text-slate-300 mx-1.5">•</span>
                      <span className="text-sky-600">{t.assigned_classes_count ?? 0} classes</span>
                    </td>
                    <td className="p-3.5"><StatusPill status={t.status} /></td>
                    <td className="p-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openView(t)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition" title="View Profile">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openEdit(t)} className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition" title="Edit Teacher">
                          <SquarePen size={13} />
                        </button>
                        <button onClick={() => setDeleting(t)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition" title="Delete Teacher">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              {data.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-400 font-medium">No teachers found</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination meta={meta} onPageChange={load} />

        {/* Modals */}
        {formOpen && (
            <Modal title={editing ? `Edit Record — ${editing.name}` : 'Add New Teacher'} icon={editing ? SquarePen : UserPlus} onClose={() => setFormOpen(false)} wide>
              <TeacherForm
                  initial={{ ...EMPTY_FORM, ...editing, subject_ids: editing?.subjects?.map((s) => s.id) ?? [], class_ids: editing?.assigned_classes?.map((c) => c.id) ?? [] }}
                  options={options}
                  onSave={handleSaved}
                  onClose={() => setFormOpen(false)}
              />
            </Modal>
        )}

        {viewing && (
            <Modal title="Teacher Profile Overview" icon={UserRound} onClose={() => setViewing(null)} wide>
              <TeacherDetail teacher={viewing} onEdit={(t) => { setViewing(null); openEdit(t); }} />
            </Modal>
        )}

        {detailLoading && (
            <Modal title="Teacher Profile" icon={UserRound} onClose={() => setDetailLoading(false)} wide>
              <div className="py-12 text-center text-slate-400 font-medium">Loading profile details...</div>
            </Modal>
        )}

        {importOpen && <ImportModal onClose={() => setImportOpen(false)} onImported={() => load(1)} />}

        {deleting && (
            <Modal title="Confirm Delete" icon={Trash2} onClose={() => setDeleting(null)}>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <b>{deleting.name}</b>? This action will permanently remove their profile, assigned schedules, and teaching history.
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition shadow-xs">Delete Teacher</button>
              </div>
            </Modal>
        )}
      </div>
  );
}