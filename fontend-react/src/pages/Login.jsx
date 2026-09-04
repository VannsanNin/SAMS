import { useState } from 'react';
import { Mail, Lock, LogIn, School, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed. Please check credentials.');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans p-4">
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Main Glass Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-950/80">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-500/10">
              <School size={32} />
            </div>
            <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">SAMS</h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">
              School Attendance Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all placeholder:text-slate-500"
                  placeholder="you@school.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all placeholder:text-slate-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-medium">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:bg-indigo-800/50 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm"
            >
              <LogIn size={18} />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Fill Options */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3">
              <Sparkles size={14} className="text-indigo-400" />
              <span>Quick Demo Sign-In:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('admin@school.edu', 'admin123')}
                className="px-3 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-lg text-left border border-slate-700/50 transition-colors flex items-center justify-between"
              >
                <span>Admin</span>
                <CheckCircle2 size={12} className="text-indigo-400 opacity-60" />
              </button>
              <button
                type="button"
                onClick={() => fillDemo('teacher@school.edu', 'teacher123')}
                className="px-3 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-lg text-left border border-slate-700/50 transition-colors flex items-center justify-between"
              >
                <span>Teacher</span>
                <CheckCircle2 size={12} className="text-indigo-400 opacity-60" />
              </button>
              <button
                type="button"
                onClick={() => fillDemo('student1@school.edu', 'student123')}
                className="px-3 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-lg text-left border border-slate-700/50 transition-colors flex items-center justify-between"
              >
                <span>Student</span>
                <CheckCircle2 size={12} className="text-indigo-400 opacity-60" />
              </button>
              <button
                type="button"
                onClick={() => fillDemo('parent1@school.edu', 'parent123')}
                className="px-3 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-lg text-left border border-slate-700/50 transition-colors flex items-center justify-between"
              >
                <span>Parent</span>
                <CheckCircle2 size={12} className="text-indigo-400 opacity-60" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
