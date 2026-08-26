import { useState, useEffect, useCallback } from 'react';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function SettingForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await apiFetch(`${API}/settings`, { method: 'POST', body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <Field label="Setting Key" required><input className={inputCls} value={form.key || ''} onChange={set('key')} required placeholder="school_name" /></Field>
      <Field label="Value" required><input className={inputCls} value={form.value || ''} onChange={set('value')} required /></Field>
      <Field label="Group"><input className={inputCls} value={form.group || ''} onChange={set('group')} placeholder="general" /></Field>
      <Field label="Description"><textarea className={inputCls} rows={2} value={form.description || ''} onChange={set('description')} /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [groupFilter, setGroupFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (groupFilter) p.set('group', groupFilter);
    const res = await apiFetch(`${API}/settings?${p}`);
    if (res.ok) { const d = await res.json(); setSettings(d.data || d || []); }
  }, [groupFilter]);

  useEffect(() => { load(); }, [load]);

  const groups = [...new Set(settings.map(s => s.group || 'general'))].sort();

  const handleSaved = () => { setFormOpen(false); setMsg({ type: 'success', text: 'Saved' }); load(); setTimeout(() => setMsg(null), 3000); };
  const confirmDelete = async () => {
    if (!deleting) return;
    await apiFetch(`${API}/settings/${deleting.id || deleting.key}`, { method: 'DELETE' });
    setDeleting(null); setMsg({ text: 'Deleted' }); load(); setTimeout(() => setMsg(null), 3000);
  };

  const grouped = {};
  settings.forEach(s => { const g = s.group || 'general'; if (!grouped[g]) grouped[g] = []; grouped[g].push(s); });

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Configure school and system settings</p></div>
        <button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> New Setting</button>
      </div>
      {msg && <div className="text-xs p-3 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">{msg.text}</div>}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setGroupFilter('')} className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${!groupFilter ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
          {groups.map(g => <button key={g} onClick={() => setGroupFilter(g)} className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize transition ${groupFilter === g ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{g}</button>)}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <h3 className="text-sm font-bold text-slate-700 capitalize mb-2 flex items-center gap-2"><Settings size={14} className="text-indigo-500" /> {group}</h3>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-slate-200 grid grid-cols-4 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"><div>Key</div><div>Value</div><div>Description</div><div className="text-right">Actions</div></div>
              <div className="divide-y divide-slate-100 text-slate-700">
                {items.map(s => (
                  <div key={s.id || s.key} className="grid grid-cols-4 gap-4 px-4 py-3 text-xs hover:bg-slate-50/80 transition items-center">
                    <div className="font-mono font-semibold text-indigo-700">{s.key}</div>
                    <div className="font-semibold truncate max-w-xs">{s.value}</div>
                    <div className="text-slate-500 truncate">{s.description || '—'}</div>
                    <div className="flex justify-end"><button onClick={() => setDeleting(s)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition"><Trash2 size={14} /></button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {settings.length === 0 && <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-12 text-center text-slate-400 text-sm shadow-xs">No settings configured</div>}
      </div>

      {formOpen && <Modal title="New Setting" onClose={() => setFormOpen(false)} icon={Settings}><SettingForm initial={{}} onSave={handleSaved} onClose={() => setFormOpen(false)} /></Modal>}
      {deleting && <Modal title="Delete Setting" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Delete setting <strong>{deleting.key}</strong>?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}
