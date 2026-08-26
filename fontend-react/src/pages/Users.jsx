import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, SquarePen, Trash2, Search, Eye, UserCheck, UserX } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';
const ROLES = ['admin', 'principal', 'teacher', 'student', 'class_president', 'parent', 'accountant', 'librarian', 'receptionist', 'staff'];
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';
const pillCls = { admin: 'bg-purple-50 text-purple-700', principal: 'bg-indigo-50 text-indigo-700', teacher: 'bg-blue-50 text-blue-700', student: 'bg-emerald-50 text-emerald-700', parent: 'bg-amber-50 text-amber-700', accountant: 'bg-teal-50 text-teal-700', librarian: 'bg-cyan-50 text-cyan-700', receptionist: 'bg-pink-50 text-pink-700', staff: 'bg-slate-100 text-slate-700', class_president: 'bg-orange-50 text-orange-700' };

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function UserForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await apiFetch(`${API}/users`, { method: 'POST', body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" required><input className={inputCls} value={form.name || ''} onChange={set('name')} required /></Field>
        <Field label="Email" required><input type="email" className={inputCls} value={form.email || ''} onChange={set('email')} required /></Field>
        <Field label="Role" required>
          <select className={inputCls} value={form.role || 'student'} onChange={set('role')} required>
            {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </Field>
        <Field label="Phone"><input className={inputCls} value={form.phone || ''} onChange={set('phone')} /></Field>
        {!initial.id && <Field label="Password" required><input type="password" className={inputCls} value={form.password || ''} onChange={set('password')} required minLength={6} /></Field>}
        <Field label="Status">
          <select className={inputCls} value={form.status || 'active'} onChange={set('status')}>
            <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    if (roleFilter) p.set('role', roleFilter);
    const res = await apiFetch(`${API}/users?${p}`);
    if (res.ok) { const d = await res.json(); setUsers(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search, roleFilter]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const handleSaved = () => { setFormOpen(false); setEditing(null); setMsg({ type: 'success', text: 'Saved' }); load(); setTimeout(() => setMsg(null), 3000); };
  const toggleActive = async (u) => {
    const endpoint = u.is_active !== false ? 'deactivate' : 'activate';
    await apiFetch(`${API}/users/${u.id}/${endpoint}`, { method: 'PUT' });
    setMsg({ text: `User ${endpoint}d` }); load(); setTimeout(() => setMsg(null), 3000);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    await apiFetch(`${API}/users/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null); setMsg({ text: 'Deleted' }); load(); setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Manage system users and accounts</p></div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> New User</button>
      </div>
      {msg && <div className="text-xs p-3 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">{msg.text}</div>}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className={inputCls + ' w-auto'} value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-slate-200 grid grid-cols-6 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"><div className="col-span-2">User</div><div>Role</div><div>Email</div><div>Status</div><div className="text-right">Actions</div></div>
        <div className="divide-y divide-slate-100 text-slate-700">
          {users.map(u => (
            <div key={u.id} className="grid grid-cols-6 gap-4 px-4 py-3.5 text-xs hover:bg-slate-50/80 transition items-center">
              <div className="col-span-2"><p className="font-semibold">{u.name}</p><p className="text-slate-500 text-[10px]">{u.phone || ''}</p></div>
              <div><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${pillCls[u.role] || ''}`}>{u.role?.replace('_', ' ')}</span></div>
              <div className="text-slate-500">{u.email}</div>
              <div><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{u.is_active !== false ? 'Active' : 'Inactive'}</span></div>
              <div className="flex justify-end gap-1.5">
                <button onClick={() => toggleActive(u)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition" title={u.is_active !== false ? 'Deactivate' : 'Activate'}>
                  {u.is_active !== false ? <UserX size={14} /> : <UserCheck size={14} />}
                </button>
                <button onClick={() => { setEditing(u); setFormOpen(true); }} className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition"><SquarePen size={14} /></button>
                <button onClick={() => setDeleting(u)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {users.length === 0 && <div className="px-4 py-12 text-center text-slate-400 text-sm">No users found</div>}
        </div>
      </div>
      <Pagination meta={meta} onPageChange={setPage} />

      {formOpen && <Modal title={editing ? 'Edit User' : 'New User'} onClose={() => { setFormOpen(false); setEditing(null); }} icon={Users}><UserForm initial={editing || {}} onSave={handleSaved} onClose={() => { setFormOpen(false); setEditing(null); }} /></Modal>}
      {deleting && <Modal title="Delete User" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Delete <strong>{deleting.name}</strong>?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}
