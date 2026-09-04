import { useState, useEffect, useCallback } from 'react';
import { Award, Plus, Trash2, Search, Trophy } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function AwardForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await apiFetch(`${API}/awards`, { method: 'POST', body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <Field label="Award Name" required><input className={inputCls} value={form.name || ''} onChange={set('name')} required /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Category">
          <select className={inputCls} value={form.category || 'academic'} onChange={set('category')}>
            {['academic', 'sports', 'cultural', 'leadership', 'community', 'attendance', 'other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Level">
          <select className={inputCls} value={form.level || 'school'} onChange={set('level')}>
            <option value="class">Class</option><option value="school">School</option><option value="district">District</option><option value="national">National</option>
          </select>
        </Field>
        <Field label="Academic Year"><input className={inputCls} value={form.academic_year || '2025-2026'} onChange={set('academic_year')} /></Field>
        <Field label="Semester"><input className={inputCls} value={form.semester || ''} onChange={set('semester')} /></Field>
      </div>
      <Field label="Description"><textarea className={inputCls} rows={2} value={form.description || ''} onChange={set('description')} /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

function RecipientForm({ awardId, onSave, onClose }) {
  const [form, setForm] = useState({ student_id: '', reason: '', date_awarded: new Date().toISOString().slice(0, 10) });
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { apiFetch(`${API}/students`).then(r => r.ok && r.json()).then(d => setStudents(d?.data || d || [])); }, []);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch(`${API}/awards/${awardId}/recipients`, { method: 'POST', body: JSON.stringify(form) });
      onSave();
    } catch { setSaving(false); return; } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Student" required>
        <select className={inputCls} value={form.student_id} onChange={set('student_id')} required>
          <option value="">Select student...</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <Field label="Date Awarded"><input type="date" className={inputCls} value={form.date_awarded} onChange={set('date_awarded')} /></Field>
      <Field label="Reason"><textarea className={inputCls} rows={2} value={form.reason} onChange={set('reason')} /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Awarding...' : 'Award'}</button>
      </div>
    </form>
  );
}

export default function Awards() {
  const [awards, setAwards] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    const res = await apiFetch(`${API}/awards?${p}`);
    if (res.ok) { const d = await res.json(); setAwards(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const handleSaved = () => { setFormOpen(false); setRecipientOpen(null); setMsg({ type: 'success', text: 'Saved' }); load(); setTimeout(() => setMsg(null), 3000); };
  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await apiFetch(`${API}/awards/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) { setDeleting(null); setMsg({ type: 'success', text: 'Deleted' }); load(); setTimeout(() => setMsg(null), 3000); }
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Awards & Achievements</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Recognize student achievements</p></div>
        <button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> New Award</button>
      </div>
      {msg && <div className="text-xs p-3 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">{msg.text}</div>}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder="Search awards..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {awards.map(a => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">{a.name}</h3>
              </div>
            </div>
            <div className="flex gap-2 text-[10px] mb-2 flex-wrap">
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">{a.category}</span>
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full capitalize">{a.level}</span>
            </div>
            {a.description && <p className="text-xs text-slate-600 line-clamp-2 mb-2">{a.description}</p>}
            {a.recipients?.length > 0 && (
              <p className="text-[10px] text-slate-500 mb-3">
                <Award size={10} className="inline mr-1" />{a.recipients.length} recipient(s)
              </p>
            )}
            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <button onClick={() => setRecipientOpen(a)} className="flex-1 text-center p-2 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold transition">+ Recipient</button>
              <button onClick={() => { setFormOpen(true); }} className="flex-1 text-center p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold transition">Edit</button>
              <button onClick={() => setDeleting(a)} className="flex-1 text-center p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Pagination meta={meta} onPageChange={setPage} />

      {formOpen && <Modal title="New Award" onClose={() => setFormOpen(false)} icon={Award}><AwardForm initial={{}} onSave={handleSaved} onClose={() => setFormOpen(false)} /></Modal>}
      {recipientOpen && <Modal title={`Award: ${recipientOpen.name}`} onClose={() => setRecipientOpen(null)} icon={Award}><RecipientForm awardId={recipientOpen.id} onSave={handleSaved} onClose={() => setRecipientOpen(null)} /></Modal>}
      {deleting && <Modal title="Delete Award" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Delete <strong>{deleting.name}</strong>?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}
