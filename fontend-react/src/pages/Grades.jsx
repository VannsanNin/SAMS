import { useState, useEffect, useCallback } from 'react';
import { Award, Plus, Search } from 'lucide-react';
import { apiFetch } from '../api';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';

const API = '/api';
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all';

function Field({ label, required, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-700 mb-1">{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function GradeScaleForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [items, setItems] = useState(initial.items?.length ? initial.items : [
    { grade: 'A+', min_percentage: 90, max_percentage: 100, gpa_point: 4.0 },
    { grade: 'A', min_percentage: 80, max_percentage: 89.99, gpa_point: 4.0 },
    { grade: 'B+', min_percentage: 75, max_percentage: 79.99, gpa_point: 3.5 },
    { grade: 'B', min_percentage: 70, max_percentage: 74.99, gpa_point: 3.0 },
    { grade: 'C', min_percentage: 60, max_percentage: 69.99, gpa_point: 2.0 },
    { grade: 'D', min_percentage: 50, max_percentage: 59.99, gpa_point: 1.0 },
    { grade: 'F', min_percentage: 0, max_percentage: 49.99, gpa_point: 0.0 },
  ]);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setItem = (i, k) => (e) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: e.target.value } : it));

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const body = { ...form, items: items.map(it => ({ ...it, min_percentage: +it.min_percentage, max_percentage: +it.max_percentage, gpa_point: +it.gpa_point })) };
      const res = await apiFetch(`${API}/grade-scales`, { method: 'POST', body: JSON.stringify(body) });
      if (res.ok) onSave();
    } catch (e) {} finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Scale Name" required><input className={inputCls} value={form.name || ''} onChange={set('name')} required /></Field>
        <Field label="Academic Year"><input className={inputCls} value={form.academic_year || '2025-2026'} onChange={set('academic_year')} /></Field>
      </div>
      <div><label className="block text-xs font-medium text-slate-700 mb-1">Default Scale?</label><input type="checkbox" checked={form.is_default || false} onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))} className="rounded" /></div>
      <div className="space-y-2"><span className="text-xs font-medium text-slate-700">Grade Items</span>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 items-center">
            <input className={inputCls} placeholder="Grade" value={it.grade} onChange={setItem(i, 'grade')} />
            <input type="number" className={inputCls} placeholder="Min %" value={it.min_percentage} onChange={setItem(i, 'min_percentage')} />
            <input type="number" className={inputCls} placeholder="Max %" value={it.max_percentage} onChange={setItem(i, 'max_percentage')} />
            <input type="number" step="0.1" className={inputCls} placeholder="GPA" value={it.gpa_point} onChange={setItem(i, 'gpa_point')} />
            <button type="button" onClick={() => setItems(prev => prev.filter((_, j) => j !== i))} className="text-rose-500 hover:text-rose-700 text-xs">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => setItems(prev => [...prev, { grade: '', min_percentage: 0, max_percentage: 0, gpa_point: 0 }])} className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold">+ Add Grade</button>
      </div>
      <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border text-xs font-semibold hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition">{saving ? 'Saving...' : 'Save'}</button></div>
    </form>
  );
}

export default function Grades() {
  const [scales, setScales] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState('Semester 1');
  const [results, setResults] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [tab, setTab] = useState('scales');
  const [msg, setMsg] = useState(null);

  const loadScales = async () => { const r = await apiFetch(`${API}/grade-scales`); if (r.ok) setScales(await r.json()); };
  const loadClasses = async () => { const r = await apiFetch(`${API}/classes`); if (r.ok) { const d = await r.json(); setClasses(d.data || d); } };

  const loadResults = async () => {
    if (!classId) return;
    const r = await apiFetch(`${API}/grades/class/${classId}?academic_year=${academicYear}&semester=${semester}`);
    if (r.ok) setResults(await r.json());
  };

  useEffect(() => { loadScales(); loadClasses(); }, []);
  useEffect(() => { if (tab === 'results') loadResults(); }, [classId, academicYear, semester, tab]);

  const handleSaved = () => { setFormOpen(false); setMsg({ type: 'success', text: 'Grade scale created' }); loadScales(); setTimeout(() => setMsg(null), 3000); };

  return (
    <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Grades & Results</h1><p className="text-xs text-slate-500 font-medium mt-0.5">Manage grade scales and view class results</p></div>
        <div className="flex gap-2">
          <button onClick={() => setTab('scales')} className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${tab === 'scales' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Grade Scales</button>
          <button onClick={() => setTab('results')} className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${tab === 'results' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Class Results</button>
        </div>
      </div>
      {msg && <div className={`text-xs p-3 rounded-xl border ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{msg.text}</div>}

      {tab === 'scales' && (
        <>
          <button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2"><Plus size={16} /> New Grade Scale</button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scales.map(scale => (
              <div key={scale.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900">{scale.name}</h3>
                  {scale.is_default && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-full border border-indigo-200">Default</span>}
                </div>
                <table className="w-full text-xs"><thead><tr className="text-slate-500 border-b"><th className="text-left py-1.5">Grade</th><th className="text-left py-1.5">Range</th><th className="text-left py-1.5">GPA</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{(scale.items || []).map(it => <tr key={it.id}><td className="py-1.5 font-semibold">{it.grade}</td><td className="py-1.5">{it.min_percentage}% - {it.max_percentage}%</td><td className="py-1.5">{it.gpa_point}</td></tr>)}</tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'results' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap gap-3">
            <Field label="Class" required>
              <select className={inputCls + ' w-48'} value={classId} onChange={e => { setClassId(e.target.value); setResults(null); }}>
                <option value="">Select class...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </Field>
            <Field label="Academic Year"><input className={inputCls + ' w-40'} value={academicYear} onChange={e => setAcademicYear(e.target.value)} /></Field>
            <Field label="Semester"><input className={inputCls + ' w-40'} value={semester} onChange={e => setSemester(e.target.value)} /></Field>
            <button onClick={loadResults} className="self-end bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition">Load Results</button>
          </div>
          {results && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex gap-6 text-xs">
                <span>Students: <strong>{results.stats?.total_students}</strong></span>
                <span>Avg GPA: <strong>{results.stats?.average_gpa}</strong></span>
                <span>Avg %: <strong>{results.stats?.average_percentage}%</strong></span>
                <span className="text-emerald-600">Pass: <strong>{results.stats?.pass_count}</strong></span>
                <span className="text-rose-600">Fail: <strong>{results.stats?.fail_count}</strong></span>
              </div>
              <div className="bg-slate-900 text-slate-200 grid grid-cols-6 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wider"><div>Rank</div><div>Student</div><div>Total</div><div>Obtained</div><div>GPA</div><div>Grade</div></div>
              <div className="divide-y divide-slate-100 text-slate-700">
                {(results.results || []).map(r => (
                  <div key={r.student_id} className="grid grid-cols-6 gap-4 px-4 py-3 text-xs hover:bg-slate-50/80 transition items-center">
                    <div className="font-bold text-indigo-600">#{r.rank}</div>
                    <div><p className="font-semibold">{r.student_name}</p><p className="text-slate-500">{r.student_code}</p></div>
                    <div>{r.total_marks}</div>
                    <div className="font-semibold">{r.obtained_marks}</div>
                    <div className="font-bold">{r.gpa}</div>
                    <div><span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[10px]">{r.grade}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {formOpen && <Modal title="New Grade Scale" onClose={() => setFormOpen(false)} icon={Award}><GradeScaleForm initial={{ name: '', academic_year: '2025-2026', is_default: false }} onSave={handleSaved} onClose={() => setFormOpen(false)} /></Modal>}
    </div>
  );
}
