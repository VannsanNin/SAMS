import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, SquarePen, Trash2, Eye, Search } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';
const TYPES = ['quiz', 'midterm', 'final', 'monthly', 'practical', 'oral'];
const STATUSES = ['draft', 'scheduled', 'ongoing', 'completed', 'cancelled'];
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';
const pillCls = { draft: 'bg-slate-100 text-slate-600', scheduled: 'bg-blue-50 text-blue-700', ongoing: 'bg-amber-50 text-amber-700', completed: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-rose-50 text-rose-700' };

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function ExamForm({ initial, options, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/exams${form.id ? `/${form.id}` : ''}`, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Save failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Exam Name" required><input className={inputCls} value={form.name || ''} onChange={set('name')} required /></Field>
        <Field label="Type" required>
          <select className={inputCls} value={form.type || 'quiz'} onChange={set('type')}>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </Field>
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
        <Field label="Date" required><input type="date" className={inputCls} value={form.date || ''} onChange={set('date')} required /></Field>
        <Field label="Total Marks" required><input type="number" className={inputCls} value={form.total_marks || 100} onChange={set('total_marks')} min="1" /></Field>
        <Field label="Passing Marks" required><input type="number" className={inputCls} value={form.passing_marks || 50} onChange={set('passing_marks')} min="0" /></Field>
        <Field label="Room"><input className={inputCls} value={form.room || ''} onChange={set('room')} /></Field>
        <Field label="Time Start"><input type="time" className={inputCls} value={form.time_start || ''} onChange={set('time_start')} /></Field>
        <Field label="Time End"><input type="time" className={inputCls} value={form.time_end || ''} onChange={set('time_end')} /></Field>
        <Field label="Academic Year"><input className={inputCls} value={form.academic_year || '2025-2026'} onChange={set('academic_year')} /></Field>
        <Field label="Semester"><input className={inputCls} value={form.semester || ''} onChange={set('semester')} /></Field>
      </div>
      <Field label="Description"><textarea className={inputCls} rows={2} value={form.description || ''} onChange={set('description')} /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

function ExamDetail({ item, onClose }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-4">
        <div><span className="text-slate-500">Name:</span> <span className="font-semibold">{item.name}</span></div>
        <div><span className="text-slate-500">Type:</span> <span className="font-semibold capitalize">{item.type}</span></div>
        <div><span className="text-slate-500">Subject:</span> <span className="font-semibold">{item.subject?.subject_name}</span></div>
        <div><span className="text-slate-500">Class:</span> <span className="font-semibold">{item.school_class?.class_name}</span></div>
        <div><span className="text-slate-500">Date:</span> <span className="font-semibold">{item.date}</span></div>
        <div><span className="text-slate-500">Marks:</span> <span className="font-semibold">{item.total_marks} (Pass: {item.passing_marks})</span></div>
        <div><span className="text-slate-500">Status:</span> <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${pillCls[item.status] || ''}`}>{item.status}</span></div>
        {item.room && <div><span className="text-slate-500">Room:</span> <span className="font-semibold">{item.room}</span></div>}
      </div>
      {item.marks?.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-700 mb-2">Marks ({item.marks.length} students)</h4>
          <div className="bg-slate-50 rounded-xl p-3 max-h-60 overflow-y-auto">
            <table className="w-full text-xs"><thead><tr className="text-slate-500"><th className="text-left py-1">Student</th><th className="text-left py-1">Marks</th><th className="text-left py-1">Status</th></tr></thead>
              <tbody>{item.marks.map(m => <tr key={m.id} className="border-t border-slate-200"><td className="py-1">{m.student?.name}</td><td className="py-1 font-semibold">{m.marks_obtained ?? '—'}</td><td className="py-1">{m.is_absent ? 'Absent' : (m.marks_obtained >= item.passing_marks ? 'Pass' : 'Fail')}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Exams() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [options, setOptions] = useState({ subjects: [], classes: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    if (typeFilter) p.set('type', typeFilter);
    if (statusFilter) p.set('status', statusFilter);
    const res = await apiFetch(`${API}/exams?${p}`);
    if (res.ok) { const d = await res.json(); setData(d.data); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search, typeFilter, statusFilter]);

  const loadOptions = useCallback(async () => {
    const [s, c] = await Promise.all([apiFetch(`${API}/subjects`), apiFetch(`${API}/classes`)]);
    if (s.ok) { const d = await s.json(); setOptions(o => ({ ...o, subjects: d.data || d })); }
    if (c.ok) { const d = await c.json(); setOptions(o => ({ ...o, classes: d.data || d })); }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const handleSaved = () => { setFormOpen(false); setEditing(null); setMsg({ type: 'success', text: 'Saved successfully' }); load(); setTimeout(() => setMsg(null), 3000); };
  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await apiFetch(`${API}/exams/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) { setDeleting(null); setMsg({ type: 'success', text: 'Deleted' }); load(); setTimeout(() => setMsg(null), 3000); }
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Examinations</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Manage exams, quizzes, and assessments</p></div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> New Exam</button>
      </div>
      {msg && <div className={`text-xs p-3 rounded-xl border ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{msg.text}</div>}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={`${inputCls} pl-9`} placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className={inputCls + ' w-auto'} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select className={inputCls + ' w-auto'} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-slate-200 grid grid-cols-7 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"><div className="col-span-2">Exam</div><div>Subject</div><div>Class</div><div>Date</div><div>Marks</div><div className="text-right">Actions</div></div>
        <div className="divide-y divide-slate-100 text-slate-700">
          {data.map(item => (
            <div key={item.id} className="grid grid-cols-7 gap-4 px-4 py-3.5 text-xs hover:bg-slate-50/80 transition items-center">
              <div className="col-span-2"><p className="font-semibold">{item.name}</p><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${pillCls[item.status] || ''}`}>{item.type}</span></div>
              <div>{item.subject?.subject_name || '—'}</div>
              <div>{item.school_class?.class_name || '—'}</div>
              <div>{item.date}</div>
              <div className="font-semibold">{item.total_marks}</div>
              <div className="flex justify-end gap-1.5">
                <button onClick={() => setViewing(item)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"><Eye size={14} /></button>
                <button onClick={() => { setEditing(item); setFormOpen(true); }} className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition"><SquarePen size={14} /></button>
                <button onClick={() => setDeleting(item)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {data.length === 0 && <div className="px-4 py-12 text-center text-slate-400 text-sm">No exams found</div>}
        </div>
      </div>
      <Pagination meta={meta} onPageChange={setPage} />
      {formOpen && <Modal title={editing ? 'Edit Exam' : 'New Exam'} onClose={() => { setFormOpen(false); setEditing(null); }} icon={FileText}><ExamForm initial={editing || {}} options={options} onSave={handleSaved} onClose={() => { setFormOpen(false); setEditing(null); }} /></Modal>}
      {viewing && <Modal title="Exam Details" onClose={() => setViewing(null)} icon={Eye} wide><ExamDetail item={viewing} onClose={() => setViewing(null)} /></Modal>}
      {deleting && <Modal title="Delete Exam" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Are you sure you want to delete <strong>{deleting.name}</strong>?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-50">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}
