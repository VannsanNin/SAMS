import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserRound, GraduationCap, BookOpen, School, CalendarClock, ClipboardCheck, ClipboardList, CalendarOff, BarChart3, TriangleAlert, LogOut, UsersRound, KeyRound, FileText, Award, BookMarked, ClipboardList as ClipboardIcon, MessageSquare, CalendarDays, Bell, Settings, DollarSign, ShieldAlert, FolderOpen, History, Building2 } from 'lucide-react';
import Login from './pages/Login';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Staff from './pages/Staff';
import Parents from './pages/Parents';
import Subjects from './pages/Subjects';
import Classes from './pages/Classes';
import Schedules from './pages/Schedules';
import Attendances from './pages/Attendances';
import Leaves from './pages/Leaves';
import MarkAttendance from './pages/MarkAttendance';
import Reports from './pages/Reports';
import Warnings from './pages/Warnings';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import Exams from './pages/Exams';
import Grades from './pages/Grades';
import Fees from './pages/Fees';
import Library from './pages/Library';
import Homework from './pages/Homework';
import Messages from './pages/Messages';
import Events from './pages/Events';
import Discipline from './pages/Discipline';
import Awards from './pages/Awards';
import Documents from './pages/Documents';
import Notifications from './pages/Notifications';
import SchoolSettings from './pages/SchoolSettings';
import Payroll from './pages/Payroll';
import UsersPage from './pages/Users';
import SettingsPage from './pages/Settings';
import LoginHistory from './pages/LoginHistory';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: ['admin', 'teacher', 'student', 'class_president', 'parent', 'accountant', 'librarian', 'receptionist', 'staff'] },
  { to: '/students', label: 'Students', icon: GraduationCap, roles: ['admin', 'teacher'] },
  { to: '/teachers', label: 'Teachers', icon: UserRound, roles: ['admin'] },
  { to: '/parents', label: 'Parents', icon: UsersRound, roles: ['admin'] },
  { to: '/users', label: 'User Management', icon: Users, roles: ['admin'] },
  { to: '/subjects', label: 'Courses', icon: BookOpen, roles: ['admin', 'teacher'] },
  { to: '/classes', label: 'Classes', icon: School, roles: ['admin', 'teacher'] },
  { to: '/schedules', label: 'Schedules', icon: CalendarClock, roles: ['admin', 'teacher'] },
  { to: '/mark-attendance', label: 'Mark Attendance', icon: ClipboardCheck, roles: ['admin', 'teacher'] },
  { to: '/attendances', label: 'Attendances', icon: ClipboardList, roles: ['admin', 'teacher'] },
  { to: '/exams', label: 'Exams', icon: FileText, roles: ['admin', 'teacher'] },
  { to: '/grades', label: 'Grades & Results', icon: Award, roles: ['admin', 'teacher'] },
  { to: '/homework', label: 'Homework', icon: ClipboardIcon, roles: ['admin', 'teacher'] },
  { to: '/library', label: 'Library', icon: BookMarked, roles: ['admin', 'teacher', 'librarian'] },
  { to: '/fees', label: 'Fees & Finance', icon: DollarSign, roles: ['admin', 'accountant'] },
  { to: '/payroll', label: 'Payroll', icon: DollarSign, roles: ['admin', 'accountant'] },
  { to: '/messages', label: 'Messages', icon: MessageSquare, roles: ['admin', 'teacher', 'student', 'class_president', 'parent', 'staff'] },
  { to: '/events', label: 'Events', icon: CalendarDays, roles: ['admin', 'teacher'] },
  { to: '/discipline', label: 'Discipline', icon: ShieldAlert, roles: ['admin', 'teacher'] },
  { to: '/awards', label: 'Awards', icon: Award, roles: ['admin', 'teacher'] },
  { to: '/documents', label: 'Documents', icon: FolderOpen, roles: ['admin', 'teacher', 'staff'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'teacher', 'student', 'class_president', 'parent', 'staff', 'accountant', 'librarian', 'receptionist'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'teacher'] },
  { to: '/warnings', label: 'Warnings', icon: TriangleAlert, roles: ['admin', 'teacher'] },
  { to: '/leaves', label: 'Leaves', icon: CalendarOff, roles: ['admin', 'teacher', 'student', 'class_president', 'parent'] },
  { to: '/school-settings', label: 'School Settings', icon: Building2, roles: ['admin'] },
  { to: '/settings', label: 'System Settings', icon: Settings, roles: ['admin'] },
  { to: '/login-history', label: 'Login History', icon: History, roles: ['admin'] },
  { to: '/account', label: 'My Account', icon: KeyRound, roles: ['admin', 'teacher', 'student', 'class_president', 'parent'] },
];

