import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, SquarePen, Download, Search, Trash2, X, AlertCircle, Plus } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';

const EMPTY_FORM = {
  student_id: '', schedule_id: '', staff_id: '', date: '', status: 'present',
};

const STATUS_META = {
  present: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  absent: 'bg-rose-50 text-rose-700 border-rose-200/60',
  late: 'bg-amber-50 text-amber-700 border-amber-200/60',
  excused: 'bg-sky-50 text-sky-700 border-sky-200/60',
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
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${STATUS_META[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status || 'present'}
    </span>
  );
}

function AttendanceForm({ initial, options, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/attendances${form.id ? `/${form.id}` : ''}`, {
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
          <Field label="Student" required>
            <select className={inputCls} value={form.student_id} onChange={set('student_id')} required>
              <option value="">— Select Student —</option>
              {(options.students || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Schedule Session" required>
            <select className={inputCls} value={form.schedule_id} onChange={set('schedule_id')} required>
              <option value="">— Select Schedule —</option>
              {(options.schedules || []).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Recorded By Staff" required>
            <select className={inputCls} value={form.staff_id} onChange={set('staff_id')} required>
              <option value="">— Select Staff —</option>
              {(options.staff || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Date" required>
            <input type="date" className={inputCls} value={form.date} onChange={set('date')} required />
          </Field>
          <Field label="Attendance Status" required className="sm:col-span-2">
            <select className={inputCls} value={form.status} onChange={set('status')} required>
              {(['present', 'absent', 'late', 'excused']).map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
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
            {saving ? 'Saving...' : form.id ? 'Update Record' : 'Save Record'}
          </button>
        </div>
      </form>
  );
}

export default function Attendances() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', student_id: '', staff_id: '', class_id: '', schedule_id: '', date_from: '', date_to: '' });
  const [options, setOptions] = useState({ statuses: [], students: [], staff: [], classes: [], schedules: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = useCallback((page = 1) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', page);
    apiFetch(`${API}/attendances?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load attendances'))))
        .then((res) => { setData(res.data); setMeta({ ...res, data: undefined }); })
        .catch(() => {});
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    apiFetch(`${API}/attendances/filters`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load filter options'))))
        .then(setOptions)
        .catch(() => {});
  }, []);

  const flash = (text, type = 'success') => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (a) => { setEditing(a); setFormOpen(true); };

  const handleSaved = (saved) => {
    setFormOpen(false);
    flash(`Attendance record for ${saved.student?.name ?? `#${saved.student_id}`} saved.`);
    load(meta?.current_page || 1);
  };

  const confirmDelete = async () => {
    await apiFetch(`${API}/attendances/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    flash('Attendance record deleted.');
    load(1);
  };

  const exportAttendances = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await apiFetch(`${API}/attendances/export?${params.toString()}`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendances.csv';
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
        {key === 'status'
            ? (options.statuses || []).map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)
            : key === 'schedule_id'
                ? (options.schedules || []).map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)
                : (options[key] || []).map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)
        }
      </select>
  );

  return (
      <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ClipboardList size={26} className="text-indigo-600" /> Attendance History Log
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Audit, query, and edit past session attendance records</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportAttendances} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
              <Download size={15} /> Export
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition">
              <Plus size={15} /> Add Record
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative lg:col-span-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder="Search student name..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            {filterSelect('status', 'All Statuses')}
            {filterSelect('class_id', 'All Classes')}
            {filterSelect('schedule_id', 'All Schedules')}
            {filterSelect('student_id', 'All Students')}
            {filterSelect('staff_id', 'All Staff')}
            <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
                title="From date"
            />
            <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
                title="To date"
            />
          </div>
          {(filters.search || filters.status || filters.student_id || filters.staff_id || filters.class_id || filters.schedule_id || filters.date_from || filters.date_to) && (
              <button
                  onClick={() => setFilters({ search: '', status: '', student_id: '', staff_id: '', class_id: '', schedule_id: '', date_from: '', date_to: '' })}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear active filters
              </button>
          )}
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 text-left">Student</th>
                <th className="p-3.5 text-left hidden md:table-cell">Subject</th>
                <th className="p-3.5 text-left hidden lg:table-cell">Schedule</th>
                <th className="p-3.5 text-left hidden sm:table-cell">Recorded By</th>
                <th className="p-3.5 text-left">Date</th>
                <th className="p-3.5 text-left">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-900">{a.student?.name ?? `#${a.student_id}`}</p>
                      <p className="text-[11px] text-slate-400 md:hidden">{a.schedule?.subject?.subject_name ?? '—'}</p>
                    </td>
                    <td className="p-3.5 hidden md:table-cell font-medium text-slate-800">{a.schedule?.subject?.subject_name ?? '—'}</td>
                    <td className="p-3.5 hidden lg:table-cell text-slate-500 font-medium">
                      {a.schedule ? `${a.schedule.day} ${String(a.schedule.time_start).slice(0, 5)}` : '—'}
                    </td>
                    <td className="p-3.5 hidden sm:table-cell text-slate-600 font-medium">{a.staff?.name ?? '—'}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{a.date}</td>
                    <td className="p-3.5"><StatusPill status={a.status} /></td>
                    <td className="p-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openEdit(a)} className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition" title="Edit Record">
                          <SquarePen size={13} />
                        </button>
                        <button onClick={() => setDeleting(a)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition" title="Delete Record">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              {data.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-400 font-medium">No attendance records found</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination meta={meta} onPageChange={load} />

        {/* Modals */}
        {formOpen && (
            <Modal
                title={editing ? `Edit Record — ${editing.student?.name ?? `#${editing.student_id}`}` : 'Add Attendance Record'}
                icon={editing ? SquarePen : Plus}
                onClose={() => setFormOpen(false)}
                wide
            >
              <AttendanceForm
                  initial={{ ...EMPTY_FORM, ...editing }}
                  options={options}
                  onSave={handleSaved}
                  onClose={() => setFormOpen(false)}
              />
            </Modal>
        )}

        {deleting && (
            <Modal title="Confirm Delete" icon={Trash2} onClose={() => setDeleting(null)}>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete the attendance record for <b>{deleting.student?.name ?? `#${deleting.student_id}`}</b> on {deleting.date}?
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition shadow-xs">Delete Record</button>
              </div>
            </Modal>
        )}
      </div>
  );
}