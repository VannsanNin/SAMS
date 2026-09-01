import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  Users, UserRound, ClipboardList, School, CalendarCheck, DollarSign,
  Target, Inbox, TrendingUp, ClipboardPlus, UserPlus,
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

const COLORS = ['#D98E2B', '#1E2A4A', '#7c8a9a', '#5b8c5a', '#c96f4a', '#6b7aa1'];

function StatCard({ item }) {
  const Icon = ICONS[item.icon] || TrendingUp;
  const value = `${item.prefix ?? ''}${item.value}${item.suffix ?? ''}`;
  return (
    <div className="bg-white border border-hairline border-[#D8D2C4] rounded-sm p-5 shadow-sm">
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

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`bg-white border border-[#D8D2C4] rounded-sm p-5 shadow-sm ${className}`}>
      <h2 className="text-sm font-semibold text-ink tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-ledger-slate mt-0.5 mb-3">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ListCard({ title, subtitle = '', children }) {
  return (
    <section className="bg-white border border-[#D8D2C4] rounded-sm p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-ink tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-ledger-slate mt-0.5">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function EnrollmentChart({ data }) {
  return (
    <ChartCard title="Enrollment Trend" subtitle="Student enrollments by month">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ece7db" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="enrollments" name="Enrollments" fill="#D98E2B" radius={[2, 2, 0, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function AttendanceTrendChart({ data }) {
  return (
    <ChartCard title="Attendance Rate Trend" subtitle="Weekly attendance percentage">
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

function FeeCollectionChart({ data }) {
  return (
    <ChartCard title="Fee Collection vs Target" subtitle="Monthly collected vs target">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ece7db" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Bar dataKey="target" name="Target" fill="#C9C2B2" radius={[2, 2, 0, 0]} barSize={18} />
            <Bar dataKey="collected" name="Collected" fill="#1E2A4A" radius={[2, 2, 0, 0]} barSize={18} />
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
            <CartesianGrid strokeDasharray="3 3" stroke="#ece7db" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="Students" fill="#D98E2B" radius={[0, 2, 2, 0]} barSize={16} />
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
        <ResponsiveContainer width="100%" height={220}>
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

function DeptRatioChart({ data }) {
  return (
    <ChartCard title="Teacher : Student by Department" subtitle="Staffing load per department">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ece7db" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Bar dataKey="teachers" name="Teachers" fill="#D98E2B" radius={[2, 2, 0, 0]} barSize={12} />
            <Bar dataKey="students" name="Students" fill="#1E2A4A" radius={[2, 2, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

const tooltipStyle = {
  backgroundColor: '#1E2A4A', borderRadius: '4px', border: 'none', color: '#faf8f3', fontSize: '12px',
};

function GenericTable({ columns, rows, empty = 'No data available' }) {
  if (!rows.length) return <p className="text-ledger-slate text-sm text-center py-6">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="border-b border-[#E4DECF] text-ledger-slate uppercase tracking-wider">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`p-2.5 font-semibold text-left ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0ECDF] text-ink">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-paper">
              {columns.map((c) => (
                <td key={c.key} className={`p-2.5 ${c.align === 'right' ? 'text-right font-semibold' : ''}`}>
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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E4DECF]">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-ledger-slate font-medium mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/mark-attendance" className="inline-flex items-center gap-2 bg-ink text-paper font-semibold text-xs px-4 py-2.5 rounded-sm transition">
            <ClipboardPlus size={15} /> Take Attendance
          </Link>
          <Link to="/users" className="inline-flex items-center gap-2 border border-ink text-ink font-semibold text-xs px-4 py-2.5 rounded-sm transition">
            <UserPlus size={15} /> Add Student
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => <StatCard key={i} item={k} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5"><EnrollmentChart data={g.enrollment_trend || []} /></div>
        <div className="lg:col-span-3"><AttendanceTrendChart data={g.attendance_trend || []} /></div>
        <div className="lg:col-span-4"><FeeCollectionChart data={g.fee_collection || []} /></div>

        <div className="lg:col-span-5"><StudentsByClassChart data={g.students_by_class || []} /></div>
        <div className="lg:col-span-3"><GenderRatioChart data={g.gender_ratio || []} /></div>
        <div className="lg:col-span-4"><DeptRatioChart data={g.teacher_student_by_dept || []} /></div>

        <div className="lg:col-span-7">
          <ListCard title="Recent Admissions" subtitle="Newly enrolled students">
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
              <ul className="space-y-2">
                {l.upcoming_events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between border border-[#E4DECF] rounded-sm p-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-ink truncate">{e.title}</p>
                      <p className="text-[11px] text-ledger-slate truncate">{e.type} · {e.location || '—'}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-ochre pl-2 whitespace-nowrap">{e.date}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-ledger-slate text-sm text-center py-6">No upcoming events</p>}
          </ListCard>
        </div>

        <div className="lg:col-span-4">
          <ListCard title="Low-Attendance Students" subtitle="Most absences (30 days)">
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
