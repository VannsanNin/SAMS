import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Trash2, Search, Eye } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';
const pillCls = { pending: 'bg-amber-50 text-amber-700', paid: 'bg-emerald-50 text-emerald-700', partial: 'bg-blue-50 text-blue-700' };

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function PayrollForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { apiFetch(`${API}/users`).then(r => r.ok && r.json()).then(d => setUsers(d?.data || d || [])); }, []);

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const body = { ...form, basic_salary: +form.basic_salary || 0, allowances: +form.allowances || 0, deductions: +form.deductions || 0 };
      const res = await apiFetch(`${API}/payroll`, { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <Field label="Employee" required>
        <select className={inputCls} value={form.user_id || ''} onChange={set('user_id')} required>
          <option value="">Select employee...</option>
          {users.filter(u => ['teacher', 'staff', 'accountant', 'librarian'].includes(u.role)).map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Month" required><input type="month" className={inputCls} value={form.month || ''} onChange={set('month')} required /></Field>
        <Field label="Year" required><input type="number" className={inputCls} value={form.year || new Date().getFullYear()} onChange={set('year')} required /></Field>
        <Field label="Basic Salary" required><input type="number" step="0.01" className={inputCls} value={form.basic_salary || ''} onChange={set('basic_salary')} required /></Field>
        <Field label="Allowances"><input type="number" step="0.01" className={inputCls} value={form.allowances || 0} onChange={set('allowances')} /></Field>
        <Field label="Deductions"><input type="number" step="0.01" className={inputCls} value={form.deductions || 0} onChange={set('deductions')} /></Field>
        <Field label="Status">
          <select className={inputCls} value={form.status || 'pending'} onChange={set('status')}>
            <option value="pending">Pending</option><option value="paid">Paid</option><option value="partial">Partial</option>
          </select>
        </Field>
      </div>
      <Field label="Payment Date"><input type="date" className={inputCls} value={form.payment_date || ''} onChange={set('payment_date')} /></Field>
      <Field label="Notes"><textarea className={inputCls} rows={2} value={form.notes || ''} onChange={set('notes')} /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function Payroll() {
  const [records, setRecords] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    const res = await apiFetch(`${API}/payroll?${p}`);
    if (res.ok) { const d = await res.json(); setRecords(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search]);

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  const handleSaved = () => { setFormOpen(false); setMsg({ type: 'success', text: 'Saved' }); load(); setTimeout(() => setMsg(null), 3000); };
  const confirmDelete = async () => {
    if (!deleting) return;
    await apiFetch(`${API}/payroll/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null); setMsg({ text: 'Deleted' }); load(); setTimeout(() => setMsg(null), 3000);
  };

  const netSalary = (r) => (+r.basic_salary || 0) + (+r.allowances || 0) - (+r.deductions || 0);

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Manage employee salaries</p></div>
        <button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> New Payroll</button>
      </div>
      {msg && <div className="text-xs p-3 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">{msg.text}</div>}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder="Search payroll..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-slate-200 grid grid-cols-7 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"><div className="col-span-2">Employee</div><div>Period</div><div>Basic</div><div>Net</div><div>Status</div><div className="text-right">Actions</div></div>
        <div className="divide-y divide-slate-100 text-slate-700">
          {records.map(r => (
            <div key={r.id} className="grid grid-cols-7 gap-4 px-4 py-3.5 text-xs hover:bg-slate-50/80 transition items-center">
              <div className="col-span-2"><p className="font-semibold">{r.user?.name || '—'}</p><p className="text-slate-500 text-[10px] capitalize">{r.user?.role}</p></div>
              <div className="font-semibold">{r.month}/{r.year}</div>
              <div>${Number(r.basic_salary).toFixed(2)}</div>
              <div className="font-bold text-emerald-600">${netSalary(r).toFixed(2)}</div>
              <div><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${pillCls[r.status] || ''}`}>{r.status}</span></div>
              <div className="flex justify-end gap-1.5">
                <button onClick={() => setViewing(r)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"><Eye size={14} /></button>
                <button onClick={() => setDeleting(r)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {records.length === 0 && <div className="px-4 py-12 text-center text-slate-400 text-sm">No payroll records</div>}
        </div>
      </div>
      <Pagination meta={meta} onPageChange={setPage} />

      {formOpen && <Modal title="New Payroll Record" onClose={() => setFormOpen(false)} icon={DollarSign}><PayrollForm initial={{}} onSave={handleSaved} onClose={() => setFormOpen(false)} /></Modal>}
      {viewing && <Modal title="Payroll Details" onClose={() => setViewing(null)} icon={Eye}>
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-slate-500">Employee:</span> <span className="font-semibold">{viewing.user?.name}</span></div>
            <div><span className="text-slate-500">Period:</span> <span className="font-semibold">{viewing.month}/{viewing.year}</span></div>
            <div><span className="text-slate-500">Basic:</span> <span className="font-semibold">${Number(viewing.basic_salary).toFixed(2)}</span></div>
            <div><span className="text-slate-500">Allowances:</span> <span className="font-semibold text-emerald-600">+${Number(viewing.allowances || 0).toFixed(2)}</span></div>
            <div><span className="text-slate-500">Deductions:</span> <span className="font-semibold text-rose-600">-${Number(viewing.deductions || 0).toFixed(2)}</span></div>
            <div><span className="text-slate-500">Net:</span> <span className="font-bold text-lg text-emerald-600">${netSalary(viewing).toFixed(2)}</span></div>
          </div>
          {viewing.notes && <div className="bg-slate-50 rounded-xl p-3">{viewing.notes}</div>}
        </div>
      </Modal>}
      {deleting && <Modal title="Delete Record" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Delete this payroll record?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}
