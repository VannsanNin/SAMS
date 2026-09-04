import { useState, useEffect, useCallback } from 'react';
import { Search, Check, CheckCheck, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';
const typeCls = { info: 'bg-blue-50 text-blue-700 border-l-4 border-l-blue-400', success: 'bg-emerald-50 text-emerald-700 border-l-4 border-l-emerald-400', warning: 'bg-amber-50 text-amber-700 border-l-4 border-l-amber-400', error: 'bg-rose-50 text-rose-700 border-l-4 border-l-rose-400' };

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 20 });
    if (search) p.set('search', search);
    const res = await apiFetch(`${API}/notifications?${p}`);
    if (res.ok) { const d = await res.json(); setNotifications(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const markRead = async (id) => {
    await apiFetch(`${API}/notifications/${id}/read`, { method: 'PUT' });
    load();
  };

  const markAllRead = async () => {
    await apiFetch(`${API}/notifications/read-all`, { method: 'PUT' });
    setMsg({ text: 'All marked as read' }); load(); setTimeout(() => setMsg(null), 3000);
  };

  const remove = async (id) => {
    await apiFetch(`${API}/notifications/${id}`, { method: 'DELETE' });
    load();
  };

  const filtered = tab === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Stay updated on school activities</p></div>
        <div className="flex gap-2">
          <button onClick={() => setTab('all')} className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${tab === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>All</button>
          <button onClick={() => setTab('unread')} className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${tab === 'unread' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>Unread</button>
          <button onClick={markAllRead} className="text-xs font-semibold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"><CheckCheck size={14} /> Mark All Read</button>
        </div>
      </div>
      {msg && <div className="text-xs p-3 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">{msg.text}</div>}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder="Search notifications..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <div className="space-y-2">
        {filtered.map(n => (
          <div key={n.id} className={`bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs transition ${!n.is_read ? (typeCls[n.type] || 'bg-blue-50') : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />}
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{n.created_at?.slice(0, 16).replace('T', ' ')}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!n.is_read && <button onClick={() => markRead(n.id)} className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 transition" title="Mark as read"><Check size={14} /></button>}
                <button onClick={() => remove(n.id)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-12 text-center text-slate-400 text-sm shadow-xs">No notifications</div>}
      </div>
      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
