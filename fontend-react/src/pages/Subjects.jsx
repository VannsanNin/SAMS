import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, SquarePen, Upload, Download, Search, Trash2, CalendarClock, Eye, X, Check, AlertCircle, Plus } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';

const EMPTY_FORM = {
  course_code: '', subject_name: '', credits: '3', description: '',
  department: '', semester: '', academic_year: '', status: 'active',
  teacher_ids: [],
};

const STATUS_META = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  archived: 'bg-rose-50 text-rose-700 border-rose-200/60',
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

function StatusPill({ status }) {
  return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${STATUS_META[status] || STATUS_META.inactive}`}>
      {status || 'active'}
    </span>
  );
}

function MultiSelect({ label, options, value, onChange }) {
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
                  <span>{opt.name}</span>
                  {active ? <Check size={13} className="text-indigo-600" /> : <span className="text-slate-300 text-sm leading-none">+</span>}
                </button>
            );
          })}
        </div>
      </Field>
  );
}

function CourseForm({ initial, options, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/subjects${form.id ? `/${form.id}` : ''}`, {
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
          <Field label="Course Name" required>
            <input className={inputCls} value={form.subject_name} onChange={set('subject_name')} required />
          </Field>
          <Field label="Course Code">
            <input className={inputCls} value={form.course_code} onChange={set('course_code')} placeholder="Auto-generated if blank" />
          </Field>
          <Field label="Credits" required>
            <input type="number" min="0" max="30" className={inputCls} value={form.credits} onChange={set('credits')} required />
          </Field>
          <Field label="Department">
            <input className={inputCls} value={form.department} onChange={set('department')} placeholder="e.g. Science" />
          </Field>
          <Field label="Semester">
            <input className={inputCls} value={form.semester} onChange={set('semester')} placeholder="e.g. Semester 1" />
          </Field>
          <Field label="Academic Year">
            <input className={inputCls} value={form.academic_year} onChange={set('academic_year')} placeholder="e.g. 2025-2026" />
          </Field>
          <Field label="Course Status">
            <select className={inputCls} value={form.status} onChange={set('status')}>
              {['active', 'inactive', 'archived'].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <textarea rows="3" className={inputCls} value={form.description} onChange={set('description')} placeholder="Brief overview of course objectives..." />
          </Field>
        </div>

        <div className="pt-2">
          <MultiSelect
              label="Assigned Teachers"
              options={options.teachers}
              value={form.teacher_ids}
              onChange={(v) => setForm((f) => ({ ...f, teacher_ids: v }))}
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
            {saving ? 'Saving...' : form.id ? 'Update Record' : 'Save Course'}
          </button>
        </div>
      </form>
  );
}

function CourseDetail({ course, onEdit }) {
  const rows = [
    ['Course Code', course.course_code],
    ['Course Name', course.subject_name],
    ['Credits', course.credits],
    ['Department', course.department],
    ['Semester', course.semester],
    ['Academic Year', course.academic_year],
    ['Schedules', course.schedules_count],
    ['Description', course.description],
  ];

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen size={28} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{course.subject_name}</h3>
              <StatusPill status={course.status} />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{course.course_code ?? 'No Code'}</p>
          </div>
          <button
              onClick={() => onEdit(course)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition"
          >
            <SquarePen size={14} />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Course Specification</h4>
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
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Instructors</h4>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4">
              {course.teachers?.length ? (
                  <div className="space-y-2">
                    {course.teachers.map((t) => (
                        <div key={t.id} className="flex items-center gap-2.5 text-xs">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {t.name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                          <span className="font-semibold text-slate-900">{t.name}</span>
                        </div>
                    ))}
                  </div>
              ) : (
                  <p className="text-slate-400 text-xs">No teachers currently assigned</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CalendarClock size={14} className="text-indigo-600" /> Linked Schedules
          </h4>
          {course.recent_schedules?.length ? (
              <div className="overflow-hidden rounded-xl border border-slate-200/80">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-slate-200 font-semibold uppercase">
                  <tr>
                    <th className="p-2.5 text-left">Day</th>
                    <th className="p-2.5 text-left">Time</th>
                    <th className="p-2.5 text-left">Class</th>
                    <th className="p-2.5 text-left">Teacher</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                  {course.recent_schedules.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-900 capitalize">{s.day}</td>
                        <td className="p-2.5">{s.time_start} – {s.time_end}</td>
                        <td className="p-2.5">{s.class?.class_name ?? '—'}</td>
                        <td className="p-2.5">{s.teacher?.name ?? '—'}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          ) : (
              <p className="text-slate-400 text-xs py-3 text-center">No active schedule configured</p>
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
      const res = await apiFetch(`${API}/subjects/import`, { method: 'POST', body: fd });
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
          title="Import Courses"
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
            {'Course Code,Course Name,Credits,Description,Department,Semester,Academic Year,Status,Teachers\n"PHY-201","Applied Physics",2,"Practical physics",Science,"Semester 2",2025-2026,active,"Sreymom Ly; Dara Tep"'}
          </pre>
          </div>
        </form>
      </Modal>
  );
}

export default function Subjects() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', department: '', status: '', semester: '', academic_year: '', teacher_id: '' });
  const [options, setOptions] = useState({ teachers: [], departments: [], statuses: [], semesters: [], academic_years: [] });
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
    apiFetch(`${API}/subjects?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load courses'))))
        .then((res) => { setData(res.data); setMeta({ ...res, data: undefined }); })
        .catch(() => {});
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    apiFetch(`${API}/subjects/filters`)
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
    apiFetch(`${API}/subjects/${c.id}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load course details'))))
        .then((d) => setViewing(d))
        .catch(() => flash('Failed to load course details', 'error'))
        .finally(() => setDetailLoading(false));
  };

  const handleSaved = (saved) => {
    setFormOpen(false);
    flash(`Course "${saved.subject_name}" saved.`);
    load(meta?.current_page || 1);
  };

  const confirmDelete = async () => {
    await apiFetch(`${API}/subjects/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    flash(`Course "${deleting.subject_name}" deleted.`);
    load(1);
  };

  const exportCourses = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await apiFetch(`${API}/subjects/export?${params.toString()}`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courses.csv';
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
              <BookOpen size={26} className="text-indigo-600" /> Course Catalog
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage academic courses, credit values, and faculty assignments</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
              <Upload size={15} /> Import
            </button>
            <button onClick={exportCourses} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
              <Download size={15} /> Export
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition">
              <Plus size={15} /> Add Course
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
                  placeholder="Search name, code, description..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            {filterSelect('department', 'All Departments')}
            {filterSelect('status', 'All Statuses')}
            {filterSelect('semester', 'All Semesters')}
            {filterSelect('academic_year', 'All Years')}
            {filterSelect('teacher_id', 'All Teachers')}
          </div>
          {(filters.search || filters.department || filters.status || filters.semester || filters.academic_year || filters.teacher_id) && (
              <button
                  onClick={() => setFilters({ search: '', department: '', status: '', semester: '', academic_year: '', teacher_id: '' })}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear active filters
              </button>
          )}
        </div>

        {/* Course Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 text-left">Course</th>
                <th className="p-3.5 text-left">Code</th>
                <th className="p-3.5 text-left hidden sm:table-cell">Credits</th>
                <th className="p-3.5 text-left hidden lg:table-cell">Department</th>
                <th className="p-3.5 text-left hidden md:table-cell">Semester</th>
                <th className="p-3.5 text-left hidden sm:table-cell">Teachers</th>
                <th className="p-3.5 text-left">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <BookOpen size={15} />
                        </div>
                        <p className="font-semibold text-slate-900">{c.subject_name}</p>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900">{c.course_code ?? '—'}</td>
                    <td className="p-3.5 hidden sm:table-cell font-medium">{c.credits}</td>
                    <td className="p-3.5 hidden lg:table-cell text-slate-500">{c.department ?? '—'}</td>
                    <td className="p-3.5 hidden md:table-cell text-slate-500">{c.semester ?? '—'}</td>
                    <td className="p-3.5 hidden sm:table-cell text-xs font-medium">
                      {(c.teachers_count ?? 0) === 0 ? (
                          <span className="text-slate-400">None</span>
                      ) : (
                          <span className="text-indigo-600">{c.teachers_count} teacher{c.teachers_count === 1 ? '' : 's'}</span>
                      )}
                    </td>
                    <td className="p-3.5"><StatusPill status={c.status} /></td>
                    <td className="p-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openView(c)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition" title="View Details">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openEdit(c)} className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition" title="Edit Course">
                          <SquarePen size={13} />
                        </button>
                        <button onClick={() => setDeleting(c)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition" title="Delete Course">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              {data.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-12 text-center text-slate-400 font-medium">No courses found</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination meta={meta} onPageChange={load} />

        {/* Modals */}
        {formOpen && (
            <Modal title={editing ? `Edit Record — ${editing.subject_name}` : 'Add New Course'} icon={editing ? SquarePen : Plus} onClose={() => setFormOpen(false)} wide>
              <CourseForm
                  initial={{ ...EMPTY_FORM, ...editing, teacher_ids: editing?.teachers?.map((t) => t.id) ?? [] }}
                  options={options}
                  onSave={handleSaved}
                  onClose={() => setFormOpen(false)}
              />
            </Modal>
        )}

        {viewing && (
            <Modal title="Course Profile Overview" icon={BookOpen} onClose={() => setViewing(null)} wide>
              <CourseDetail course={viewing} onEdit={(c) => { setViewing(null); openEdit(c); }} />
            </Modal>
        )}

        {detailLoading && (
            <Modal title="Course Details" icon={BookOpen} onClose={() => setDetailLoading(false)} wide>
              <div className="py-12 text-center text-slate-400 font-medium">Loading course details...</div>
            </Modal>
        )}

        {importOpen && <ImportModal onClose={() => setImportOpen(false)} onImported={() => load(1)} />}

        {deleting && (
            <Modal title="Confirm Delete" icon={Trash2} onClose={() => setDeleting(null)}>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <b>{deleting.subject_name}</b>? This action will permanently remove this course and its associated schedules.
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition shadow-xs">Delete Course</button>
              </div>
            </Modal>
        )}
      </div>
  );
}