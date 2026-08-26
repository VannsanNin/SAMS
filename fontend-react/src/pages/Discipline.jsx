import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Plus, SquarePen, Trash2, Search, Eye } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';
const pillCls = { minor: 'bg-amber-50 text-amber-700', major: 'bg-rose-50 text-rose-700', critical: 'bg-red-100 text-red-800', pending: 'bg-blue-50 text-blue-700', resolved: 'bg-emerald-50 text-emerald-700', warning: 'bg-amber-50 text-amber-700', suspension: 'bg-rose-50 text-rose-700', expulsion: 'bg-red-100 text-red-800', counseling: 'bg-blue-50 text-blue-700' };

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function DisciplineForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { apiFetch(`${API}/students`).then(r => r.ok && r.json()).then(d => setStudents(d?.data || d || [])); }, []);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await apiFetch(`${API}/discipline`, { method: 'POST', body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <Field label="Student" required>
        <select className={inputCls} value={form.student_id || ''} onChange={set('student_id')} required>
          <option value="">Select student...</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_code || s.email})</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" required>
          <select className={inputCls} value={form.category || 'behavior'} onChange={set('category')}>
            {['behavior', 'academic', 'attendance', 'uniform', 'substance', 'bullying', 'theft', 'vandalism', 'other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Severity" required>
          <select className={inputCls} value={form.severity || 'minor'} onChange={set('severity')}>
            <option value="minor">Minor</option><option value="major">Major</option><option value="critical">Critical</option>
          </select>
        </Field>
        <Field label="Incident Date" required><input type="date" className={inputCls} value={form.incident_date || new Date().toISOString().slice(0, 10)} onChange={set('incident_date')} required /></Field>
        <Field label="Action Taken">
          <select className={inputCls} value={form.action_taken || 'warning'} onChange={set('action_taken')}>
            {['warning', 'counseling', 'detention', 'suspension', 'expulsion', 'community_service', 'parent_meeting', 'other'].map(a => <option key={a} value={a}>{a.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Description" required><textarea className={inputCls} rows={3} value={form.description || ''} onChange={set('description')} required placeholder="Describe the incident..." /></Field>
      <Field label="Action Details"><textarea className={inputCls} rows={2} value={form.action_details || ''} onChange={set('action_details')} placeholder="Details of action taken..." /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function Discipline() {
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    if (severityFilter) p.set('severity', severityFilter);
    const res = await apiFetch(`${API}/discipline?${p}`);
    if (res.ok) { const d = await res.json(); setRecords(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search, severityFilter]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const handleSaved = () => { setFormOpen(false); setEditing(null); setMsg({ type: 'success', text: 'Saved' }); load(); setTimeout(() => setMsg(null), 3000); };
  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await apiFetch(`${API}/discipline/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) { setDeleting(null); setMsg({ type: 'success', text: 'Deleted' }); load(); setTimeout(() => setMsg(null), 3000); }
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discipline Records</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Track student behavior and disciplinary actions</p></div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> New Record</button>
      </div>
      {msg && <div className="text-xs p-3 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">{msg.text}</div>}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className={inputCls + ' w-auto'} value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}>
            <option value="">All Severity</option>
            <option value="minor">Minor</option><option value="major">Major</option><option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-slate-200 grid grid-cols-7 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"><div className="col-span-2">Student</div><div>Category</div><div>Severity</div><div>Date</div><div>Action</div><div className="text-right">Actions</div></div>
        <div className="divide-y divide-slate-100 text-slate-700">
          {records.map(r => (
            <div key={r.id} className="grid grid-cols-7 gap-4 px-4 py-3.5 text-xs hover:bg-slate-50/80 transition items-center">
              <div className="col-span-2"><p className="font-semibold">{r.student?.name || '—'}</p><p className="text-slate-500 text-[10px] line-clamp-1">{r.description}</p></div>
              <div className="capitalize">{r.category}</div>
              <div><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${pillCls[r.severity] || ''}`}>{r.severity}</span></div>
              <div>{r.incident_date}</div>
              <div className="capitalize text-[10px]">{r.action_taken?.replace('_', ' ')}</div>
              <div className="flex justify-end gap-1.5">
                <button onClick={() => setViewing(r)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"><Eye size={14} /></button>
                <button onClick={() => { setEditing(r); setFormOpen(true); }} className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition"><SquarePen size={14} /></button>
                <button onClick={() => setDeleting(r)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {records.length === 0 && <div className="px-4 py-12 text-center text-slate-400 text-sm">No discipline records</div>}
        </div>
      </div>
      <Pagination meta={meta} onPageChange={setPage} />

      {formOpen && <Modal title={editing ? 'Edit Record' : 'New Discipline Record'} onClose={() => { setFormOpen(false); setEditing(null); }} icon={ShieldAlert} wide><DisciplineForm initial={editing || {}} onSave={handleSaved} onClose={() => { setFormOpen(false); setEditing(null); }} /></Modal>}
      {viewing && <Modal title="Discipline Record" onClose={() => setViewing(null)} icon={Eye}>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-slate-500">Student:</span> <span className="font-semibold">{viewing.student?.name}</span></div>
            <div><span className="text-slate-500">Category:</span> <span className="font-semibold capitalize">{viewing.category}</span></div>
            <div><span className="text-slate-500">Severity:</span> <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${pillCls[viewing.severity] || ''}`}>{viewing.severity}</span></div>
            <div><span className="text-slate-500">Date:</span> <span className="font-semibold">{viewing.incident_date}</span></div>
            <div><span className="text-slate-500">Action:</span> <span className="font-semibold capitalize">{viewing.action_taken?.replace('_', ' ')}</span></div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3"><p className="text-slate-500 mb-1">Description:</p><p className="text-slate-700">{viewing.description}</p></div>
          {viewing.action_details && <div className="bg-slate-50 rounded-xl p-3"><p className="text-slate-500 mb-1">Action Details:</p><p className="text-slate-700">{viewing.action_details}</p></div>}
        </div>
      </Modal>}
      {deleting && <Modal title="Delete Record" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Delete this discipline record?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}
