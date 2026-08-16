import { useState, useEffect, useCallback, useRef } from 'react';
import { School, SquarePen, Upload, Download, Search, Trash2, GraduationCap, BookOpen, CalendarClock, Eye, X, Check, AlertCircle, Plus } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';

const EMPTY_FORM = {
  class_name: '', department: '', academic_year: '', semester: '',
  room: '', teacher_id: '', subject_ids: [],
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

function ClassForm({ initial, options, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/classes${form.id ? `/${form.id}` : ''}`, {
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Class Name / Code" required>
            <input className={inputCls} value={form.class_name} onChange={set('class_name')} placeholder="e.g. 10-A" required />
          </Field>
          <Field label="Department">
            <input className={inputCls} value={form.department} onChange={set('department')} placeholder="e.g. Science" />
          </Field>
          <Field label="Academic Year" required>
            <input className={inputCls} value={form.academic_year} onChange={set('academic_year')} placeholder="e.g. 2025-2026" required />
          </Field>
          <Field label="Semester">
            <input className={inputCls} value={form.semester} onChange={set('semester')} placeholder="e.g. Semester 1" />
          </Field>
          <Field label="Room">
            <input className={inputCls} value={form.room} onChange={set('room')} placeholder="e.g. Room 201" />
          </Field>
          <Field label="Homeroom Teacher" required>
            <select className={inputCls} value={form.teacher_id} onChange={set('teacher_id')} required>
              <option value="">— Select Teacher —</option>
              {options.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="pt-2">
          <MultiSelect
              label="Courses for this Class"
              options={options.subjects}
              value={form.subject_ids}
              onChange={(v) => setForm((f) => ({ ...f, subject_ids: v }))}
              labelKey="subject_name"
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
            {saving ? 'Saving...' : form.id ? 'Update Record' : 'Save Class'}
          </button>
        </div>
      </form>
  );
}

function ClassDetail({ klass, onEdit }) {
  const rows = [
    ['Class Name / Code', klass.class_name],
    ['Department', klass.department],
    ['Academic Year', klass.academic_year],
    ['Semester', klass.semester],
    ['Room', klass.room],
    ['Homeroom Teacher', klass.teacher?.name ?? '—'],
    ['Students Count', klass.students?.length ?? 0],
  ];

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <School size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{klass.class_name}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{klass.teacher?.name ? `Homeroom: ${klass.teacher.name}` : 'No homeroom teacher assigned'}</p>
          </div>
          <button
              onClick={() => onEdit(klass)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition"
          >
            <SquarePen size={14} />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Class Overview</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-white border border-slate-200/80 rounded-2xl p-4 text-xs">
              {rows.map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-slate-100 py-1.5">
                    <span className="text-slate-500 font-medium">{label}</span>
                    <span className="font-semibold text-slate-900 text-right">{value || '—'}</span>
                  </div>
              ))}
            </div>

            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-6 mb-2.5 flex items-center gap-1.5">
              <BookOpen size={14} className="text-indigo-600" /> Assigned Courses
            </h4>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4">
              {klass.courses?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {klass.courses.map((c) => (
                        <span key={c.id} className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                    {c.subject_name}
                  </span>
                    ))}
                  </div>
              ) : (
                  <p className="text-slate-400 text-xs">No courses assigned to this class</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-sky-600" /> Enrolled Students ({klass.students?.length ?? 0})
            </h4>
            {klass.students?.length ? (
                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200/80 bg-white">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-900 text-slate-200 font-semibold uppercase">
                    <tr>
                      <th className="p-2.5 text-left">Student</th>
                      <th className="p-2.5 text-left">ID</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                    {klass.students.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold text-slate-900">{s.name}</td>
                          <td className="p-2.5 font-medium text-slate-500">{s.student_id ?? '—'}</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-slate-400 text-xs">
                  No students enrolled in this class
                </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CalendarClock size={14} className="text-indigo-600" /> Class Weekly Timetable
          </h4>
          {klass.schedules?.length ? (
              <div className="overflow-hidden rounded-xl border border-slate-200/80">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-slate-200 font-semibold uppercase">
                  <tr>
                    <th className="p-2.5 text-left">Day</th>
                    <th className="p-2.5 text-left">Time</th>
                    <th className="p-2.5 text-left">Course</th>
                    <th className="p-2.5 text-left">Teacher</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                  {klass.schedules.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-900 capitalize">{s.day}</td>
                        <td className="p-2.5">{s.time_start} – {s.time_end}</td>
                        <td className="p-2.5">{s.subject?.subject_name ?? '—'}</td>
                        <td className="p-2.5">{s.teacher?.name ?? '—'}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          ) : (
              <p className="text-slate-400 text-xs py-3 text-center">No active class schedule configured</p>
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
      const res = await apiFetch(`${API}/classes/import`, { method: 'POST', body: fd });
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
          title="Import Classes"
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
            {'Class Name,Department,Academic Year,Semester,Room,Teacher,Courses\n"9-A",Science,2026-2027,"Semester 1","Room 101","Borey Kim","Mathematics; Physics"'}
          </pre>
          </div>
        </form>
      </Modal>
  );
}

export default function Classes() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', department: '', academic_year: '', semester: '', teacher_id: '', subject_id: '' });
  const [options, setOptions] = useState({ teachers: [], subjects: [], departments: [], academic_years: [], semesters: [] });
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
    apiFetch(`${API}/classes?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load classes'))))
        .then((res) => { setData(res.data); setMeta({ ...res, data: undefined }); })
        .catch(() => {});
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    apiFetch(`${API}/classes/filters`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load filter options'))))
        .then(setOptions)
        .catch(() => {});
  }, []);

  const flash = (text, type = 'success') => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c) => { setEditing(c); setFormOpen(true); };

  const openView = (c) => {
    setViewing(null);
    setDetailLoading(true);
    apiFetch(`${API}/classes/${c.id}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load class details'))))
        .then((d) => setViewing(d))
        .catch(() => flash('Failed to load class details', 'error'))
        .finally(() => setDetailLoading(false));
  };

  const handleSaved = (saved) => {
    setFormOpen(false);
    flash(`Class "${saved.class_name}" saved.`);
    load(meta?.current_page || 1);
  };

  const confirmDelete = async () => {
    await apiFetch(`${API}/classes/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    flash(`Class "${deleting.class_name}" deleted.`);
    load(1);
  };

  const exportClasses = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await apiFetch(`${API}/classes/export?${params.toString()}`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'classes.csv';
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
        {(key === 'teacher_id'
                ? (options.teachers || []).map((t) => ({ id: t.id, name: t.name }))
                : key === 'subject_id'
                    ? (options.subjects || []).map((s) => ({ id: s.id, name: s.subject_name }))
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
              <School size={26} className="text-indigo-600" /> Class Management
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage academic sections, homeroom assignments, and room allocations</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
              <Upload size={15} /> Import
            </button>
            <button onClick={exportClasses} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
              <Download size={15} /> Export
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition">
              <Plus size={15} /> Add Class
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
                  placeholder="Search name, code, room, dept..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            {filterSelect('department', 'All Departments')}
            {filterSelect('academic_year', 'All Years')}
            {filterSelect('semester', 'All Semesters')}
            {filterSelect('teacher_id', 'All Teachers')}
            {filterSelect('subject_id', 'All Courses')}
          </div>
          {(filters.search || filters.department || filters.academic_year || filters.semester || filters.teacher_id || filters.subject_id) && (
              <button
                  onClick={() => setFilters({ search: '', department: '', academic_year: '', semester: '', teacher_id: '', subject_id: '' })}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear active filters
              </button>
          )}
        </div>

        {/* Class Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 text-left">Class</th>
                <th className="p-3.5 text-left hidden sm:table-cell">Room</th>
                <th className="p-3.5 text-left hidden lg:table-cell">Department</th>
                <th className="p-3.5 text-left hidden md:table-cell">Homeroom Teacher</th>
                <th className="p-3.5 text-left hidden sm:table-cell">Students</th>
                <th className="p-3.5 text-left hidden sm:table-cell">Courses</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <School size={15} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{c.class_name}</p>
                          <p className="text-[11px] text-slate-400 sm:hidden">{c.teacher?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 hidden sm:table-cell">{c.room ?? '—'}</td>
                    <td className="p-3.5 hidden lg:table-cell text-slate-500">{c.department ?? '—'}</td>
                    <td className="p-3.5 hidden md:table-cell font-medium text-slate-800">{c.teacher?.name ?? '—'}</td>
                    <td className="p-3.5 hidden sm:table-cell font-medium">{c.students_count ?? 0}</td>
                    <td className="p-3.5 hidden sm:table-cell text-xs font-medium">
                      {(c.courses_count ?? 0) === 0 ? (
                          <span className="text-slate-400">None</span>
                      ) : (
                          <span className="text-indigo-600">{c.courses_count} course{c.courses_count === 1 ? '' : 's'}</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openView(c)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition" title="View Details">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openEdit(c)} className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition" title="Edit Class">
                          <SquarePen size={13} />
                        </button>
                        <button onClick={() => setDeleting(c)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition" title="Delete Class">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              {data.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-400 font-medium">No classes found</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination meta={meta} onPageChange={load} />

        {/* Modals */}
        {formOpen && (
            <Modal title={editing ? `Edit Record — ${editing.class_name}` : 'Add New Class'} icon={editing ? SquarePen : Plus} onClose={() => setFormOpen(false)} wide>
              <ClassForm
                  initial={{ ...EMPTY_FORM, ...editing, subject_ids: editing?.courses?.map((c) => c.id) ?? [] }}
                  options={options}
                  onSave={handleSaved}
                  onClose={() => setFormOpen(false)}
              />
            </Modal>
        )}

        {viewing && (
            <Modal title="Class Section Overview" icon={School} onClose={() => setViewing(null)} wide>
              <ClassDetail klass={viewing} onEdit={(c) => { setViewing(null); openEdit(c); }} />
            </Modal>
        )}

        {detailLoading && (
            <Modal title="Class Details" icon={School} onClose={() => setDetailLoading(false)} wide>
              <div className="py-12 text-center text-slate-400 font-medium">Loading class details...</div>
            </Modal>
        )}

        {importOpen && <ImportModal onClose={() => setImportOpen(false)} onImported={() => load(1)} />}

        {deleting && (
            <Modal title="Confirm Delete" icon={Trash2} onClose={() => setDeleting(null)}>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <b>{deleting.class_name}</b>? This action will permanently remove this section and its associated timetable configurations.
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition shadow-xs">Delete Class</button>
              </div>
            </Modal>
        )}
      </div>
  );
}