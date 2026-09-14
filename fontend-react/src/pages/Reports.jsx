import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { apiFetch } from '../api';
import { exportCSV, exportExcel, exportPDF, exportWord } from '../utils/export';
import {
  BarChart3, BookOpen, Building2, TriangleAlert, TrendingUp,
  CheckCircle2, XCircle, Clock, CalendarCheck, UserRound, RefreshCw, School, Download, FileSpreadsheet, FileText, File as FileIcon, Sheet
} from 'lucide-react';

const API = '/api';

function Card({ title, subtitle, icon: Icon, right, className = '', children }) {
  return (
      <section className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 ${className}`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
                <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
                  <Icon size={18} />
                </div>
            )}
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
            </div>
          </div>
          {right}
        </div>
        {children}
      </section>
  );
}

function StatCard({ label, value, icon: Icon, color, suffix }) {
  return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {value}{suffix}
          </p>
        </div>
        {Icon && (
            <div className={`p-3 rounded-2xl text-white ${color} shadow-xs`}>
              <Icon size={20} />
            </div>
        )}
      </div>
  );
}

function RatePill({ rate }) {
  const cls = rate >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
      : rate >= 75 ? 'bg-amber-50 text-amber-700 border-amber-200/60'
          : 'bg-rose-50 text-rose-700 border-rose-200/60';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>{rate}%</span>;
}

function ProgressBar({ rate }) {
  const cls = rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-amber-500' : 'bg-rose-500';
  return (
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${cls} rounded-full transition-all duration-300`} style={{ width: `${Math.max(rate, 2)}%` }} />
      </div>
  );
}

