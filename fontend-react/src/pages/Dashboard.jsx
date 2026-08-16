import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { apiFetch } from '../api';
import {
  TrendingUp, BarChart3, ChartPie, ListChecks, Trophy, TriangleAlert, CalendarDays,
  GraduationCap, History, Building2, CheckCircle2, XCircle, Clock, CalendarCheck,
  Inbox, ClipboardPlus, Sparkles, CalendarOff, School, FileText, UserPlus, UserRoundPlus
} from 'lucide-react';

const API = '/api';

const STATUS_META = {
  present: { label: 'Present', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', color: '#10b981' },
  absent: { label: 'Absent', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200/60', color: '#f43f5e' },
  late: { label: 'Late', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200/60', color: '#f59e0b' },
  excused: { label: 'Excused', dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 border-sky-200/60', color: '#0284c7' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta ? meta.badge : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {meta ? meta.label : status}
    </span>
  );
}

function Card({ title, subtitle, right, icon: Icon, className = '', children }) {
  return (
      <section className={`bg-white rounded-2xl border border-slate-150 shadow-sm hover:shadow-md transition-shadow duration-200 p-6 ${className}`}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            {Icon && (
                <div className="p-2.5 rounded-xl bg-indigo-50/80 text-indigo-600 border border-indigo-100/50">
                  <Icon size={18} />
                </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {right}
        </div>
        {children}
      </section>
  );
}

function StatCard({ label, value, icon: Icon, accentColor, sub }) {
  return (
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
        <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor}`} />
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>}
          </div>
          {Icon && (
              <div className="p-3 rounded-xl bg-slate-50 text-slate-600 group-hover:scale-105 transition-transform duration-200">
                <Icon size={22} />
              </div>
          )}
        </div>
      </div>
  );
}

function MiniStat({ label, value, icon: Icon }) {
  return (
      <div className="flex items-center gap-3 bg-white border border-slate-200/60 rounded-xl px-4 py-3 shadow-xs">
        {Icon && (
            <div className="p-2 rounded-lg bg-slate-100/80 text-slate-600">
              <Icon size={16} />
            </div>
        )}
        <div>
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          <p className="font-bold text-slate-900 text-sm tracking-tight">{value}</p>
        </div>
      </div>
  );
}

function RateList({ items, max = 6 }) {
  const list = useMemo(
      () => [...items].sort((a, b) => b.attendance_rate - a.attendance_rate).slice(0, max),
      [items, max]
  );
  if (list.length === 0) return <p className="text-slate-400 text-sm py-6 text-center">No data available</p>;
  return (
      <div className="space-y-3.5">
        {list.map((it) => (
            <div key={`${it.name}-${it.id ?? ''}`}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700 truncate">{it.name}</span>
                <span className="text-slate-500 font-semibold ml-2">{it.attendance_rate}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(it.attendance_rate, 2)}%` }}
                />
              </div>
            </div>
        ))}
      </div>
  );
}

function TrendChart({ trend }) {
  const [range, setRange] = useState(30);
  const data = useMemo(() => trend.slice(-range), [trend, range]);
  return (
      <Card
          icon={TrendingUp}
          title="Daily Attendance Trend"
          subtitle="Students present / absent / late per day"
          right={
            <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium text-slate-600">
              {[7, 30].map((r) => (
                  <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`px-3 py-1 rounded-md transition ${range === r ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'}`}
                  >
                    {r}d
                  </button>
              ))}
            </div>
          }
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="count" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(value, name) => [value, name === 'attendance_rate' ? 'Rate %' : name]}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
              <Bar yAxisId="count" dataKey="absent" name="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={8} />
              <Bar yAxisId="count" dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={8} />
              <Area yAxisId="count" dataKey="present" name="Present" fill="#10b981" fillOpacity={0.15} stroke="#10b981" strokeWidth={2} />
              <Line yAxisId="rate" dataKey="attendance_rate" name="Attendance %" stroke="#6366f1" strokeWidth={2.5} dot={false} type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
  );
}

function MonthlyRateChart({ monthly }) {
  return (
      <Card icon={BarChart3} title="Monthly Attendance Rate" subtitle="Last 6 months performance">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthly} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="attendance_rate" name="Attendance %" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
  );
}

