import {
  GraduationCap, UserRound, School, CalendarCheck, Award, ClipboardList,
  CalendarDays, DollarSign, Receipt, UsersRound, BookMarked, Bell,
  Users, Briefcase, Building2, FileText, BookOpen, TrendingUp, Clock,
  ClipboardCheck, FolderOpen, History, Wallet, ShieldAlert, LibraryBig,
  CalendarOff, ListChecks, Sparkles, Star, AlertTriangle, XCircle,
  CheckCircle2, BadgePercent, PieChart, CalendarClock, BarChart3,
} from 'lucide-react';
import { apiFetch } from '../api';

const GRADES = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Grade ${i + 1}` }));

async function json(path) {
  try {
    const r = await apiFetch(path);
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

function rowsOf(d) {
  if (Array.isArray(d)) return d;
  if (!d) return [];
  return d.data ?? d.results ?? d.items ?? d.by_class ?? d.by_course
    ?? d.by_department ?? d.rows ?? d.grades ?? d.by_type ?? d.students ?? [];
}

async function all(path) {
  const sep = path.includes('?') ? '&' : '?';
  const out = [];
  let page = 1;
  let perPage = 100;
  let lastPage = Infinity;
  while (page <= 40) {
    const d = await json(`${path}${sep}per_page=${perPage}${page > 1 ? `&page=${page}` : ''}`);
    if (!d) break;
    if (Array.isArray(d)) {
      out.push(...d);
      break;
    }
    const rows = rowsOf(d);
    if (!rows.length) break;
    out.push(...rows);
    lastPage = Number(d.last_page ?? d.meta?.last_page ?? lastPage);
    const metaPerPage = Number(d.per_page ?? d.meta?.per_page ?? perPage);
    if (metaPerPage > 0) perPage = metaPerPage;
    if (page >= lastPage) break;
    page += 1;
  }
  return out;
}

function countBy(arr, keyFn) {
  const m = {};
  arr.forEach((x) => {
    const k = keyFn(x) ?? 'Other';
    m[k] = (m[k] ?? 0) + 1;
  });
  return Object.entries(m)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name)));
}

function sumBy(arr, keyFn) {
  return arr.reduce((acc, x) => acc + (Number(keyFn(x)) || 0), 0);
}

function money(v) {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n.toLocaleString() : (v ?? '0');
}

function monthKey(d) {
  const date = new Date(String(d).slice(0, 10));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-CA', { year: 'numeric', month: '2-digit' });
}

function ageOf(dob) {
  if (!dob) return null;
  const d = new Date(String(dob).slice(0, 10));
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
}

function nameOf(x) {
  if (!x) return '—';
  return x.name ?? x.label ?? x.subject_name ?? x.class_name ?? x.student_name ?? String(x);
}

const studentName = (row) => row.name ?? row.student_name ?? row.student?.name ?? '—';
const studentClass = (row) => row.class?.class_name ?? row.class_name ?? (row.student?.class?.class_name) ?? '—';
const teacherName = (row) => row.teacher?.name ?? row.teacher_name ?? '—';
const subjectName = (row) => row.subject?.subject_name ?? row.subject_name ?? '—';
const studentId = (row) => row.student_id ?? row.student?.student_id ?? '—';

// ─── Param option loaders (used by the viewer) ──────────────────────────────
export async function loadReportOptions(param) {
  switch (param) {
    case 'grade':
      return GRADES;
    case 'class':
      return (await all('/api/classes')).map((c) => ({ value: c.id, label: c.class_name }));
    case 'subject':
      return (await all('/api/subjects')).map((s) => ({ value: s.id, label: s.subject_name }));
    case 'student':
      return (await all('/api/students')).map((s) => ({
        value: s.id,
        label: `${s.name}${s.class?.class_name ? ` · ${s.class.class_name}` : ''}`,
      }));
    case 'teacher':
      return (await all('/api/teachers')).map((t) => ({ value: t.id, label: t.name }));
    case 'parent':
      return (await all('/api/parents')).map((p) => ({ value: p.id, label: p.name }));
    case 'staff':
      return (await all('/api/staff')).map((s) => ({ value: s.id, label: s.name }));
    case 'exam':
      return (await all('/api/exams')).map((e) => ({ value: e.id, label: e.name }));
    case 'homework':
      return (await all('/api/homework')).map((h) => ({ value: h.id, label: h.title }));
    default:
      return [];
  }
}

// ─── CATEGORIES & REPORTS ───────────────────────────────────────────────────
export const REPORT_CATEGORIES = [
  {
    key: 'students',
    title: 'Student Reports',
    icon: GraduationCap,
    reports: [
      {
        key: 'student-list', title: 'Student List', icon: ListChecks,
        desc: 'Complete roster of all enrolled students.',
        columns: [
          { key: 'code', label: 'Student ID' }, { key: 'name', label: 'Name' },
          { key: 'gender', label: 'Gender' }, { key: 'class_name', label: 'Class' },
          { key: 'grade_level', label: 'Grade' }, { key: 'status', label: 'Status' },
          { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
        ],
        fetch: async () => {
          const rows = (await all('/api/students')).map((s) => ({
            code: studentId(s), name: studentName(s), gender: s.gender ?? '—',
            class_name: studentClass(s), grade_level: s.grade_level ?? (s.class?.grade_level) ?? '—',
            status: s.status, phone: s.phone ?? '—', email: s.email ?? '—',
          }));
          return {
            rows,
            cards: [
              { label: 'Total Students', value: rows.length, icon: UsersRound },
              { label: 'Active', value: rows.filter((r) => r.status === 'active').length, icon: CheckCircle2 },
              { label: 'Inactive', value: rows.filter((r) => r.status !== 'active').length, icon: XCircle },
            ],
          };
        },
      },
      {
        key: 'student-profile', title: 'Student Profiles', icon: FileText,
        desc: 'Detailed profile, attendance stats and recent history for a selected student.',
        param: 'student',
        columns: [
          { key: 'date', label: 'Date' }, { key: 'time', label: 'Time' },
          { key: 'subject', label: 'Subject' }, { key: 'status', label: 'Status' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/students/${value}`);
          if (!d) return { rows: [], info: [], note: 'Student not found.' };
          const at = d.attendance_stats ?? {};
          const info = [
            ['Student ID', studentId(d)], ['Name', studentName(d)], ['Gender', d.gender ?? '—'],
            ['Date of Birth', d.dob ?? '—'], ['Class', studentClass(d)], ['Grade Level', d.grade_level ?? '—'],
            ['Status', d.status ?? '—'], ['Phone', d.phone ?? '—'], ['Email', d.email ?? '—'],
            ['Address', d.address ?? '—'], ['Parent / Guardian', d.parent_name ?? '—'],
            ['Parent Phone', d.parent_phone ?? '—'], ['Attendance Rate', at.attendance_rate != null ? `${at.attendance_rate}%` : '—'],
          ].map(([label, value]) => ({ label, value }));
          return {
            info,
            rows: (d.recent_attendances ?? []).map((a) => ({
              date: a.date, time: a.time, subject: a.subject ?? '—', status: a.status,
            })),
            cards: [
              { label: 'Total Sessions', value: at.total ?? 0 }, { label: 'Present', value: at.present ?? 0 },
              { label: 'Absent', value: at.absent ?? 0 }, { label: 'Late', value: at.late ?? 0 },
            ],
            note: 'Recent attendance records shown below.',
          };
        },
      },
      {
        key: 'new-students', title: 'Current Enrollment', icon: Sparkles,
        desc: 'Students enrolled for the current academic year.',
        columns: [
          { key: 'code', label: 'Student ID' }, { key: 'name', label: 'Name' },
          { key: 'class_name', label: 'Class' }, { key: 'enrollment_date', label: 'Enrolled' },
          { key: 'academic_year', label: 'Year' }, { key: 'status', label: 'Status' },
        ],
        fetch: async () => {
          const rows = (await all('/api/students')).map((s) => ({
            code: studentId(s), name: studentName(s), class_name: studentClass(s),
            enrollment_date: s.enrollment_date ?? s.created_at?.slice(0, 10) ?? '—',
            academic_year: s.academic_year ?? '—', status: s.status,
          }));
          return { rows };
        },
      },
      {
        key: 'student-status', title: 'Students by Status', icon: ShieldAlert,
        desc: 'Breakdown of students by their enrollment status (active / inactive / graduated / suspended).',
        param: 'status',
        statusOptions: [
          { value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }, { value: 'graduated', label: 'Graduated' },
          { value: 'suspended', label: 'Suspended' },
        ],
        columns: [
          { key: 'code', label: 'Student ID' }, { key: 'name', label: 'Name' },
          { key: 'gender', label: 'Gender' }, { key: 'class_name', label: 'Class' }, { key: 'status', label: 'Status' },
        ],
        fetch: async ({ value }) => {
          const qs = value && value !== 'all' ? `&status=${value}` : '';
          const rows = (await all(`/api/students${qs}`)).map((s) => ({
            code: studentId(s), name: studentName(s), gender: s.gender ?? '—',
            class_name: studentClass(s), status: s.status,
          }));
          return {
            rows,
            cards: countBy(rows, (r) => r.status).map((g) => ({ label: `${g.name} Students`, value: g.count })),
          };
        },
      },
      {
        key: 'students-by-grade', title: 'Students by Grade', icon: School,
        desc: 'All students in a selected grade level (1–12).',
        param: 'grade',
        columns: [
          { key: 'code', label: 'Student ID' }, { key: 'name', label: 'Name' },
          { key: 'gender', label: 'Gender' }, { key: 'class_name', label: 'Class' }, { key: 'status', label: 'Status' },
        ],
        fetch: async ({ value }) => {
          const rows = (await all(`/api/students?grade_level=${value}`)).map((s) => ({
            code: studentId(s), name: studentName(s), gender: s.gender ?? '—',
            class_name: studentClass(s), status: s.status,
          }));
          return {
            rows,
            cards: [
              { label: 'Students', value: rows.length },
              { label: 'Active', value: rows.filter((r) => r.status === 'active').length },
            ],
          };
        },
      },
      {
        key: 'gender-distribution', title: 'Gender Distribution', icon: PieChart,
        desc: 'Male / Female / Other student counts across the school.',
        columns: [
          { key: 'name', label: 'Gender' }, { key: 'count', label: 'Students', align: 'right' },
          { key: 'share', label: 'Share', align: 'right' },
        ],
        fetch: async () => {
          const rows = await all('/api/students');
          const dist = countBy(rows, (s) => String(s.gender ?? 'Other').trim().toLowerCase())
            .map((g) => ({
              ...g,
              name: g.name.charAt(0).toUpperCase() + g.name.slice(1),
              share: rows.length ? `${Math.round((g.count * 100) / rows.length)}%` : '0%',
            }));
          return { rows: dist };
        },
      },
      {
        key: 'age-distribution', title: 'Age Distribution', icon: Clock,
        desc: 'Students grouped by age derived from date of birth.',
        columns: [
          { key: 'name', label: 'Age Group' }, { key: 'count', label: 'Students', align: 'right' },
          { key: 'share', label: 'Share', align: 'right' },
        ],
        fetch: async () => {
          const rows = await all('/api/students');
          const buckets = { 'Under 6': 0, '6–10': 0, '11–14': 0, '15–18': 0, '19+': 0, 'N/A': 0 };
          rows.forEach((s) => {
            const a = ageOf(s.dob);
            const k = a == null ? 'N/A' : a < 6 ? 'Under 6' : a <= 10 ? '6–10' : a <= 14 ? '11–14' : a <= 18 ? '15–18' : '19+';
            buckets[k] += 1;
          });
          const total = rows.length;
          return {
            rows: Object.entries(buckets).map(([name, count]) => ({
              name, count, share: total ? `${Math.round((count * 100) / total)}%` : '0%',
            })),
            cards: [{ label: 'Total Students', value: total }, { label: 'Reported DOB', value: total - buckets['N/A'] }],
          };
        },
      },
      {
        key: 'enrollment-summary', title: 'Enrollment Summary', icon: Building2,
        desc: 'School-wide enrollment totals, grade distribution and gender ratio.',
        columns: [
          { key: 'grade', label: 'Grade' }, { key: 'students', label: 'Students', align: 'right' },
        ],
        fetch: async () => {
          const summary = await json('/api/students/summary');
          if (!summary) return { rows: [], note: 'Enrollment summary is unavailable.' };
          const gradeRows = (summary.grade_distribution ?? []).map((g) => ({
            grade: g.grade ?? '—', students: g.students ?? 0,
          }));
          const genderRows = (summary.gender_ratio ?? []).map((g) => ({
            name: g.name, count: g.value ?? 0,
          }));
          return {
            rows: gradeRows,
            cards: [
              { label: 'Total Students', value: summary.total ?? 0 },
              { label: 'Active', value: summary.active ?? 0 },
              { label: 'New This Month', value: summary.new_this_month ?? 0 },
              { label: 'Avg Attendance', value: summary.avg_attendance != null ? `${summary.avg_attendance}%` : '—' },
            ],
            extraTables: [
              { title: 'Gender Ratio', columns: [{ key: 'name', label: 'Gender' }, { key: 'count', label: 'Students' }], rows: genderRows },
            ],
          };
        },
      },
      {
        key: 'student-promotion', title: 'Promotion Overview', icon: TrendingUp,
        desc: 'Current grade-level placement per student for planning the next academic year.',
        columns: [
          { key: 'code', label: 'Student ID' }, { key: 'name', label: 'Name' },
          { key: 'class_name', label: 'Class' }, { key: 'grade_level', label: 'Current Grade' },
          { key: 'next', label: 'Next Grade' }, { key: 'status', label: 'Status' },
        ],
        fetch: async () => {
          const rows = (await all('/api/students')).map((s) => {
            const g = Number(s.grade_level ?? s.class?.grade_level) || 0;
            return {
              code: studentId(s), name: studentName(s), class_name: studentClass(s),
              grade_level: g || '—', next: g >= 12 ? 'Graduated' : g ? `Grade ${g + 1}` : '—',
              status: s.status,
            };
          });
          return { rows, note: 'Use the Students page → Promote to apply promotions for a new academic year.' };
        },
      },
    ],
  },

  {
    key: 'teachers',
    title: 'Teacher Reports',
    icon: UserRound,
    reports: [
      {
        key: 'teacher-list', title: 'Teacher List', icon: ListChecks,
        desc: 'Complete roster of teaching staff.',
        columns: [
          { key: 'name', label: 'Name' }, { key: 'position', label: 'Position' },
          { key: 'department', label: 'Dept.' }, { key: 'subjects', label: 'Subjects' },
          { key: 'classes', label: 'Classes' }, { key: 'status', label: 'Status' }, { key: 'phone', label: 'Phone' },
        ],
        fetch: async () => {
          const rows = (await all('/api/teachers')).map((t) => ({
            name: t.name, position: t.position ?? '—', department: t.department ?? '—',
            subjects: (t.subjects ?? []).map((s) => s.subject_name).join(', ') || '—',
            classes: (t.assignedClasses ?? t.classes ?? []).map((c) => c.class_name).join(', ') || '—',
            status: t.status, phone: t.phone ?? '—',
          }));
          return {
            rows,
            cards: [
              { label: 'Total Teachers', value: rows.length },
              { label: 'Active', value: rows.filter((r) => r.status === 'active').length },
            ],
          };
        },
      },
      {
        key: 'teacher-profile', title: 'Teacher Profiles', icon: FileText,
        desc: 'Detailed profile with assigned classes and subjects.',
        param: 'teacher',
        columns: [
          { key: 'class_name', label: 'Class' }, { key: 'subject', label: 'Subject' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/teachers/${value}`);
          if (!d) return { rows: [], info: [], note: 'Teacher not found.' };
          const assignments = [
            ...(d.assignedClasses ?? []).map((c) => ({ class_name: c.class_name, subject: 'Homeroom' })),
            ...(d.subjects ?? []).map((s) => ({ class_name: '—', subject: s.subject_name })),
          ];
          return {
            info: [
              ['Name', d.name], ['Position', d.position ?? '—'], ['Department', d.department ?? '—'],
              ['Status', d.status ?? '—'], ['Phone', d.phone ?? '—'], ['Email', d.email ?? '—'],
              ['Hire Date', d.hire_date ?? '—'],
            ].map(([label, value]) => ({ label, value })),
            rows: assignments,
            cards: [
              { label: 'Subjects', value: (d.subjects ?? []).length },
              { label: 'Classes', value: (d.assignedClasses ?? d.classes ?? []).length },
            ],
          };
        },
      },
      {
        key: 'teachers-by-subject', title: 'Teachers by Subject', icon: BookOpen,
        desc: 'Teachers assigned to a selected course/subject.',
        param: 'subject',
        columns: [
          { key: 'name', label: 'Name' }, { key: 'position', label: 'Position' },
          { key: 'department', label: 'Dept.' }, { key: 'classes', label: 'Classes' }, { key: 'status', label: 'Status' },
        ],
        fetch: async ({ value }) => {
          const rows = (await all('/api/teachers')).filter((t) =>
            (t.subjects ?? []).some((s) => String(s.id) === String(value))
          ).map((t) => ({
            name: t.name, position: t.position ?? '—', department: t.department ?? '—',
            classes: (t.assignedClasses ?? t.classes ?? []).map((c) => c.class_name).join(', ') || '—',
            status: t.status,
          }));
          return { rows };
        },
      },
      {
        key: 'teachers-by-department', title: 'Teachers by Department', icon: Building2,
        desc: 'Teacher counts grouped by department.',
        columns: [
          { key: 'name', label: 'Department' }, { key: 'count', label: 'Teachers', align: 'right' },
        ],
        loadOptions: async () => {
          const teachers = await all('/api/teachers');
          return [
            { value: 'all', label: 'All departments' },
            ...countBy(teachers, (t) => t.department || 'Unassigned').map((g) => ({ value: g.name, label: g.name })),
          ];
        },
        fetch: async ({ value }) => {
          const rows = await all('/api/teachers');
          const filtered = value && value !== 'all' ? rows.filter((t) => (t.department || 'Unassigned') === value) : rows;
          return {
            rows: countBy(filtered, (t) => t.department || 'Unassigned'),
            cards: [{ label: 'Teachers', value: filtered.length }],
          };
        },
      },
      {
        key: 'teacher-workload', title: 'Teacher Workload', icon: ClipboardCheck,
        desc: 'Subject and class load per teacher to balance workloads.',
        columns: [
          { key: 'name', label: 'Name' }, { key: 'department', label: 'Dept.' },
          { key: 'subjects_count', label: 'Subjects', align: 'right' },
          { key: 'classes_count', label: 'Classes', align: 'right' },
          { key: 'total', label: 'Total Load', align: 'right' },
        ],
        fetch: async () => {
          const rows = (await all('/api/teachers')).map((t) => {
            const subjects = (t.subjects ?? []).length;
            const classes = (t.assignedClasses ?? t.classes ?? []).length;
            return {
              name: t.name, department: t.department ?? '—',
              subjects_count: subjects, classes_count: classes, total: subjects + classes,
            };
          }).sort((a, b) => b.total - a.total);
          return { rows, note: 'Highest workload appears first.' };
        },
      },
      {
        key: 'teacher-attendance', title: 'Teacher Attendance', icon: CalendarCheck,
        desc: 'Attendance tracking for teaching staff.',
        columns: [
          { key: 'name', label: 'Name' }, { key: 'present', label: 'Present', align: 'right' },
          { key: 'absent', label: 'Absent', align: 'right' }, { key: 'rate', label: 'Rate %', align: 'right' },
        ],
        fetch: async () => {
          const staff = await all('/api/staff');
          const rows = staff.map((s) => ({
            name: s.name, present: s.attendances_count ?? null, absent: s.leaves_count ?? null,
            rate: '—',
          }));
          return {
            rows,
            note: 'Teacher-specific attendance is tracked via Staff Attendance. Detailed daily logs are on the Attendances page.',
            unavailable: rows.every((r) => r.present == null),
          };
        },
      },
    ],
  },

  {
    key: 'classes',
    title: 'Class Reports',
    icon: School,
    reports: [
      {
        key: 'class-list', title: 'Class List', icon: ListChecks,
        desc: 'All class sections, homeroom teachers, students and courses.',
        columns: [
          { key: 'class_name', label: 'Class' }, { key: 'grade_level', label: 'Grade' },
          { key: 'homeroom', label: 'Homeroom Teacher' }, { key: 'students_count', label: 'Students', align: 'right' },
          { key: 'courses', label: 'Courses' },
        ],
        fetch: async () => {
          const rows = (await all('/api/classes')).map((c) => ({
            class_name: c.class_name, grade_level: c.grade_level ?? '—',
            homeroom: c.teacher?.name ?? '—', students_count: c.students_count ?? 0,
            courses: (c.courses ?? []).map((s) => s.subject_name).join(', ') || '—',
          }));
          return {
            rows,
            cards: [
              { label: 'Total Classes', value: rows.length },
              { label: 'Total Students', value: sumBy(rows, (r) => r.students_count) },
            ],
          };
        },
      },
      {
        key: 'class-roster', title: 'Class Rosters', icon: UsersRound,
        desc: 'Students enrolled in a selected class section.',
        param: 'class',
        columns: [
          { key: 'code', label: 'Student ID' }, { key: 'name', label: 'Name' },
          { key: 'gender', label: 'Gender' }, { key: 'status', label: 'Status' },
        ],
        fetch: async ({ value }) => {
          const rows = (await all('/api/students?class_id=' + value)).map((s) => ({
            code: studentId(s), name: studentName(s), gender: s.gender ?? '—', status: s.status,
          }));
          return {
            rows,
            cards: [
              { label: 'Students', value: rows.length },
              { label: 'Active', value: rows.filter((r) => r.status === 'active').length },
            ],
          };
        },
      },
      {
        key: 'class-capacity', title: 'Class Capacity', icon: Building2,
        desc: 'Current occupancy per class section.',
        columns: [
          { key: 'class_name', label: 'Class' }, { key: 'room', label: 'Room' },
          { key: 'students_count', label: 'Students', align: 'right' },
        ],
        fetch: async () => {
          const rows = (await all('/api/classes')).map((c) => ({
            class_name: c.class_name, room: c.room ?? c.classroom ?? '—', students_count: c.students_count ?? 0,
          }));
          return { rows };
        },
      },
      {
        key: 'class-schedule-profile', title: 'Class Schedule', icon: CalendarClock,
        desc: 'Weekly timetable for a selected class section.',
        param: 'class',
        columns: [
          { key: 'day', label: 'Day' }, { key: 'time', label: 'Time' },
          { key: 'subject', label: 'Subject' }, { key: 'teacher', label: 'Teacher' }, { key: 'room', label: 'Room' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/classes/${value}`);
          if (!d) return { rows: [], note: 'Class not found.' };
          return {
            info: [
              ['Class', d.class_name], ['Grade Level', d.grade_level ?? '—'],
              ['Homeroom Teacher', d.teacher?.name ?? '—'], ['Students', (d.students ?? []).length],
            ].map(([label, value]) => ({ label, value })),
            rows: (d.schedules ?? []).map((s) => ({
              day: s.day ?? s.day_of_week ?? '—',
              time: `${String(s.time_start ?? '—').slice(0, 5)} – ${String(s.time_end ?? '—').slice(0, 5)}`,
              subject: s.subject?.subject_name ?? s.subject_name ?? '—',
              teacher: s.teacher?.name ?? '—', room: s.room ?? '—',
            })),
          };
        },
      },
      {
        key: 'homeroom-report', title: 'Homeroom Teachers', icon: UserRound,
        desc: 'Class sections matched to their homeroom teacher.',
        columns: [
          { key: 'class_name', label: 'Class' }, { key: 'homeroom', label: 'Homeroom Teacher' },
          { key: 'students_count', label: 'Students', align: 'right' },
        ],
        fetch: async () => {
          const rows = (await all('/api/classes')).map((c) => ({
            class_name: c.class_name, homeroom: c.teacher?.name ?? 'Unassigned', students_count: c.students_count ?? 0,
          }));
          return {
            rows,
            cards: [
              { label: 'Classes', value: rows.length },
              { label: 'Assigned', value: rows.filter((r) => r.homeroom !== 'Unassigned').length },
              { label: 'Unassigned', value: rows.filter((r) => r.homeroom === 'Unassigned').length },
            ],
          };
        },
      },
      {
        key: 'students-per-grade', title: 'Students per Grade', icon: School,
        desc: 'Enrollment totals by grade level derived from class capacity.',
        columns: [
          { key: 'name', label: 'Grade' }, { key: 'count', label: 'Students', align: 'right' },
        ],
        fetch: async () => {
          const rows = await all('/api/classes');
          return {
            rows: countBy(rows, (c) => c.grade_level ? `Grade ${c.grade_level}` : '—')
              .map((g) => ({ name: g.name, count: g.count })),
          };
        },
      },
    ],
  },

  {
    key: 'attendance',
    title: 'Attendance Reports',
    icon: CalendarCheck,
    reports: [
      {
        key: 'attendance-analytics', title: 'Attendance Analytics', icon: TrendingUp,
        desc: 'Interactive dashboard with trends, class/course/department breakdowns and at-risk detection.',
        columns: [],
        fetch: async () => ({ rows: [], note: 'Open the interactive Attendance Analytics dashboard for full visuals.' }),
        link: '/reports/analytics',
        hasAction: true,
      },
      {
        key: 'attendance-summary', title: 'Daily Attendance Summary', icon: ClipboardCheck,
        desc: 'Present / absent / late totals across all classes on a selected day (defaults to today).',
        columns: [
          { key: 'class_name', label: 'Class' }, { key: 'present', label: 'Present', align: 'right' },
          { key: 'absent', label: 'Absent', align: 'right' }, { key: 'late', label: 'Late', align: 'right' },
        ],
        fetch: async () => {
          const today = new Date().toISOString().slice(0, 10);
          const d = await json(`/api/reports/attendance?date_from=${today}&date_to=${today}`);
          return {
            rows: (d?.by_class ?? []).map((c) => ({
              class_name: c.name ?? '—', present: c.present ?? 0, absent: c.absent ?? 0, late: c.late ?? 0,
            })),
            cards: [{ label: 'Overall Rate', value: d?.summary?.attendance_rate != null ? `${d.summary.attendance_rate}%` : '—' }],
            note: `Showing data for ${today}.`,
          };
        },
      },
      {
        key: 'attendance-class', title: 'Attendance by Class', icon: School,
        desc: 'Attendance rates by class section across the whole date range.',
        columns: [
          { key: 'class_name', label: 'Class' }, { key: 'present', label: 'Present', align: 'right' },
          { key: 'absent', label: 'Absent', align: 'right' }, { key: 'late', label: 'Late', align: 'right' },
          { key: 'rate', label: 'Rate %', align: 'right' },
        ],
        fetch: async () => {
          const d = await json('/api/reports/attendance');
          return {
            rows: (d?.by_class ?? []).map((c) => ({
              class_name: c.name ?? '—', present: c.present ?? 0, absent: c.absent ?? 0,
              late: c.late ?? 0, rate: c.attendance_rate ?? '—',
            })),
          };
        },
      },
      {
        key: 'attendance-student', title: 'Student Attendance', icon: UserRound,
        desc: 'Course-by-course attendance breakdown for a selected student.',
        param: 'student',
        columns: [
          { key: 'name', label: 'Course' }, { key: 'present', label: 'Present', align: 'right' },
          { key: 'absent', label: 'Absent', align: 'right' }, { key: 'late', label: 'Late', align: 'right' },
          { key: 'rate', label: 'Rate %', align: 'right' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/reports/attendance/student?student_id=${value}`);
          if (!d) return { rows: [], note: 'No attendance data for this student.' };
          return {
            info: [
              ['Student', d.student?.name], ['Class', d.student?.class ?? '—'],
              ['Attendance Rate', d.summary ? `${d.summary.attendance_rate}%` : '—'],
              ['Total Sessions', d.summary?.total ?? 0],
            ].map(([label, value]) => ({ label, value })),
            rows: (d.courses ?? []).map((c) => ({
              name: c.name, present: c.present ?? 0, absent: c.absent ?? 0,
              late: c.late ?? 0, rate: c.attendance_rate ?? '—',
            })),
            cards: (d.summary ? [
              { label: 'Present', value: d.summary.present ?? 0 },
              { label: 'Absent', value: d.summary.absent ?? 0 },
              { label: 'Late', value: d.summary.late ?? 0 },
            ] : []),
          };
        },
      },
      {
        key: 'attendance-absent', title: 'Absent Students', icon: XCircle,
        desc: 'Students marked absent, ranked by total absences.',
        columns: [
          { key: 'name', label: 'Student' }, { key: 'class_name', label: 'Class' },
          { key: 'absent', label: 'Absent', align: 'right' }, { key: 'rate', label: 'Attendance %', align: 'right' },
        ],
        fetch: async () => {
          const summary = await json('/api/students/summary');
          const rows = (summary?.students ?? [])
            .filter((s) => s.status === 'active')
            .sort((a, b) => (b.attendance ?? 0) - (a.attendance ?? 0))
            .map((s) => ({
              name: s.name, class_name: s.class_name ?? '—', absent: s.attendance != null ? `${100 - s.attendance}%` : '—',
              rate: s.attendance ?? '—',
            }));
          return { rows, note: 'Ranked by lowest attendance rate.' };
        },
      },
      {
        key: 'attendance-low', title: 'At-Risk Students', icon: AlertTriangle,
        desc: 'Students falling below the 75% attendance threshold.',
        columns: [
          { key: 'name', label: 'Student' }, { key: 'class', label: 'Class' },
          { key: 'total', label: 'Sessions', align: 'right' }, { key: 'absent', label: 'Absent', align: 'right' },
          { key: 'late', label: 'Late', align: 'right' }, { key: 'rate', label: 'Attendance %', align: 'right' },
        ],
        fetch: async () => {
          const d = await json('/api/reports/attendance');
          return { rows: d?.low_attendance ?? [], note: 'Same data powers the Warnings page.' };
        },
      },
    ],
  },

  {
    key: 'academic',
    title: 'Academic Reports',
    icon: Award,
    reports: [
      {
        key: 'exam-list', title: 'Exam Schedule', icon: FileText,
        desc: 'All exams with date, subject, grade, type and status.',
        columns: [
          { key: 'name', label: 'Exam' }, { key: 'subject', label: 'Subject' },
          { key: 'class_name', label: 'Class' }, { key: 'grade_level', label: 'Grade' },
          { key: 'date', label: 'Date' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' },
        ],
        fetch: async () => {
          const rows = (await all('/api/exams')).map((e) => ({
            name: e.name, subject: subjectName(e), class_name: e.schoolClass?.class_name ?? e.class_name ?? '—',
            grade_level: e.grade_level ?? '—', date: e.date, type: e.type ?? '—', status: e.status ?? '—',
          }));
          return {
            rows,
            cards: countBy(rows, (r) => r.status).map((g) => ({ label: `${g.name} Exams`, value: g.count })),
          };
        },
      },
      {
        key: 'exam-results', title: 'Exam Results', icon: Award,
        desc: 'Ranked marks, pass rate and statistics for a completed exam.',
        param: 'exam',
        columns: [
          { key: 'rank', label: 'Rank', align: 'right' }, { key: 'code', label: 'Student ID' },
          { key: 'name', label: 'Student' }, { key: 'section', label: 'Section' },
          { key: 'marks_obtained', label: 'Marks', align: 'right' }, { key: 'percentage', label: '%', align: 'right' },
          { key: 'status', label: 'Status' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/exams/${value}/results`);
          if (!d) return { rows: [], note: 'Exam results unavailable.' };
          const st = d.stats ?? {};
          return {
            info: [
              ['Exam', d.exam?.name], ['Subject', subjectName(d.exam)],
              ['Grade', d.exam?.grade_level ?? d.exam?.schoolClass?.class_name ?? '—'],
              ['Date', d.exam?.date ?? '—'],
            ].map(([label, value]) => ({ label, value })),
            rows: (d.results ?? []).map((r) => ({
              rank: r.rank, code: r.student_code ?? '—', name: r.student_name ?? '—',
              section: r.section ?? '—', marks_obtained: r.marks_obtained ?? 0,
              percentage: r.percentage ?? 0, status: r.status ?? '—',
            })),
            cards: [
              { label: 'Students', value: st.total ?? 0 }, { label: 'Pass', value: st.pass ?? 0 },
              { label: 'Fail', value: st.fail ?? 0 }, { label: 'Pass Rate', value: st.pass_rate != null ? `${st.pass_rate}%` : '—' },
              { label: 'Average', value: st.average ?? '—' }, { label: 'Highest', value: st.highest ?? '—' },
            ],
          };
        },
      },
      {
        key: 'grade-level-grades', title: 'Grade-Level Grades', icon: GraduationCap,
        desc: 'Aggregated results, GPA and rankings for a whole grade level (1–12).',
        param: 'grade',
        columns: [
          { key: 'rank', label: 'Rank', align: 'right' }, { key: 'code', label: 'Student ID' },
          { key: 'name', label: 'Student' }, { key: 'section', label: 'Section' },
          { key: 'percentage', label: '%', align: 'right' }, { key: 'grade', label: 'Grade' },
          { key: 'gpa', label: 'GPA', align: 'right' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/grades/grade-level/${value}`);
          if (!d) return { rows: [], note: `No completed exams for grade ${value}.` };
          const st = d.stats ?? {};
          return {
            rows: (d.results ?? []).map((r) => ({
              rank: r.rank, code: r.student_code ?? '—', name: r.student_name ?? '—',
              section: r.section ?? '—', percentage: r.percentage ?? 0,
              grade: r.grade ?? '—', gpa: r.gpa ?? 0,
            })),
            cards: [
              { label: 'Students', value: st.total_students ?? 0 },
              { label: 'Avg GPA', value: st.average_gpa ?? '—' },
              { label: 'Pass', value: st.pass_count ?? 0 },
              { label: 'Fail', value: st.fail_count ?? 0 },
            ],
          };
        },
      },
      {
        key: 'class-results', title: 'Class Results', icon: School,
        desc: 'Aggregated exam results for a selected class section.',
        param: 'class',
        columns: [
          { key: 'rank', label: 'Rank', align: 'right' }, { key: 'name', label: 'Student' },
          { key: 'percentage', label: '%', align: 'right' }, { key: 'grade', label: 'Grade' },
          { key: 'gpa', label: 'GPA', align: 'right' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/grades/class/${value}`);
          if (!d) return { rows: [], note: 'No results for this class.' };
          const st = d.stats ?? {};
          return {
            rows: (d.results ?? []).map((r) => ({
              rank: r.rank, name: r.student_name ?? '—', percentage: r.percentage ?? 0,
              grade: r.grade ?? '—', gpa: r.gpa ?? 0,
            })),
            cards: [
              { label: 'Avg GPA', value: st.average_gpa ?? '—' },
              { label: 'Avg %', value: st.average_percentage ?? '—' },
              { label: 'Pass', value: st.pass_count ?? 0 }, { label: 'Fail', value: st.fail_count ?? 0 },
            ],
          };
        },
      },
      {
        key: 'top-students', title: 'Top Students', icon: Star,
        desc: 'Class leaders by GPA for a selected grade level.',
        param: 'grade',
        columns: [
          { key: 'rank', label: 'Rank', align: 'right' }, { key: 'name', label: 'Student' },
          { key: 'section', label: 'Section' }, { key: 'percentage', label: '%', align: 'right' },
          { key: 'grade', label: 'Grade' }, { key: 'gpa', label: 'GPA', align: 'right' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/grades/grade-level/${value}`);
          const rows = (d?.results ?? []).filter((r) => (r.gpa ?? 0) > 0).map((r) => ({
            rank: r.rank, name: r.student_name ?? '—', section: r.section ?? '—',
            percentage: r.percentage ?? 0, grade: r.grade ?? '—', gpa: r.gpa ?? 0,
          }));
          return { rows: rows.slice(0, 15), note: 'Top 15 students by GPA — data requires completed exams.' };
        },
      },
      {
        key: 'failed-students', title: 'Failed Students', icon: XCircle,
        desc: 'Students scoring below 50% for a selected grade level.',
        param: 'grade',
        columns: [
          { key: 'rank', label: 'Rank', align: 'right' }, { key: 'name', label: 'Student' },
          { key: 'section', label: 'Section' }, { key: 'percentage', label: '%', align: 'right' },
          { key: 'grade', label: 'Grade' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/grades/grade-level/${value}`);
          const rows = (d?.results ?? []).filter((r) => (r.percentage ?? 0) < 50).map((r) => ({
            rank: r.rank, name: r.student_name ?? '—', section: r.section ?? '—',
            percentage: r.percentage ?? 0, grade: r.grade ?? '—',
          }));
          return { rows, note: 'Based on completed exams for the grade.' };
        },
      },
      {
        key: 'grade-distribution', title: 'Grade Distribution', icon: BadgePercent,
        desc: 'Students per letter grade for a selected grade level.',
        param: 'grade',
        columns: [
          { key: 'name', label: 'Grade' }, { key: 'count', label: 'Students', align: 'right' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/grades/grade-level/${value}`);
          const rows = countBy((d?.results ?? []).filter((r) => r.grade), (r) => r.grade);
          return { rows };
        },
      },
      {
        key: 'report-cards', title: 'Published Report Cards', icon: FolderOpen,
        desc: 'All published report cards with overall percentage, GPA and grade.',
        columns: [
          { key: 'code', label: 'Student ID' }, { key: 'student', label: 'Student' },
          { key: 'class_name', label: 'Class' }, { key: 'academic_year', label: 'Academic Year' },
          { key: 'semester', label: 'Semester' }, { key: 'percentage', label: '%', align: 'right' },
          { key: 'gpa', label: 'GPA', align: 'right' }, { key: 'grade', label: 'Grade' },
        ],
        fetch: async () => {
          const rows = (await all('/api/result-cards')).map((rc) => ({
            code: rc.student?.student_id ?? '—', student: rc.student?.name ?? rc.student_name ?? '—',
            class_name: rc.schoolClass?.class_name ?? rc.student?.class?.class_name ?? rc.class_name ?? '—',
            academic_year: rc.academic_year ?? '—', semester: rc.semester ?? '—',
            percentage: rc.percentage ?? 0, gpa: rc.gpa ?? 0, grade: rc.grade ?? '—',
          }));
          return {
            rows,
            cards: [
              { label: 'Published', value: rows.length },
              { label: 'Avg GPA', value: rows.length ? (sumBy(rows, (r) => Number(r.gpa)) / rows.length).toFixed(2) : '—' },
            ],
          };
        },
      },
    ],
  },

  {
    key: 'homework',
    title: 'Homework Reports',
    icon: ClipboardList,
    reports: [
      {
        key: 'homework-list', title: 'Homework List', icon: ListChecks,
        desc: 'All homework assignments with subject, class, teacher and due date.',
        columns: [
          { key: 'title', label: 'Title' }, { key: 'subject', label: 'Subject' },
          { key: 'class_name', label: 'Class' }, { key: 'teacher', label: 'Teacher' },
          { key: 'due', label: 'Due Date' }, { key: 'status', label: 'Status' },
        ],
        fetch: async () => {
          const rows = (await all('/api/homework')).map((h) => ({
            title: h.title, subject: subjectName(h),
            class_name: h.schoolClass?.class_name ?? h.class_name ?? '—',
            teacher: h.teacher?.name ?? '—', due: h.due_date ?? '—', status: h.status ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'homework-stats', title: 'Homework Completion', icon: ClipboardCheck,
        desc: 'Completion statistics: assigned, active, submitted, pending and graded.',
        columns: [
          { key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value', align: 'right' },
        ],
        fetch: async () => {
          const stats = await json('/api/homework/stats');
          if (!stats) return { rows: [], note: 'Homework statistics unavailable.' };
          const metrics = [
            ['Total Assignments', stats.total ?? 0], ['Active', stats.active ?? '—'],
            ['Submitted', stats.submitted ?? '—'], ['Pending', stats.pending ?? '—'],
            ['Graded', stats.graded ?? '—'],
          ];
          return {
            rows: metrics.filter(([, v]) => v !== undefined).map(([metric, value]) => ({ metric, value })),
            cards: [
              { label: 'Total', value: stats.total ?? 0 }, { label: 'Active', value: stats.active ?? '—' },
              { label: 'Graded', value: stats.graded ?? '—' },
            ],
            note: 'Per-assignment submission details are on Homework → Submitted Homework.',
          };
        },
      },
      {
        key: 'homework-submissions', title: 'Submitted Homework', icon: FileText,
        desc: 'Submissions for a selected homework assignment.',
        param: 'homework',
        columns: [
          { key: 'code', label: 'Student ID' }, { key: 'student', label: 'Student' },
          { key: 'class_name', label: 'Class' }, { key: 'status', label: 'Status' },
          { key: 'score', label: 'Score', align: 'right' },
        ],
        fetch: async ({ value }) => {
          const sub = await json(`/api/homework/${value}/submissions`);
          const rows = (sub ?? []).map((x) => ({
            code: x.student?.student_id ?? '—', student: x.student?.name ?? '—',
            class_name: x.student?.class?.class_name ?? '—', status: x.status ?? 'submitted',
            score: x.score != null ? `${x.score}%` : '—',
          }));
          return {
            rows,
            cards: countBy(rows, (r) => r.status).map((g) => ({ label: g.name, value: g.count })),
          };
        },
      },
      {
        key: 'homework-missing', title: 'Missing Homework', icon: AlertTriangle,
        desc: 'Assignments not yet submitted and overdue.',
        columns: [
          { key: 'title', label: 'Assignment' }, { key: 'class_name', label: 'Class' },
          { key: 'due', label: 'Due Date' }, { key: 'status', label: 'Status' },
        ],
        fetch: async () => {
          const rows = (await all('/api/homework'))
            .filter((h) => /open|pending|active/i.test(String(h.status ?? '')) || !h.submittedCount)
            .map((h) => ({
              title: h.title, class_name: h.schoolClass?.class_name ?? h.class_name ?? '—',
              due: h.due_date ?? '—', status: h.status ?? 'open',
            }));
          return { rows, note: 'Assignments still open or pending submission.' };
        },
      },
    ],
  },

  {
    key: 'schedule',
    title: 'Schedule Reports',
    icon: CalendarDays,
    reports: [
      {
        key: 'master-schedule', title: 'Master Schedule', icon: CalendarDays,
        desc: 'The full weekly timetable across classes, teachers, subjects and rooms.',
        columns: [
          { key: 'class_name', label: 'Class' }, { key: 'day', label: 'Day' },
          { key: 'time', label: 'Time' }, { key: 'subject', label: 'Subject' },
          { key: 'teacher', label: 'Teacher' }, { key: 'room', label: 'Room' },
        ],
        fetch: async () => {
          const rows = (await all('/api/schedules')).map((s) => ({
            class_name: s.class?.class_name ?? s.class_name ?? '—', day: s.day ?? s.day_of_week ?? '—',
            time: `${String(s.time_start ?? '—').slice(0, 5)} – ${String(s.time_end ?? '—').slice(0, 5)}`,
            subject: subjectName(s), teacher: teacherName(s), room: s.room ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'schedule-class', title: 'Class Schedule', icon: School,
        desc: 'Weekly timetable for a selected class.',
        param: 'class',
        columns: [
          { key: 'day', label: 'Day' }, { key: 'time', label: 'Time' },
          { key: 'subject', label: 'Subject' }, { key: 'teacher', label: 'Teacher' }, { key: 'room', label: 'Room' },
        ],
        fetch: async ({ value }) => {
          const rows = (await all(`/api/schedules?class_id=${value}`)).map((s) => ({
            day: s.day ?? s.day_of_week ?? '—', time: `${String(s.time_start ?? '—').slice(0, 5)} – ${String(s.time_end ?? '—').slice(0, 5)}`,
            subject: subjectName(s), teacher: teacherName(s), room: s.room ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'schedule-teacher', title: 'Teacher Schedule', icon: UserRound,
        desc: 'Weekly timetable for a selected teacher.',
        param: 'teacher',
        columns: [
          { key: 'day', label: 'Day' }, { key: 'time', label: 'Time' },
          { key: 'class_name', label: 'Class' }, { key: 'subject', label: 'Subject' }, { key: 'room', label: 'Room' },
        ],
        fetch: async ({ value }) => {
          const rows = (await all(`/api/schedules?teacher_id=${value}`)).map((s) => ({
            day: s.day ?? s.day_of_week ?? '—', time: `${String(s.time_start ?? '—').slice(0, 5)} – ${String(s.time_end ?? '—').slice(0, 5)}`,
            class_name: s.class?.class_name ?? s.class_name ?? '—', subject: subjectName(s), room: s.room ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'schedule-room', title: 'Room Schedule', icon: Building2,
        desc: 'What happens in each room across the week.',
        columns: [
          { key: 'room', label: 'Room' }, { key: 'day', label: 'Day' },
          { key: 'time', label: 'Time' }, { key: 'class_name', label: 'Class' }, { key: 'subject', label: 'Subject' },
        ],
        fetch: async () => {
          const rows = (await all('/api/schedules')).map((s) => ({
            room: s.room ?? '—', day: s.day ?? s.day_of_week ?? '—',
            time: `${String(s.time_start ?? '—').slice(0, 5)} – ${String(s.time_end ?? '—').slice(0, 5)}`,
            class_name: s.class?.class_name ?? s.class_name ?? '—', subject: subjectName(s),
          })).filter((r) => r.room !== '—');
          return { rows };
        },
      },
      {
        key: 'exam-schedule', title: 'Exam Schedule', icon: FileText,
        desc: 'Upcoming and scheduled exams across grade levels.',
        columns: [
          { key: 'name', label: 'Exam' }, { key: 'subject', label: 'Subject' },
          { key: 'grade_level', label: 'Grade' }, { key: 'date', label: 'Date' }, { key: 'type', label: 'Type' },
        ],
        fetch: async () => {
          const rows = (await all('/api/exams')).map((e) => ({
            name: e.name, subject: subjectName(e), grade_level: e.grade_level ?? '—',
            date: e.date, type: e.type ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'schedule-conflicts', title: 'Schedule Conflicts', icon: AlertTriangle,
        desc: 'Overlapping timetable slots flagged by the system.',
        columns: [
          { key: 'day', label: 'Day' }, { key: 'time', label: 'Time' },
          { key: 'details', label: 'Conflict Details' },
        ],
        fetch: async () => {
          const d = await json('/api/schedules/conflicts');
          const items = Array.isArray(d) ? d : d?.conflicts ?? [];
          const rows = items.map((c) => ({
            day: c.day ?? c.date ?? '—', time: c.time ?? '—',
            details: c.details ?? c.message ?? JSON.stringify(c),
          }));
          return { rows: rows.slice(0, 200), note: rows.length ? `Found ${rows.length} flagged conflict(s).` : 'No conflicts detected.' };
        },
      },
    ],
  },

  {
    key: 'finance',
    title: 'Finance Reports',
    icon: DollarSign,
    reports: [
      {
        key: 'fee-collection', title: 'Fee Collection', icon: Wallet,
        desc: 'Total collected vs pending fees broken down by fee type.',
        columns: [
          { key: 'type', label: 'Fee Type' }, { key: 'total_amount', label: 'Billed', align: 'right' },
          { key: 'collected', label: 'Collected', align: 'right' }, { key: 'pending', label: 'Pending', align: 'right' },
        ],
        fetch: async () => {
          const year = new Date().getFullYear();
          const d = await json(`/api/fees/reports/collection?academic_year=${year}-${year + 1}`);
          if (!d) return { rows: [], note: 'Fee collection report unavailable for this academic year.' };
          return {
            rows: (d.by_type ?? []).map((t) => ({
              type: t.type ?? '—', total_amount: money(t.total_amount), collected: money(t.collected), pending: money(t.pending),
            })),
            cards: [
              { label: 'Total Collected', value: money(d.total_collected) },
              { label: 'Total Pending', value: money(d.total_pending) },
            ],
          };
        },
      },
      {
        key: 'invoices-outstanding', title: 'Outstanding Fees', icon: AlertTriangle,
        desc: 'All invoices that are unpaid or partially paid.',
        columns: [
          { key: 'invoice', label: 'Invoice #' }, { key: 'student', label: 'Student' },
          { key: 'class_name', label: 'Class' }, { key: 'type', label: 'Type' },
          { key: 'amount', label: 'Amount', align: 'right' }, { key: 'paid', label: 'Paid', align: 'right' },
          { key: 'balance', label: 'Balance', align: 'right' }, { key: 'due', label: 'Due Date' },
        ],
        fetch: async () => {
          const rows = (await all('/api/fees/invoices?per_page=1000')).filter((i) => i.status !== 'paid').map((i) => ({
            invoice: i.invoice_number ?? i.id, student: i.student?.name ?? '—',
            class_name: i.student?.class?.class_name ?? '—', type: i.feeStructure?.name ?? i.feeStructure?.type ?? '—',
            amount: money(i.amount), paid: money(i.paid_amount), balance: money(i.balance), due: i.due_date ?? '—',
          }));
          return {
            rows,
            cards: [{ label: 'Outstanding Invoices', value: rows.length }, { label: 'Unpaid Balance', value: money(sumBy(rows, (r) => Number(r.balance.replace(/,/g, '')) || 0)) }],
          };
        },
      },
      {
        key: 'paid-fees', title: 'Paid Fees', icon: CheckCircle2,
        desc: 'Fully paid invoices.',
        columns: [
          { key: 'student', label: 'Student' }, { key: 'class_name', label: 'Class' },
          { key: 'type', label: 'Type' }, { key: 'amount', label: 'Amount', align: 'right' },
          { key: 'paid', label: 'Paid', align: 'right' }, { key: 'due', label: 'Due Date' },
        ],
        fetch: async () => {
          const rows = (await all('/api/fees/invoices?per_page=1000')).filter((i) => i.status === 'paid').map((i) => ({
            student: i.student?.name ?? '—', class_name: i.student?.class?.class_name ?? '—',
            type: i.feeStructure?.name ?? i.feeStructure?.type ?? '—', amount: money(i.amount),
            paid: money(i.paid_amount), due: i.due_date ?? '—',
          }));
          return { rows, cards: [{ label: 'Paid Invoices', value: rows.length }] };
        },
      },
      {
        key: 'unpaid-students', title: 'Unpaid Students', icon: XCircle,
        desc: 'Students with fully unpaid invoices.',
        columns: [
          { key: 'student', label: 'Student' }, { key: 'class_name', label: 'Class' },
          { key: 'balance', label: 'Balance', align: 'right' }, { key: 'due', label: 'Due Date' },
        ],
        fetch: async () => {
          const rows = (await all('/api/fees/invoices?per_page=1000')).filter((i) => i.status === 'unpaid' || (i.status == null && Number(i.balance) > 0)).map((i) => ({
            student: i.student?.name ?? '—', class_name: i.student?.class?.class_name ?? '—',
            balance: money(i.balance), due: i.due_date ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'payment-history', title: 'Payment History', icon: History,
        desc: 'Every fee payment recorded, newest first.',
        columns: [
          { key: 'date', label: 'Date' }, { key: 'student', label: 'Student' },
          { key: 'amount', label: 'Amount', align: 'right' }, { key: 'method', label: 'Method' },
          { key: 'reference', label: 'Reference' }, { key: 'received_by', label: 'Received By' },
        ],
        fetch: async () => {
          const rows = (await all('/api/fees/payments?per_page=1000')).map((p) => ({
            date: p.payment_date ?? '—', student: p.student?.name ?? '—',
            amount: money(p.amount), method: p.payment_method ?? '—',
            reference: p.transaction_reference ?? '—', received_by: p.receiver?.name ?? '—',
          }));
          return { rows, cards: [{ label: 'Total Payments', value: rows.length }, { label: 'Collected', value: money(sumBy(rows, (r) => Number(r.amount.replace(/,/g, '')) || 0)) }] };
        },
      },
      {
        key: 'revenue-month', title: 'Revenue by Month', icon: TrendingUp,
        desc: 'Collected revenue aggregated by month.',
        columns: [
          { key: 'name', label: 'Month' }, { key: 'count', label: 'Payments', align: 'right' },
          { key: 'amount', label: 'Collected', align: 'right' },
        ],
        fetch: async () => {
          const rows = await all('/api/fees/payments?per_page=1000');
          const months = {};
          rows.forEach((p) => {
            const k = monthKey(p.payment_date);
            months[k] = months[k] ?? { count: 0, amount: 0 };
            months[k].count += 1;
            months[k].amount += Number(p.amount) || 0;
          });
          return {
            rows: Object.entries(months).sort().map(([name, v]) => ({ name, count: v.count, amount: v.amount.toLocaleString() })),
          };
        },
      },
      {
        key: 'revenue-class', title: 'Revenue by Class', icon: School,
        desc: 'Collected revenue aggregated by the paying student’s class.',
        columns: [
          { key: 'name', label: 'Class' }, { key: 'count', label: 'Payments', align: 'right' },
          { key: 'amount', label: 'Collected', align: 'right' },
        ],
        fetch: async () => {
          const rows = await all('/api/fees/payments?per_page=1000');
          const groups = {};
          rows.forEach((p) => {
            const k = p.student?.class?.class_name ?? 'Unknown';
            groups[k] = groups[k] ?? { count: 0, amount: 0 };
            groups[k].count += 1;
            groups[k].amount += Number(p.amount) || 0;
          });
          return {
            rows: Object.entries(groups).sort((a, b) => b[1].amount - a[1].amount)
              .map(([name, v]) => ({ name, count: v.count, amount: v.amount.toLocaleString() })),
          };
        },
      },
      {
        key: 'fee-structures', title: 'Fee Structures', icon: Receipt,
        desc: 'Defined fee types, amounts and academic year applicability.',
        columns: [
          { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' },
          { key: 'class_name', label: 'Class' }, { key: 'amount', label: 'Amount', align: 'right' },
          { key: 'academic_year', label: 'Academic Year' }, { key: 'is_active', label: 'Active' },
        ],
        fetch: async () => {
          const d = await json('/api/fees/structures');
          const rows = (d ?? []).map((f) => ({
            name: f.name, type: f.type ?? '—', class_name: f.schoolClass?.class_name ?? 'All',
            amount: money(f.amount), academic_year: f.academic_year ?? '—', is_active: f.is_active ? 'Yes' : 'No',
          }));
          return { rows };
        },
      },
    ],
  },

  {
    key: 'expense',
    title: 'Expense Reports',
    icon: Receipt,
    reports: [
      {
        key: 'payroll-expenses', title: 'Payroll Expenses', icon: Wallet,
        desc: 'Total payroll cost components for a selected month (defaults to current).',
        columns: [
          { key: 'metric', label: 'Component' }, { key: 'value', label: 'Amount', align: 'right' },
        ],
        fetch: async () => {
          const month = new Date().toISOString().slice(0, 7);
          const d = await json(`/api/payroll/reports?month=${month}`);
          if (!d) return { rows: [], note: `No payroll data for ${month}.` };
          const metrics = [
            ['Employees', d.total_employees ?? 0], ['Basic Salary', money(d.total_basic)],
            ['Allowances', money(d.total_allowances)], ['Bonuses', money(d.total_bonuses)],
            ['Deductions', money(d.total_deductions)], ['Tax', money(d.total_tax)],
            ['Net Payroll', money(d.total_net)],
          ];
          return {
            rows: metrics.map(([metric, value]) => ({ metric, value })),
            cards: [
              { label: 'Employees', value: d.total_employees ?? 0 },
              { label: 'Net Payroll', value: money(d.total_net) },
            ],
            note: `Payroll report for ${month}.`,
          };
        },
      },
      {
        key: 'payroll-register', title: 'Payroll Register', icon: ListChecks,
        desc: 'Per-employee salary records.',
        columns: [
          { key: 'employee', label: 'Employee' }, { key: 'month', label: 'Month' },
          { key: 'basic', label: 'Basic', align: 'right' }, { key: 'allowances', label: 'Allowances', align: 'right' },
          { key: 'deductions', label: 'Deductions', align: 'right' }, { key: 'net', label: 'Net Pay', align: 'right' },
          { key: 'status', label: 'Status' },
        ],
        fetch: async () => {
          const rows = (await all('/api/payroll')).map((p) => ({
            employee: p.user?.name ?? '—', month: p.month ?? '—', basic: money(p.basic_salary),
            allowances: money(p.allowances), deductions: money(p.deductions), net: money(p.net_salary),
            status: p.status ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'other-expenses', title: 'Operational Expenses', icon: Building2,
        desc: 'Non-payroll operating expenses (utilities, maintenance, supplies).',
        columns: [
          { key: 'category', label: 'Category' }, { key: 'amount', label: 'Amount', align: 'right' },
          { key: 'date', label: 'Date' },
        ],
        fetch: async () => ({ rows: [], unavailable: true, note: 'Operational expense tracking is not yet connected to a data source. Payroll costs are available under Payroll Expenses.' }),
      },
    ],
  },

  {
    key: 'parents',
    title: 'Parent Reports',
    icon: UsersRound,
    reports: [
      {
        key: 'parent-list', title: 'Parent List', icon: ListChecks,
        desc: 'All guardians/parents registered in the system.',
        columns: [
          { key: 'name', label: 'Name' }, { key: 'relationship', label: 'Relationship' },
          { key: 'students_count', label: 'Children', align: 'right' }, { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' }, { key: 'has_account', label: 'Account' },
        ],
        fetch: async () => {
          const rows = (await all('/api/parents')).map((p) => ({
            name: p.name, relationship: p.relationship ?? '—', students_count: p.students_count ?? 0,
            phone: p.phone ?? '—', email: p.email ?? '—', has_account: (p.has_account ?? 0) ? 'Yes' : 'No',
          }));
          return { rows, cards: [{ label: 'Registered Parents', value: rows.length }] };
        },
      },
      {
        key: 'parent-profile', title: 'Parent-Student Relationship', icon: UsersRound,
        desc: 'Children linked to a selected parent.',
        param: 'parent',
        columns: [
          { key: 'code', label: 'Student ID' }, { key: 'name', label: 'Student' },
          { key: 'class_name', label: 'Class' }, { key: 'status', label: 'Status' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/parents/${value}`);
          if (!d) return { rows: [], info: [], note: 'Parent not found.' };
          return {
            info: [
              ['Name', d.name], ['Relationship', d.relationship ?? '—'],
              ['Phone', d.phone ?? '—'], ['Email', d.email ?? '—'],
            ].map(([label, value]) => ({ label, value })),
            rows: (d.students ?? []).map((s) => ({
              code: s.student_id ?? '—', name: s.name, class_name: s.class?.class_name ?? '—', status: s.status ?? '—',
            })),
            cards: [{ label: 'Children', value: (d.students ?? []).length }, { label: 'Has Account', value: d.stats?.has_account ? 'Yes' : 'No' }],
          };
        },
      },
      {
        key: 'parent-contacts', title: 'Parent Contact List', icon: Bell,
        desc: 'Phone and email directory for contacting parents.',
        columns: [
          { key: 'name', label: 'Name' }, { key: 'relationship', label: 'Relationship' },
          { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
        ],
        fetch: async () => {
          const rows = (await all('/api/parents')).map((p) => ({
            name: p.name, relationship: p.relationship ?? '—', phone: p.phone ?? '—', email: p.email ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'parent-outstanding', title: 'Outstanding Fees by Parent', icon: DollarSign,
        desc: 'Parents whose children carry unpaid fee balances.',
        columns: [
          { key: 'name', label: 'Parent' }, { key: 'student', label: 'Student' },
          { key: 'balance', label: 'Balance', align: 'right' },
        ],
        fetch: async () => {
          const parents = await all('/api/parents');
          const invoices = (await all('/api/fees/invoices?per_page=1000')).filter((i) => Number(i.balance) > 0);
          const byStudent = {};
          invoices.forEach((i) => {
            const id = i.student_id;
            byStudent[id] = byStudent[id] ?? 0;
            byStudent[id] += Number(i.balance) || 0;
          });
          const rows = [];
          parents.forEach((p) => {
            (p.students ?? []).forEach((s) => {
              const bal = byStudent[s.id];
              if (bal) rows.push({ name: p.name, student: s.name, balance: bal.toLocaleString() });
            });
          });
          return { rows, note: 'Parent list must include linked students to match balances.' };
        },
      },
    ],
  },

  {
    key: 'library',
    title: 'Library Reports',
    icon: BookMarked,
    reports: [
      {
        key: 'books-list', title: 'Books List', icon: LibraryBig,
        desc: 'Full library catalogue.',
        columns: [
          { key: 'isbn', label: 'ISBN' }, { key: 'title', label: 'Title' },
          { key: 'author', label: 'Author' }, { key: 'category', label: 'Category' },
          { key: 'copies', label: 'Copies', align: 'right' }, { key: 'status', label: 'Status' },
        ],
        fetch: async () => {
          const rows = (await all('/api/library/books')).map((b) => ({
            isbn: b.isbn ?? '—', title: b.title, author: b.author ?? '—',
            category: b.category ?? '—', copies: b.total_copies ?? b.copies ?? 0, status: b.status ?? 'available',
          }));
          return { rows };
        },
      },
      {
        key: 'borrowed-books', title: 'Borrowed Books', icon: BookMarked,
        desc: 'Currently borrowed books.',
        columns: [
          { key: 'book', label: 'Book' }, { key: 'borrower', label: 'Borrower' },
          { key: 'borrowed', label: 'Borrowed' }, { key: 'due', label: 'Due Date' },
        ],
        fetch: async () => {
          const rows = (await all('/api/library/borrowings')).filter((b) => !b.returned_at && !(String(b.status ?? '').toLowerCase() === 'returned')).map((b) => ({
            book: b.book?.title ?? '—', borrower: b.user?.name ?? '—',
            borrowed: b.borrowed_date ?? '—', due: b.due_date ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'returned-books', title: 'Returned Books', icon: CheckCircle2,
        desc: 'Books returned to the library.',
        columns: [
          { key: 'book', label: 'Book' }, { key: 'borrower', label: 'Borrower' },
          { key: 'borrowed', label: 'Borrowed' }, { key: 'returned', label: 'Returned' },
        ],
        fetch: async () => {
          const rows = (await all('/api/library/borrowings')).filter((b) => b.returned_at || String(b.status ?? '').toLowerCase() === 'returned').map((b) => ({
            book: b.book?.title ?? '—', borrower: b.user?.name ?? '—',
            borrowed: b.borrowed_date ?? '—', returned: b.returned_at ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'overdue-books', title: 'Overdue Books', icon: AlertTriangle,
        desc: 'Books past their due date and still not returned.',
        columns: [
          { key: 'book', label: 'Book' }, { key: 'borrower', label: 'Borrower' },
          { key: 'borrowed', label: 'Borrowed' }, { key: 'due', label: 'Due Date' },
        ],
        fetch: async () => {
          const rows = (await all('/api/library/overdue')).map((b) => ({
            book: b.book?.title ?? '—', borrower: b.user?.name ?? '—',
            borrowed: b.borrowed_date ?? '—', due: b.due_date ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'library-stats', title: 'Library Statistics', icon: BarChart3,
        desc: 'Collection and circulation statistics.',
        columns: [
          { key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' },
        ],
        fetch: async () => {
          const d = await json('/api/library/stats');
          if (!d) return { rows: [], note: 'Library statistics unavailable.' };
          const map = {
            total_books: d.total_books, total_copies: d.total_copies, available: d.available,
            borrowed: d.borrowed, overdue: d.overdue, returned: d.returned,
            categories: d.categories, active_borrowers: d.active_borrowers, most_borrowed: d.most_borrowed,
          };
          const rows = Object.entries(map)
            .filter(([, v]) => v !== undefined)
            .map(([key, value]) => ({ metric: key.replace(/_/g, ' '), value: nameOf(value) }));
          return { rows };
        },
      },
      {
        key: 'most-borrowed', title: 'Most Borrowed Books', icon: Star,
        desc: 'Titles ranked by borrowing count.',
        columns: [
          { key: 'title', label: 'Book' }, { key: 'count', label: 'Times Borrowed', align: 'right' },
        ],
        fetch: async () => {
          const rows = await all('/api/library/borrowings');
          return {
            rows: countBy(rows.filter((b) => b.book), (b) => b.book.title ?? b.book.isbn ?? '—')
              .map((g) => ({ title: g.name, count: g.count })),
          };
        },
      },
    ],
  },

  {
    key: 'communication',
    title: 'Communication Reports',
    icon: Bell,
    reports: [
      {
        key: 'notifications', title: 'Notification History', icon: Bell,
        desc: 'Notifications sent to system users.',
        columns: [
          { key: 'date', label: 'Date' }, { key: 'type', label: 'Type' },
          { key: 'title', label: 'Title' }, { key: 'message', label: 'Message' }, { key: 'read', label: 'Read' },
        ],
        fetch: async () => {
          const rows = (await all('/api/notifications')).map((n) => ({
            date: n.created_at?.slice(0, 16) ?? '—', type: n.type ?? n.notifiable_type ?? '—',
            title: n.title ?? '—', message: n.message ?? '—', read: n.read_at ? 'Yes' : 'No',
          }));
          return { rows };
        },
      },
      {
        key: 'announcements', title: 'Announcements', icon: Bell,
        desc: 'Published school announcements.',
        columns: [
          { key: 'date', label: 'Date' }, { key: 'title', label: 'Title' },
          { key: 'message', label: 'Message' }, { key: 'author', label: 'Author' },
        ],
        fetch: async () => {
          const d = await json('/api/announcements');
          const rows = rowsOf(d).map((a) => ({
            date: a.publish_date ?? a.created_at?.slice(0, 10) ?? '—', title: a.title ?? '—',
            message: a.message ?? '—', author: a.author?.name ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'messages-sent', title: 'Messages Sent', icon: History,
        desc: 'Outgoing internal messages by the current user.',
        columns: [
          { key: 'date', label: 'Date' }, { key: 'recipient', label: 'Recipient' },
          { key: 'subject', label: 'Subject' }, { key: 'message', label: 'Message' },
        ],
        fetch: async () => {
          const d = await json('/api/messages/sent');
          const rows = rowsOf(d).map((m) => ({
            date: m.created_at?.slice(0, 16) ?? '—', recipient: m.recipient?.name ?? '—',
            subject: m.subject ?? m.title ?? '—', message: m.message ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'messages-inbox', title: 'Messages Inbox', icon: FolderOpen,
        desc: 'Incoming internal messages for the current user.',
        columns: [
          { key: 'date', label: 'Date' }, { key: 'sender', label: 'Sender' },
          { key: 'subject', label: 'Subject' }, { key: 'message', label: 'Message' }, { key: 'read', label: 'Read' },
        ],
        fetch: async () => {
          const d = await json('/api/messages');
          const rows = rowsOf(d).map((m) => ({
            date: m.created_at?.slice(0, 16) ?? '—', sender: m.sender?.name ?? '—',
            subject: m.subject ?? m.title ?? '—', message: m.message ?? '—', read: m.read_at ? 'Yes' : 'No',
          }));
          return { rows };
        },
      },
    ],
  },

  {
    key: 'users',
    title: 'User Reports',
    icon: Users,
    reports: [
      {
        key: 'user-list', title: 'System Users', icon: ListChecks,
        desc: 'All user accounts in the system.',
        columns: [
          { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' },
          { key: 'last_login', label: 'Last Login' },
        ],
        fetch: async () => {
          const rows = (await all('/api/users')).map((u) => ({
            name: u.name, email: u.email ?? '—', role: u.role ?? '—',
            status: u.status ?? (u.is_active !== false ? 'active' : 'inactive'), last_login: u.last_login_at ?? '—',
          }));
          return {
            rows,
            cards: countBy(rows, (r) => r.role).map((g) => ({ label: `${g.name} (role)`, value: g.count })),
          };
        },
      },
      {
        key: 'users-by-role', title: 'Users by Role', icon: UsersRound,
        desc: 'User accounts grouped by role.',
        columns: [
          { key: 'name', label: 'Role' }, { key: 'count', label: 'Users', align: 'right' },
        ],
        fetch: async () => {
          const rows = await all('/api/users');
          return { rows: countBy(rows, (u) => u.role || 'unknown') };
        },
      },
      {
        key: 'login-history', title: 'Login History', icon: History,
        desc: 'All user login events with IP address and user agent.',
        columns: [
          { key: 'date', label: 'Date' }, { key: 'user', label: 'User' },
          { key: 'ip', label: 'IP Address' }, { key: 'device', label: 'Device' },
        ],
        fetch: async () => {
          const d = await json('/api/login-history/all');
          const rows = rowsOf(d).map((l) => ({
            date: l.created_at?.slice(0, 16) ?? l.login_at?.slice(0, 16) ?? '—',
            user: l.user?.name ?? '—', ip: l.ip_address ?? '—', device: l.user_agent ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'login-stats', title: 'Login Activity', icon: CalendarCheck,
        desc: 'Login statistics and per-user login counts.',
        columns: [
          { key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value', align: 'right' },
        ],
        fetch: async () => {
          const d = await json('/api/login-history/stats');
          if (!d) return { rows: [], note: 'Login stats unavailable.' };
          const rows = Object.entries(d).map(([key, value]) => ({
            metric: key.replace(/_/g, ' '), value: typeof value === 'object' ? JSON.stringify(value) : value,
          }));
          return { rows: rows.slice(0, 30) };
        },
      },
      {
        key: 'activity-logs', title: 'User Activity Logs', icon: History,
        desc: 'Audit trail of actions performed in the system.',
        columns: [
          { key: 'date', label: 'Date' }, { key: 'user', label: 'User' },
          { key: 'action', label: 'Action' }, { key: 'details', label: 'Details' },
        ],
        fetch: async () => {
          const d = await json('/api/activity-logs');
          const rows = rowsOf(d).map((l) => ({
            date: l.created_at?.slice(0, 16) ?? '—', user: l.user?.name ?? '—',
            action: l.action ?? '—', details: l.description ?? JSON.stringify(l.properties ?? ''),
          }));
          return { rows };
        },
      },
    ],
  },

  {
    key: 'staff',
    title: 'Staff Reports',
    icon: Briefcase,
    reports: [
      {
        key: 'staff-list', title: 'Staff List', icon: ListChecks,
        desc: 'All non-teaching staff members.',
        columns: [
          { key: 'name', label: 'Name' }, { key: 'position', label: 'Position' },
          { key: 'department', label: 'Department' }, { key: 'attendances_count', label: 'Attendance Records', align: 'right' },
          { key: 'leaves_count', label: 'Leaves', align: 'right' }, { key: 'status', label: 'Status' },
        ],
        fetch: async () => {
          const rows = (await all('/api/staff')).map((s) => ({
            name: s.name, position: s.position ?? '—', department: s.department ?? '—',
            attendances_count: s.attendances_count ?? 0, leaves_count: s.leaves_count ?? 0, status: s.status ?? '—',
          }));
          return { rows };
        },
      },
      {
        key: 'staff-profile', title: 'Staff Attendance', icon: CalendarCheck,
        desc: 'Personal details and attendance records for a selected staff member.',
        param: 'staff',
        columns: [
          { key: 'date', label: 'Date' }, { key: 'time', label: 'Time' },
          { key: 'subject', label: 'Subject' }, { key: 'status', label: 'Status' },
        ],
        fetch: async ({ value }) => {
          const d = await json(`/api/staff/${value}`);
          if (!d) return { rows: [], info: [], note: 'Staff member not found.' };
          const stats = d.stats ?? {};
          return {
            info: [
              ['Name', d.name], ['Position', d.position ?? '—'], ['Department', d.department ?? '—'],
              ['Status', d.status ?? '—'], ['Phone', d.phone ?? '—'], ['Email', d.email ?? '—'],
            ].map(([label, value]) => ({ label, value })),
            rows: (d.attendances ?? []).map((a) => ({
              date: a.date ?? '—', time: a.time ?? '—',
              subject: a.schedule?.subject?.subject_name ?? a.subject ?? '—', status: a.status ?? '—',
            })),
            cards: [
              { label: 'Attendance Records', value: stats.attendance_count ?? (d.attendances ?? []).length },
              { label: 'Leaves', value: stats.leave_count ?? (d.leaves ?? []).length },
            ],
          };
        },
      },
      {
        key: 'staff-leaves', title: 'Staff Leave', icon: CalendarOff,
        desc: 'Leave requests from all staff.',
        columns: [
          { key: 'date', label: 'Date Range' }, { key: 'user', label: 'Applicant' },
          { key: 'type', label: 'Type' }, { key: 'days', label: 'Days', align: 'right' }, { key: 'status', label: 'Status' },
        ],
        fetch: async () => {
          const rows = (await all('/api/leaves')).map((l) => ({
            date: `${l.date_from ?? '—'} → ${l.date_to ?? '—'}`, user: l.staff?.name ?? l.name ?? '—',
            type: l.type ?? '—', days: l.days ?? (l.date_from && l.date_to ? Math.max(1, Math.round((new Date(l.date_to) - new Date(l.date_from)) / 86400000) + 1) : '—'),
            status: l.status ?? '—',
          }));
          return {
            rows,
            cards: countBy(rows, (r) => r.status).map((g) => ({ label: g.name, value: g.count })),
          };
        },
      },
      {
        key: 'staff-payroll', title: 'Staff Payroll', icon: DollarSign,
        desc: 'Salary records for staff and teachers.',
        columns: [
          { key: 'employee', label: 'Employee' }, { key: 'month', label: 'Month' },
          { key: 'basic', label: 'Basic', align: 'right' }, { key: 'net', label: 'Net Pay', align: 'right' },
          { key: 'status', label: 'Status' },
        ],
        fetch: async () => {
          const rows = (await all('/api/payroll')).map((p) => ({
            employee: p.user?.name ?? '—', month: p.month ?? '—', basic: money(p.basic_salary),
            net: money(p.net_salary), status: p.status ?? '—',
          }));
          return { rows };
        },
      },
    ],
  },

  {
    key: 'administration',
    title: 'Administration Reports',
    icon: Building2,
    reports: [
      {
        key: 'school-statistics', title: 'School Statistics', icon: BarChart3,
        desc: 'Top-line counts: students, teachers, staff and classes.',
        columns: [
          { key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value', align: 'right' },
        ],
        fetch: async () => {
          const d = await json('/api/dashboard');
          const c = d?.counts ?? d?.stats ?? d?.kpis ?? {};
          const metrics = [
            ['Students', c.total_students ?? c.students ?? (c.institute ?? 0)],
            ['Teachers', c.total_teachers ?? c.teachers ?? 0],
            ['Staff', c.total_staff ?? c.staff ?? 0],
            ['Classes', c.total_classes ?? c.classes ?? 0],
            ['Subjects', c.total_subjects ?? c.subjects ?? 0],
          ].filter(([, v]) => v !== undefined && v !== 0);
          const rows = metrics.map(([metric, value]) => ({ metric, value }));
          return { rows, note: 'Pulled live from the dashboard analytics.' };
        },
      },
      {
        key: 'demographics', title: 'Student Demographics', icon: PieChart,
        desc: 'Gender ratio and grade distribution across the school.',
        columns: [
          { key: 'grade', label: 'Grade' }, { key: 'students', label: 'Students', align: 'right' },
        ],
        fetch: async () => {
          const summary = await json('/api/students/summary');
          if (!summary) return { rows: [], note: 'Demographics unavailable.' };
          return {
            rows: (summary.grade_distribution ?? []).map((g) => ({ grade: g.grade, students: g.students })),
            extraTables: [{
              title: 'Gender Ratio',
              columns: [{ key: 'name', label: 'Gender' }, { key: 'value', label: 'Students' }],
              rows: (summary.gender_ratio ?? []).map((g) => ({ name: g.name, value: g.value })),
            }],
          };
        },
      },
      {
        key: 'academic-years', title: 'Academic Years', icon: CalendarDays,
        desc: 'Academic years and their semesters.',
        columns: [
          { key: 'name', label: 'Academic Year' }, { key: 'start_date', label: 'Start' },
          { key: 'end_date', label: 'End' }, { key: 'status', label: 'Status' },
          { key: 'semesters', label: 'Semesters' },
        ],
        fetch: async () => {
          const d = await json('/api/school/academic-years');
          const rows = rowsOf(d).map((y) => ({
            name: y.name ?? y.academic_year ?? '—', start_date: y.start_date ?? '—', end_date: y.end_date ?? '—',
            status: y.status ?? '—',
            semesters: (y.semesters ?? []).map((s) => s.name ?? s.semester).join(', ') || '—',
          }));
          return { rows };
        },
      },
      {
        key: 'school-departments', title: 'Departments & Rooms', icon: Building2,
        desc: 'School departments, buildings and rooms.',
        columns: [
          { key: 'type', label: 'Type' }, { key: 'name', label: 'Name' }, { key: 'details', label: 'Details' },
        ],
        fetch: async () => {
          const [depts, buildings, rooms] = await Promise.all([
            json('/api/school/departments'), json('/api/school/buildings'), json('/api/school/rooms'),
          ]);
          const rows = [
            ...(rowsOf(depts).map((d) => ({ type: 'Department', name: d.name ?? d.department, details: d.description ?? '—' }))),
            ...(rowsOf(buildings).map((b) => ({ type: 'Building', name: b.name, details: b.address ?? '—' }))),
            ...(rowsOf(rooms).map((r) => ({ type: 'Room', name: r.name ?? r.room_name, details: `${r.room_type ?? ''} ${r.capacity ? `· cap ${r.capacity}` : ''}`.trim() }))),
          ];
          return { rows };
        },
      },
      {
        key: 'recent-activity', title: 'Recent Activity', icon: History,
        desc: 'The latest system-wide actions.',
        columns: [
          { key: 'date', label: 'Date' }, { key: 'user', label: 'User' },
          { key: 'action', label: 'Action' }, { key: 'details', label: 'Details' },
        ],
        fetch: async () => {
          const d = await json('/api/activity-logs/recent');
          const rows = rowsOf(d).map((l) => ({
            date: l.created_at?.slice(0, 16) ?? '—', user: l.user?.name ?? '—',
            action: l.action ?? '—', details: l.description ?? '—',
          }));
          return { rows };
        },
      },
    ],
  },
];