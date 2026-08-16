import { useState, useEffect, useCallback } from 'react';
import { CalendarClock, SquarePen, Download, Trash2, LayoutGrid, List, Eye, X, AlertCircle, Plus } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEK_DAYS = DAYS.slice(0, 5);

const EMPTY_FORM = {
  day: 'Monday', time_start: '08:00', time_end: '10:00',
  subject_id: '', teacher_id: '', class_id: '', room: '', recurrence: 'weekly',
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

function ConflictBanner({ conflicts }) {
  if (!conflicts || conflicts.length === 0) return null;
  return (
      <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 space-y-1">
        <div className="flex items-center gap-2 font-bold text-rose-900">
          <AlertCircle size={15} className="shrink-0" />
          <span>{conflicts.length} schedule conflict{conflicts.length === 1 ? '' : 's'} detected</span>
        </div>
        <ul className="pl-6 space-y-0.5 list-disc text-rose-700">
          {conflicts.map((c, i) => <li key={i}>{c.message}</li>)}
        </ul>
      </div>
  );
}

function ScheduleForm({ initial, options, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [conflicts, setConflicts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    const valid = Boolean(form.day && form.time_start && form.time_end);
    const params = new URLSearchParams({ day: form.day, time_start: form.time_start, time_end: form.time_end });
    if (valid) {
      if (form.teacher_id) params.set('teacher_id', form.teacher_id);
      if (form.class_id) params.set('class_id', form.class_id);
      if (form.room) params.set('room', form.room);
      if (form.id) params.set('exclude_id', form.id);
    }
    const t = setTimeout(() => {
      if (!valid) {
        setConflicts([]);
        return;
      }
      apiFetch(`${API}/schedules/conflicts?${params.toString()}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => setConflicts(d?.conflicts ?? []))
          .catch(() => setConflicts([]));
    }, 400);
    return () => clearTimeout(t);
  }, [form.day, form.time_start, form.time_end, form.teacher_id, form.class_id, form.room, form.id]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/schedules${form.id ? `/${form.id}` : ''}`, {
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
        <ConflictBanner conflicts={conflicts} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Day" required>
            <select className={inputCls} value={form.day} onChange={set('day')}>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Recurrence">
            <select className={inputCls} value={form.recurrence} onChange={set('recurrence')}>
              {['weekly', 'biweekly', 'monthly', 'none'].map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Start Time" required>
            <input type="time" className={inputCls} value={form.time_start} onChange={set('time_start')} required />
          </Field>
          <Field label="End Time" required>
            <input type="time" className={inputCls} value={form.time_end} onChange={set('time_end')} required />
          </Field>
          <Field label="Course" required>
            <select className={inputCls} value={form.subject_id} onChange={set('subject_id')} required>
              <option value="">— Select Course —</option>
              {options.subjects.map((s) => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
            </select>
          </Field>
          <Field label="Teacher" required>
            <select className={inputCls} value={form.teacher_id} onChange={set('teacher_id')} required>
              <option value="">— Select Teacher —</option>
              {options.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Class" required>
            <select className={inputCls} value={form.class_id} onChange={set('class_id')} required>
              <option value="">— Select Class —</option>
              {options.classes.map((c) => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </Field>
          <Field label="Room">
            <input className={inputCls} value={form.room} onChange={set('room')} placeholder="e.g. Room 101" />
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
            {saving ? 'Saving...' : form.id ? 'Update Record' : 'Save Schedule'}
          </button>
        </div>
      </form>
  );
}

function ScheduleList({ data, onView, onEdit, onDelete }) {
  return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-slate-200 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-3.5 text-left">Day</th>
              <th className="p-3.5 text-left">Time</th>
              <th className="p-3.5 text-left hidden sm:table-cell">Course</th>
              <th className="p-3.5 text-left hidden md:table-cell">Teacher</th>
              <th className="p-3.5 text-left hidden lg:table-cell">Class</th>
              <th className="p-3.5 text-left">Room</th>
              <th className="p-3.5 text-left hidden sm:table-cell">Recurrence</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-semibold text-slate-900">{s.day}</td>
                  <td className="p-3.5 font-medium text-slate-900">
                    {s.time_start?.slice(0, 5)}–{s.time_end?.slice(0, 5)}
                  </td>
                  <td className="p-3.5 hidden sm:table-cell text-slate-800 font-medium">{s.subject?.subject_name ?? '—'}</td>
                  <td className="p-3.5 hidden md:table-cell text-slate-600">{s.teacher?.name ?? '—'}</td>
                  <td className="p-3.5 hidden lg:table-cell text-slate-600">{s.class?.class_name ?? '—'}</td>
                  <td className="p-3.5 font-medium">{s.room ?? '—'}</td>
                  <td className="p-3.5 hidden sm:table-cell capitalize text-slate-500">{s.recurrence}</td>
                  <td className="p-3.5">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => onView(s)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition" title="View Details">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => onEdit(s)} className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition" title="Edit Schedule">
                        <SquarePen size={13} />
                      </button>
                      <button onClick={() => onDelete(s)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition" title="Delete Schedule">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
            {data.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-400 font-medium">No schedules found</td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
  );
}

function WeeklyGrid({ data, onEdit, onDelete }) {
  const fmt = (t) => (t || '').slice(0, 5);
  return (
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {WEEK_DAYS.map((day) => {
          const items = data.filter((s) => s.day === day)
              .sort((a, b) => (a.time_start < b.time_start ? -1 : 1));
          return (
              <div key={day} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                <div className="bg-slate-900 text-slate-200 text-center py-2.5 text-xs font-bold uppercase tracking-wider">{day}</div>
                <div className="p-2.5 space-y-2.5 min-h-[140px] flex-1 bg-slate-50/30">
                  {items.length === 0 && <p className="text-xs text-slate-400 text-center py-8 font-medium">No sessions</p>}
                  {items.map((s) => (
                      <div key={s.id} className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-2.5 text-xs shadow-2xs hover:border-indigo-200 transition">
                        <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-indigo-900 bg-indigo-100/70 px-1.5 py-0.5 rounded-md text-[10px]">
                      {fmt(s.time_start)}–{fmt(s.time_end)}
                    </span>
                          <div className="flex gap-1">
                            <button onClick={() => onEdit(s)} className="p-1 text-indigo-600 hover:text-indigo-900" title="Edit"><SquarePen size={12} /></button>
                            <button onClick={() => onDelete(s)} className="p-1 text-rose-500 hover:text-rose-700" title="Delete"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <p className="font-bold text-slate-900 mt-1.5 truncate">{s.subject?.subject_name}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{s.teacher?.name}</p>
                        <p className="text-[10px] font-semibold text-indigo-700 mt-1">{s.class?.class_name}{s.room ? ` · ${s.room}` : ''}</p>
                      </div>
                  ))}
                </div>
              </div>
          );
        })}
      </div>
  );
}

function ScheduleDetail({ schedule, onEdit }) {
  const rows = [
    ['Day', schedule.day],
    ['Time', `${(schedule.time_start || '').slice(0, 5)} – ${(schedule.time_end || '').slice(0, 5)}`],
    ['Course', schedule.subject?.subject_name ?? '—'],
    ['Teacher', schedule.teacher?.name ?? '—'],
    ['Class', schedule.class?.class_name ?? '—'],
    ['Room', schedule.room ?? '—'],
    ['Recurrence', schedule.recurrence],
  ];

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CalendarClock size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{schedule.subject?.subject_name ?? 'Schedule Session'}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{schedule.day} · {schedule.time_start?.slice(0, 5)}–{schedule.time_end?.slice(0, 5)}</p>
          </div>
          <button
              onClick={() => onEdit(schedule)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition"
          >
            <SquarePen size={14} />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-white border border-slate-200/80 rounded-2xl p-4 text-xs">
          {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-slate-100 py-1.5">
                <span className="text-slate-500 font-medium">{label}</span>
                <span className="font-semibold text-slate-900 text-right capitalize">{value || '—'}</span>
              </div>
          ))}
        </div>
      </div>
  );
}

export default function Schedules() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState({ day: '', class_id: '', teacher_id: '', subject_id: '', room: '' });
  const [options, setOptions] = useState({ days: [], classes: [], teachers: [], subjects: [], rooms: [], recurrences: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = useCallback((page = 1) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', page);
    apiFetch(`${API}/schedules?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load schedules'))))
        .then((res) => { setData(res.data); setMeta({ ...res, data: undefined }); })
        .catch(() => {});
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    apiFetch(`${API}/schedules/filters`)
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
    apiFetch(`${API}/schedules/${s.id}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load schedule details'))))
        .then((d) => setViewing(d))
        .catch(() => flash('Failed to load schedule details', 'error'))
        .finally(() => setDetailLoading(false));
  };

  const handleSaved = (saved) => {
    setFormOpen(false);
    flash(`Schedule for "${saved.subject?.subject_name ?? 'Course'}" saved.`);
    load(meta?.current_page || 1);
  };

  const confirmDelete = async () => {
    await apiFetch(`${API}/schedules/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    flash('Schedule deleted.');
    load(1);
  };

  const exportTimetable = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await apiFetch(`${API}/schedules/export?${params.toString()}`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable.csv';
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
        {(key === 'class_id'
                ? (options.classes || []).map((c) => ({ id: c.id, name: c.class_name }))
                : key === 'teacher_id'
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
              <CalendarClock size={26} className="text-indigo-600" /> Timetable & Schedules
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage session times, room allocations, and weekly timetables</p>
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-xs">
              <button
                  onClick={() => setView('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <List size={14} /> List View
              </button>
              <button
                  onClick={() => setView('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${view === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <LayoutGrid size={14} /> Weekly Grid
              </button>
            </div>
            <button onClick={exportTimetable} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
              <Download size={15} /> Export
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition">
              <Plus size={15} /> Add Schedule
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
            {filterSelect('day', 'All Days')}
            {filterSelect('class_id', 'All Classes')}
            {filterSelect('teacher_id', 'All Teachers')}
            {filterSelect('subject_id', 'All Courses')}
            {filterSelect('room', 'All Rooms')}
          </div>
          {(filters.day || filters.class_id || filters.teacher_id || filters.subject_id || filters.room) && (
              <button
                  onClick={() => setFilters({ day: '', class_id: '', teacher_id: '', subject_id: '', room: '' })}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear active filters
              </button>
          )}
        </div>

        {/* Views */}
        {view === 'list' ? (
            <ScheduleList data={data} onView={openView} onEdit={openEdit} onDelete={setDeleting} />
        ) : (
            <WeeklyGrid data={data} onEdit={openEdit} onDelete={setDeleting} />
        )}
        <Pagination meta={meta} onPageChange={load} />

        {/* Modals */}
        {formOpen && (
            <Modal
                title={editing ? `Edit Session — ${editing.subject?.subject_name ?? ''}` : 'Add New Schedule Session'}
                icon={editing ? SquarePen : Plus}
                onClose={() => setFormOpen(false)}
                wide
            >
              <ScheduleForm
                  initial={{
                    ...EMPTY_FORM,
                    ...editing,
                    time_start: editing?.time_start?.slice(0, 5) ?? EMPTY_FORM.time_start,
                    time_end: editing?.time_end?.slice(0, 5) ?? EMPTY_FORM.time_end,
                  }}
                  options={options}
                  onSave={handleSaved}
                  onClose={() => setFormOpen(false)}
              />
            </Modal>
        )}

        {viewing && (
            <Modal title="Schedule Session Overview" icon={CalendarClock} onClose={() => setViewing(null)}>
              <ScheduleDetail schedule={viewing} onEdit={(s) => { setViewing(null); openEdit(s); }} />
            </Modal>
        )}

        {detailLoading && (
            <Modal title="Schedule Details" icon={CalendarClock} onClose={() => setDetailLoading(false)}>
              <div className="py-12 text-center text-slate-400 font-medium">Loading session details...</div>
            </Modal>
        )}

        {deleting && (
            <Modal title="Confirm Delete" icon={Trash2} onClose={() => setDeleting(null)}>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete the schedule for{' '}
                <b>{deleting.subject?.subject_name}</b> ({deleting.day}, {deleting.time_start?.slice(0, 5)}–{deleting.time_end?.slice(0, 5)})?
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition shadow-xs">Delete Schedule</button>
              </div>
            </Modal>
        )}
      </div>
  );
}