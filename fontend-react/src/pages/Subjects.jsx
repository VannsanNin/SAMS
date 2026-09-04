import { useMemo, useState } from "react";
import { PageShell, KPI, KpiRow, FilterBar, TextInput, Select, Table, RowAction } from "../components/shared";

const COURSES = [
  { code: "MATH-10", name: "Mathematics", dept: "Math", teacher: "Sokun Meas", classes: 4 },
  { code: "PHYS-11", name: "Physics", dept: "Science", teacher: "Ratana Chea", classes: 3 },
  { code: "ENG-09", name: "English Literature", dept: "English", teacher: "Bopha Kim", classes: 5 },
  { code: "HIST-10", name: "World History", dept: "History", teacher: "Vantha Sok", classes: 3 },
  { code: "PE-ALL", name: "Physical Education", dept: "PE", teacher: "Pisey Ly", classes: 8 },
];

export default function Courses() {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const depts = useMemo(() => ["all", ...new Set(COURSES.map((c) => c.dept))], []);
  const filtered = COURSES.filter((c) => (dept === "all" || c.dept === dept) && c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <PageShell title="Courses" sub={`${COURSES.length} subjects`} action="Add Subject">
      <KpiRow cols={3}>
        <KPI label="Total Subjects" value="28" tone="ink" />
        <KPI label="Departments" value="8" tone="slate" />
        <KPI label="Unassigned Subjects" value="1" tone="coral" />
      </KpiRow>

      <FilterBar>
        <TextInput placeholder="Search subjects..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={dept} onChange={(e) => setDept(e.target.value)}>
          {depts.map((d) => <option key={d} value={d}>{d === "all" ? "All departments" : d}</option>)}
        </Select>
      </FilterBar>

      <Table
        columns={["Code", "Subject", "Department", "Teacher", "Classes Taught In", "Actions"]}
        rows={filtered}
        renderRow={(c) => (
          <>
            <td className="px-4 py-3">{c.code}</td>
            <td className="px-4 py-3">{c.name}</td>
            <td className="px-4 py-3">{c.dept}</td>
            <td className="px-4 py-3">{c.teacher}</td>
            <td className="px-4 py-3">{c.classes}</td>
            <td className="px-4 py-3"><RowAction>Edit</RowAction></td>
          </>
        )}
      />
    </PageShell>
  );
}
