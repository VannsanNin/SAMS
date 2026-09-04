import { useState } from "react";
import { PageShell, Select } from "../components/shared";
import { CheckCircle2, AlertCircle, XCircle, CheckCheck, Save } from "lucide-react";

const ROSTER = [
  { id: "S-1001", name: "Sopheak Chan", avatar: "SC" },
  { id: "S-1002", name: "Dara Ly", avatar: "DL" },
  { id: "S-1003", name: "Rithy Sok", avatar: "RS" },
  { id: "S-1004", name: "Chenda Prum", avatar: "CP" },
  { id: "S-1005", name: "Vibol Heng", avatar: "VH" },
];

const STATUSES = [
  { key: "present", label: "Present", icon: CheckCircle2, activeBg: "bg-emerald-600 text-white border-emerald-600", inactiveBg: "bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50" },
  { key: "late", label: "Late", icon: AlertCircle, activeBg: "bg-amber-500 text-white border-amber-500", inactiveBg: "bg-white text-amber-700 border-slate-200 hover:bg-amber-50" },
  { key: "absent", label: "Absent", icon: XCircle, activeBg: "bg-red-600 text-white border-red-600", inactiveBg: "bg-white text-red-700 border-slate-200 hover:bg-red-50" },
];

export default function MarkAttendance() {
  const [cls, setCls] = useState("10B");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [marks, setMarks] = useState(Object.fromEntries(ROSTER.map((s) => [s.id, "present"])));
  const [submitted, setSubmitted] = useState(false);

  const setMark = (id, status) => {
    setMarks((m) => ({ ...m, [id]: status }));
    setSubmitted(false);
  };

  const markAll = (status) => {
    setMarks(Object.fromEntries(ROSTER.map((s) => [s.id, status])));
    setSubmitted(false);
  };

  const presentCount = Object.values(marks).filter((s) => s === "present").length;
  const lateCount = Object.values(marks).filter((s) => s === "late").length;
  const absentCount = Object.values(marks).filter((s) => s === "absent").length;

  return (
    <PageShell title="Mark Daily Attendance" sub="Select class section and date to record attendance roster">
      {/* Controls & Filters Bar */}
      <div className="impeccable-card p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="9A">Grade 9A (Science)</option>
              <option value="10B">Grade 10B (Mathematics)</option>
              <option value="11C">Grade 11C (Literature)</option>
            </Select>
          </div>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-3 pr-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs"
            />
          </div>
          <button
            onClick={() => markAll("present")}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200/80 transition-all"
          >
            <CheckCheck size={15} /> Mark All Present
          </button>
        </div>

        {/* Live Summary Chips */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            Present: <b>{presentCount}</b>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80">
            Late: <b>{lateCount}</b>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200/80">
            Absent: <b>{absentCount}</b>
          </span>
        </div>
      </div>

      {/* Roster Table Container */}
      <div className="impeccable-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name & ID</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Status</span>
        </div>
        <div className="divide-y divide-slate-100">
          {ROSTER.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                  {s.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{s.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {STATUSES.map((st) => {
                  const Icon = st.icon;
                  const isSelected = marks[s.id] === st.key;
                  return (
                    <button
                      key={st.key}
                      onClick={() => setMark(s.id, st.key)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                        isSelected ? st.activeBg + ' shadow-xs' : st.inactiveBg
                      }`}
                    >
                      <Icon size={14} />
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Submit Bar */}
      <div className="mt-6 flex items-center justify-between">
        {submitted ? (
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200">
            <CheckCircle2 size={16} /> Attendance recorded successfully for {date}
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium">Click save when ready to commit attendance records.</span>
        )}

        <button
          onClick={() => setSubmitted(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
        >
          <Save size={16} /> Save Roster Attendance
        </button>
      </div>
    </PageShell>
  );
}
