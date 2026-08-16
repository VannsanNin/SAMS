import { useState } from 'react';
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../api';
import { useNavigate } from 'react-router-dom';

const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all';

function Field({ label, children }) {
  return (
      <label className="block">
      <span className="block text-xs font-medium text-slate-700 mb-1">{label}</span>
        {children}
      </label>
  );
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setInfo('');
    try {
      const res = await apiFetch('/api/change-password', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to change password.');
      }
      setInfo('Password changed successfully. Please sign in again with your new password.');
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
      <div className="space-y-6 pb-12 bg-slate-50/50 p-2 sm:p-6 rounded-3xl">
        <div className="pb-2 border-b border-slate-200/60">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <KeyRound size={26} className="text-indigo-600" /> My Account
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Update your login password</p>
        </div>

        <div className="max-w-md">
          <form onSubmit={submit} className="space-y-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
            )}
            {info && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{info}</span>
                </div>
            )}

            <Field label="Current Password">
              <input type="password" className={inputCls} value={form.current_password} onChange={set('current_password')} required autoComplete="current-password" />
            </Field>
            <Field label="New Password">
              <input type="password" className={inputCls} value={form.new_password} onChange={set('new_password')} required minLength={8} autoComplete="new-password" />
            </Field>
            <Field label="Confirm New Password">
              <input type="password" className={inputCls} value={form.new_password_confirmation} onChange={set('new_password_confirmation')} required minLength={8} autoComplete="new-password" />
            </Field>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500">
              <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
              After a successful change you will be signed out and asked to log in again with your new password.
            </div>

            <div className="pt-1 flex justify-end">
              <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition shadow-xs"
              >
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}
