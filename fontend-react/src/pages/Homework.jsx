import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, SquarePen, Trash2, Search, Check, FileText } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function HomeworkForm({ initial, options, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const body = { ...form, total_marks: +form.total_marks || 0 };
      const res = await apiFetch(`${API}/homework`, { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Save failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <Field label="Title" required><input className={inputCls} value={form.title || ''} onChange={set('title')} required /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Subject" required>
          <select className={inputCls} value={form.subject_id || ''} onChange={set('subject_id')} required>
            <option value="">Select...</option>
            {(options.subjects || []).map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
          </select>
        </Field>
        <Field label="Class" required>
          <select className={inputCls} value={form.class_id || ''} onChange={set('class_id')} required>
            <option value="">Select...</option>
            {(options.classes || []).map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Due Date" required><input type="date" className={inputCls} value={form.due_date || ''} onChange={set('due_date')} required /></Field>
        <Field label="Total Marks"><input type="number" className={inputCls} value={form.total_marks || ''} onChange={set('total_marks')} min="0" /></Field>
        <Field label="Status">
          <select className={inputCls} value={form.status || 'active'} onChange={set('status')}>
            <option value="draft">Draft</option><option value="active">Active</option><option value="closed">Closed</option>
          </select>
        </Field>
      </div>
      <Field label="Description" required><textarea className={inputCls} rows={3} value={form.description || ''} onChange={set('description')} required /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function Homework() {
  const [tab, setTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState({ subjects: [], classes: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    const res = await apiFetch(`${API}/homework?${p}`);
    if (res.ok) { const d = await res.json(); setAssignments(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search]);

  const loadOptions = useCallback(async () => {
    const [s, c] = await Promise.all([apiFetch(`${API}/subjects`), apiFetch(`${API}/classes`)]);
    if (s.ok) { const d = await s.json(); setOptions(o => ({ ...o, subjects: d.data || d })); }
    if (c.ok) { const d = await c.json(); setOptions(o => ({ ...o, classes: d.data || d })); }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const handleSaved = () => { setFormOpen(false); setMsg({ type: 'success', text: 'Saved' }); load(); setTimeout(() => setMsg(null), 3000); };
  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await apiFetch(`${API}/homework/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) { setDeleting(null); setMsg({ type: 'success', text: 'Deleted' }); load(); setTimeout(() => setMsg(null), 3000); }
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Homework</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Assign and track homework</p></div>
        <div className="flex gap-2">
          <button onClick={() => { setTab('assignments'); setPage(1); }} className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${tab === 'assignments' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>Assignments</button>
        </div>
      </div>
      {msg && <div className={`text-xs p-3 rounded-xl border ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{msg.text}</div>}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder="Search homework..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> New Assignment</button>

      <div className="space-y-3">
        {assignments.map(a => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 text-sm">{a.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${a.status === 'active' ? 'bg-emerald-50 text-emerald-700' : a.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-700'}`}>{a.status}</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Subject: <strong>{a.subject?.subject_name || '—'}</strong> • Class: <strong>{a.school_class?.class_name || '—'}</strong> • Due: <strong className="text-indigo-600">{a.due_date}</strong></p>
                {a.description && <p className="text-xs text-slate-600 line-clamp-2">{a.description}</p>}
                {a.total_marks > 0 && <p className="text-[10px] text-slate-500 mt-1">Total Marks: {a.total_marks}</p>}
                {a.submissions?.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                    <Check size={12} className="text-emerald-500" />
                    {a.submissions.length} submission(s)
                  </div>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setViewing(a)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"><FileText size={14} /></button>
                <button onClick={() => setDeleting(a)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {assignments.length === 0 && <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-12 text-center text-slate-400 text-sm shadow-xs">No assignments found</div>}
      </div>

      <Pagination meta={meta} onPageChange={setPage} />

      {formOpen && <Modal title="New Homework" onClose={() => setFormOpen(false)} icon={ClipboardList}><HomeworkForm initial={{}} options={options} onSave={handleSaved} onClose={() => setFormOpen(false)} /></Modal>}
      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)} icon={FileText} wide>
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">Subject:</span> <span className="font-semibold">{viewing.subject?.subject_name}</span></div>
              <div><span className="text-slate-500">Class:</span> <span className="font-semibold">{viewing.school_class?.class_name}</span></div>
              <div><span className="text-slate-500">Due Date:</span> <span className="font-semibold text-indigo-600">{viewing.due_date}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className="font-semibold capitalize">{viewing.status}</span></div>
            </div>
            <div><span className="text-slate-500">Description:</span><p className="mt-1 text-slate-700 bg-slate-50 rounded-xl p-3 whitespace-pre-wrap">{viewing.description}</p></div>
            {viewing.submissions?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">Submissions ({viewing.submissions.length})</h4>
                <div className="bg-slate-50 rounded-xl p-3 max-h-60 overflow-y-auto">
                  <table className="w-full text-xs"><thead><tr className="text-slate-500"><th className="text-left py-1">Student</th><th className="text-left py-1">Submitted</th><th className="text-left py-1">Marks</th><th className="text-left py-1">Status</th></tr></thead>
                    <tbody>{viewing.submissions.map(s => <tr key={s.id} className="border-t border-slate-200"><td className="py-1">{s.student?.name || s.student_id}</td><td className="py-1">{s.submission_date || '—'}</td><td className="py-1 font-semibold">{s.marks_obtained ?? '—'}</td><td className="py-1 capitalize">{s.status}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      {deleting && <Modal title="Delete Assignment" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Delete <strong>{deleting.title}</strong>?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}