function RequireRole({ user, roles, children }) {
  if (!roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function AppLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const menu = NAV.filter((item) => item.roles.includes(user.role));

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout(null);
    navigate('/login');
  };

  const roleLabel = user.role === 'class_president' ? 'Class President' : user.role;

  return (
    <div className="flex h-screen bg-paper">
      <aside className="w-64 bg-ink text-white flex flex-col">
        <div className="p-6 text-2xl font-display font-bold border-b border-white/15">SAMS</div>
        <div className="px-6 py-3 border-b border-white/15 text-sm text-white/60">
          {user.name}
          <span className="ml-2 px-2 py-0.5 rounded bg-ochre text-ink text-xs font-semibold capitalize">{roleLabel}</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menu.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-sm ${isActive ? 'bg-ochre text-ink font-semibold' : 'hover:bg-white/10'}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/15">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-sm transition">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<Dashboard role={user.role} />} />
          <Route path="/account" element={<ChangePassword />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/students" element={<RequireRole user={user} roles={['admin', 'teacher']}><Students /></RequireRole>} />
          <Route path="/teachers" element={<RequireRole user={user} roles={['admin']}><Teachers /></RequireRole>} />
          <Route path="/staff" element={<RequireRole user={user} roles={['admin']}><Staff /></RequireRole>} />
          <Route path="/parents" element={<RequireRole user={user} roles={['admin']}><Parents /></RequireRole>} />
          <Route path="/users" element={<RequireRole user={user} roles={['admin']}><UsersPage /></RequireRole>} />
          <Route path="/subjects" element={<RequireRole user={user} roles={['admin', 'teacher']}><Subjects /></RequireRole>} />
          <Route path="/classes" element={<RequireRole user={user} roles={['admin', 'teacher']}><Classes /></RequireRole>} />
          <Route path="/schedules" element={<RequireRole user={user} roles={['admin', 'teacher']}><Schedules /></RequireRole>} />
          <Route path="/attendances" element={<RequireRole user={user} roles={['admin', 'teacher']}><Attendances /></RequireRole>} />
          <Route path="/reports" element={<RequireRole user={user} roles={['admin', 'teacher']}><Reports /></RequireRole>} />
          <Route path="/warnings" element={<RequireRole user={user} roles={['admin', 'teacher']}><Warnings /></RequireRole>} />
          <Route path="/mark-attendance" element={<RequireRole user={user} roles={['admin', 'teacher']}><MarkAttendance /></RequireRole>} />
          <Route path="/exams" element={<RequireRole user={user} roles={['admin', 'teacher']}><Exams /></RequireRole>} />
          <Route path="/grades" element={<RequireRole user={user} roles={['admin', 'teacher']}><Grades /></RequireRole>} />
          <Route path="/homework" element={<RequireRole user={user} roles={['admin', 'teacher']}><Homework /></RequireRole>} />
          <Route path="/library" element={<RequireRole user={user} roles={['admin', 'teacher', 'librarian']}><Library /></RequireRole>} />
          <Route path="/fees" element={<RequireRole user={user} roles={['admin', 'accountant']}><Fees /></RequireRole>} />
          <Route path="/payroll" element={<RequireRole user={user} roles={['admin', 'accountant']}><Payroll /></RequireRole>} />
          <Route path="/messages" element={<RequireRole user={user} roles={['admin', 'teacher', 'student', 'class_president', 'parent', 'staff']}><Messages /></RequireRole>} />
          <Route path="/events" element={<RequireRole user={user} roles={['admin', 'teacher']}><Events /></RequireRole>} />
          <Route path="/discipline" element={<RequireRole user={user} roles={['admin', 'teacher']}><Discipline /></RequireRole>} />
          <Route path="/awards" element={<RequireRole user={user} roles={['admin', 'teacher']}><Awards /></RequireRole>} />
          <Route path="/documents" element={<RequireRole user={user} roles={['admin', 'teacher', 'staff']}><Documents /></RequireRole>} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/school-settings" element={<RequireRole user={user} roles={['admin']}><SchoolSettings /></RequireRole>} />
          <Route path="/settings" element={<RequireRole user={user} roles={['admin']}><SettingsPage /></RequireRole>} />
          <Route path="/login-history" element={<RequireRole user={user} roles={['admin']}><LoginHistory /></RequireRole>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login onLogin={(u) => setUser(u)} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <AppLayout user={user} onLogout={() => setUser(null)} />
    </Router>
  );
}
