import { useMemo, useState } from "react";
import { PageShell, KPI, KpiRow, Badge, FilterBar, TextInput, Select, Table, RowAction } from "../components/shared";

const CLASSES = [
  { id: "10B", homeroom: "Sokun Meas", students: 34, room: "204", avg: 76 },
  { id: "9A", homeroom: "Bopha Kim", students: 31, room: "108", avg: 80 },
  { id: "11C", homeroom: "Ratana Chea", students: 29, room: "312", avg: 71 },
  { id: "12A", homeroom: "Vantha Sok", students: 27, room: "115", avg: 85 },
];

export default function Classes() {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("all");
  const grades = useMemo(() => ["all", ...new Set(CLASSES.map((c) => c.id.replace(/[A-Z]/g, "")))], []);
  const filtered = CLASSES.filter((c) => (grade === "all" || c.id.startsWith(grade)) && c.id.toLowerCase().includes(query.toLowerCase()));

  return (
    <PageShell title="Classes" sub={`${CLASSES.length} classes`} action="Add Class">
      <KpiRow>
        <KPI label="Total Classes" value="24" tone="ink" />
        <KPI label="Avg Class Size" value="30" tone="slate" />
        <KPI label="Largest Class" value="10B — 34" tone="amber" />
        <KPI label="Lowest Avg Score" value="11C — 71%" tone="coral" />
      </KpiRow>

      <FilterBar>
        <TextInput placeholder="Search class..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
          {grades.map((g) => <option key={g} value={g}>{g === "all" ? "All grades" : `Grade ${g}`}</option>)}
        </Select>
      </FilterBar>

      <Table
        columns={["Class", "Homeroom Teacher", "Students", "Room", "Class Avg", "Actions"]}
        rows={filtered}
        renderRow={(c) => (
          <>
            <td className="px-4 py-3">{c.id}</td>
            <td className="px-4 py-3">{c.homeroom}</td>
            <td className="px-4 py-3">{c.students}</td>
            <td className="px-4 py-3">{c.room}</td>
            <td className="px-4 py-3"><Badge text={`${c.avg}%`} tone={c.avg < 75 ? "coral" : "sage"} /></td>
            <td className="px-4 py-3">
              <RowAction>Roster</RowAction>
              <RowAction tone="slate">Timetable</RowAction>
            </td>
          </>
        )}
      />
    </PageShell>
  );
}
