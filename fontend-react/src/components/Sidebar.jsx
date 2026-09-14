import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { getLanguage, translateLabel } from "../i18n";

export default function Sidebar({ user, menu, onLogout }) {
  const navigate = useNavigate();
  const language = getLanguage();

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await fetch("/api/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    onLogout(null);
    navigate("/login");
  };

  const roleLabel = user.role === "class_president" ? "Class President" : user.role;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col shadow-xl z-20">
      {/* Brand Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
            S
          </div>
          <div>
            <span className="text-xl font-display font-extrabold tracking-tight text-white">SAMS</span>
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
              v2.0
            </span>
          </div>
        </div>
      </div>

      {/* User Info Chip */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold">
          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-100 truncate">{user.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-amber-400 capitalize truncate">{roleLabel}</span>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menu.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={`transition-transform duration-150 group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                <span className="truncate">{translateLabel(label, language)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}