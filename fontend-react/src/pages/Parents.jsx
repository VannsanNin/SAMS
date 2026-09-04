import { useMemo, useState } from "react";
import { PageShell, KPI, KpiRow, Badge, FilterBar, TextInput, Select, Table, RowAction } from "../components/shared";

const PARENTS = [
  { id: "P-001", name: "Vibol Chan", children: ["Sopheak Chan (10B)"], contact: "012 345 678", lastLogin: "2026-08-30", status: "active" },
  { id: "P-002", name: "Sreymom Ly", children: ["Dara Ly (9A)"], contact: "012 456 789", lastLogin: "2026-08-29", status: "active" },
  { id: "P-003", name: "Bopha Sok", children: ["Rithy Sok (11C)"], contact: "012 567 890", lastLogin: "2026-08-12", status: "inactive" },
  { id: "P-004", name: "Sokha Prum", children: ["Chenda Prum (10B)", "Sokun Prum (7A)"], contact: "012 678 901", lastLogin: "2026-08-31", status: "active" },
  { id: "P-005", name: "Ratana Heng", children: ["Vibol Heng (11C)"], contact: "012 789 012", lastLogin: "2026-08-25", status: "active" },
];

export default function Parents() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(
    () =>
      PARENTS.filter(
        (p) =>
          (status === "all" || p.status === status) &&
          (p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.children.some((c) => c.toLowerCase().includes(query.toLowerCase())))
      ),
    [query, status]
  );

  return (
    <PageShell title="Parents" sub={`${PARENTS.length} total records`} action="Add Parent">
      <KpiRow>
        <KPI label="Total Parents" value={PARENTS.length} tone="ink" />
        <KPI label="Active Accounts" value={PARENTS.filter((p) => p.status === "active").length} tone="sage" />
        <KPI label="Unlinked Children" value="2" sub="need a guardian" tone="coral" />
        <KPI label="Logged In (7 days)" value="38%" tone="amber" />
      </KpiRow>

      <FilterBar>
        <TextInput placeholder="Search by parent or child name..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FilterBar>

      <Table
        columns={["ID", "Name", "Linked Children", "Contact", "Last Login", "Status", "Actions"]}
        rows={filtered}
        renderRow={(p) => (
          <>
            <td className="px-4 py-3">{p.id}</td>
            <td className="px-4 py-3">{p.name}</td>
            <td className="px-4 py-3">{p.children.join(", ")}</td>
            <td className="px-4 py-3">{p.contact}</td>
            <td className="px-4 py-3">{p.lastLogin}</td>
            <td className="px-4 py-3"><Badge text={p.status} tone={p.status === "active" ? "sage" : "coral"} /></td>
            <td className="px-4 py-3">
              <RowAction>View</RowAction>
              <RowAction tone="slate">Link Child</RowAction>
            </td>
          </>
        )}
      />
    </PageShell>
  );
}
