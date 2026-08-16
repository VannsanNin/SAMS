import { useState, useEffect, useCallback } from 'react';
import { UserPlus, UsersRound, Download, Search, Trash2, SquarePen, Eye, X, AlertCircle, Link2, Phone, GraduationCap } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';

const EMPTY_FORM = {
  name: '', gender: '', dob: '', phone: '', email: '',
  address: '', relationship: '', emergency_contact: '', image: '', student_ids: [],
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

function Avatar({ guardian, size = 40 }) {
  if (guardian?.image) {
    return (
        <img
            src={guardian.image}
            alt={guardian.name}
            className="rounded-full object-cover shrink-0 border border-slate-200 shadow-xs"
            style={{ width: size, height: size }}
        />
    );
  }
  const initials = (guardian?.name || '?')
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  return (
      <div
          className="rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold shrink-0 shadow-xs"
          style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {initials}
      </div>
  );
}

function GuardianForm({ initial, students, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    ...initial,
    student_ids: initial.student_ids || initial.children?.map((c) => c.id) || [],
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleChild = (id) =>
      setForm((f) => ({
        ...f,
        student_ids: f.student_ids.includes(id) ? f.student_ids.filter((x) => x !== id) : [...f.student_ids, id],
      }));

  const grouped = (students || []).reduce((acc, s) => {
    const key = s.class?.class_name || 'Unassigned';
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/parents${form.id ? `/${form.id}` : ''}`, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Validation failed. Check the required fields.');
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
          <Field label="Full Name" required>
            <input className={inputCls} value={form.name} onChange={set('name')} required />
          </Field>
          <Field label="Relationship">
            <input className={inputCls} value={form.relationship} onChange={set('relationship')} placeholder="e.g. Father, Mother, Guardian" />
          </Field>
          <Field label="Gender">
            <select className={inputCls} value={form.gender} onChange={set('gender')}>
              <option value="">— Select —</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Date of Birth">
            <input type="date" className={inputCls} value={form.dob} onChange={set('dob')} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Email">
            <input type="email" className={inputCls} value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Emergency Contact">
            <input className={inputCls} value={form.emergency_contact} onChange={set('emergency_contact')} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <input className={inputCls} value={form.address} onChange={set('address')} />
          </Field>
        </div>

        <div className="rounded-2xl border border-slate-200/80 p-4">
          <p className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
            <Link2 size={14} className="text-indigo-600" /> Linked Students
          </p>
          <p className="text-[11px] text-slate-500 mb-3">Select the children this guardian is responsible for.</p>
          {students.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No students available</p>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {Object.entries(grouped).map(([className, list]) => (
                    <div key={className} className="space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{className}</p>
                      {list.map((s) => (
                          <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.student_ids.includes(s.id)}
                                onChange={() => toggleChild(s.id)}
                                className="accent-indigo-600"
                            />
                            <span className="text-xs font-medium text-slate-700">{s.name}</span>
                          </label>
                      ))}
                    </div>
                ))}
              </div>
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
            {saving ? 'Saving...' : form.id ? 'Update Guardian' : 'Save Guardian'}
          </button>
        </div>
      </form>
  );
}

function GuardianDetail({ guardian, onEdit }) {
  const children = guardian.students || [];
  const rows = [
    ['Email', guardian.email],
    ['Phone', guardian.phone],
    ['Date of Birth', guardian.dob],
    ['Gender', guardian.gender],
    ['Address', guardian.address],
    ['Relationship', guardian.relationship],
    ['Emergency Contact', guardian.emergency_contact],
    ['Linked Children', children.length],
    ['Account Created', guardian.stats?.has_account ? 'Yes' : 'No'],
  ];

  return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <Avatar guardian={guardian} size={64} />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{guardian.name}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{guardian.relationship || 'Guardian'}</p>
          </div>
          <button
              onClick={() => onEdit(guardian)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition"
          >
            <SquarePen size={14} />
            Edit
          </button>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">General Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-white border border-slate-200/80 rounded-2xl p-4 text-xs">
            {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500 font-medium">{label}</span>
                  <span className="font-semibold text-slate-900 text-right">{value || '—'}</span>
                </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Linked Students</h4>
          {children.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {children.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-white">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><GraduationCap size={14} /></div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{c.name}</p>
                        <p className="text-[11px] text-slate-500">{c.class?.class_name || '—'} · {c.student_id || '—'}</p>
                      </div>
                    </div>
                ))}
              </div>
          ) : (
              <p className="text-slate-400 text-xs py-3 text-center">No students linked to this guardian</p>
          )}
        </div>
      </div>
  );
}

export default function Parents() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', relationship: '', gender: '' });
  const [options, setOptions] = useState({ relationships: [], genders: [], students: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = useCallback((page = 1) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', page);
    apiFetch(`${API}/parents?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load parents'))))
        .then((res) => { setData(res.data); setMeta({ ...res, data: undefined }); })
        .catch(() => {});
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    apiFetch(`${API}/parents/filters`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load filter options'))))
        .then(setOptions)
        .catch(() => {});
  }, []);

  const flash = (text, type = 'success') => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (g) => { setEditing(g); setFormOpen(true); };

  const openView = (g) => {
    setViewing(null);
    apiFetch(`${API}/parents/${g.id}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load guardian details'))))
        .then((d) => setViewing(d))
        .catch(() => flash('Failed to load guardian details', 'error'));
  };

  const handleSaved = (saved) => {
    setFormOpen(false);
    flash(`Guardian "${saved.name}" saved.`);
    load(meta?.current_page || 1);
  };

  const confirmDelete = async () => {
    await apiFetch(`${API}/parents/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    flash(`Guardian "${deleting.name}" deleted.`);
    load(1);
  };

  const exportParents = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await apiFetch(`${API}/parents/export?${params.toString()}`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parents.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterSelect = (key, label) => (
      <select
          value={filters[key]}
          onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
          className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
      >
        <option value="">{label}</option>
        {(options[key] || []).map((v) => <option key={v} value={v}>{v}</option>)}
      </select>
  );

  return (
      <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <UsersRound size={26} className="text-indigo-600" /> Parent Management
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage guardians, link students, and provision parent accounts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportParents} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition">
              <Download size={15} /> Export
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition">
              <UserPlus size={15} /> Add Parent
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder="Search name, email, phone, relationship..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            {filterSelect('relationship', 'All Relationships')}
            {filterSelect('gender', 'All Genders')}
          </div>
          {(filters.search || filters.relationship || filters.gender) && (
              <button
                  onClick={() => setFilters({ search: '', relationship: '', gender: '' })}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear active filters
              </button>
          )}
        </div>

        {/* Guardians Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-200 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 text-left">Guardian</th>
                <th className="p-3.5 text-left hidden sm:table-cell">Relationship</th>
                <th className="p-3.5 text-left hidden md:table-cell">Contact</th>
                <th className="p-3.5 text-left">Children</th>
                <th className="p-3.5 text-left hidden lg:table-cell">Account</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar guardian={g} size={36} />
                        <div>
                          <p className="font-semibold text-slate-900">{g.name}</p>
                          <p className="text-[11px] text-slate-400">{g.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 hidden sm:table-cell text-slate-500">{g.relationship || '—'}</td>
                    <td className="p-3.5 hidden md:table-cell text-slate-500">
                      <span className="flex items-center gap-1"><Phone size={12} /> {g.phone || '—'}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        {g.students_count ?? 0} child{g.students_count === 1 ? '' : 'ren'}
                      </span>
                    </td>
                    <td className="p-3.5 hidden lg:table-cell">
                      {g.has_account ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">Active</span>
                      ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">No login</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => openView(g)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition" title="View Profile">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openEdit(g)} className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 transition" title="Edit Guardian">
                          <SquarePen size={13} />
                        </button>
                        <button onClick={() => setDeleting(g)} className="p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition" title="Delete Guardian">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              {data.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-400 font-medium">No guardians found</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination meta={meta} onPageChange={load} />

        {/* Modals */}
        {formOpen && (
            <Modal title={editing ? `Edit Guardian — ${editing.name}` : 'Add New Parent'} icon={editing ? SquarePen : UserPlus} onClose={() => setFormOpen(false)} wide>
              <GuardianForm
                  initial={{ ...EMPTY_FORM, ...editing }}
                  students={options.students}
                  onSave={handleSaved}
                  onClose={() => setFormOpen(false)}
              />
            </Modal>
        )}

        {viewing && (
            <Modal title="Guardian Profile" icon={UsersRound} onClose={() => setViewing(null)} wide>
              <GuardianDetail guardian={viewing} onEdit={(g) => { setViewing(null); openEdit(g); }} />
            </Modal>
        )}

        {deleting && (
            <Modal title="Confirm Delete" icon={Trash2} onClose={() => setDeleting(null)}>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <b>{deleting.name}</b>? Linked students will keep their records but lose their guardian assignment.
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition shadow-xs">Delete Guardian</button>
              </div>
            </Modal>
        )}
      </div>
  );
}
