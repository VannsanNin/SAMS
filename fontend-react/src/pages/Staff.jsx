import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, SquarePen, UserPlus, Upload, Download, Search, Trash2, CalendarClock } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';

const EMPTY_FORM = {
  name: '', gender: 'Female', dob: '', phone: '', email: '',
  address: '', position: '', salary: '', hire_date: '',
};

const inputCls = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none';

function Field({ label, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

function StaffForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`${API}/staff${form.id ? `/${form.id}` : ''}`, {
        method: form.id ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Validation failed. Check the highlighted fields.');
      }
      onSave(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required>
          <input className={inputCls} value={form.name} onChange={set('name')} placeholder="e.g. Sreyneang Chen" required />
        </Field>
        <Field label="Gender" required>
          <select className={inputCls} value={form.gender} onChange={set('gender')} required>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
        </Field>
        <Field label="Date of Birth" required>
          <input type="date" className={inputCls} value={form.dob} onChange={set('dob')} required />
        </Field>
        <Field label="Phone" required>
          <input className={inputCls} value={form.phone} onChange={set('phone')} placeholder="e.g. 098765432" required />
        </Field>
        <Field label="Email" required>
          <input type="email" className={inputCls} value={form.email} onChange={set('email')} placeholder="name@school.edu" required />
        </Field>
        <Field label="Position" required>
          <input className={inputCls} value={form.position} onChange={set('position')} placeholder="e.g. Administrator" required />
        </Field>
        <Field label="Salary (USD)" required>
          <input type="number" step="0.01" min="0" className={inputCls} value={form.salary} onChange={set('salary')} placeholder="e.g. 1200" required />
        </Field>
        <Field label="Hire Date" required>
          <input type="date" className={inputCls} value={form.hire_date} onChange={set('hire_date')} required />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <textarea className={inputCls} value={form.address} onChange={set('address')} rows={2} placeholder="e.g. Phnom Penh" />
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border hover:bg-gray-50 font-medium">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-8 py-2.5 rounded-lg transition"
        >
          {saving ? 'Saving...' : form.id ? 'Update Staff' : 'Add Staff'}
        </button>
      </div>
    </form>
  );
}

function StaffDetail({ member, onEdit }) {
  const rows = [
    ['Position', member.position],
    ['Gender', member.gender],
    ['Date of Birth', member.dob],
    ['Phone', member.phone],
    ['Email', member.email],
    ['Address', member.address],
    ['Salary', member.salary ? `$${member.salary}` : '—'],
    ['Hire Date', member.hire_date],
    ['Days Employed', member.stats?.days_employed ?? '—'],
  ];

  const cards = [
    { label: 'Total Attendances', value: member.stats?.total_attendances ?? 0, cls: 'bg-blue-50 text-blue-700' },
    { label: 'Total Leaves', value: member.stats?.total_leaves ?? 0, cls: 'bg-purple-50 text-purple-700' },
    { label: 'Pending Leaves', value: member.stats?.pending_leaves ?? 0, cls: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-[72px] h-[72px] rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 text-2xl font-bold">
          {member.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold">{member.name}</h3>
          <p className="text-gray-500">{member.position}</p>
        </div>
        <button
          onClick={() => onEdit(member)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          <SquarePen size={15} />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl px-4 py-3 ${c.cls}`}>
            <p className="text-xs font-medium opacity-80">{c.label}</p>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Details</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm border-b border-gray-100 py-1.5">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-right">{value || '—'}</span>
          </div>
        ))}
      </div>

      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-6 mb-2 flex items-center gap-1.5">
        <CalendarClock size={14} /> Recent Leaves
      </h4>
      {member.leaves?.length ? (
        <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-2 text-left">Student</th>
                <th className="p-2 text-left">From</th>
                <th className="p-2 text-left">To</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {member.leaves.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="p-2">{l.student?.name ?? '—'}</td>
                  <td className="p-2">{l.date_from}</td>
                  <td className="p-2">{l.date_to}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-400 text-sm py-2">No leaves recorded.</p>
      )}
    </div>
  );
}

function ImportModal({ onClose, onImported }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiFetch(`${API}/staff/import`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Import failed.');
      setResult(data);
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Import Staff from Excel / CSV"
      icon={Upload}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg border hover:bg-gray-50 font-medium">Close</button>
          <button
            type="submit"
            form="import-form"
            disabled={busy}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-8 py-2.5 rounded-lg transition"
          >
            {busy ? 'Importing...' : 'Import File'}
          </button>
        </div>
      }
    >
      <form id="import-form" onSubmit={submit}>
        {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-600">{error}</div>}
        {result && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-green-50 text-green-700">
            {result.message}
            {result.skipped > 0 && ` Skipped ${result.skipped} row(s).`}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx"
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-sm text-gray-500 mt-3">Supported: <b>.csv</b> (preferred) and <b>.xlsx</b>.</p>
        <p className="text-sm text-gray-500 mt-2">
          Required columns: <b>name</b> and <b>email</b>. Position, salary, hire date, gender, phone, address are optional.
        </p>
        <div className="mt-3 rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Example CSV</p>
          <pre className="text-xs text-gray-500 whitespace-pre-wrap">{'Name,Gender,Phone,Email,Position,Salary,Hire Date\n"Kim Sreymom","Female","011222333","sreymom@school.edu","Registrar",1000,2022-03-01'}</pre>
        </div>
        {result?.errors?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-600 mb-1">Issues ({result.errors.length})</p>
            <ul className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3 max-h-40 overflow-y-auto">
              {result.errors.map((err, i) => <li key={i}>• {err}</li>)}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  );
}

export default function Staff() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', position: '', gender: '' });
  const [options, setOptions] = useState({ positions: [], genders: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = useCallback((page = 1) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', page);
    apiFetch(`${API}/staff?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load staff'))))
      .then((res) => { setData(res.data); setMeta({ ...res, data: undefined }); })
      .catch(() => {});
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => load(1), 350);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    apiFetch(`${API}/staff/filters`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load filter options'))))
      .then(setOptions)
      .catch(() => {});
  }, []);

  const flash = (text, type = 'success') => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const openAdd = () => { setEditing(null); setFormOpen(true); };

  const openEdit = (s) => { setEditing(s); setFormOpen(true); };

  const openView = (s) => {
    setViewing(null);
    setDetailLoading(true);
    apiFetch(`${API}/staff/${s.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load staff details'))))
      .then((d) => setViewing(d))
      .catch(() => flash('Failed to load staff details', 'error'))
      .finally(() => setDetailLoading(false));
  };

  const handleSaved = (saved) => {
    setFormOpen(false);
    flash(`Staff member "${saved.name}" saved.`);
    load(meta?.current_page || 1);
  };

  const confirmDelete = async () => {
    await apiFetch(`${API}/staff/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    flash(`Staff member "${deleting.name}" deleted.`);
    load(1);
  };

  const exportStaff = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const res = await apiFetch(`${API}/staff/export?${params.toString()}`);
    const text = await res.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterSelect = (key, label) => (
    <select
      value={filters[key]}
      onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
      className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
    >
      <option value="">{label}</option>
      {(options[key] || []).map((v) => <option key={v} value={v}>{v}</option>)}
    </select>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Users size={30} className="text-blue-600" /> Staff</h1>
        <div className="flex gap-2">
          <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border font-medium hover:bg-gray-50 text-sm">
            <Upload size={16} />
            Import
          </button>
          <button onClick={exportStaff} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border font-medium hover:bg-gray-50 text-sm">
            <Download size={16} />
            Export
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition text-sm">
            <UserPlus size={16} />
            Add Staff
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search name, email, phone, position..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {filterSelect('position', 'All Positions')}
          {filterSelect('gender', 'All Genders')}
        </div>
        {(filters.search || filters.position || filters.gender) && (
          <button
            onClick={() => setFilters({ search: '', position: '', gender: '' })}
            className="text-sm text-blue-600 hover:underline mt-3"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left hidden lg:table-cell">Gender</th>
              <th className="p-3 text-left hidden sm:table-cell">Position</th>
              <th className="p-3 text-left hidden md:table-cell">Phone</th>
              <th className="p-3 text-left hidden lg:table-cell">Salary</th>
              <th className="p-3 text-left hidden md:table-cell">Leaves</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500 lg:hidden">{s.position}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 hidden lg:table-cell">{s.gender}</td>
                <td className="p-3 hidden sm:table-cell">{s.position}</td>
                <td className="p-3 hidden md:table-cell">{s.phone ?? '—'}</td>
                <td className="p-3 hidden lg:table-cell">{s.salary ? `$${s.salary}` : '—'}</td>
                <td className="p-3 hidden md:table-cell">{s.leaves_count ?? 0}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => openView(s)} className="flex items-center gap-1 px-3 py-1.5 rounded border text-xs font-medium hover:bg-gray-50">
                      <Search size={13} />
                      View
                    </button>
                    <button onClick={() => openEdit(s)} className="flex items-center gap-1 px-3 py-1.5 rounded border text-xs font-medium text-blue-700 hover:bg-blue-50">
                      <SquarePen size={13} />
                      Edit
                    </button>
                    <button onClick={() => setDeleting(s)} className="flex items-center gap-1 px-3 py-1.5 rounded border text-xs font-medium text-red-700 hover:bg-red-50">
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan="7" className="p-10 text-center text-gray-400">No staff found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} onPageChange={load} />

      {formOpen && (
        <Modal
          title={editing ? `Edit Staff — ${editing.name}` : 'Add Staff'}
          icon={editing ? SquarePen : UserPlus}
          onClose={() => setFormOpen(false)}
          wide
        >
          <StaffForm
            initial={{ ...EMPTY_FORM, ...editing }}
            onSave={handleSaved}
            onClose={() => setFormOpen(false)}
          />
        </Modal>
      )}

      {viewing && (
        <Modal title="Staff Details" icon={Users} onClose={() => setViewing(null)} wide>
          <StaffDetail member={viewing} onEdit={(s) => { setViewing(null); openEdit(s); }} />
        </Modal>
      )}

      {detailLoading && (
        <Modal title="Staff Details" icon={Users} onClose={() => setDetailLoading(false)} wide>
          <div className="py-10 text-center text-gray-400">Loading staff...</div>
        </Modal>
      )}

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} onImported={() => load(1)} />}

      {deleting && (
        <Modal title="Delete Staff" icon={Trash2} onClose={() => setDeleting(null)}>
          <p className="text-gray-700">
            Are you sure you want to delete <b>{deleting.name}</b>? This will also remove their attendance and leave records.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setDeleting(null)} className="px-5 py-2.5 rounded-lg border hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button onClick={confirmDelete} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg">
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
