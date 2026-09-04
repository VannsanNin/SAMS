import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api';
import Modal from '../components/Modal';
import {
  TriangleAlert, Search,
  GraduationCap, School, AlertTriangle, ShieldCheck, ShieldAlert, Eye,
} from 'lucide-react';

const API = '/api';

function Card({ title, subtitle, icon: Icon, className = '', children }) {
  return (
    <section className={`bg-white rounded-xl shadow p-6 ${className}`}>
      <div className="flex items-start gap-2 mb-4">
        {Icon && <Icon size={20} className="text-blue-600" />}
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className={`rounded-xl shadow p-5 text-white ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm opacity-80 font-medium">{label}</h3>
          <p className="text-4xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs opacity-80 mt-1">{sub}</p>}
        </div>
        {Icon && <Icon size={28} className="opacity-90" />}
      </div>
    </div>
  );
}

function LevelBadge({ level, size = 'md' }) {
  const meta = {
    critical: { label: 'Critical', cls: 'bg-red-100 text-red-800', emoji: '\u{1f6a8}' },
    warning: { label: 'Warning', cls: 'bg-amber-100 text-amber-800', emoji: '\u26a0\ufe0f' },
  };
  const m = meta[level];
  if (!m) return null;
  const sz = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded font-semibold ${m.cls} ${sz}`}>
      {m.emoji} {m.label}
    </span>
  );
}

function ThresholdLegend({ warningBelow, criticalBelow }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <span className="font-medium text-gray-700">Thresholds:</span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-green-500" />
        {'\u2265'}{warningBelow}% OK
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-amber-500" />
        &lt;{warningBelow}% Warning
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        &lt;{criticalBelow}% Critical
      </span>
    </div>
  );
}

