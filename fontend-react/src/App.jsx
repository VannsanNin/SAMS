import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserRound, GraduationCap, BookOpen, School, CalendarClock, ClipboardCheck, ClipboardList, CalendarOff, BarChart3, TriangleAlert, UsersRound, KeyRound, FileText, Award, BookMarked, ClipboardList as ClipboardIcon, MessageSquare, CalendarDays, Bell, Settings, DollarSign, ShieldAlert, FolderOpen, History, Building2, Wallet } from 'lucide-react';
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
import MyFees from './pages/MyFees';
import { getLanguage, setLanguage, translateLabel } from './i18n';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import Sidebar from './components/Sidebar';

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
  { to: '/my-fees', label: 'My Fees', icon: Wallet, roles: ['student', 'class_president', 'parent'] },
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
  const [language, setLanguageState] = useState(getLanguage);
  const menu = NAV.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Impeccable Dark Sidebar */}
      <Sidebar user={user} menu={menu} onLogout={onLogout} />

      {/* Main Content Surface */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Navigation Bar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100 font-display">{translateLabel('Academic Management Center', language)}</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NavLink
              to="/notifications"
              className="relative p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
              title="Notifications"
            >
              <Bell size={19} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
            </NavLink>
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{translateLabel('Language', language)}:</span>
              <button onClick={() => { const next = setLanguage(language === 'en' ? 'km' : 'en'); document.documentElement.lang = next; setLanguageState(next); }} className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                {translateLabel(language === 'en' ? 'Khmer' : 'English', language)}
              </button>
              <span className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              <span>{translateLabel('Role', language)}: <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">{user.role}</span></span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors duration-150">
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
          <Route path="/my-fees" element={<RequireRole user={user} roles={['student', 'class_president', 'parent']}><MyFees /></RequireRole>} />
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
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  return (
    <ThemeProvider>
      <Router>
        {!user ? (
          <Routes>
            <Route path="*" element={<Login onLogin={(u) => setUser(u)} />} />
          </Routes>
        ) : (
          <AppLayout user={user} onLogout={() => setUser(null)} />
        )}
      </Router>
    </ThemeProvider>
  );
}
