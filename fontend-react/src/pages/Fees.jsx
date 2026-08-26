import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, SquarePen, Trash2, Eye, Search } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';
const pillCls = { active: 'bg-emerald-50 text-emerald-700', inactive: 'bg-slate-100 text-slate-600', paid: 'bg-emerald-50 text-emerald-700', unpaid: 'bg-rose-50 text-rose-700', partial: 'bg-amber-50 text-amber-700', overdue: 'bg-rose-50 text-rose-700', approved: 'bg-emerald-50 text-emerald-700', pending: 'bg-amber-50 text-amber-700', rejected: 'bg-rose-50 text-rose-700', rejected: 'bg-rose-50 text-rose-700' };

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function FeeStructureForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const body = { ...form, amount: +form.amount };
      const res = await apiFetch(`${API}/fee-structures`, { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Save failed'); }
      onSave();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs p-3 rounded-xl">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" required><input className={inputCls} value={form.name || ''} onChange={set('name')} required /></Field>
        <Field label="Amount (USD)" required><input type="number" step="0.01" className={inputCls} value={form.amount || ''} onChange={set('amount')} required /></Field>
        <Field label="Type" required>
          <select className={inputCls} value={form.type || 'tuition'} onChange={set('type')}>
            {['tuition', 'examination', 'library', 'laboratory', 'transport', 'uniform', 'activity', 'other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Frequency">
          <select className={inputCls} value={form.frequency || 'monthly'} onChange={set('frequency')}>
            {['one_time', 'monthly', 'quarterly', 'semester', 'yearly'].map(f => <option key={f} value={f}>{f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </Field>
        <Field label="Academic Year"><input className={inputCls} value={form.academic_year || '2025-2026'} onChange={set('academic_year')} /></Field>
        <Field label="Semester"><input className={inputCls} value={form.semester || ''} onChange={set('semester')} /></Field>
      </div>
      <Field label="Description"><textarea className={inputCls} rows={2} value={form.description || ''} onChange={set('description')} /></Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function Fees() {
  const [tab, setTab] = useState('structures');
  const [structures, setStructures] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadStructures = async () => {
    const res = await apiFetch(`${API}/fee-structures`);
    if (res.ok) { const d = await res.json(); setStructures(d.data || d); }
  };

  const loadInvoices = useCallback(async () => {
    const p = new URLSearchParams({ page, per_page: 15 });
    if (search) p.set('search', search);
    const res = await apiFetch(`${API}/fee-invoices?${p}`);
    if (res.ok) { const d = await res.json(); setInvoices(d.data || []); setMeta({ current_page: d.current_page, last_page: d.last_page, from: d.from, to: d.to, total: d.total }); }
  }, [page, search]);

  useEffect(() => { loadStructures(); }, []);
  useEffect(() => { if (tab === 'invoices') { const t = setTimeout(loadInvoices, 200); return () => clearTimeout(t); } }, [tab, loadInvoices]);

  const handleSaved = () => { setFormOpen(false); setEditing(null); setMsg({ type: 'success', text: 'Saved' }); loadStructures(); setTimeout(() => setMsg(null), 3000); };
  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await apiFetch(`${API}/fee-structures/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) { setDeleting(null); setMsg({ type: 'success', text: 'Deleted' }); loadStructures(); setTimeout(() => setMsg(null), 3000); }
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fees & Finance</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Manage fee structures, invoices, and payments</p></div>
        <div className="flex gap-2">
          <button onClick={() => setTab('structures')} className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${tab === 'structures' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Structures</button>
          <button onClick={() => setTab('invoices')} className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${tab === 'invoices' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Invoices</button>
        </div>
      </div>
      {msg && <div className={`text-xs p-3 rounded-xl border ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{msg.text}</div>}

      {tab === 'structures' && (
        <>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> New Fee Structure</button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {structures.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-start justify-between mb-3">
                  <div><h3 className="font-bold text-slate-900">{s.name}</h3><p className="text-[10px] text-slate-500 capitalize">{s.type} • {s.frequency?.replace('_', ' ')}</p></div>
                  <span className="font-bold text-emerald-600">${Number(s.amount).toFixed(2)}</span>
                </div>
                {s.description && <p className="text-xs text-slate-600 mb-3">{s.description}</p>}
                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <button onClick={() => { setEditing(s); setFormOpen(true); }} className="flex-1 text-center p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold transition">Edit</button>
                  <button onClick={() => setDeleting(s)} className="flex-1 text-center p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'invoices' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className={inputCls + ' pl-9'} placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="bg-slate-900 text-slate-200 grid grid-cols-6 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"><div className="col-span-2">Invoice</div><div>Amount</div><div>Paid</div><div>Status</div><div className="text-right">Actions</div></div>
            <div className="divide-y divide-slate-100 text-slate-700">
              {invoices.map(inv => (
                <div key={inv.id} className="grid grid-cols-6 gap-4 px-4 py-3.5 text-xs hover:bg-slate-50/80 transition items-center">
                  <div className="col-span-2">
                    <p className="font-semibold">{inv.invoice_number}</p>
                    <p className="text-slate-500">{inv.student?.name}</p>
                  </div>
                  <div className="font-semibold">${Number(inv.total_amount).toFixed(2)}</div>
                  <div className="font-semibold text-emerald-600">${Number(inv.paid_amount || 0).toFixed(2)}</div>
                  <div><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${pillCls[inv.status] || ''}`}>{inv.status}</span></div>
                  <div className="flex justify-end">
                    <button onClick={() => setViewing(inv)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"><Eye size={14} /></button>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <div className="px-4 py-12 text-center text-slate-400 text-sm">No invoices found</div>}
            </div>
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

      {viewing && (
        <Modal title="Invoice Details" onClose={() => setViewing(null)} icon={Eye} wide>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">Invoice #:</span> <span className="font-semibold">{viewing.invoice_number}</span></div>
              <div><span className="text-slate-500">Student:</span> <span className="font-semibold">{viewing.student?.name}</span></div>
              <div><span className="text-slate-500">Total:</span> <span className="font-bold">${Number(viewing.total_amount).toFixed(2)}</span></div>
              <div><span className="text-slate-500">Paid:</span> <span className="font-bold text-emerald-600">${Number(viewing.paid_amount || 0).toFixed(2)}</span></div>
              <div><span className="text-slate-500">Due:</span> <span className="font-bold text-rose-600">${Number(viewing.due_amount || 0).toFixed(2)}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${pillCls[viewing.status] || ''}`}>{viewing.status}</span></div>
            </div>
            {viewing.payments?.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">Payments</h4>
                <div className="bg-slate-50 rounded-xl p-3">
                  <table className="w-full text-xs"><thead><tr className="text-slate-500"><th className="text-left py-1">Date</th><th className="text-left py-1">Amount</th><th className="text-left py-1">Method</th><th className="text-left py-1">Reference</th></tr></thead>
                    <tbody>{viewing.payments.map(p => <tr key={p.id} className="border-t border-slate-200"><td className="py-1">{p.payment_date}</td><td className="py-1 font-semibold text-emerald-600">${Number(p.amount).toFixed(2)}</td><td className="py-1 capitalize">{p.payment_method}</td><td className="py-1">{p.reference_number}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      {formOpen && <Modal title={editing ? 'Edit Fee Structure' : 'New Fee Structure'} onClose={() => { setFormOpen(false); setEditing(null); }} icon={DollarSign}><FeeStructureForm initial={editing || {}} onSave={handleSaved} onClose={() => { setFormOpen(false); setEditing(null); }} /></Modal>}
      {deleting && <Modal title="Delete Fee Structure" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Delete <strong>{deleting.name}</strong>?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}