function TrendChart({ trend }) {
  const [range, setRange] = useState(30);
  const data = useMemo(() => trend.slice(-range), [trend, range]);
  return (
      <Card
          icon={TrendingUp}
          title="Attendance Trends"
          subtitle="Daily attendance rate and volume fluctuation"
          right={
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
              {[7, 30].map((r) => (
                  <button
                      key={r}
                      onClick={() => setRange(r)}
                      className={`px-3 py-1 rounded-lg transition ${range === r ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {r} Days
                  </button>
              ))}
            </div>
          }
      >
        <div className="h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" />
              <YAxis yAxisId="count" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis yAxisId="rate" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" width={40} />
              <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(value, name) => [name === 'attendance_rate' ? `${value}%` : value, name === 'attendance_rate' ? 'Rate %' : name]}
                  labelFormatter={(label, payload) => (payload?.[0]?.payload?.date ?? label)}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area yAxisId="count" dataKey="present" name="Present" fill="#6366f1" fillOpacity={0.15} stroke="#6366f1" />
              <Line yAxisId="count" dataKey="absent" name="Absent" stroke="#f43f5e" strokeWidth={2} dot={false} type="monotone" />
              <Line yAxisId="count" dataKey="late" name="Late" stroke="#f59e0b" strokeWidth={2} dot={false} type="monotone" />
              <Line yAxisId="rate" dataKey="attendance_rate" name="Attendance %" stroke="#10b981" strokeWidth={2.5} dot={false} type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
  );
}

function SummaryTable({ title, icon: Icon, subtitle, rows, columns, cell = null, empty = 'No data available' }) {
  return (
      <Card icon={Icon} title={title} subtitle={subtitle}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-slate-200 font-semibold uppercase tracking-wider">
            <tr>
              {columns.map((c) => (
                  <th key={c.key} className={`p-3 text-left ${c.align === 'right' ? 'text-right' : ''}`}>
                    {c.label}
                  </th>
              ))}
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((r, i) => (
                <tr key={r.id ?? r.name ?? i} className="hover:bg-slate-50/80 transition">
                  {columns.map((c) => (
                      <td key={c.key} className={`p-3 ${c.align === 'right' ? 'text-right font-semibold' : ''}`}>
                        {cell ? cell(r, c) : (r[c.key] ?? '—')}
                      </td>
                  ))}
                </tr>
            ))}
            {rows.length === 0 && (
                <tr><td colSpan={columns.length} className="p-8 text-center text-slate-400 font-medium">{empty}</td></tr>
            )}
            </tbody>
          </table>
        </div>
      </Card>
  );
}

function StudentReport({ report, options, onSelect, loading }) {
  const courses = report?.courses ?? [];
  const summary = report?.summary ?? null;

  return (
      <Card
          icon={UserRound}
          title="Student Performance Analysis"
          subtitle={report?.student ? `${report.student.class} · ${report.student.department ?? 'No department'}` : 'Select a student to inspect course breakdown'}
          right={
            <div className="flex items-center gap-2">
              {loading && <span className="text-xs text-slate-400 font-medium">Loading...</span>}
              <select
                  value={report?.student?.id ?? ''}
                  onChange={(e) => onSelect(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
              >
                <option value="">— Select Student —</option>
                {(options.students || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.class ? ` · ${s.class}` : ''}</option>
                ))}
              </select>
            </div>
          }
      >
        {!report?.student ? (
            <p className="text-slate-400 text-xs py-12 text-center font-medium">Choose a student to generate their detailed attendance report.</p>
        ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <p className="text-xs font-bold text-slate-900">
                  {report.student.name} <span className="text-slate-400 font-normal">({report.student.class})</span>
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="text-slate-600">Total: <b>{summary?.total ?? 0}</b></span>
                  <span className="text-emerald-700">Present: <b>{summary?.present ?? 0}</b></span>
                  <span className="text-rose-700">Absent: <b>{summary?.absent ?? 0}</b></span>
                  <span className="text-amber-700">Late: <b>{summary?.late ?? 0}</b></span>
                  <span className="text-base font-bold text-indigo-600 ml-2">
                {summary?.total > 0 ? `${summary.attendance_rate}%` : '—'}
              </span>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200/80">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-slate-200 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 text-left">Course</th>
                    <th className="p-3 text-right">Present</th>
                    <th className="p-3 text-right">Absent</th>
                    <th className="p-3 text-right">Late</th>
                    <th className="p-3 text-right">Excused</th>
                    <th className="p-3 text-right">Rate %</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                  {courses.map((c) => (
                      <tr key={c.name} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-semibold text-slate-900">{c.name}</td>
                        <td className="p-3 text-right text-emerald-700 font-semibold">{c.present}</td>
                        <td className="p-3 text-right text-rose-700 font-semibold">{c.absent}</td>
                        <td className="p-3 text-right text-amber-700 font-semibold">{c.late}</td>
                        <td className="p-3 text-right text-sky-700 font-semibold">{c.excused}</td>
                        <td className="p-3 text-right"><RatePill rate={c.attendance_rate} /></td>
                      </tr>
                  ))}
                  {courses.length === 0 && (
                      <tr><td colSpan="6" className="p-6 text-center text-slate-400 font-medium">No course records for this student</td></tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
        )}
      </Card>
  );
}

function LowAttendance({ items, threshold }) {
  return (
      <Card
          icon={TriangleAlert}
          title="At-Risk Students"
          subtitle={`Below ${threshold}% attendance rate`}
      >
        {items.length === 0 ? (
            <p className="text-slate-400 text-xs py-16 text-center font-medium">No students currently below {threshold}% threshold</p>
        ) : (
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {items.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl border border-rose-100 bg-rose-50/30">
                    <div className="flex justify-between text-xs mb-1.5">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 truncate">{s.name}</span>
                        <span className="text-[11px] text-slate-400 ml-2 font-medium">{s.class ?? '—'}</span>
                      </div>
                      <span className="text-rose-700 font-extrabold whitespace-nowrap ml-2">{s.attendance_rate}%</span>
                    </div>
                    <ProgressBar rate={s.attendance_rate} />
                    <p className="text-[10px] text-slate-500 font-medium mt-1.5">
                      {s.absent} absent · {s.late} late · {s.total} total sessions
                    </p>
                  </div>
              ))}
            </div>
        )}
      </Card>
  );
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [options, setOptions] = useState({ classes: [], departments: [], students: [] });
  const [filters, setFilters] = useState({ class_id: '', department: '', date_from: '', date_to: '', threshold: '75' });
  const [studentReport, setStudentReport] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportOpen, setExportOpen] = useState(false);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    apiFetch(`${API}/reports/attendance?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load attendance reports'))))
        .then(setData)
        .catch((err) => setError(err.message));
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    apiFetch(`${API}/reports/attendance/filters`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load report options'))))
        .then((opts) => setOptions(opts))
        .catch(() => {});
  }, []);

  const loadStudent = useCallback((studentId) => {
    if (!studentId) {
      setStudentReport(null);
      return;
    }
    setStudentLoading(true);
    const params = new URLSearchParams({ student_id: studentId });
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    apiFetch(`${API}/reports/attendance/student?${params.toString()}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load student report'))))
        .then(setStudentReport)
        .catch(() => {})
        .finally(() => setStudentLoading(false));
  }, [filters.date_from, filters.date_to]);

  useEffect(() => {
    if (!options.students?.length || studentReport) return;
    const t = setTimeout(() => loadStudent(options.students[0].id), 0);
    return () => clearTimeout(t);
  }, [options, studentReport, loadStudent]);

  const summary = data?.summary ?? null;

  const summaryCards = summary ? [
    { label: 'Total Logs', value: summary.total, icon: BarChart3, color: 'bg-indigo-600', suffix: '' },
    { label: 'Present', value: summary.present, icon: CheckCircle2, color: 'bg-emerald-600', suffix: '' },
    { label: 'Absent', value: summary.absent, icon: XCircle, color: 'bg-rose-600', suffix: '' },
    { label: 'Late', value: summary.late, icon: Clock, color: 'bg-amber-600', suffix: '' },
    { label: 'Overall Rate', value: summary.total > 0 ? summary.attendance_rate : '—', icon: CalendarCheck, color: 'bg-sky-600', suffix: summary.total > 0 ? '%' : '' },
  ] : [];

  const classColumns = [
    { key: 'name', label: 'Class' },
    { key: 'total_students', label: 'Students', align: 'right' },
    { key: 'present', label: 'Present', align: 'right' },
    { key: 'absent', label: 'Absent', align: 'right' },
    { key: 'late', label: 'Late', align: 'right' },
  ];

  const courseColumns = [
    { key: 'name', label: 'Course' },
    { key: 'present', label: 'Present', align: 'right' },
    { key: 'absent', label: 'Absent', align: 'right' },
    { key: 'late', label: 'Late', align: 'right' },
  ];

  const classRateCell = (row, col) => {
    if (col.key === 'name') return <span className="font-semibold text-slate-900">{row.name}</span>;
    if (col.key === 'total_students') return <span className="font-medium text-slate-700">{row.total_students}</span>;
    if (col.key === 'present') return <span className="text-emerald-700 font-semibold">{row.present}</span>;
    if (col.key === 'absent') return <span className="text-rose-700 font-semibold">{row.absent}</span>;
    if (col.key === 'late') return <span className="text-amber-700 font-semibold">{row.late}</span>;
    return row[col.key] ?? '—';
  };

  const courseRateCell = (row, col) => {
    if (col.key === 'name') return <span className="font-semibold text-slate-900">{row.name}</span>;
    if (col.key === 'present') return <span className="text-emerald-700 font-semibold">{row.present}</span>;
    if (col.key === 'absent') return <span className="text-rose-700 font-semibold">{row.absent}</span>;
    if (col.key === 'late') return <span className="text-amber-700 font-semibold">{row.late}</span>;
    return row[col.key] ?? '—';
  };

  const filterSelect = (key, label, list) => (
      <select
          value={filters[key]}
          onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
          className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
      >
        <option value="">{label}</option>
        {list.map((opt) => <option key={opt.id} value={opt.id}>{opt.class_name ?? opt.name}</option>)}
      </select>
  );

  const buildExportSections = () => {
    const sections = [];
    if (!data) return sections;

    if (summary) {
      sections.push({
        title: 'Summary',
        columns: [{ key: 'label', label: 'Metric' }, { key: 'value', label: 'Value' }],
        rows: summaryCards.map((c) => ({ label: c.label, value: c.value + (c.suffix ?? '') })),
      });
    }

    sections.push({
      title: 'Class Breakdown',
      columns: [
        { key: 'name', label: 'Class' },
        { key: 'total_students', label: 'Students' },
        { key: 'present', label: 'Present' },
        { key: 'absent', label: 'Absent' },
        { key: 'late', label: 'Late' },
        { key: 'attendance_rate', label: 'Rate %' },
      ],
      rows: data.by_class || [],
    });

    sections.push({
      title: 'Course Breakdown',
      columns: [
        { key: 'name', label: 'Course' },
        { key: 'present', label: 'Present' },
        { key: 'absent', label: 'Absent' },
        { key: 'late', label: 'Late' },
        { key: 'attendance_rate', label: 'Rate %' },
      ],
      rows: data.by_course || [],
    });

    sections.push({
      title: 'Department Performance',
      columns: [
        { key: 'name', label: 'Department' },
        { key: 'present', label: 'Present' },
        { key: 'absent', label: 'Absent' },
        { key: 'late', label: 'Late' },
        { key: 'attendance_rate', label: 'Rate %' },
      ],
      rows: data.by_department || [],
    });

    if (studentReport?.courses?.length) {
      sections.push({
        title: `Student Report — ${studentReport.student?.name ?? studentReport.student?.id}`,
        columns: [
          { key: 'name', label: 'Course' },
          { key: 'present', label: 'Present' },
          { key: 'absent', label: 'Absent' },
          { key: 'late', label: 'Late' },
          { key: 'excused', label: 'Excused' },
          { key: 'attendance_rate', label: 'Rate %' },
        ],
        rows: studentReport.courses,
      });
    }

    if (data.low_attendance?.length) {
      sections.push({
        title: `At-Risk Students (below ${filters.threshold}%)`,
        columns: [
          { key: 'name', label: 'Student' },
          { key: 'class', label: 'Class' },
          { key: 'total', label: 'Total Sessions' },
          { key: 'absent', label: 'Absent' },
          { key: 'late', label: 'Late' },
          { key: 'attendance_rate', label: 'Attendance %' },
        ],
        rows: data.low_attendance,
      });
    }

    return sections;
  };

  const handleExport = (format) => {
    setExportOpen(false);
    const filename = 'Attendance_Report';
    const heading = 'SAMS — Attendance Analytics Report';
    const subheading = [
      filters.class_id ? `Class ${options.classes.find((c) => String(c.id) === String(filters.class_id))?.class_name}` : null,
      filters.department ? `Dept: ${filters.department}` : null,
      filters.date_from || 'All dates',
      filters.date_from && filters.date_to ? `to ${filters.date_to}` : null,
    ].filter(Boolean).join(' · ') || 'All date range';

    if (format === 'csv') exportCSV(filename, buildExportSections());
    if (format === 'excel') exportExcel(filename, buildExportSections());
    if (format === 'pdf') exportPDF(filename, heading, subheading, buildExportSections());
    if (format === 'word') exportWord(filename, heading, subheading, buildExportSections());
  };

  const EXPORT_ITEMS = [
    { id: 'excel', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
    { id: 'pdf', label: 'PDF Document', icon: FileText },
    { id: 'word', label: 'Word (.doc)', icon: FileIcon },
    { id: 'csv', label: 'CSV File', icon: Sheet },
  ];

  if (error) {
    return (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-6 text-xs font-semibold">
          Failed to load attendance reports: {error}
        </div>
    );
  }

  return (
      <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <BarChart3 size={26} className="text-indigo-600" /> Attendance Analytics
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">High-level insights across students, courses, classes, and departments</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                  onClick={() => setExportOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold shadow-xs transition"
              >
                <Download size={15} /> Export
                <span className="text-[9px] ml-0.5">▾</span>
              </button>
              {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setExportOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-30 w-48 bg-white rounded-xl border border-slate-200/80 shadow-xl overflow-hidden py-1">
                      <p className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">Export report as</p>
                      {EXPORT_ITEMS.map((item) => (
                          <button
                              key={item.id}
                              onClick={() => handleExport(item.id)}
                              disabled={!data}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-700 transition"
                          >
                            <item.icon size={15} className="text-slate-400" />
                            {item.label}
                          </button>
                      ))}
                    </div>
                  </>
              )}
            </div>
            <button
                onClick={() => load()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw size={15} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {filterSelect('class_id', 'All Classes', options.classes)}
            <select
                value={filters.department}
                onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">All Departments</option>
              {(options.departments || []).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
                title="From date"
            />
            <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
                title="To date"
            />
            <select
                value={filters.threshold}
                onChange={(e) => setFilters((f) => ({ ...f, threshold: e.target.value }))}
                className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
                title="Low attendance threshold"
            >
              <option value="60">Low threshold: 60%</option>
              <option value="70">Low threshold: 70%</option>
              <option value="75">Low threshold: 75%</option>
              <option value="80">Low threshold: 80%</option>
              <option value="85">Low threshold: 85%</option>
              <option value="90">Low threshold: 90%</option>
            </select>
          </div>
          {(filters.class_id || filters.department || filters.date_from || filters.date_to || filters.threshold !== '75') && (
              <button
                  onClick={() => setFilters({ class_id: '', department: '', date_from: '', date_to: '', threshold: '75' })}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear active filters
              </button>
          )}
        </div>

        {!data ? (
            <div className="flex items-center justify-center h-64 text-slate-400 text-xs font-medium">
              Compiling analytics reports...
            </div>
        ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
                {summaryCards.map((s) => <StatCard key={s.label} {...s} />)}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Student Section */}
                <div className="lg:col-span-12">
                  <StudentReport
                      report={studentReport}
                      options={options}
                      onSelect={loadStudent}
                      loading={studentLoading}
                  />
                </div>

                {/* Class Breakdown */}
                <div className="lg:col-span-4">
                  <SummaryTable
                      title="Class Breakdown"
                      icon={School}
                      subtitle="Attendance stats by class section"
                      rows={data.by_class}
                      columns={[...classColumns, { key: 'rate', label: 'Rate %', align: 'right' }]}
                      cell={(row, col) => col.key === 'rate'
                          ? <RatePill rate={row.attendance_rate} />
                          : classRateCell(row, col)}
                  />
                </div>

                {/* Course Breakdown */}
                <div className="lg:col-span-4">
                  <SummaryTable
                      title="Course Breakdown"
                      icon={BookOpen}
                      subtitle="Attendance stats by course"
                      rows={data.by_course}
                      columns={[...courseColumns, { key: 'rate', label: 'Rate %', align: 'right' }]}
                      cell={(row, col) => col.key === 'rate'
                          ? <RatePill rate={row.attendance_rate} />
                          : courseRateCell(row, col)}
                  />
                </div>

                {/* Department Breakdown */}
                <div className="lg:col-span-4">
                  <Card icon={Building2} title="Department Performance" subtitle="Average attendance by department">
                    {data.by_department.length === 0 ? (
                        <p className="text-slate-400 text-xs py-12 text-center font-medium">No department data recorded</p>
                    ) : (
                        <div className="space-y-3.5">
                          {data.by_department.map((d) => (
                              <div key={d.name}>
                                <div className="flex justify-between text-xs mb-1 font-semibold">
                                  <span className="text-slate-900 truncate">{d.name}</span>
                                  <span className="text-slate-600 whitespace-nowrap ml-2">{d.attendance_rate}%</span>
                                </div>
                                <ProgressBar rate={d.attendance_rate} />
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                  {d.present} present · {d.absent} absent · {d.late} late
                                </p>
                              </div>
                          ))}
                        </div>
                    )}
                  </Card>
                </div>

                {/* Trend Chart */}
                <div className="lg:col-span-7">
                  <TrendChart trend={data.trend} />
                </div>

                {/* Low Attendance Alert */}
                <div className="lg:col-span-5">
                  <LowAttendance items={data.low_attendance} threshold={filters.threshold} />
                </div>
              </div>
            </>
        )}
      </div>
  );
}