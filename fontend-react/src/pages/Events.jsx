import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Plus, Trash2, Search } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';
const pillCls = { upcoming: 'bg-blue-50 text-blue-700', ongoing: 'bg-emerald-50 text-emerald-700', completed: 'bg-slate-100 text-slate-600', cancelled: 'bg-rose-50 text-rose-700' };

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function EventForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await apiFetch(`${API}/events`, { method: 'POST', body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <Field label="Title" required><input className={inputCls} value={form.title || ''} onChange={set('title')} required /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Event Type">
          <select className={inputCls} value={form.event_type || 'other'} onChange={set('event_type')}>
            {['academic', 'cultural', 'sports', 'ceremony', 'meeting', 'workshop', 'holiday', 'other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={form.status || 'upcoming'} onChange={set('status')}>
            <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <Field label="Start Date" required><input type="date" className={inputCls} value={form.start_date || ''} onChange={set('start_date')} required /></Field>
        <Field label="End Date"><input type="date" className={inputCls} value={form.end_date || ''} onChange={set('end_date')} /></Field>
        <Field label="Time"><input type="time" className={inputCls} value={form.time || ''} onChange={set('time')} /></Field>
        <Field label="Location"><input className={inputCls} value={form.location || ''} onChange={set('location')} /></Field>
        <Field label="Max Participants"><input type="number" className={inputCls} value={form.max_participants || ''} onChange={set('max_participants')} min="0" /></Field>
        <Field label="Class"><input className={inputCls} value={form.class_id || ''} onChange={set('class_id')} placeholder="Leave empty for all" /></Field>
      </div>
      <Field label="Description"><textarea className={inputCls} rows={3} value={form.description || ''} onChange={set('description')} /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    if (typeFilter) p.set('event_type', typeFilter);
    const res = await apiFetch(`${API}/events?${p}`);
    if (res.ok) { const d = await res.json(); setEvents(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search, typeFilter]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const handleSaved = () => { setFormOpen(false); setEditing(null); setMsg({ type: 'success', text: 'Saved' }); load(); setTimeout(() => setMsg(null), 3000); };
  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await apiFetch(`${API}/events/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) { setDeleting(null); setMsg({ type: 'success', text: 'Deleted' }); load(); setTimeout(() => setMsg(null), 3000); }
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Events</h1><p className="text-xs text-slate-500 font-medium mt-0.5">School events, activities, and ceremonies</p></div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> New Event</button>
      </div>
      {msg && <div className="text-xs p-3 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">{msg.text}</div>}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className={inputCls + ' w-auto'} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {['academic', 'cultural', 'sports', 'ceremony', 'meeting', 'workshop', 'holiday', 'other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(e => (
          <div key={e.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-slate-900 text-sm leading-tight">{e.title}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize shrink-0 ${pillCls[e.status] || ''}`}>{e.status}</span>
            </div>
            <div className="text-[10px] text-slate-500 space-y-1 mb-3">
              <p>📅 {e.start_date}{e.end_date && e.end_date !== e.start_date ? ` to ${e.end_date}` : ''}</p>
              {e.time && <p>🕐 {e.time}</p>}
              {e.location && <p>📍 {e.location}</p>}
              <span className="bg-slate-100 px-2 py-0.5 rounded-full capitalize">{e.event_type}</span>
            </div>
            {e.description && <p className="text-xs text-slate-600 line-clamp-2 mb-3">{e.description}</p>}
            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <button onClick={() => { setEditing(e); setFormOpen(true); }} className="flex-1 text-center p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold transition">Edit</button>
              <button onClick={() => setDeleting(e)} className="flex-1 text-center p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Pagination meta={meta} onPageChange={setPage} />

      {formOpen && <Modal title={editing ? 'Edit Event' : 'New Event'} onClose={() => { setFormOpen(false); setEditing(null); }} icon={CalendarDays} wide><EventForm initial={editing || {}} onSave={handleSaved} onClose={() => { setFormOpen(false); setEditing(null); }} /></Modal>}
      {deleting && <Modal title="Delete Event" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Delete <strong>{deleting.title}</strong>?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}
