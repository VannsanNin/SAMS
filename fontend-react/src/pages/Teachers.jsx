import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, PageShell, KPI, KpiRow, Panel, ChartGrid, Badge, FilterBar, TextInput, Select, Table, RowAction } from "../components/shared";

const TEACHERS = [
  { id: "T-001", name: "Sokun Meas", dept: "Mathematics", classes: 4, contact: "012 111 222", status: "active" },
  { id: "T-002", name: "Ratana Chea", dept: "Science", classes: 5, contact: "012 222 333", status: "active" },
  { id: "T-003", name: "Bopha Kim", dept: "English", classes: 3, contact: "012 333 444", status: "on leave" },
  { id: "T-004", name: "Vantha Sok", dept: "History", classes: 4, contact: "012 444 555", status: "active" },
  { id: "T-005", name: "Pisey Ly", dept: "Physical Ed.", classes: 6, contact: "012 555 666", status: "active" },
];

const byDept = [
  { dept: "Math", count: 12 }, { dept: "Science", count: 15 },
  { dept: "English", count: 9 }, { dept: "History", count: 7 },
  { dept: "PE", count: 6 },
];

export default function Teachers() {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const depts = useMemo(() => ["all", ...new Set(TEACHERS.map((t) => t.dept))], []);
  const filtered = TEACHERS.filter(
    (t) => (dept === "all" || t.dept === dept) && t.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <PageShell title="Teachers" sub={`${TEACHERS.length} total records`} action="Add Teacher">
      <KpiRow>
        <KPI label="Total Teachers" value="61" tone="ink" />
        <KPI label="Departments" value="8" tone="slate" />
        <KPI label="On Leave Today" value="3" tone="amber" />
        <KPI label="Avg Classes / Teacher" value="4.2" tone="sage" />
      </KpiRow>

      <ChartGrid cols={1}>
        <Panel title="Teachers by Department">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDept}>
              <CartesianGrid stroke={COLORS.hairline} vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.hairline }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} width={32} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.ink} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </ChartGrid>

      <FilterBar>
        <TextInput placeholder="Search by name..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={dept} onChange={(e) => setDept(e.target.value)}>
          {depts.map((d) => <option key={d} value={d}>{d === "all" ? "All departments" : d}</option>)}
        </Select>
      </FilterBar>

      <Table
        columns={["ID", "Name", "Department", "Classes", "Contact", "Status", "Actions"]}
        rows={filtered}
        renderRow={(t) => (
          <>
            <td className="px-4 py-3">{t.id}</td>
            <td className="px-4 py-3">{t.name}</td>
            <td className="px-4 py-3">{t.dept}</td>
            <td className="px-4 py-3">{t.classes}</td>
            <td className="px-4 py-3">{t.contact}</td>
            <td className="px-4 py-3"><Badge text={t.status} tone={t.status === "active" ? "sage" : "amber"} /></td>
            <td className="px-4 py-3"><RowAction>View</RowAction><RowAction tone="slate">Edit</RowAction></td>
          </>
        )}
      />
    </PageShell>
  );
}
