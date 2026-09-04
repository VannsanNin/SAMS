import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  Users, UserRound, ClipboardList, School, CalendarCheck, DollarSign,
  Target, Inbox, TrendingUp, ClipboardPlus, UserPlus, Calendar, ArrowUpRight
} from 'lucide-react';

const ICONS = {
  users: Users,
  teachers: UserRound,
  staff: ClipboardList,
  classes: School,
  attendance: CalendarCheck,
  fees: DollarSign,
  target: Target,
  pending: Inbox,
};

const CHART_PALETTE = ['#4F46E5', '#F59E0B', '#10B981', '#0284C7', '#EF4444', '#8B5CF6'];

function StatCard({ item }) {
  const Icon = ICONS[item.icon] || TrendingUp;
  const value = `${item.prefix ?? ''}${item.value}${item.suffix ?? ''}`;
  return (
    <div className="impeccable-card p-5 flex flex-col justify-between group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform duration-200">
          <Icon size={19} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-display font-bold text-slate-900 tracking-tight truncate">{value}</p>
        <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-600">
          <ArrowUpRight size={14} />
          <span>Active status</span>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`impeccable-card p-6 ${className}`}>
      <div className="mb-4">
        <h2 className="text-base font-display font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function ListCard({ title, subtitle = '', children }) {
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

const tooltipStyle = {
  backgroundColor: '#0F172A',
  borderRadius: '0.75rem',
  border: 'none',
  color: '#F8FAFC',
  fontSize: '12px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
};

function EnrollmentChart({ data }) {
  return (
    <ChartCard title="Enrollment Trend" subtitle="Student enrollments by month">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="enrollments" name="Enrollments" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function AttendanceTrendChart({ data }) {
  return (
    <ChartCard title="Attendance Rate" subtitle="Weekly rate percentage">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} unit="%" axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="rate" name="Rate %" stroke="#10B981" strokeWidth={3} dot={{ fill: '#047857', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function FeeCollectionChart({ data }) {
  return (
    <ChartCard title="Fee Collection vs Target" subtitle="Monthly collected vs target">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Bar dataKey="target" name="Target" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={18} />
            <Bar dataKey="collected" name="Collected" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function StudentsByClassChart({ data }) {
  return (
    <ChartCard title="Students by Class" subtitle="Distribution across classes">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="Students" fill="#0284C7" radius={[0, 6, 6, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function GenderRatioChart({ data }) {
  return (
    <ChartCard title="Gender Ratio" subtitle="Male vs female students">
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

function DeptRatioChart({ data }) {
  return (
    <ChartCard title="Teacher : Student Load" subtitle="Staffing per department">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Bar dataKey="teachers" name="Teachers" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={14} />
            <Bar dataKey="students" name="Students" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function GenericTable({ columns, rows, empty = 'No data available' }) {
  if (!rows.length) return <p className="text-slate-400 text-sm text-center py-6 font-medium">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-3 ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 ${c.align === 'right' ? 'text-right font-semibold text-slate-900' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard({ data }) {
  const kpis = data.kpis || [];
  const g = data.graphs || {};
  const l = data.lists || {};

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
            <Calendar size={15} className="text-indigo-600" />
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/mark-attendance"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            <ClipboardPlus size={16} /> Take Attendance
          </Link>
          <Link
            to="/users"
            className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <UserPlus size={16} /> Add Student
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {kpis.map((k, i) => <StatCard key={i} item={k} />)}
      </div>

      {/* Chart Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5"><EnrollmentChart data={g.enrollment_trend || []} /></div>
        <div className="lg:col-span-3"><AttendanceTrendChart data={g.attendance_trend || []} /></div>
        <div className="lg:col-span-4"><FeeCollectionChart data={g.fee_collection || []} /></div>

        <div className="lg:col-span-5"><StudentsByClassChart data={g.students_by_class || []} /></div>
        <div className="lg:col-span-3"><GenderRatioChart data={g.gender_ratio || []} /></div>
        <div className="lg:col-span-4"><DeptRatioChart data={g.teacher_student_by_dept || []} /></div>

        {/* Action Tables & Lists */}
        <div className="lg:col-span-7">
          <ListCard title="Recent Admissions" subtitle="Newly enrolled students in current term">
            <GenericTable
              columns={[
                { key: 'name', label: 'Student' },
                { key: 'student_id', label: 'ID' },
                { key: 'class', label: 'Class' },
                { key: 'date', label: 'Enrolled', align: 'right' },
              ]}
              rows={l.recent_admissions || []}
            />
          </ListCard>
        </div>
        <div className="lg:col-span-5">
          <ListCard title="Upcoming Events & Holidays">
            {l.upcoming_events?.length ? (
              <ul className="space-y-2.5">
                {l.upcoming_events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between border border-slate-100 rounded-xl p-3.5 bg-slate-50/50 hover:bg-white transition-all">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{e.title}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate">{e.type} · {e.location || '—'}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full whitespace-nowrap">{e.date}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-slate-400 text-sm text-center py-6 font-medium">No upcoming events</p>}
          </ListCard>
        </div>

        <div className="lg:col-span-4">
          <ListCard title="Low-Attendance Alert" subtitle="Most absences over past 30 days">
            <GenericTable
              columns={[
                { key: 'name', label: 'Student' },
                { key: 'absences', label: 'Absences', align: 'right' },
              ]}
              rows={l.low_attendance || []}
            />
          </ListCard>
        </div>
        <div className="lg:col-span-4">
          <ListCard title="Overdue Fee Payments">
            <GenericTable
              columns={[
                { key: 'student', label: 'Student' },
                { key: 'balance', label: 'Balance', align: 'right', render: (r) => `$${Number(r.balance).toLocaleString()}` },
              ]}
              rows={l.overdue_fees || []}
            />
          </ListCard>
        </div>
        <div className="lg:col-span-4">
          <ListCard title="Staff on Leave Today">
            <GenericTable
              columns={[
                { key: 'name', label: 'Staff' },
                { key: 'date_from', label: 'From' },
                { key: 'date_to', label: 'To' },
              ]}
              rows={l.staff_on_leave || []}
            />
          </ListCard>
        </div>
      </div>
    </div>
  );
}
