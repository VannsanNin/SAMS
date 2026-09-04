import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  CalendarCheck, Award, ClipboardList, DollarSign, Megaphone, CalendarOff, Calendar, ArrowUpRight
} from 'lucide-react';

const ICONS = {
  attendance: CalendarCheck,
  average: Award,
  assignments: ClipboardList,
  fees: DollarSign,
};

const CHART_PALETTE = ['#10B981', '#F59E0B', '#EF4444'];

const tooltipStyle = {
  backgroundColor: '#0F172A',
  borderRadius: '0.75rem',
  border: '1px solid #1E293B',
  color: '#F8FAFC',
  fontSize: '12px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
};

function StatCard({ item }) {
  const Icon = ICONS[item.icon] || Award;
  const value = `${item.prefix ?? ''}${item.value}${item.suffix ?? ''}`;
  return (
    <div className="impeccable-card p-5 flex flex-col justify-between group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.label}</span>
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 group-hover:scale-105 transition-transform duration-200">
          <Icon size={19} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight truncate">{value}</p>
        <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ArrowUpRight size={14} />
          <span>Student portal</span>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="impeccable-card p-6">
      <div className="mb-4">
        <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function ListCard({ title, subtitle, children }) {
  return (
    <section className="impeccable-card p-6">
      <div className="mb-4">
        <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function GradeTrend({ data }) {
  return (
    <ChartCard title="My Grade Trend" subtitle="Average marks across periods">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="average" name="Average" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#4F46E5', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function SubjectWise({ data }) {
  return (
    <ChartCard title="Subject Performance" subtitle="Score by subject">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="score" name="Score" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function AttendanceBreakdown({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard title="Attendance Breakdown" subtitle="Present / late / absent">
      {total === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-16 font-medium">No attendance records yet</p>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" innerRadius={50} outerRadius={75} paddingAngle={4} strokeWidth={0}>
                {data.map((d, i) => <Cell key={d.label} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">
            {data.map((d, i) => (
              <span key={d.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                {d.label} · <b>{d.value}</b>
              </span>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}

function EmptyMessage({ text }) {
  return <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6 font-medium">{text}</p>;
}

export default function StudentDashboard({ data }) {
  const kpis = data.kpis || [];
  const g = data.graphs || {};
  const l = data.lists || {};

  const asArr = (v) => (Array.isArray(v) ? v : []);

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">Student Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-2">
            <Calendar size={15} className="text-indigo-600 dark:text-indigo-400" />
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          to="/leaves"
          className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all"
        >
          <CalendarOff size={16} /> Request Leave
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {kpis.map((k, i) => <StatCard key={i} item={k} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5"><GradeTrend data={asArr(g.grade_trend)} /></div>
        <div className="lg:col-span-4"><SubjectWise data={asArr(g.subject_wise)} /></div>
        <div className="lg:col-span-3"><AttendanceBreakdown data={asArr(g.attendance_breakdown)} /></div>

        <div className="lg:col-span-5">
          <ListCard title="Today's Timetable" subtitle={`${(l.today_timetable || []).length} session(s)`}>
            {l.today_timetable?.length ? (
              <ul className="space-y-2.5">
                {l.today_timetable.map((s) => (
                  <li key={s.id} className="flex items-center justify-between border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{s.subject || '—'}</p>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full whitespace-nowrap">{s.time_start}–{s.time_end}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No classes today" />}
          </ListCard>
        </div>

        <div className="lg:col-span-4">
          <ListCard title="Upcoming Assignments & Exams" subtitle="With due dates">
            <div className="space-y-3.5">
              {l.upcoming_assignments?.length ? (
                <>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Assignments</p>
                  <ul className="space-y-2">
                    {l.upcoming_assignments.map((h) => (
                      <li key={h.id} className="flex items-center justify-between border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/40">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{h.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{h.subject || '—'}</p>
                        </div>
                        <div className="pl-2 text-right whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${h.status === 'submitted' ? 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60' : 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60'}`}>
                            {h.status}
                          </span>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Due {h.due_date}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {l.upcoming_exams?.length ? (
                <>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Exams</p>
                  <ul className="space-y-2">
                    {l.upcoming_exams.map((e) => (
                      <li key={e.id} className="flex items-center justify-between border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/40">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{e.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{e.subject || '—'}</p>
                        </div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full whitespace-nowrap">{e.date}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {!l.upcoming_assignments?.length && !l.upcoming_exams?.length && <EmptyMessage text="No upcoming items" />}
            </div>
          </ListCard>
        </div>

        <div className="lg:col-span-3">
          <ListCard title="Recent Grades">
            {l.recent_grades?.length ? (
              <ul className="space-y-2.5">
                {l.recent_grades.map((m, i) => (
                  <li key={i} className="flex items-center justify-between border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{m.subject || '—'}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{m.date || '—'}</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">{m.marks}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No grades yet" />}
          </ListCard>
        </div>

        <div className="lg:col-span-12">
          <ListCard title="Announcements & Notices">
            {l.announcements?.length ? (
              <ul className="space-y-3">
                {l.announcements.map((a) => (
                  <li key={a.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Megaphone size={15} className="text-indigo-600 dark:text-indigo-400" /> {a.title}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pl-2 whitespace-nowrap">{a.date}</span>
                    </div>
                    {a.body && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">{a.body}</p>}
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No announcements" />}
          </ListCard>
        </div>
      </div>
    </div>
  );
}
