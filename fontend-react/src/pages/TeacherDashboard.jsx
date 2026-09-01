import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  School, Users, ClipboardCheck, CalendarCheck,
} from 'lucide-react';

const ICONS = {
  classes: School,
  users: Users,
  grading: ClipboardCheck,
  attendance: CalendarCheck,
};

const COLORS = ['#D98E2B', '#1E2A4A', '#5A6B95', '#6E8F68', '#C25B45'];

const tooltipStyle = {
  backgroundColor: '#1E2A4A', borderRadius: '4px', border: 'none', color: '#faf8f3', fontSize: '12px',
};

function StatCard({ item }) {
  const Icon = ICONS[item.icon] || School;
  return (
    <div className="bg-white border border-hairline rounded-sm p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-ledger-slate uppercase tracking-wider">{item.label}</h3>
          <p className="text-3xl font-bold text-ink mt-2 tracking-tight">{item.value}{item.suffix ?? ''}</p>
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

function SubjectPerformance({ data }) {
  return (
    <ChartCard title="Class Average by Subject" subtitle="Average marks obtained">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ece7db" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="average" name="Avg Marks" fill="#D98E2B" radius={[2, 2, 0, 0]} barSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function AttendanceTrendChart({ data }) {
  return (
    <ChartCard title="Class Attendance Trend" subtitle="Weekly attendance percentage">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ece7db" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} unit="%" axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="rate" name="Rate %" stroke="#1E2A4A" strokeWidth={2.5} dot={{ fill: '#D98E2B', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function GradeDistribution({ data }) {
  return (
    <ChartCard title="Grade Distribution" subtitle="Latest exam score bands">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ece7db" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Students" fill="#1E2A4A" radius={[2, 2, 0, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function SubmissionRate({ data }) {
  return (
    <ChartCard title="Assignment Submission Rate" subtitle="Submitted vs pending">
      <div className="h-60 flex flex-col items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={80} paddingAngle={3} strokeWidth={0}>
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
    </ChartCard>
  );
}

function EmptyMessage({ text }) {
  return <p className="text-ledger-slate text-sm text-center py-6">{text}</p>;
}

export default function TeacherDashboard({ data }) {
  const kpis = data.kpis || [];
  const g = data.graphs || {};
  const l = data.lists || {};

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Teacher Dashboard</h1>
          <p className="text-xs text-ledger-slate font-medium mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-ochre bg-white border border-hairline rounded-sm px-4 py-2.5">
          <CalendarCheck size={15} /> Mark attendance & grade submissions
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => <StatCard key={i} item={k} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6"><SubjectPerformance data={g.subject_performance || []} /></div>
        <div className="lg:col-span-6"><AttendanceTrendChart data={g.attendance_trend || []} /></div>
        <div className="lg:col-span-7"><GradeDistribution data={g.grade_distribution || []} /></div>
        <div className="lg:col-span-5"><SubmissionRate data={g.submission_rate || []} /></div>

        <div className="lg:col-span-5">
          <ListCard title="Today's Timetable" subtitle={`${(l.today_timetable || []).length} session(s)`}>
            {l.today_timetable?.length ? (
              <ul className="space-y-2">
                {l.today_timetable.map((s) => (
                  <li key={s.id} className="flex items-center justify-between border border-[#E4DECF] rounded-sm p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">{s.subject || '—'}</p>
                      <p className="text-[11px] text-ledger-slate truncate">{s.class || '—'}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-ledger-slate pl-2 whitespace-nowrap">{s.time_start}–{s.time_end}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No classes scheduled today" />}
          </ListCard>
        </div>

        <div className="lg:col-span-4">
          <ListCard title="Students with Low Grades" subtitle="Flagged for attention">
            {l.low_performing?.length ? (
              <ul className="space-y-2">
                {l.low_performing.map((s) => (
                  <li key={s.id} className="flex items-center justify-between border border-[#F0D9CD] bg-[#FBF3EF] rounded-sm p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-coral truncate">{s.name}</p>
                      <p className="text-[11px] text-ledger-slate truncate">{s.class || '—'}</p>
                    </div>
                    <span className="text-[11px] font-bold text-coral pl-2">{s.marks}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No flagged students" />}
          </ListCard>
        </div>

        <div className="lg:col-span-3">
          <ListCard title="Upcoming Tests & Deadlines">
            {l.upcoming_tests?.length ? (
              <ul className="space-y-2">
                {l.upcoming_tests.map((e) => (
                  <li key={e.id} className="border border-[#E4DECF] rounded-sm p-3">
                    <p className="text-xs font-semibold text-ink truncate">{e.name} · <span className="text-ledger-slate font-medium">{e.subject}</span></p>
                    <p className="text-[11px] text-ledger-slate mt-0.5">{e.class || '—'} · <span className="font-semibold text-ochre">{e.date}</span></p>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No upcoming tests" />}
          </ListCard>
        </div>

        <div className="lg:col-span-7">
          <ListCard title="Recent Submissions to Review" subtitle="Homework submitted by students">
            {l.recent_submissions?.length ? (
              <ul className="space-y-2">
                {l.recent_submissions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between border border-[#E4DECF] rounded-sm p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">{s.student || '—'} · <span className="text-ledger-slate font-medium">{s.homework || '—'}</span></p>
                      <p className="text-[11px] text-ledger-slate mt-0.5">{s.submitted_at || '—'}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${s.status === 'graded' ? 'text-sage border-sage bg-sage/10' : 'text-ochre border-ochre bg-ochre/10'}`}>
                      {s.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No recent submissions" />}
          </ListCard>
        </div>

        <div className="lg:col-span-5">
          <ListCard title="Messages / Notifications">
            {l.messages?.length ? (
              <ul className="space-y-2">
                {l.messages.map((m) => (
                  <li key={m.id} className={`border rounded-sm p-3 ${m.is_read ? 'border-[#E4DECF]' : 'border-ochre bg-ochre/5'}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink truncate">{m.subject || 'Message'}</p>
                      <span className="text-[10px] text-ledger-slate pl-2 whitespace-nowrap">{m.date}</span>
                    </div>
                    <p className="text-[11px] text-ledger-slate mt-1 line-clamp-2">{m.body}</p>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No new messages" />}
          </ListCard>
        </div>
      </div>
    </div>
  );
}
