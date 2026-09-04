import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  School, Users, ClipboardCheck, CalendarCheck, Calendar, ArrowUpRight
} from 'lucide-react';

const ICONS = {
  classes: School,
  users: Users,
  grading: ClipboardCheck,
  attendance: CalendarCheck,
};

const CHART_PALETTE = ['#4F46E5', '#F59E0B', '#10B981', '#0284C7', '#EF4444'];

const tooltipStyle = {
  backgroundColor: '#0F172A',
  borderRadius: '0.75rem',
  border: 'none',
  color: '#F8FAFC',
  fontSize: '12px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
};

function StatCard({ item }) {
  const Icon = ICONS[item.icon] || School;
  return (
    <div className="impeccable-card p-5 flex flex-col justify-between group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform duration-200">
          <Icon size={19} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-display font-bold text-slate-900 tracking-tight">{item.value}{item.suffix ?? ''}</p>
        <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-600">
          <ArrowUpRight size={14} />
          <span>Active term</span>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="impeccable-card p-6">
      <div className="mb-4">
        <h2 className="text-base font-display font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function ListCard({ title, subtitle, children }) {
  return (
    <section className="impeccable-card p-6">
      <div className="mb-4">
        <h2 className="text-base font-display font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function SubjectPerformance({ data }) {
  return (
    <ChartCard title="Class Average by Subject" subtitle="Average marks obtained">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="average" name="Avg Marks" fill="#F59E0B" radius={[6, 6, 0, 0]} barSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function AttendanceTrendChart({ data }) {
  return (
    <ChartCard title="Class Attendance Trend" subtitle="Weekly attendance percentage">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="rate" name="Rate %" stroke="#4F46E5" strokeWidth={3} dot={{ fill: '#4338CA', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function GradeDistribution({ data }) {
  return (
    <ChartCard title="Grade Distribution" subtitle="Latest exam score bands">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" name="Students" fill="#0284C7" radius={[6, 6, 0, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function SubmissionRate({ data }) {
  return (
    <ChartCard title="Assignment Submission Rate" subtitle="Submitted vs pending">
      <div className="h-64 flex flex-col items-center justify-center">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={80} paddingAngle={4} strokeWidth={0}>
              {data.map((d, i) => <Cell key={d.label} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex gap-4 text-xs font-semibold text-slate-700 mt-2">
          {data.map((d, i) => (
            <span key={d.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
              {d.label} · <b>{d.value}</b>
            </span>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function EmptyMessage({ text }) {
  return <p className="text-slate-400 text-sm text-center py-6 font-medium">{text}</p>;
}

export default function TeacherDashboard({ data }) {
  const kpis = data.kpis || [];
  const g = data.graphs || {};
  const l = data.lists || {};

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">Teacher Console</h1>
          <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
            <Calendar size={15} className="text-indigo-600" />
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-xl px-4 py-2.5 shadow-xs">
          <CalendarCheck size={16} /> Mark attendance & grade submissions
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {kpis.map((k, i) => <StatCard key={i} item={k} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6"><SubjectPerformance data={g.subject_performance || []} /></div>
        <div className="lg:col-span-6"><AttendanceTrendChart data={g.attendance_trend || []} /></div>
        <div className="lg:col-span-7"><GradeDistribution data={g.grade_distribution || []} /></div>
        <div className="lg:col-span-5"><SubmissionRate data={g.submission_rate || []} /></div>

        <div className="lg:col-span-5">
          <ListCard title="Today's Timetable" subtitle={`${(l.today_timetable || []).length} session(s)`}>
            {l.today_timetable?.length ? (
              <ul className="space-y-2.5">
                {l.today_timetable.map((s) => (
                  <li key={s.id} className="flex items-center justify-between border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 hover:bg-white transition-all">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{s.subject || '—'}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate">{s.class || '—'}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full whitespace-nowrap">{s.time_start}–{s.time_end}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No classes scheduled today" />}
          </ListCard>
        </div>

        <div className="lg:col-span-4">
          <ListCard title="Students Needing Attention" subtitle="Flagged low marks">
            {l.low_performing?.length ? (
              <ul className="space-y-2.5">
                {l.low_performing.map((s) => (
                  <li key={s.id} className="flex items-center justify-between border border-red-100 bg-red-50/40 rounded-xl p-3.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-red-700 truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate">{s.class || '—'}</p>
                    </div>
                    <span className="text-xs font-bold text-red-600 bg-white px-2 py-0.5 rounded-md border border-red-200">{s.marks}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No flagged students" />}
          </ListCard>
        </div>

        <div className="lg:col-span-3">
          <ListCard title="Upcoming Tests">
            {l.upcoming_tests?.length ? (
              <ul className="space-y-2.5">
                {l.upcoming_tests.map((e) => (
                  <li key={e.id} className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-900 truncate">{e.name} · <span className="text-slate-500 font-normal">{e.subject}</span></p>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">{e.class || '—'} · <span className="font-bold text-amber-600">{e.date}</span></p>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No upcoming tests" />}
          </ListCard>
        </div>

        <div className="lg:col-span-7">
          <ListCard title="Submissions to Review" subtitle="Recent student homework">
            {l.recent_submissions?.length ? (
              <ul className="space-y-2.5">
                {l.recent_submissions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between border border-slate-100 rounded-xl p-3.5 bg-slate-50/50">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{s.student || '—'} · <span className="text-slate-500 font-normal">{s.homework || '—'}</span></p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{s.submitted_at || '—'}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${s.status === 'graded' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-amber-700 border-amber-200 bg-amber-50'}`}>
                      {s.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <EmptyMessage text="No recent submissions" />}
          </ListCard>
        </div>

        <div className="lg:col-span-5">
          <ListCard title="Messages & Notifications">
            {l.messages?.length ? (
              <ul className="space-y-2.5">
                {l.messages.map((m) => (
                  <li key={m.id} className={`border rounded-xl p-3.5 ${m.is_read ? 'border-slate-100 bg-white' : 'border-indigo-200 bg-indigo-50/40'}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-900 truncate">{m.subject || 'Message'}</p>
                      <span className="text-[10px] text-slate-400 font-medium pl-2 whitespace-nowrap">{m.date}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">{m.body}</p>
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
