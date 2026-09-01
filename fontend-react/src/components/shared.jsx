export const COLORS = {
  ink: "#1E2A4A",
  paper: "#FAF8F3",
  card: "#FFFFFF",
  slate: "#5A6B95",
  amber: "#D98E2B",
  sage: "#6E8F68",
  coral: "#C25B45",
  hairline: "#E4E0D6",
};
export const CHART_COLORS = [COLORS.ink, COLORS.amber, COLORS.sage, COLORS.slate, COLORS.coral];

export function PageShell({ title, sub, action, onAction, children }) {
  return (
    <div style={{ background: COLORS.paper, minHeight: "100vh" }} className="font-sans">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <header className="flex items-end justify-between mb-8" style={{ borderBottom: `2px solid ${COLORS.ink}`, paddingBottom: "16px" }}>
          <div>
            <h1 className="font-serif text-[26px]" style={{ color: COLORS.ink }}>{title}</h1>
            {sub && <p className="text-[13px]" style={{ color: COLORS.slate }}>{sub}</p>}
          </div>
          {action && (
            <button className="px-4 py-2 text-[13px] text-white" style={{ background: COLORS.ink }} onClick={onAction}>
              {action}
            </button>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}

export function KPI({ label, value, sub, tone = "ink" }) {
  return (
    <div style={{ borderBottom: `2px solid ${COLORS[tone]}`, background: COLORS.card }}
         className="px-5 py-4 flex flex-col gap-1">
      <span className="text-[13px] tracking-wide" style={{ color: COLORS.slate }}>{label}</span>
      <span className="text-[28px] font-serif" style={{ color: COLORS.ink }}>{value}</span>
      {sub && <span className="text-[12px]" style={{ color: COLORS.slate }}>{sub}</span>}
    </div>
  );
}

export function KpiRow({ children, cols = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "1px", background: COLORS.hairline }} className="mb-6">
      {children}
    </div>
  );
}

export function Panel({ title, children, span = 1 }) {
  return (
    <div style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card, gridColumn: `span ${span}` }}
         className="p-5 rounded-sm">
      <h3 className="font-serif text-[16px] mb-4" style={{ color: COLORS.ink }}>{title}</h3>
      {children}
    </div>
  );
}

export function ChartGrid({ children, cols = 2 }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "16px" }} className="mb-6">{children}</div>;
}

export function Badge({ text, tone = "slate" }) {
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-sm" style={{ color: COLORS[tone], border: `1px solid ${COLORS[tone]}` }}>
      {text}
    </span>
  );
}

export function FilterBar({ children }) {
  return <div className="flex gap-3 mb-3 items-center">{children}</div>;
}

export function TextInput(props) {
  return (
    <input
      {...props}
      className="px-3 py-2 text-[13px] flex-1"
      style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card, color: COLORS.ink }}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="px-3 py-2 text-[13px]"
      style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card, color: COLORS.ink }}
    >
      {children}
    </select>
  );
}

export function Table({ columns, rows, renderRow, emptyText = "No records found." }) {
  return (
    <div style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card }}>
      <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${COLORS.hairline}`, color: COLORS.slate }}>
            {columns.map((c) => (
              <th key={c} className="text-left px-4 py-3 font-normal">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center" style={{ color: COLORS.slate }}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.hairline}`, color: COLORS.ink }}>
                {renderRow(row)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function RowAction({ children, tone = "ink", onClick }) {
  return <button className="text-[12px] mr-3" style={{ color: COLORS[tone] }} onClick={onClick}>{children}</button>;
}
