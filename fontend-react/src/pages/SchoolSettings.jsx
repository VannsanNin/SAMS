import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Calendar, Building2, DoorOpen, Landmark } from 'lucide-react';
import { apiFetch } from '../api';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function AcademicYearForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { const r = await apiFetch(`${API}/school/academic-years${form.id ? `/${form.id}` : ''}`, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(form) }); if (r.ok) onSave(); } catch { setSaving(false); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" required><input className={inputCls} value={form.name || ''} onChange={set('name')} required placeholder="2025-2026" /></Field>
        <Field label="Start Date" required><input type="date" className={inputCls} value={form.start_date || ''} onChange={set('start_date')} required /></Field>
        <Field label="End Date" required><input type="date" className={inputCls} value={form.end_date || ''} onChange={set('end_date')} required /></Field>
      </div>
      <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button><button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button></div>
    </form>
  );
}

function DepartmentForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { const r = await apiFetch(`${API}/school/departments${form.id ? `/${form.id}` : ''}`, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(form) }); if (r.ok) onSave(); } catch { setSaving(false); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" required><input className={inputCls} value={form.name || ''} onChange={set('name')} required /></Field>
        <Field label="Code" required><input className={inputCls} value={form.code || ''} onChange={set('code')} required /></Field>
      </div>
      <Field label="Description"><textarea className={inputCls} rows={2} value={form.description || ''} onChange={set('description')} /></Field>
      <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button><button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button></div>
    </form>
  );
}

function BuildingForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { const r = await apiFetch(`${API}/school/buildings${form.id ? `/${form.id}` : ''}`, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(form) }); if (r.ok) onSave(); } catch { setSaving(false); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" required><input className={inputCls} value={form.name || ''} onChange={set('name')} required /></Field>
        <Field label="Code" required><input className={inputCls} value={form.code || ''} onChange={set('code')} required /></Field>
        <Field label="Floors"><input type="number" className={inputCls} value={form.total_floors || 1} onChange={set('total_floors')} min="1" /></Field>
        <Field label="Status">
          <select className={inputCls} value={form.is_active === false ? 'inactive' : 'active'} onChange={e => set('is_active')({ target: { value: e.target.value === 'active' } })}>
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </Field>
      </div>
      <Field label="Address"><input className={inputCls} value={form.address || ''} onChange={set('address')} /></Field>
      <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button><button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button></div>
    </form>
  );
}