function PresentVsAbsentChart({ today }) {
  const data = [
    { name: 'Present', value: today.present, color: STATUS_META.present.color },
    { name: 'Absent', value: today.absent, color: STATUS_META.absent.color },
    { name: 'Late', value: today.late, color: STATUS_META.late.color },
    { name: 'Excused', value: today.excused, color: STATUS_META.excused.color },
  ].filter((d) => d.value > 0);

  return (
      <Card icon={ChartPie} title="Today's Breakdown" subtitle={`${today.total} total records`}>
        {data.length === 0 ? (
            <p className="text-slate-400 text-sm py-16 text-center">No records today</p>
        ) : (
            <div className="h-56 flex flex-col justify-between">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                      {data.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-medium">
                {data.map((d) => (
                    <span key={d.name} className="flex items-center justify-between text-slate-600 px-2 py-1 rounded-lg bg-slate-50">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-bold text-slate-900">{d.value}</span>
              </span>
                ))}
              </div>
            </div>
        )}
      </Card>
  );
}

function TodaySummaryTable({ today }) {
  const rows = ['present', 'absent', 'late', 'excused'];
  return (
      <Card icon={ListChecks} title="Status Summary" subtitle="Today's distribution">
        <div className="overflow-hidden rounded-xl border border-slate-200/80">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-slate-200 uppercase font-semibold tracking-wider">
            <tr>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Count</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((s) => (
                <tr key={s} className="hover:bg-slate-50/80 transition">
                  <td className="p-3">
                  <span className="flex items-center gap-2 font-medium">
                    <span className={`w-2 h-2 rounded-full ${STATUS_META[s].dot}`} />
                    {STATUS_META[s].label}
                  </span>
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">{today[s]}</td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
          <span className="text-xs font-semibold text-indigo-900">Overall Rate</span>
          <span className="text-xl font-bold text-indigo-600">
          {today.total > 0 ? `${today.attendance_rate}%` : '—'}
        </span>
        </div>
      </Card>
  );
}

function TopAttendance({ top }) {
  return (
      <Card icon={Trophy} title="Top Performers" subtitle="Highest attendance benchmarks">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <p className="text-xs font-semibold text-emerald-800">Top Class</p>
            <p className="text-base font-bold text-slate-900 mt-1">{top.best_class ? top.best_class.name : '—'}</p>
            <p className="text-xs text-emerald-700 font-medium mt-0.5">{top.best_class ? `${top.best_class.attendance_rate}% Rate` : 'No data'}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
            <p className="text-xs font-semibold text-indigo-800">Top Department</p>
            <p className="text-base font-bold text-slate-900 mt-1">{top.best_department ? top.best_department.name : '—'}</p>
            <p className="text-xs text-indigo-700 font-medium mt-0.5">{top.best_department ? `${top.best_department.attendance_rate}% Rate` : 'No data'}</p>
          </div>
        </div>

        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Top Perfect Attendance Students</h3>
        {top.perfect_students.length === 0 ? (
            <p className="text-slate-400 text-xs py-2">No perfect attendance recorded yet</p>
        ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200/80">
              <table className="w-full text-xs">
                <thead className="bg-slate-900 text-slate-200 font-semibold uppercase">
                <tr>
                  <th className="p-2.5 text-left">#</th>
                  <th className="p-2.5 text-left">Student</th>
                  <th className="p-2.5 text-left">Class</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                {top.perfect_students.map((s, i) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 text-slate-400 font-medium">{i + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{s.name}</td>
                      <td className="p-2.5 text-slate-500">{s.class ?? '—'}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-600">{s.total}</td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
      </Card>
  );
}

function AlertsSection({ alerts }) {
  const items = [
    ...alerts.consecutive_absent.map((a) => ({ tone: 'red', title: `${a.name} absent ${a.days} days in a row`, detail: `${a.class ?? '—'} · Since ${a.since}` })),
    ...alerts.below_75.map((a) => ({ tone: 'amber', title: `${a.name} under 75% threshold`, detail: `${a.class ?? '—'} · ${a.attendance_rate}%` })),
    ...alerts.teachers_no_submission.map((t) => ({ tone: 'orange', title: `${t.name} submission pending`, detail: `${t.pending_schedules} pending schedule(s)` })),
    ...alerts.holidays.map((h) => ({ tone: 'blue', title: `Holiday: ${h}`, detail: '' })),
  ];

  const tones = {
    red: 'border-rose-200 bg-rose-50/50 text-rose-900',
    amber: 'border-amber-200 bg-amber-50/50 text-amber-900',
    orange: 'border-orange-200 bg-orange-50/50 text-orange-900',
    blue: 'border-sky-200 bg-sky-50/50 text-sky-900',
  };

  return (
      <Card icon={TriangleAlert} title="Operational Alerts" subtitle="Requires immediate action">
        {items.length === 0 ? (
            <p className="text-slate-400 text-xs py-8 text-center">All systems standard — zero active alerts</p>
        ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {items.map((item, i) => (
                  <li key={i} className={`rounded-xl border p-3 text-xs ${tones[item.tone]}`}>
                    <p className="font-semibold">{item.title}</p>
                    {item.detail && <p className="opacity-80 mt-0.5">{item.detail}</p>}
                  </li>
              ))}
            </ul>
        )}
      </Card>
  );
}

function TodaySchedule({ schedule }) {
  const statusMeta = {
    current: { label: 'In Progress', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    upcoming: { label: 'Up Next', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    past: { label: 'Completed', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  };

  return (
      <Card icon={CalendarDays} title="Today's Timetable" subtitle={`${schedule.length} active sessions`}>
        <ul className="space-y-2">
          {schedule.map((s) => {
            const meta = statusMeta[s.status];
            return (
                <li key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 p-3 hover:border-slate-300 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-center w-12 shrink-0 border-r border-slate-100 pr-2">
                      <p className="text-xs font-bold text-slate-900">{s.time_start}</p>
                      <p className="text-[10px] text-slate-400">{s.time_end}</p>
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 truncate">{s.subject}</p>
                      <p className="text-[11px] text-slate-500 truncate">{s.class} · {s.teacher}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.cls}`}>
                {meta.label}
              </span>
                </li>
            );
          })}
        </ul>
      </Card>
  );
}

function RecentRecords({ records }) {
  return (
      <Card icon={History} title="Live Log" subtitle="Real-time attendance recordings">
        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-slate-200 font-semibold uppercase">
            <tr>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Student</th>
              <th className="p-3 text-left">Class</th>
              <th className="p-3 text-left">Course</th>
              <th className="p-3 text-left">Status</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
            {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-semibold text-slate-900">{r.time}</td>
                  <td className="p-3">{r.student ?? '—'}</td>
                  <td className="p-3 text-slate-500">{r.class ?? '—'}</td>
                  <td className="p-3 text-slate-500">{r.subject ?? '—'}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                </tr>
            ))}
            </tbody>
          </table>
        </div>
      </Card>
  );
}

function QuickActions() {
  return (
      <Card icon={Sparkles} title="Quick Actions" subtitle="Streamlined operational shortcuts">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Take Attendance', icon: ClipboardPlus, to: '/mark-attendance', color: 'bg-indigo-600 hover:bg-indigo-700' },
            { label: 'Add Student', icon: UserPlus, to: '/students', color: 'bg-slate-800 hover:bg-slate-900' },
            { label: 'Add Teacher', icon: UserRoundPlus, to: '/teachers', color: 'bg-slate-800 hover:bg-slate-900' },
            { label: 'View Reports', icon: FileText, to: '/reports', color: 'bg-slate-800 hover:bg-slate-900' },
          ].map(({ label, icon: Icon, to, color }) => (
              <Link key={label} to={to} className={`flex items-center justify-center gap-2 text-xs font-semibold text-white rounded-xl p-3 shadow-xs transition ${color}`}>
                <Icon size={15} />
                {label}
              </Link>
          ))}
        </div>
      </Card>
  );
}

function PersonalDashboard({ data, roleLabel }) {
  const children = data.children || [];

  return (
      <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {roleLabel} view · {new Date(data.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link to="/leaves" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition">
            <CalendarOff size={16} /> Request Leave
          </Link>
        </div>

        {children.length === 0 && (
            <Card icon={Inbox} title="No Records" subtitle="Nothing linked to your account yet">
              <p className="text-slate-400 text-sm py-8 text-center">No students are associated with your account. Contact the school administration.</p>
            </Card>
        )}

        {children.map((child) => {
          const s = child.stats || { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendance_rate: 0 };
          return (
              <div key={child.id} className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-50/80 text-indigo-600 border border-indigo-100/50">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-900 tracking-tight">{child.name}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{child.class || '—'} · {child.student_code || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-2">
                      <CalendarCheck size={15} />
                      {s.total > 0 ? `${s.attendance_rate}% Attendance Rate` : 'No records yet'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <MiniStat label="Total Records" value={s.total} icon={ListChecks} />
                    <MiniStat label="Present" value={s.present} icon={CheckCircle2} />
                    <MiniStat label="Absent" value={s.absent} icon={XCircle} />
                    <MiniStat label="Late" value={s.late} icon={Clock} />
                    <MiniStat label="Excused" value={s.excused} icon={CalendarCheck} />
                  </div>
                </div>

                <Card icon={CalendarDays} title="Today's Classes" subtitle={`${(child.today || []).length} recorded session(s)`}>
                  {child.today?.length ? (
                      <ul className="space-y-2">
                        {child.today.map((t) => (
                            <li key={t.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 p-3 hover:border-slate-300 transition">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xs font-bold text-slate-900 w-10 shrink-0">{t.time || '--:--'}</span>
                                <span className="text-xs font-medium text-slate-600 truncate">{t.subject || '—'}</span>
                              </div>
                              <StatusBadge status={t.status} />
                            </li>
                        ))}
                      </ul>
                  ) : (
                      <p className="text-slate-400 text-sm py-6 text-center">No attendance recorded for today</p>
                  )}
                </Card>
              </div>
          );
        })}

        <RecentRecords records={data.recent || []} />
      </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch(`${API}/dashboard`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load dashboard'))))
        .then((res) => setData(res))
        .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-6 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200">Error: {error}</div>;
  if (!data) return <div className="flex items-center justify-center h-96 text-slate-400 font-medium">Loading metrics...</div>;

  if (data.view === 'parent' || data.view === 'student') {
    return <PersonalDashboard data={data} roleLabel={data.view === 'parent' ? 'Parent' : 'Student'} />;
  }

  const { counts, today } = data;

  return (
      <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Dashboard</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Link to="/mark-attendance" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition">
            <ClipboardPlus size={16} /> Take Attendance
          </Link>
        </div>

        {/* Primary KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Enrolled" value={counts.students} icon={GraduationCap} accentColor="bg-indigo-600" />
          <StatCard label="Present Today" value={today.present} icon={CheckCircle2} accentColor="bg-emerald-500" />
          <StatCard label="Absent Today" value={today.absent} icon={XCircle} accentColor="bg-rose-500" />
          <StatCard label="Daily Rate" value={today.total > 0 ? `${today.attendance_rate}%` : '—'} icon={CalendarCheck} accentColor="bg-sky-500" />
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8"><TrendChart trend={data.trend} /></div>
          <div className="lg:col-span-4"><PresentVsAbsentChart today={today} /></div>

          <div className="lg:col-span-4"><MonthlyRateChart monthly={data.monthly} /></div>
          <div className="lg:col-span-4"><Card icon={School} title="By Class"><RateList items={data.by_class} /></Card></div>
          <div className="lg:col-span-4"><Card icon={Building2} title="By Department"><RateList items={data.by_department} /></Card></div>

          <div className="lg:col-span-8"><RecentRecords records={data.recent} /></div>
          <div className="lg:col-span-4"><TodaySummaryTable today={today} /></div>

          <div className="lg:col-span-7"><TopAttendance top={data.top} /></div>
          <div className="lg:col-span-5 space-y-6">
            <TodaySchedule schedule={data.schedule} exams={data.exams_today} events={data.events_today} />
            <AlertsSection alerts={data.alerts} />
          </div>

          <div className="lg:col-span-12"><QuickActions /></div>
        </div>
      </div>
  );
}