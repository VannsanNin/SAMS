export const COLORS = {
  ink: "#0F172A",
  paper: "#F8FAFC",
  card: "#FFFFFF",
  slate: "#64748B",
  amber: "#F59E0B",
  sage: "#10B981",
  coral: "#EF4444",
  hairline: "#E2E8F0",
  indigo: "#4F46E5",
  sky: "#0284C7",
};

export const CHART_COLORS = [COLORS.indigo, COLORS.amber, COLORS.sage, COLORS.sky, COLORS.coral];

export function PageShell({ title, sub, action, onAction, children }) {
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            {sub && <p className="text-sm font-medium text-slate-500 mt-1">{sub}</p>}
          </div>
          {action && (
            <button
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
              onClick={onAction}
            >
              {action}
            </button>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}

export function KPI({ label, value, sub, tone = "indigo" }) {
  const toneBg = {
    indigo: "bg-indigo-50/50 text-indigo-600 border-indigo-200",
    amber: "bg-amber-50/50 text-amber-600 border-amber-200",
    sage: "bg-emerald-50/50 text-emerald-600 border-emerald-200",
    coral: "bg-red-50/50 text-red-600 border-red-200",
    slate: "bg-slate-50/50 text-slate-600 border-slate-200",
  };

  return (
    <div className="impeccable-card p-5 flex flex-col justify-between relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-2.5 h-2.5 rounded-full ${toneBg[tone] || toneBg.indigo}`} />
      </div>
      <div className="mt-3">
        <span className="text-3xl font-display font-bold text-slate-900 tracking-tight">{value}</span>
        {sub && <p className="text-xs font-medium text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export function KpiRow({ children, cols = 4 }) {
  const colClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return <div className={`grid ${colClass[cols] || colClass[4]} gap-4 mb-6`}>{children}</div>;
}

export function Panel({ title, children, span = 1 }) {
  return (
    <div className={`impeccable-card p-6 bg-white ${span > 1 ? `lg:col-span-${span}` : ''}`}>
      {title && <h3 className="font-display font-bold text-lg text-slate-900 mb-4">{title}</h3>}
      {children}
    </div>
  );
}

export function ChartGrid({ children }) {
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">{children}</div>;
}

export function Badge({ text, tone = "slate" }) {
  const styles = {
    sage: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    amber: "bg-amber-50 text-amber-700 border-amber-200/80",
    coral: "bg-red-50 text-red-700 border-red-200/80",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[tone] || styles.slate}`}>
      {text}
    </span>
  );
}

export function FilterBar({ children }) {
  return <div className="flex flex-wrap gap-3 mb-5 items-center bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">{children}</div>;
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className="px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150 flex-1"
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-150"
    >
      {children}
    </select>
  );
}

export function Table({ columns, rows, renderRow, emptyText = "No records found." }) {
  return (
    <div className="impeccable-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {columns.map((c) => (
                <th key={c} className="px-5 py-3.5">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-slate-500 font-medium">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors duration-150">
                  {renderRow(row)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RowAction({ children, tone = "indigo", onClick }) {
  const toneColor = {
    indigo: "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50",
    coral: "text-red-600 hover:text-red-800 hover:bg-red-50",
    amber: "text-amber-600 hover:text-amber-800 hover:bg-amber-50",
    slate: "text-slate-600 hover:text-slate-800 hover:bg-slate-100",
  };

  return (
    <button
      className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors duration-150 ${toneColor[tone] || toneColor.indigo}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
