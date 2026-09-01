import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  CalendarCheck, Award, ClipboardList, DollarSign, Megaphone, CalendarOff,
} from 'lucide-react';

const ICONS = {
  attendance: CalendarCheck,
  average: Award,
  assignments: ClipboardList,
  fees: DollarSign,
};

const COLORS = ['#6E8F68', '#D98E2B', '#C25B45'];

const tooltipStyle = {
  backgroundColor: '#1E2A4A', borderRadius: '4px', border: 'none', color: '#faf8f3', fontSize: '12px',
};

function StatCard({ item }) {
  const Icon = ICONS[item.icon] || Award;
  const value = `${item.prefix ?? ''}${item.value}${item.suffix ?? ''}`;
  return (
    <div className="bg-white border border-hairline rounded-sm p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-ledger-slate uppercase tracking-wider">{item.label}</h3>
          <p className="text-3xl font-bold text-ink mt-2 tracking-tight truncate">{value}</p>
        </div>
        <div className="p-3 rounded-sm bg-paper text-ochre border border-[#E4DECF] shrink-0">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="bg-white border border-hairline rounded-sm p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-ink tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-ledger-slate mt-0.5 mb-3">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ListCard({ title, subtitle, children }) {
  return (
    <section className="bg-white border border-hairline rounded-sm p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-ink tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-ledger-slate mt-0.5">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function GradeTrend({ data }) {
  return (
    <ChartCard title="My Grade Trend" subtitle="Average marks across periods">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ece7db" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="average" name="Average" stroke="#D98E2B" strokeWidth={2.5} dot={{ fill: '#1E2A4A', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function SubjectWise({ data }) {
  return (
    <ChartCard title="Subject-wise Performance" subtitle="Score by subject">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ece7db" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="score" name="Score" fill="#1E2A4A" radius={[2, 2, 0, 0]} barSize={26} />
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
        <p className="text-ledger-slate text-sm text-center py-16">No attendance records yet</p>
      ) : (
        <div className="h-60 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" innerRadius={50} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                {data.map((d, i) => <Cell key={d.label} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 text-xs font-medium text-ink">
            {data.map((d) => (
              <span key={d.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[data.indexOf(d) % COLORS.length] }} />
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
  return <p className="text-ledger-slate text-sm text-center py-6">{text}</p>;
}

export default function StudentDashboard({ data }) {
  const kpis = data.kpis || [];
  const g = data.graphs || {};
  const l = data.lists || {};

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Student Dashboard</h1>
          <p className="text-xs text-ledger-slate font-medium mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/leaves" className="inline-flex items-center gap-2 border border-ink text-ink font-semibold text-xs px-4 py-2.5 rounded-sm transition">
          <CalendarOff size={15} /> Request Leave
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => <StatCard key={i} item={k} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5"><GradeTrend data={g.grade_trend || []} /></div>
        <div className="lg:col-span-4"><SubjectWise data={g.subject_wise || []} /></div>
        <div className="lg:col-span-3"><AttendanceBreakdown data={g.attendance_breakdown || []} /></div>

        <div className="lg:col-span-5">
          <ListCard title="Today's Timetable" subtitle={`${(l.today_timetable || []).length} session(s)`}>
            {l.today_timetable?.length ? (
              <ul className="space-y-2">
                {l.today_timetable.map((s) => (
                  <li key={s.id} className="flex items-center justify-between border border-[#E4DECF] rounded-sm p-3">
                    <p className="text-xs font-semibold text-ink truncate">{s.subject || '—'}</p>
                    <span className="text-[11px] font-semibold text-ledger-slate pl-2 whitespace-nowrap">{s.time_start}–{s.time_end}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No classes today" />}
          </ListCard>
        </div>

        <div className="lg:col-span-4">
          <ListCard title="Upcoming Assignments & Exams" subtitle="With due dates">
            <div className="space-y-3">
              {l.upcoming_assignments?.length ? (
                <>
                  <p className="text-[10px] font-semibold text-ledger-slate uppercase tracking-wider">Assignments</p>
                  <ul className="space-y-2">
                    {l.upcoming_assignments.map((h) => (
                      <li key={h.id} className="flex items-center justify-between border border-[#E4DECF] rounded-sm p-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink truncate">{h.title}</p>
                          <p className="text-[11px] text-ledger-slate truncate">{h.subject || '—'}</p>
                        </div>
                        <div className="pl-2 text-right whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${h.status === 'submitted' ? 'text-sage border-sage bg-sage/10' : 'text-ochre border-ochre bg-ochre/10'}`}>
                            {h.status}
                          </span>
                          <p className="text-[10px] text-ledger-slate mt-1">Due {h.due_date}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {l.upcoming_exams?.length ? (
                <>
                  <p className="text-[10px] font-semibold text-ledger-slate uppercase tracking-wider">Exams</p>
                  <ul className="space-y-2">
                    {l.upcoming_exams.map((e) => (
                      <li key={e.id} className="flex items-center justify-between border border-[#E4DECF] rounded-sm p-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink truncate">{e.name}</p>
                          <p className="text-[11px] text-ledger-slate truncate">{e.subject || '—'}</p>
                        </div>
                        <span className="text-[11px] font-semibold text-ochre pl-2 whitespace-nowrap">{e.date}</span>
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
          <ListCard title="Recent Grades Posted">
            {l.recent_grades?.length ? (
              <ul className="space-y-2">
                {l.recent_grades.map((m, i) => (
                  <li key={i} className="flex items-center justify-between border border-[#E4DECF] rounded-sm p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">{m.subject || '—'}</p>
                      <p className="text-[11px] text-ledger-slate">{m.date || '—'}</p>
                    </div>
                    <span className="text-sm font-bold text-ochre pl-2">{m.marks}</span>
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
                  <li key={a.id} className="border border-[#E4DECF] rounded-sm p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink flex items-center gap-2">
                        <Megaphone size={14} className="text-ochre" /> {a.title}
                      </p>
                      <span className="text-[10px] text-ledger-slate pl-2 whitespace-nowrap">{a.date}</span>
                    </div>
                    {a.body && <p className="text-[11px] text-ledger-slate mt-1.5">{a.body}</p>}
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
