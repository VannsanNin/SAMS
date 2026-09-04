import { useMemo, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS, PageShell, KPI, KpiRow, Panel, ChartGrid, Badge, FilterBar, TextInput, Select, Table } from "../components/shared";

const distribution = [
  { grade: "A", count: 62 }, { grade: "B", count: 148 }, { grade: "C", count: 110 },
  { grade: "D", count: 34 }, { grade: "F", count: 12 },
];
const trend = [
  { term: "T1", avg: 74 }, { term: "T2", avg: 77 }, { term: "T3", avg: 76 }, { term: "T4", avg: 80 },
];
const RESULTS = [
  { student: "Sopheak Chan", subject: "Math", exam: "Midterm", score: 62, grade: "D" },
  { student: "Dara Ly", subject: "Math", exam: "Midterm", score: 88, grade: "A" },
  { student: "Rithy Sok", subject: "Physics", exam: "Midterm", score: 74, grade: "B" },
  { student: "Chenda Prum", subject: "English", exam: "Midterm", score: 91, grade: "A" },
];

export default function Grades() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const subjects = useMemo(() => ["all", ...new Set(RESULTS.map((r) => r.subject))], []);
  const filtered = RESULTS.filter(
    (r) => (subject === "all" || r.subject === subject) && r.student.toLowerCase().includes(query.toLowerCase())
  );
  const toneFor = (g) => (g === "A" || g === "B" ? "sage" : g === "C" ? "amber" : "coral");

  return (
    <PageShell title="Grades & Results" sub="Exam scores and academic performance">
      <KpiRow>
        <KPI label="Class Average" value="76%" tone="ink" />
        <KPI label="Pass Rate" value="92%" tone="sage" />
        <KPI label="Top Score" value="98%" tone="amber" />
        <KPI label="Pending Entries" value="14" tone="coral" />
      </KpiRow>

      <ChartGrid>
        <Panel title="Grade Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distribution}>
              <CartesianGrid stroke={COLORS.hairline} vertical={false} />
              <XAxis dataKey="grade" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.hairline }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} width={32} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.indigo} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Performance Trend by Term">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <CartesianGrid stroke={COLORS.hairline} vertical={false} />
              <XAxis dataKey="term" tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={{ stroke: COLORS.hairline }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: COLORS.slate }} axisLine={false} tickLine={false} width={32} />
              <Tooltip />
              <Line type="monotone" dataKey="avg" stroke={COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </ChartGrid>

      <FilterBar>
        <TextInput placeholder="Search student..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
          {subjects.map((s) => <option key={s} value={s}>{s === "all" ? "All subjects" : s}</option>)}
        </Select>
      </FilterBar>

      <Table
        columns={["Student", "Subject", "Exam", "Score", "Grade"]}
        rows={filtered}
        renderRow={(r) => (
          <>
            <td className="px-4 py-3">{r.student}</td>
            <td className="px-4 py-3">{r.subject}</td>
            <td className="px-4 py-3">{r.exam}</td>
            <td className="px-4 py-3">{r.score}%</td>
            <td className="px-4 py-3"><Badge text={r.grade} tone={toneFor(r.grade)} /></td>
          </>
        )}
      />
    </PageShell>
  );
}
