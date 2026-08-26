import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Plus, Send, Search, Megaphone } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function MessageForm({ onSave, onClose }) {
  const [form, setForm] = useState({ subject: '', message: '', recipient_id: '', priority: 'normal' });
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { apiFetch(`${API}/users`).then(r => r.ok && r.json()).then(d => setUsers(d?.data || d || [])); }, []);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await apiFetch(`${API}/messages`, { method: 'POST', body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <Field label="To" required>
        <select className={inputCls} value={form.recipient_id} onChange={set('recipient_id')} required>
          <option value="">Select recipient...</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
        </select>
      </Field>
      <Field label="Subject" required><input className={inputCls} value={form.subject} onChange={set('subject')} required /></Field>
      <Field label="Priority">
        <select className={inputCls} value={form.priority} onChange={set('priority')}>
          <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
        </select>
      </Field>
      <Field label="Message" required><textarea className={inputCls} rows={4} value={form.message} onChange={set('message')} required /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-2"><Send size={14} /> {saving ? 'Sending...' : 'Send'}</button>
      </div>
    </form>
  );
}

function AnnouncementForm({ onSave, onClose }) {
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal', target_roles: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const toggleRole = (r) => setForm(f => ({ ...f, target_roles: f.target_roles.includes(r) ? f.target_roles.filter(x => x !== r) : [...f.target_roles, r] }));
  const roles = ['admin', 'teacher', 'student', 'parent', 'staff'];

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await apiFetch(`${API}/announcements`, { method: 'POST', body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <Field label="Title" required><input className={inputCls} value={form.title} onChange={set('title')} required /></Field>
      <Field label="Priority">
        <select className={inputCls} value={form.priority} onChange={set('priority')}>
          <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option>
        </select>
      </Field>
      <div><span className="block text-xs font-medium text-slate-700 mb-1">Target Roles</span>
        <div className="flex flex-wrap gap-2">{roles.map(r => <button key={r} type="button" onClick={() => toggleRole(r)} className={`px-3 py-1.5 rounded-full text-[10px] font-semibold border transition ${form.target_roles.includes(r) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{r.charAt(0).toUpperCase() + r.slice(1)}</button>)}</div>
      </div>
      <Field label="Content" required><textarea className={inputCls} rows={4} value={form.content} onChange={set('content')} required /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Publishing...' : 'Publish'}</button>
      </div>
    </form>
  );
}

export default function Messages() {
  const [tab, setTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadMessages = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    const res = await apiFetch(`${API}/messages?${p}`);
    if (res.ok) { const d = await res.json(); setMessages(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search]);

  const loadAnnouncements = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    const res = await apiFetch(`${API}/announcements?${p}`);
    if (res.ok) { const d = await res.json(); setAnnouncements(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page]);

  useEffect(() => { tab === 'inbox' || tab === 'sent' ? loadMessages() : loadAnnouncements(); }, [tab, loadMessages, loadAnnouncements]);

  const handleSaved = () => { setFormOpen(false); setAnnouncementOpen(false); setMsg({ type: 'success', text: 'Sent' }); loadMessages(); setTimeout(() => setMsg(null), 3000); };

  const filtered = tab === 'sent' ? messages.filter(m => m.sender_id) : messages;

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Internal messaging and announcements</p></div>
        <div className="flex gap-2 flex-wrap">
          {['inbox', 'sent', 'announcements'].map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`text-xs font-semibold px-4 py-2 rounded-xl transition capitalize ${tab === t ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{t === 'announcements' ? '📢 Announcements' : t}</button>
          ))}
        </div>
      </div>
      {msg && <div className="text-xs p-3 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">{msg.text}</div>}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {(tab === 'inbox' || tab === 'sent') && (
        <>
          {tab === 'inbox' && <button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> New Message</button>}
          <div className="space-y-2">
            {filtered.map(m => (
              <div key={m.id} onClick={() => setViewing(m)} className={`bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs cursor-pointer hover:bg-slate-50 transition ${!m.is_read && tab === 'inbox' ? 'border-l-4 border-l-indigo-500' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-1">From: <strong>{m.sender?.name || 'System'}</strong> → To: <strong>{m.recipient?.name || 'All'}</strong></p>
                    <h3 className="font-bold text-slate-900 text-sm">{m.subject}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{m.message}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${m.priority === 'urgent' ? 'bg-rose-50 text-rose-700' : m.priority === 'high' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{m.priority}</span>
                    <p className="text-[10px] text-slate-400 mt-1">{m.created_at?.slice(0, 10)}</p>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-12 text-center text-slate-400 text-sm shadow-xs">No messages</div>}
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

      {tab === 'announcements' && (
        <>
          <button onClick={() => setAnnouncementOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Megaphone size={16} /> New Announcement</button>
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-sm">{a.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${a.priority === 'urgent' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{a.priority}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{a.content}</p>
                    <div className="flex gap-1.5 mt-2">{(a.target_roles || []).map(r => <span key={r} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-full capitalize">{r}</span>)}</div>
                  </div>
                  <p className="text-[10px] text-slate-400 shrink-0">{a.created_at?.slice(0, 10)}</p>
                </div>
              </div>
            ))}
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

      {formOpen && <Modal title="New Message" onClose={() => setFormOpen(false)} icon={MessageSquare}><MessageForm onSave={handleSaved} onClose={() => setFormOpen(false)} /></Modal>}
      {announcementOpen && <Modal title="New Announcement" onClose={() => setAnnouncementOpen(false)} icon={Megaphone}><AnnouncementForm onSave={handleSaved} onClose={() => setAnnouncementOpen(false)} /></Modal>}
      {viewing && (
        <Modal title={viewing.subject} onClose={() => setViewing(null)} icon={MessageSquare}>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">From:</span> <span className="font-semibold">{viewing.sender?.name || 'System'}</span></div>
              <div><span className="text-slate-500">To:</span> <span className="font-semibold">{viewing.recipient?.name || 'All'}</span></div>
              <div><span className="text-slate-500">Priority:</span> <span className="font-semibold capitalize">{viewing.priority}</span></div>
              <div><span className="text-slate-500">Date:</span> <span className="font-semibold">{viewing.created_at?.slice(0, 10)}</span></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 whitespace-pre-wrap text-slate-700">{viewing.message}</div>
          </div>
        </Modal>
      )}
    </div>
  );
}
