import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserRound, GraduationCap, BookOpen, School, CalendarClock, ClipboardCheck, ClipboardList, CalendarOff, BarChart3, TriangleAlert, LogOut, UsersRound, KeyRound } from 'lucide-react';
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

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: ['admin', 'teacher', 'student', 'class_president', 'parent'] },
  { to: '/students', label: 'Students', icon: GraduationCap, roles: ['admin', 'teacher'] },
  { to: '/teachers', label: 'Teachers', icon: UserRound, roles: ['admin'] },
  // { to: '/staff', label: 'Staff', icon: Users, roles: ['admin'] },
  { to: '/parents', label: 'Parents', icon: UsersRound, roles: ['admin'] },
  { to: '/subjects', label: 'Courses', icon: BookOpen, roles: ['admin', 'teacher'] },
  { to: '/classes', label: 'Classes', icon: School, roles: ['admin', 'teacher'] },
  { to: '/schedules', label: 'Schedules', icon: CalendarClock, roles: ['admin', 'teacher'] },
  { to: '/mark-attendance', label: 'Mark Attendance', icon: ClipboardCheck, roles: ['admin', 'teacher'] },
  { to: '/attendances', label: 'Attendances', icon: ClipboardList, roles: ['admin', 'teacher'] },
  // { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'teacher'] },
  { to: '/warnings', label: 'Warnings', icon: TriangleAlert, roles: ['admin', 'teacher'] },
  { to: '/leaves', label: 'Leaves', icon: CalendarOff, roles: ['admin', 'teacher', 'student', 'class_president', 'parent'] },
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
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-gray-700">SAMS</div>
        <div className="px-6 py-3 border-b border-gray-700 text-sm text-gray-400">
          {user.name}
          <span className="ml-2 px-2 py-0.5 rounded bg-gray-700 text-xs capitalize">{roleLabel}</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menu.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded ${isActive ? 'bg-blue-700 font-semibold' : 'hover:bg-gray-700'}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/account" element={<ChangePassword />} />
          <Route path="/leaves" element={<Leaves />} />
          <Route path="/students" element={<RequireRole user={user} roles={['admin', 'teacher']}><Students /></RequireRole>} />
          <Route path="/teachers" element={<RequireRole user={user} roles={['admin']}><Teachers /></RequireRole>} />
          <Route path="/staff" element={<RequireRole user={user} roles={['admin']}><Staff /></RequireRole>} />
          <Route path="/parents" element={<RequireRole user={user} roles={['admin']}><Parents /></RequireRole>} />
          <Route path="/subjects" element={<RequireRole user={user} roles={['admin', 'teacher']}><Subjects /></RequireRole>} />
          <Route path="/classes" element={<RequireRole user={user} roles={['admin', 'teacher']}><Classes /></RequireRole>} />
          <Route path="/schedules" element={<RequireRole user={user} roles={['admin', 'teacher']}><Schedules /></RequireRole>} />
          <Route path="/attendances" element={<RequireRole user={user} roles={['admin', 'teacher']}><Attendances /></RequireRole>} />
          <Route path="/reports" element={<RequireRole user={user} roles={['admin', 'teacher']}><Reports /></RequireRole>} />
          <Route path="/warnings" element={<RequireRole user={user} roles={['admin', 'teacher']}><Warnings /></RequireRole>} />
          <Route path="/mark-attendance" element={<RequireRole user={user} roles={['admin', 'teacher']}><MarkAttendance /></RequireRole>} />
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
