import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

const API = '/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch(`${API}/dashboard`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load dashboard'))))
        .then((res) => setData(res))
        .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-6 bg-coral/10 text-coral border border-coral/30 rounded-sm">Error: {error}</div>;
  if (!data) return <div className="flex items-center justify-center h-96 text-ledger-slate font-medium">Loading metrics...</div>;

  if (data.role === 'admin') return <AdminDashboard data={data} />;
  if (data.role === 'teacher') return <TeacherDashboard data={data} />;
  if (data.role === 'student' || data.view === 'student') return <StudentDashboard data={data} />;

  return <PersonalDashboard data={data} roleLabel="Parent" />;
}

function PersonalDashboard() {
  return (
      <div className="space-y-6 pb-12">
        <div className="pb-2 border-b border-hairline">
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight">My Portal</h1>
          <p className="text-xs text-ledger-slate font-medium mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="bg-white border border-hairline rounded-sm p-6">
          <p className="text-sm text-ledger-slate">No linked records found. Contact the school administration for access.</p>
        </div>
      </div>
  );
}
