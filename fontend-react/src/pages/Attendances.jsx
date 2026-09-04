import { useMemo, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, PageShell, KPI, KpiRow, Panel, ChartGrid, Badge, FilterBar, TextInput, Select, Table } from "../components/shared";

const trend = [
  { day: "Mon", rate: 94 }, { day: "Tue", rate: 91 }, { day: "Wed", rate: 96 },
  { day: "Thu", rate: 89 }, { day: "Fri", rate: 93 },
];
const byClass = [
  { cls: "9A", rate: 92 }, { cls: "10B", rate: 84 }, { cls: "11C", rate: 88 }, { cls: "12A", rate: 96 },
];
const LOG = [
  { student: "Sopheak Chan", cls: "10B", date: "2026-08-31", status: "absent" },
  { student: "Dara Ly", cls: "9A", date: "2026-08-31", status: "present" },
  { student: "Rithy Sok", cls: "11C", date: "2026-08-31", status: "late" },
  { student: "Chenda Prum", cls: "10B", date: "2026-08-31", status: "present" },
  { student: "Vibol Heng", cls: "11C", date: "2026-08-31", status: "present" },
];

export default function Attendances() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(
    () => LOG.filter((r) => (status === "all" || r.status === status) && r.student.toLowerCase().includes(query.toLowerCase())),
    [query, status]
  );
  const toneFor = (s) => (s === "present" ? "sage" : s === "late" ? "amber" : "coral");

  return (
    <PageShell title="Attendances" sub="Daily attendance log across all classes">
      <KpiRow>
        <KPI label="Overall Rate (Month)" value="93%" tone="sage" />
        <KPI label="Below 75% Threshold" value="6 students" tone="coral" />
        <KPI label="Marked Today" value="18 / 20 classes" tone="amber" />
        <KPI label="Unmarked Classes" value="2" tone="coral" />
      </KpiRow>

      <ChartGrid>
        <Panel title="Attendance Trend (This Week)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid stroke={COLORS.hairline} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.hairline }} tickLine={false} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} width={32} />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke={COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Attendance by Class">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byClass}>
              <CartesianGrid stroke={COLORS.hairline} vertical={false} />
              <XAxis dataKey="cls" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.hairline }} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} width={32} />
              <Tooltip />
              <Bar dataKey="rate" fill={COLORS.slate} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </ChartGrid>

      <FilterBar>
        <TextInput placeholder="Search student..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </Select>
      </FilterBar>

      <Table
        columns={["Student", "Class", "Date", "Status"]}
        rows={filtered}
        renderRow={(r) => (
          <>
            <td className="px-4 py-3">{r.student}</td>
            <td className="px-4 py-3">{r.cls}</td>
            <td className="px-4 py-3">{r.date}</td>
            <td className="px-4 py-3"><Badge text={r.status} tone={toneFor(r.status)} /></td>
          </>
        )}
      />
    </PageShell>
  );
}
