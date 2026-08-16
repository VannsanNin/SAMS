import { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, Clock, FileCheck, Save, AlertCircle, X, CheckCheck, UserX } from 'lucide-react';
import { apiFetch } from '../api';

const API = '/api';

const STATUS_ICONS = { present: CheckCircle2, absent: XCircle, late: Clock, excused: FileCheck };

const STATUS_ACTIVE_STYLES = {
  present: 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20',
  absent: 'text-rose-700 bg-rose-50 border-rose-200 ring-2 ring-rose-500/20',
  late: 'text-amber-700 bg-amber-50 border-amber-200 ring-2 ring-amber-500/20',
  excused: 'text-sky-700 bg-sky-50 border-sky-200 ring-2 ring-sky-500/20',
};

const selectCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all';

export default function MarkAttendance() {
  const [classes, setClasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    Promise.all([
      apiFetch(`${API}/classes?per_page=50`).then(r => r.json()),
      apiFetch(`${API}/schedules?per_page=100`).then(r => r.json()),
      apiFetch(`${API}/staff?per_page=50`).then(r => r.json()),
    ]).then(([c, s, st]) => {
      setClasses(c.data ?? c);
      setSchedules(s.data ?? s);
      setStaffList(st.data ?? st);
    }).catch(() => {
      setMsg({ type: 'error', text: 'Failed to load initial workspace data' });
    }).finally(() => setPageLoading(false));
  }, []);

  const filteredSchedules = schedules.filter(
      s => selectedClass && String(s.class_id) === String(selectedClass)
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const selected = selectedClass && selectedSchedule && selectedDate;
      setLoading(true);
      setMsg({ type: '', text: '' });

      try {
        const [stuRes, attRes] = await Promise.all(
            selected
                ? [
                  apiFetch(`${API}/students?class_id=${selectedClass}&per_page=200`).then(r => r.json()),
                  apiFetch(`${API}/attendances?schedule_id=${selectedSchedule}&date=${selectedDate}&per_page=500`).then(r => r.json()),
                ]
                : [Promise.resolve({ data: [] }), Promise.resolve({ data: [] })]
        );
        if (cancelled) return;
        const list = stuRes.data ?? stuRes;
        const existing = attRes.data ?? attRes;
        const map = {};
        existing.forEach(a => { map[a.student_id] = a.status; });
        const att = {};
        list.forEach(s => { att[s.id] = map[s.id] || 'present'; });
        setStudents(list);
        setAttendance(att);
      } catch {
        if (!cancelled) setMsg({ type: 'error', text: 'Failed to fetch student roll list' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [selectedClass, selectedSchedule, selectedDate]);

  const setBulkStatus = (status) => {
    const next = {};
    students.forEach((s) => { next[s.id] = status; });
    setAttendance(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchedule || !selectedStaff || !selectedDate) {
      setMsg({ type: 'error', text: 'Please select class, schedule, date, and recording staff' });
      return;
    }
    setSaving(true);
    setMsg({ type: '', text: '' });

    const records = students.map(s => ({
      student_id: s.id,
      status: attendance[s.id] || 'present',
    }));

    try {
      const res = await apiFetch(`${API}/attendances/bulk`, {
        method: 'POST',
        body: JSON.stringify({ schedule_id: selectedSchedule, staff_id: selectedStaff, date: selectedDate, records }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save attendance records');
      }
      setMsg({ type: 'success', text: `Attendance successfully updated for ${records.length} students.` });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-400 font-medium text-xs">Loading attendance panel...</div>;
  }

  return (
      <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ClipboardCheck size={26} className="text-indigo-600" /> Mark Attendance
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Record and update daily student session participation</p>
          </div>
        </div>

        {msg.text && (
            <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <div className="flex items-center gap-2">
                {msg.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                <span>{msg.text}</span>
              </div>
              <button onClick={() => setMsg({ type: '', text: '' })}><X size={14} /></button>
            </div>
        )}

        {/* Control Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Class Section</label>
              <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSchedule(''); }} className={selectCls}>
                <option value="">— Select Class —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Course Schedule</label>
              <select value={selectedSchedule} onChange={e => setSelectedSchedule(e.target.value)} className={selectCls} disabled={!selectedClass}>
                <option value="">— Select Schedule —</option>
                {filteredSchedules.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.subject?.subject_name ?? 'N/A'} — {s.day} {s.time_start?.slice(0,5)}-{s.time_end?.slice(0,5)}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Session Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={selectCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Recorded By (Staff)</label>
              <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className={selectCls}>
                <option value="">— Select Staff —</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Status States */}
        {loading && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium text-xs">
              Loading student roll list...
            </div>
        )}

        {!loading && !selectedClass && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium text-xs">
              Select a class, course schedule, and session date to begin marking attendance.
            </div>
        )}

        {!loading && selectedClass && students.length === 0 && !selectedSchedule && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium text-xs">
              Select an active schedule to retrieve the student roster.
            </div>
        )}

        {!loading && students.length === 0 && selectedClass && selectedSchedule && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium text-xs">
              No students currently enrolled in this class section.
            </div>
        )}

        {/* Student List & Attendance Actions */}
        {!loading && students.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {/* Table Action Bar */}
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Student Roll List ({students.length})
              </span>
                  <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setBulkStatus('present')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition"
                    >
                      <CheckCheck size={13} /> Mark All Present
                    </button>
                    <button
                        type="button"
                        onClick={() => setBulkStatus('absent')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                    >
                      <UserX size={13} /> Mark All Absent
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-900 text-slate-200 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 text-left w-12">#</th>
                      <th className="p-3.5 text-left">Student Name</th>
                      <th className="p-3.5 text-left w-28">Gender</th>
                      <th className="p-3.5 text-left">Attendance Status</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                    {students.map((s, i) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 text-slate-400 font-medium">{i + 1}</td>
                          <td className="p-3.5 font-semibold text-slate-900">{s.name}</td>
                          <td className="p-3.5 text-slate-500 capitalize">{s.gender}</td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-2">
                              {['present', 'absent', 'late', 'excused'].map(st => {
                                const Icon = STATUS_ICONS[st];
                                const active = attendance[s.id] === st;
                                return (
                                    <label
                                        key={st}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-xs font-semibold transition ${
                                            active
                                                ? STATUS_ACTIVE_STYLES[st]
                                                : 'text-slate-500 bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                      <input
                                          type="radio"
                                          name={`s-${s.id}`}
                                          value={st}
                                          checked={active}
                                          onChange={() => setAttendance(prev => ({ ...prev, [s.id]: st }))}
                                          className="hidden"
                                      />
                                      {Icon && <Icon size={13} />}
                                      {st.charAt(0).toUpperCase() + st.slice(1)}
                                    </label>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-slate-500">
              Total Students: <b className="text-slate-900">{students.length}</b>
            </span>
                <button
                    type="submit"
                    disabled={saving || !selectedStaff}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-8 rounded-xl text-xs transition shadow-xs"
                >
                  <Save size={16} />
                  {saving ? 'Saving Records...' : 'Save Attendance'}
                </button>
              </div>
            </form>
        )}
      </div>
  );
}