function StudentDetailModal({ student, onClose }) {
  if (!student) return null;
  return (
    <Modal title="Student Attendance Detail" icon={GraduationCap} onClose={onClose} wide>
      <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-bold text-blue-900">{student.student?.name}</p>
          <p className="text-sm text-blue-700">{student.student?.class} · {student.student?.code}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-blue-700">{student.summary?.attendance_rate}%</p>
          <p className="text-xs text-blue-600">{student.summary?.total} records</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3 text-left">Course</th>
              <th className="p-3 text-right">Present</th>
              <th className="p-3 text-right">Absent</th>
              <th className="p-3 text-right">Late</th>
              <th className="p-3 text-right">Rate</th>
              <th className="p-3 text-center">Level</th>
            </tr>
          </thead>
          <tbody>
            {student.courses?.map((c) => (
              <tr key={c.name} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-right text-green-700">{c.present}</td>
                <td className="p-3 text-right text-red-700">{c.absent}</td>
                <td className="p-3 text-right text-amber-700">{c.late}</td>
                <td className="p-3 text-right font-bold">{c.attendance_rate}%</td>
                <td className="p-3 text-center">
                  <LevelBadge level={c.attendance_rate < 70 ? 'critical' : c.attendance_rate < 80 ? 'warning' : 'ok'} size="sm" />
                </td>
              </tr>
            ))}
            {(!student.courses || student.courses.length === 0) && (
              <tr><td colSpan="6" className="p-6 text-center text-gray-400">No attendance records</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default function Warnings() {
  const [data, setData] = useState({ summary: null, items: [] });
  const [options, setOptions] = useState({ classes: [], departments: [], courses: [] });
  const [filters, setFilters] = useState({ level: '', class_id: '', department: '', course_id: '', search: '' });
  const [viewing, setViewing] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    apiFetch(`${API}/reports/attendance/warnings?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load attendance warnings'))))
      .then(setData)
      .catch((err) => setError(err.message));
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    apiFetch(`${API}/reports/attendance/filters`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load filter options'))))
      .then(setOptions)
      .catch(() => {});
  }, []);

  const openDetail = (item) => {
    setViewing(null);
    setDetailLoading(true);
    apiFetch(`${API}/reports/attendance/student?student_id=${item.student_id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load student detail'))))
      .then((d) => {
        setViewing({ ...d, student: { ...d.student, code: item.student_code } });
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  };

  const filterSelect = (key, label, list, labelKey = 'name') => (
    <select
      value={filters[key]}
      onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
      className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
    >
      <option value="">{label}</option>
      {(list || []).map((opt) => <option key={opt.id ?? opt} value={opt.id ?? opt}>{opt[labelKey] ?? opt}</option>)}
    </select>
  );

  const summary = data.summary ?? { at_risk_students: 0, warning_students: 0, critical_students: 0, healthy_students: 0, at_risk_courses: 0, warning_below: 80, critical_below: 70 };
  const items = data.items ?? [];

  const stats = [
    { label: 'Critical', value: summary.critical_students, icon: ShieldAlert, color: 'bg-red-600', sub: summary.critical_students ? 'Students below 70%' : 'No critical students' },
    { label: 'Warning', value: summary.warning_students, icon: AlertTriangle, color: 'bg-amber-500', sub: summary.warning_students ? 'Students 70-80%' : 'No warnings' },
    { label: 'Total At Risk', value: summary.at_risk_students, icon: GraduationCap, color: 'bg-blue-600', sub: `${summary.at_risk_courses} course enrollment${summary.at_risk_courses === 1 ? '' : 's'} flagged` },
    { label: 'Healthy', value: summary.healthy_students, icon: ShieldCheck, color: 'bg-emerald-600', sub: 'Students above thresholds' },
  ];

  const rateColor = (r) => r >= 80 ? 'bg-green-100' : r >= 70 ? 'bg-amber-100' : 'bg-red-100';
  const rateTextColor = (r) => r >= 80 ? 'text-green-800' : r >= 70 ? 'text-amber-800' : 'text-red-800';

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
        Failed to load attendance warnings: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TriangleAlert size={30} className="text-amber-500" />
            Attendance Warnings
          </h1>
          <p className="text-gray-500 mt-1">Automatic identification of students with low attendance per course</p>
        </div>
      </div>

      <ThresholdLegend warningBelow={summary.warning_below} criticalBelow={summary.critical_below} />

      <div className="bg-white rounded-xl shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={filters.level}
            onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Levels</option>
            <option value="warning">Warning Only</option>
            <option value="critical">Critical Only</option>
          </select>
          {filterSelect('class_id', 'All Classes', options.classes, 'class_name')}
          {filterSelect('department', 'All Departments', options.departments)}
          <select
            value={filters.course_id}
            onChange={(e) => setFilters((f) => ({ ...f, course_id: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Courses</option>
            {(options.courses || []).map((c) => <option key={c.id} value={c.id}>{c.subject_name}</option>)}
          </select>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search student name or code..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        {(filters.level || filters.class_id || filters.department || filters.course_id || filters.search) && (
          <button
            onClick={() => setFilters({ level: '', class_id: '', department: '', course_id: '', search: '' })}
            className="text-sm text-blue-600 hover:underline mt-3"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {items.length > 0 && (
        <Card icon={TriangleAlert} title="Warning Alerts" subtitle={`${items.length} course-level flags`}>
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {items.map((item, i) => (
              <div key={`${item.student_id}-${item.course_id}-${i}`} className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${item.level === 'critical' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <LevelBadge level={item.level} />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${item.level === 'critical' ? 'text-red-900' : 'text-amber-900'}`}>
                      <span className="font-bold">{item.student_code ?? `#${item.student_id}`}</span> has <b>{item.rate}%</b> attendance in <b>{item.course}</b>
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.student_name} · {item.class}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-bold px-2.5 py-1 rounded ${rateColor(item.rate)} ${rateTextColor(item.rate)}`}>{item.rate}%</span>
                  <button onClick={() => openDetail(item)} className="flex items-center gap-1 px-3 py-1.5 rounded border text-xs font-medium hover:bg-white/50">
                    <Eye size={13} /> View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card icon={School} title="Full Warning Table" subtitle={`All at-risk student-course pairs (${items.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 text-left">Level</th>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left hidden sm:table-cell">Class</th>
                <th className="p-3 text-left">Course</th>
                <th className="p-3 text-right">Attended</th>
                <th className="p-3 text-right">Absent</th>
                <th className="p-3 text-right">Rate</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={`${item.student_id}-${item.course_id}-${i}`} className={`border-t hover:bg-gray-50 ${item.level === 'critical' ? 'bg-red-50/50' : 'bg-amber-50/30'}`}>
                  <td className="p-3"><LevelBadge level={item.level} /></td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{item.student_name}</p>
                      <p className="text-xs text-gray-500">{item.student_code ?? `#${item.student_id}`}</p>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">{item.class}</td>
                  <td className="p-3 font-medium">{item.course}</td>
                  <td className="p-3 text-right text-green-700">{item.present}</td>
                  <td className="p-3 text-right text-red-700">{item.absent}</td>
                  <td className="p-3 text-right">
                    <span className={`font-bold px-2 py-1 rounded text-xs ${rateColor(item.rate)} ${rateTextColor(item.rate)}`}>
                      {item.rate}%
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => openDetail(item)} className="flex items-center gap-1 px-3 py-1.5 rounded border text-xs font-medium text-blue-700 hover:bg-blue-50 ml-auto">
                      <Eye size={13} /> Detail
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan="8" className="p-10 text-center text-gray-400">No attendance warnings \u2014 all students are above thresholds</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {detailLoading && (
        <Modal title="Student Detail" icon={GraduationCap} onClose={() => setDetailLoading(false)} wide>
          <div className="py-10 text-center text-gray-400">Loading student detail...</div>
        </Modal>
      )}

      {viewing && (
        <StudentDetailModal student={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