function RoomForm({ initial, buildings, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { const r = await apiFetch(`${API}/school/rooms${form.id ? `/${form.id}` : ''}`, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify({ ...form, capacity: +form.capacity || 0 }) }); if (r.ok) onSave(); } catch { setSaving(false); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Room Number" required><input className={inputCls} value={form.number || ''} onChange={set('number')} required /></Field>
        <Field label="Name" required><input className={inputCls} value={form.name || ''} onChange={set('name')} required /></Field>
        <Field label="Building" required>
          <select className={inputCls} value={form.building_id || ''} onChange={set('building_id')} required>
            <option value="">Select...</option>
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select className={inputCls} value={form.type || 'classroom'} onChange={set('type')}>
            {['classroom', 'lab', 'office', 'library', 'hall', 'other'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Capacity"><input type="number" className={inputCls} value={form.capacity || ''} onChange={set('capacity')} min="0" /></Field>
        <Field label="Floor"><input type="number" className={inputCls} value={form.floor || ''} onChange={set('floor')} min="0" /></Field>
      </div>
      <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold">Cancel</button><button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button></div>
    </form>
  );
}

export default function SchoolSettings() {
  const [tab, setTab] = useState('years');
  const [years, setYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState(null);

  const loadYears = async () => { const r = await apiFetch(`${API}/school/academic-years`); if (r.ok) { const d = await r.json(); setYears(d.data || d || []); } };
  const loadDepts = async () => { const r = await apiFetch(`${API}/school/departments`); if (r.ok) { const d = await r.json(); setDepartments(d.data || d || []); } };
  const loadBuildings = async () => { const r = await apiFetch(`${API}/school/buildings`); if (r.ok) { const d = await r.json(); setBuildings(d.data || d || []); } };
  const loadRooms = async () => { const r = await apiFetch(`${API}/school/rooms`); if (r.ok) { const d = await r.json(); setRooms(d.data || d || []); } };

  useEffect(() => { loadYears(); loadDepts(); loadBuildings(); loadRooms(); }, []);

  const handleSaved = () => { setFormOpen(false); setEditing(null); setMsg({ type: 'success', text: 'Saved' }); [loadYears, loadDepts, loadBuildings, loadRooms][['years', 'departments', 'buildings', 'rooms'].indexOf(tab)]?.(); setTimeout(() => setMsg(null), 3000); };
  const confirmDelete = async () => {
    if (!deleting) return;
    const endpoints = { years: 'school/academic-years', departments: 'school/departments', buildings: 'school/buildings', rooms: 'school/rooms' };
    await apiFetch(`${API}/${endpoints[tab]}/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null); setMsg({ text: 'Deleted' }); handleSaved();
  };

  const renderList = (data, renderFn) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map(item => (
        <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          {renderFn(item)}
          <div className="flex gap-2 border-t border-slate-100 pt-3 mt-3">
            <button onClick={() => { setEditing(item); setFormOpen(true); }} className="flex-1 text-center p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold transition">Edit</button>
            <button onClick={() => setDeleting(item)} className="flex-1 text-center p-2 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );

  const forms = { years: AcademicYearForm, departments: DepartmentForm, buildings: BuildingForm, rooms: RoomForm };
  const formProps = { years: {}, departments: {}, buildings: {}, rooms: { buildings } };
  const FormComponent = forms[tab];

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">School Settings</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Manage academic years, buildings, rooms, and departments</p></div>
      </div>
      {msg && <div className="text-xs p-3 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200">{msg.text}</div>}

      <div className="flex gap-2 flex-wrap">
        {[['years', Calendar, 'Academic Years'], ['departments', Landmark, 'Departments'], ['buildings', Building2, 'Buildings'], ['rooms', DoorOpen, 'Rooms']].map(([key, Icon, label]) => (
          <button key={key} onClick={() => { setTab(key); setFormOpen(false); setEditing(null); }} className={`text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${tab === key ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}><Icon size={14} /> {label}</button>
        ))}
      </div>

      <button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> Add {tab.slice(0, -1).replace('ie', 'y')}</button>

      {tab === 'years' && renderList(years, y => (
        <div><h3 className="font-bold text-slate-900">{y.name}</h3><p className="text-[10px] text-slate-500">{y.start_date} to {y.end_date}</p>{y.is_current && <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">Current</span>}</div>
      ))}
      {tab === 'departments' && renderList(departments, d => (
        <div><h3 className="font-bold text-slate-900">{d.name}</h3>{d.code && <p className="text-[10px] text-slate-500">Code: {d.code}</p>}{d.description && <p className="text-xs text-slate-600 mt-1">{d.description}</p>}</div>
      ))}
      {tab === 'buildings' && renderList(buildings, b => (
        <div><h3 className="font-bold text-slate-900">{b.name}</h3><p className="text-[10px] text-slate-500">{b.total_floors} floor(s) • <span className={`font-semibold ${b.is_active ? 'text-emerald-600' : 'text-amber-600'}`}>{b.is_active ? 'active' : 'inactive'}</span></p>{b.address && <p className="text-xs text-slate-600 mt-1">{b.address}</p>}</div>
      ))}
      {tab === 'rooms' && renderList(rooms, r => (
        <div><h3 className="font-bold text-slate-900">{r.number} {r.name && `- ${r.name}`}</h3><p className="text-[10px] text-slate-500 capitalize">{r.type} • Cap: {r.capacity || '—'} • Floor {r.floor || '—'}</p></div>
      ))}

      {formOpen && <Modal title={`${editing ? 'Edit' : 'New'} ${tab.slice(0, -1).replace('ie', 'y')}`} onClose={() => { setFormOpen(false); setEditing(null); }} icon={Settings} wide><FormComponent initial={editing || {}} {...(formProps[tab] || {})} onSave={handleSaved} onClose={() => { setFormOpen(false); setEditing(null); }} /></Modal>}
      {deleting && <Modal title="Confirm Delete" onClose={() => setDeleting(null)} icon={Trash2}><p className="text-sm text-slate-600">Delete <strong>{deleting.name || deleting.number || ''}</strong>?</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setDeleting(null)} className="px-4 py-2 rounded-xl border text-xs font-semibold">Cancel</button><button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition">Delete</button></div></Modal>}
    </div>
  );
}
