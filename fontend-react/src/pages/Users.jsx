import React, { useMemo, useState } from "react";
import { PageShell, KPI, KpiRow, Badge, FilterBar, TextInput, Select, Table, RowAction } from "../components/shared";

const USERS = [
  { id: "U-001", name: "Sokun Meas", email: "sokun.meas@school.edu", role: "teacher", status: "active", lastLogin: "2026-08-31" },
  { id: "U-002", name: "Vibol Chan", email: "vibol.chan@mail.com", role: "parent", status: "active", lastLogin: "2026-08-30" },
  { id: "U-003", name: "Dara Ly", email: "dara.ly@student.school.edu", role: "student", status: "active", lastLogin: "2026-08-31" },
  { id: "U-004", name: "Admin Root", email: "admin@school.edu", role: "admin", status: "active", lastLogin: "2026-08-31" },
  { id: "U-005", name: "Bopha Kim", email: "bopha.kim@school.edu", role: "teacher", status: "suspended", lastLogin: "2026-07-15" },
];

export default function UserManagement() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const filtered = useMemo(
    () => USERS.filter((u) => (role === "all" || u.role === role) && (u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))),
    [query, role]
  );

  return (
    <PageShell title="User Management" sub={`${USERS.length} accounts`} action="Add User">
      <KpiRow>
        <KPI label="Total Users" value="1,006" tone="ink" />
        <KPI label="Admins" value="4" tone="slate" />
        <KPI label="Teachers" value="61" tone="amber" />
        <KPI label="Suspended" value="3" tone="coral" />
      </KpiRow>

      <FilterBar>
        <TextInput placeholder="Search by name or email..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
        </Select>
      </FilterBar>

      <Table
        columns={["ID", "Name", "Email", "Role", "Last Login", "Status", "Actions"]}
        rows={filtered}
        renderRow={(u) => (
          <>
            <td className="px-4 py-3">{u.id}</td>
            <td className="px-4 py-3">{u.name}</td>
            <td className="px-4 py-3">{u.email}</td>
            <td className="px-4 py-3 capitalize">{u.role}</td>
            <td className="px-4 py-3">{u.lastLogin}</td>
            <td className="px-4 py-3"><Badge text={u.status} tone={u.status === "active" ? "sage" : "coral"} /></td>
            <td className="px-4 py-3">
              <RowAction>Reset Password</RowAction>
              <RowAction tone="coral">{u.status === "active" ? "Suspend" : "Activate"}</RowAction>
            </td>
          </>
        )}
      />
    </PageShell>
  );
}
