import React, { useMemo, useState } from "react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { COLORS, CHART_COLORS, PageShell, KPI, KpiRow, Panel, ChartGrid, Badge, FilterBar, TextInput, Select, Table, RowAction } from "../components/shared";

const collectionTrend = [
  { month: "Feb", collected: 42000 }, { month: "Mar", collected: 44500 },
  { month: "Apr", collected: 39000 }, { month: "May", collected: 46000 },
];
const paymentMethods = [
  { name: "Bank Transfer", value: 62 }, { name: "Cash", value: 25 }, { name: "Card", value: 13 },
];
const ACCOUNTS = [
  { student: "Sopheak Chan", cls: "10B", due: 320, paid: 0, status: "overdue" },
  { student: "Dara Ly", cls: "9A", due: 320, paid: 320, status: "paid" },
  { student: "Rithy Sok", cls: "11C", due: 340, paid: 170, status: "partial" },
  { student: "Kosal Meas", cls: "12A", due: 340, paid: 340, status: "paid" },
];

export default function Fees() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(
    () => ACCOUNTS.filter((a) => (status === "all" || a.status === status) && a.student.toLowerCase().includes(query.toLowerCase())),
    [query, status]
  );
  const toneFor = (s) => (s === "paid" ? "sage" : s === "partial" ? "amber" : "coral");

  return (
    <PageShell title="Fees & Finance" sub="Tuition and payment tracking">
      <KpiRow>
        <KPI label="Collected (May)" value="$46,000" sub="102% of target" tone="sage" />
        <KPI label="Outstanding" value="$8,400" tone="coral" />
        <KPI label="Overdue Accounts" value="11" tone="coral" />
        <KPI label="Avg Days Overdue" value="14" tone="amber" />
      </KpiRow>

      <ChartGrid>
        <Panel title="Collection Trend">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={collectionTrend}>
              <CartesianGrid stroke={COLORS.hairline} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.hairline }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} width={48} />
              <Tooltip />
              <Line type="monotone" dataKey="collected" stroke={COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Payment Method Breakdown">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentMethods} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={2}>
                {paymentMethods.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </ChartGrid>

      <FilterBar>
        <TextInput placeholder="Search student..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
        </Select>
      </FilterBar>

      <Table
        columns={["Student", "Class", "Due", "Paid", "Status", "Actions"]}
        rows={filtered}
        renderRow={(a) => (
          <>
            <td className="px-4 py-3">{a.student}</td>
            <td className="px-4 py-3">{a.cls}</td>
            <td className="px-4 py-3">${a.due}</td>
            <td className="px-4 py-3">${a.paid}</td>
            <td className="px-4 py-3"><Badge text={a.status} tone={toneFor(a.status)} /></td>
            <td className="px-4 py-3"><RowAction>Record Payment</RowAction></td>
          </>
        )}
      />
    </PageShell>
  );
}
