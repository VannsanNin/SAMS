import { useMemo, useState } from "react";
import { PageShell, KPI, KpiRow, Badge, FilterBar, TextInput, Select, Table, RowAction } from "../components/shared";

const EXAMS = [
  { name: "Midterm", subject: "Math", cls: "10B", date: "2026-09-05", status: "scheduled" },
  { name: "Midterm", subject: "Physics", cls: "11C", date: "2026-09-06", status: "scheduled" },
  { name: "Quiz 3", subject: "English", cls: "9A", date: "2026-08-29", status: "grading" },
  { name: "Final", subject: "History", cls: "12A", date: "2026-08-20", status: "graded" },
];

export default function Exams() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(
    () => EXAMS.filter((e) => (status === "all" || e.status === status) && e.subject.toLowerCase().includes(query.toLowerCase())),
    [query, status]
  );
  const toneFor = (s) => (s === "graded" ? "sage" : s === "grading" ? "amber" : "slate");

  return (
    <PageShell title="Exams" sub={`${EXAMS.length} scheduled`} action="Schedule Exam">
      <KpiRow>
        <KPI label="Upcoming This Week" value="6" tone="ink" />
        <KPI label="Pending Grade Entry" value="9" tone="coral" />
        <KPI label="Graded" value="21" tone="sage" />
        <KPI label="Rooms Booked Today" value="4 / 12" tone="slate" />
      </KpiRow>

      <FilterBar>
        <TextInput placeholder="Search subject..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="scheduled">Scheduled</option>
          <option value="grading">Grading</option>
          <option value="graded">Graded</option>
        </Select>
      </FilterBar>

      <Table
        columns={["Exam", "Subject", "Class", "Date", "Status", "Actions"]}
        rows={filtered}
        renderRow={(e) => (
          <>
            <td className="px-4 py-3">{e.name}</td>
            <td className="px-4 py-3">{e.subject}</td>
            <td className="px-4 py-3">{e.cls}</td>
            <td className="px-4 py-3">{e.date}</td>
            <td className="px-4 py-3"><Badge text={e.status} tone={toneFor(e.status)} /></td>
            <td className="px-4 py-3">
              <RowAction>{e.status === "graded" ? "View Results" : "Enter Grades"}</RowAction>
            </td>
          </>
        )}
      />
    </PageShell>
  );
}
