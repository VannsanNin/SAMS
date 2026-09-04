import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';
const pillCls = { success: 'bg-emerald-50 text-emerald-700', failed: 'bg-rose-50 text-rose-700' };

export default function LoginHistory() {
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 20 });
    if (search) p.set('search', search);
    const res = await apiFetch(`${API}/login-history?${p}`);
    if (res.ok) { const d = await res.json(); setRecords(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="pb-2 border-b border-slate-200/60">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Login History</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Track all login attempts</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder="Search by email or IP..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-slate-200 grid grid-cols-5 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"><div className="col-span-2">User</div><div>IP Address</div><div>Status</div><div>Time</div></div>
        <div className="divide-y divide-slate-100 text-slate-700">
          {records.map(r => (
            <div key={r.id} className="grid grid-cols-5 gap-4 px-4 py-3.5 text-xs hover:bg-slate-50/80 transition items-center">
              <div className="col-span-2">
                <p className="font-semibold">{r.user?.name || '—'}</p>
                <p className="text-slate-500 text-[10px]">{r.user?.email || r.email}</p>
              </div>
              <div className="font-mono text-slate-500">{r.ip_address || '—'}</div>
              <div><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${pillCls[r.status] || ''}`}>{r.status}</span></div>
              <div className="text-slate-500">{r.created_at?.slice(0, 16).replace('T', ' ')}</div>
            </div>
          ))}
          {records.length === 0 && <div className="px-4 py-12 text-center text-slate-400 text-sm">No login records</div>}
        </div>
      </div>
      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
