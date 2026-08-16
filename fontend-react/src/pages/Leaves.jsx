import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarOff, SquarePen, Download, Search, Trash2, CheckCircle2, XCircle, X, AlertCircle, Plus } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';

const EMPTY_FORM = {
  student_id: '', staff_id: '', date_from: '', date_to: '', reason: '', status: 'pending',
};

const STATUS_META = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200/60',
};

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all';

function Field({ label, required, children, className = '' }) {
  return (
      <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-slate-700 mb-1">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
        {children}
      </label>
  );
}

function StatusPill({ status }) {
  return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${STATUS_META[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status || 'pending'}
    </span>
  );
}

function LeaveForm({ initial, options, onSave, onClose, isStaff, studentId }) {
  const [form, setForm] = useState({
    ...initial,
    student_id: initial.student_id || studentId || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/leaves${form.id ? `/${form.id}` : ''}`, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Validation failed. Check required fields.');
      }
      onSave(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
      <form onSubmit={submit} className="space-y-4">
        {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-xs bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Student" required>
            <select className={inputCls} value={form.student_id} onChange={set('student_id')} required disabled={!!studentId && !form.id}>
              <option value="">— Select Student —</option>
              {(options.students || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          {isStaff && (
              <Field label="Approving Staff" required>
                <select className={inputCls} value={form.staff_id} onChange={set('staff_id')} required>
                  <option value="">— Select Staff —</option>
                  {(options.staff || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
          )}
          <Field label="Date From" required>
            <input type="date" className={inputCls} value={form.date_from} onChange={set('date_from')} required />
          </Field>
          <Field label="Date To" required>
            <input type="date" className={inputCls} value={form.date_to} onChange={set('date_to')} required />
          </Field>
          <Field label="Reason / Remarks" className="sm:col-span-2" required>
            <textarea className={inputCls} rows={3} value={form.reason} onChange={set('reason')} placeholder="State the reason for leave..." required />
          </Field>
          {isStaff && (
              <Field label="Status" className="sm:col-span-2">
                <select className={inputCls} value={form.status} onChange={set('status')}>
                  {(['pending', 'approved', 'rejected']).map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </Field>
          )}
        </div>

        <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition shadow-xs"
          >
            {saving ? 'Saving...' : form.id ? 'Update Leave' : 'Submit Request'}
          </button>
        </div>
      </form>
  );
}

export default function Leaves() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', student_id: '', staff_id: '', date_from: '', date_to: '' });
  const [options, setOptions] = useState({ statuses: [], students: [], staff: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);
  const isStaff = ['admin', 'teacher'].includes(me?.role);
  const isStudent = ['student', 'class_president'].includes(me?.role);
  const studentId = isStudent ? me.student_id : null;

  const load = useCallback((page = 1) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', page);
    apiFetch(`${API}/leaves?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load leaves'))))
        .then((res) => { setData(res.data); setMeta({ ...res, data: undefined }); })
        .catch(() => {});
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    apiFetch(`${API}/leaves/filters`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load filter options'))))
        .then(setOptions)
        .catch(() => {});
  }, []);

  const flash = (text, type = 'success') => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (l) => { setEditing(l); setFormOpen(true); };

  const handleSaved = (saved) => {
    setFormOpen(false);
    flash(`Leave request for ${saved.student?.name ?? `#${saved.student_id}`} saved.`);
    load(meta?.current_page || 1);
  };

  const changeStatus = async (leave, status) => {
    setBusyId(leave.id);
    try {
      const res = await apiFetch(`${API}/leaves/${leave.id}/${status}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to update leave status.');
      flash(`Leave request ${status === 'approve' ? 'approved' : 'rejected'}.`);
      load(meta?.current_page || 1);
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    await apiFetch(`${API}/leaves/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    flash('Leave request deleted.');
    load(1);
  };

  const exportLeaves = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await apiFetch(`${API}/leaves/export?${params.toString()}`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leaves.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterSelect = (key, label, labelKey = 'name') => (
      <select
          value={filters[key]}
          onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
          className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
      >
        <option value="">{label}</option>
        {key === 'status'
            ? (options.statuses || []).map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)
            : (options[key] || []).map((opt) => <option key={opt.id} value={opt.id}>{opt[labelKey]}</option>)
        }
      </select>
  );

  return (
      <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <CalendarOff size={26} className="text-indigo-600" /> {isStaff ? 'Leave Management' : 'My Leave Requests'}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{isStaff ? 'Track, review, and process student absence and leave requests' : 'Submit and track your absence and leave requests'}</p>
          </div>
          <div className="flex gap-2">
            {isStaff && (
                <button onClick={exportLeaves} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
                  <Download size={15} /> Export
                </button>
            )}
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition">
              <Plus size={15} /> New Request
            </button>
          </div>
        </div>

        {msg.text && (
            <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <span>{msg.text}</span>
              <button onClick={() => setMsg({ type: '', text: '' })}><X size={14} /></button>
            </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder={isStaff ? 'Search student name...' : 'Search reason...'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            {filterSelect('status', 'All Statuses')}
            {isStaff && filterSelect('student_id', 'All Students')}
            {isStaff && filterSelect('staff_id', 'All Staff')}
            {isStaff && (
                <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                    className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    title="From date"
                />
            )}
            {isStaff && (
                <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                    className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    title="To date"
                />
            )}
          </div>
          {(filters.search || filters.status || filters.student_id || filters.staff_id || filters.date_from || filters.date_to) && (
              <button
                  onClick={() => setFilters({ search: '', status: '', student_id: '', staff_id: '', date_from: '', date_to: '' })}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear active filters
              </button>
          )}
        </div>

        {/* Leaves Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 text-left">Student</th>
                {isStaff && <th className="p-3.5 text-left hidden sm:table-cell">Assigned Staff</th>}
                <th className="p-3.5 text-left hidden lg:table-cell">From</th>
                <th className="p-3.5 text-left hidden lg:table-cell">To</th>
                <th className="p-3.5 text-left">Reason</th>
                <th className="p-3.5 text-left">Status</th>
                {isStaff && <th className="p-3.5 text-right">Actions</th>}
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-semibold text-slate-900">{l.student?.name ?? `#${l.student_id}`}</td>
                    {isStaff && <td className="p-3.5 hidden sm:table-cell font-medium text-slate-700">{l.staff?.name ?? '—'}</td>}
                    <td className="p-3.5 hidden lg:table-cell text-slate-600 font-medium">{l.date_from}</td>
                    <td className="p-3.5 hidden lg:table-cell text-slate-600 font-medium">{l.date_to}</td>
                    <td className="p-3.5">
                      <span className="block max-w-[200px] truncate font-medium text-slate-800" title={l.reason}>{l.reason || '—'}</span>
                    </td>
                    <td className="p-3.5"><StatusPill status={l.status} /></td>
                    {isStaff && (
                        <td className="p-3.5">
                          <div className="flex justify-end items-center gap-1.5">
                            {l.status === 'pending' && (
                                <>
                                  <button
                                      onClick={() => changeStatus(l, 'approve')}
                                      disabled={busyId === l.id}
                                      className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition disabled:opacity-50"
                                      title="Approve Request"
                                  >
                                    <CheckCircle2 size={13} />
                                  </button>
                                  <button
                                      onClick={() => changeStatus(l, 'reject')}
                                      disabled={busyId === l.id}
                                      className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition disabled:opacity-50"
                                      title="Reject Request"
                                  >
                                    <XCircle size={13} />
                                  </button>
                                </>
                            )}
                            <button onClick={() => openEdit(l)} className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition" title="Edit Request">
                              <SquarePen size={13} />
                            </button>
                            <button onClick={() => setDeleting(l)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition" title="Delete Request">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                    )}
                  </tr>
              ))}
              {data.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-400 font-medium">No leave requests found</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination meta={meta} onPageChange={load} />

        {/* Modals */}
        {formOpen && (
            <Modal
                title={editing ? `Edit Request — ${editing.student?.name ?? `#${editing.student_id}`}` : 'New Leave Application'}
                icon={editing ? SquarePen : Plus}
                onClose={() => setFormOpen(false)}
                wide
            >
              <LeaveForm
                  initial={{ ...EMPTY_FORM, ...editing }}
                  options={options}
                  onSave={handleSaved}
                  onClose={() => setFormOpen(false)}
                  isStaff={isStaff}
                  studentId={studentId}
              />
            </Modal>
        )}

        {deleting && (
            <Modal title="Confirm Delete" icon={Trash2} onClose={() => setDeleting(null)}>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete the leave request for <b>{deleting.student?.name ?? `#${deleting.student_id}`}</b>?
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition shadow-xs">Delete Request</button>
              </div>
            </Modal>
        )}
      </div>
  );
}