import { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Plus, Trash2, Search, Download, Eye, FileText } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';
const catCls = { transcript: 'bg-blue-50 text-blue-700', certificate: 'bg-emerald-50 text-emerald-700', id_card: 'bg-indigo-50 text-indigo-700', report_card: 'bg-amber-50 text-amber-700', admission: 'bg-purple-50 text-purple-700', medical: 'bg-rose-50 text-rose-700', photo: 'bg-slate-100 text-slate-600', other: 'bg-slate-100 text-slate-600' };

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function DocumentForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (!file) throw new Error('Please select a file.');
      const body = new FormData();
      body.append('name', form.title || 'Document');
      body.append('type', form.category || 'other');
      if (form.related_type && form.related_id) {
        body.append('documentable_type', form.related_type);
        body.append('documentable_id', form.related_id);
      }
      body.append('file', file);
      const res = await apiFetch(`${API}/documents`, { method: 'POST', body });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <Field label="Document Title" required><input className={inputCls} value={form.title || ''} onChange={set('title')} required /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" required>
          <select className={inputCls} value={form.category || 'other'} onChange={set('category')}>
            {['transcript', 'certificate', 'id_card', 'report_card', 'admission', 'medical', 'photo', 'other'].map(c => <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </Field>
        <Field label="Related Type">
          <select className={inputCls} value={form.related_type || ''} onChange={set('related_type')}>
            <option value="">None</option><option value="student">Student</option><option value="teacher">Teacher</option><option value="staff">Staff</option>
          </select>
        </Field>
        <Field label="Related ID"><input className={inputCls} value={form.related_id || ''} onChange={set('related_id')} placeholder="ID of related entity" /></Field>
        <Field label="Visibility">
          <select className={inputCls} value={form.visibility || 'admin'} onChange={set('visibility')}>
            <option value="admin">Admin Only</option><option value="staff">Staff</option><option value="owner">Owner Only</option><option value="public">Public</option>
          </select>
        </Field>
      </div>
      <Field label="File" required><input className={inputCls} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={e => setFile(e.target.files?.[0] || null)} required /></Field>
      <Field label="Description"><textarea className={inputCls} rows={2} value={form.description || ''} onChange={set('description')} /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    if (catFilter) p.set('category', catFilter);
    const res = await apiFetch(`${API}/documents?${p}`);
    if (res.ok) { const d = await res.json(); setDocs(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search, catFilter]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const handleSaved = () => { setFormOpen(false); setMsg({ type: 'success', text: 'Saved' }); load(); setTimeout(() => setMsg(null), 3000); };
  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await apiFetch(`${API}/documents/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) { setDeleting(null); setMsg({ type: 'success', text: 'Deleted' }); load(); setTimeout(() => setMsg(null), 3000); }
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Documents</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Manage school and student documents</p></div>
        <button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> Upload Document</button>
      </div>
      {msg && <div className="text-xs p-3 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">{msg.text}</div>}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className={inputCls + ' w-auto'} value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {['transcript', 'certificate', 'id_card', 'report_card', 'admission', 'medical', 'photo', 'other'].map(c => <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-slate-200 grid grid-cols-6 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"><div className="col-span-2">Document</div><div>Category</div><div>Visibility</div><div>Created</div><div className="text-right">Actions</div></div>
        <div className="divide-y divide-slate-100 text-slate-700">
          {docs.map(d => (
            <div key={d.id} className="grid grid-cols-6 gap-4 px-4 py-3.5 text-xs hover:bg-slate-50/80 transition items-center">
              <div className="col-span-2 flex items-center gap-2">
                <FileText size={16} className="text-indigo-500 shrink-0" />
                <div><p className="font-semibold">{d.title}</p>{d.description && <p className="text-slate-500 text-[10px] line-clamp-1">{d.description}</p>}</div>
              </div>
              <div><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${catCls[d.category] || ''}`}>{d.category?.replace('_', ' ')}</span></div>
              <div className="capitalize text-[10px]">{d.visibility}</div>
              <div>{d.created_at?.slice(0, 10)}</div>
              <div className="flex justify-end gap-1.5">
                {d.file_url && <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 transition"><Download size={14} /></a>}
                <button onClick={() => setViewing(d)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"><Eye size={14} /></button>
                <button onClick={() => setDeleting(d)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {docs.length === 0 && <div className="px-4 py-12 text-center text-slate-400 text-sm">No documents found</div>}
        </div>
      </div>
      <Pagination meta={meta} onPageChange={setPage} />

      {formOpen && <Modal title="Upload Document" onClose={() => setFormOpen(false)} icon={FolderOpen} wide><DocumentForm initial={{}} onSave={handleSaved} onClose={() => setFormOpen(false)} /></Modal>}
      {viewing && <Modal title="Document Details" onClose={() => setViewing(null)} icon={Eye}>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-slate-500">Title:</span> <span className="font-semibold">{viewing.title}</span></div>
            <div><span className="text-slate-500">Category:</span> <span className="font-semibold capitalize">{viewing.category?.replace('_', ' ')}</span></div>
            <div><span className="text-slate-500">Visibility:</span> <span className="font-semibold capitalize">{viewing.visibility}</span></div>
            <div><span className="text-slate-500">Created:</span> <span className="font-semibold">{viewing.created_at?.slice(0, 10)}</span></div>
          </div>
          {viewing.description && <div className="bg-slate-50 rounded-xl p-3">{viewing.description}</div>}
          {viewing.file_url && <div><a href={viewing.file_url} target="_blank" className="text-indigo-600 hover:underline flex items-center gap-1"><Download size={12} /> Download File</a></div>}
        </div>
      </Modal>}
      {deleting && <Modal title="Delete Document" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Delete <strong>{deleting.title}</strong>?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}
