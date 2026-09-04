import { useState } from "react";
import { COLORS, PageShell, FilterBar, Select } from "../components/shared";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = ["8:00", "9:30", "11:00", "1:00", "2:30"];

// grid[period][day] = { subject, teacher, room } | null
const GRID = {
  "8:00": { Mon: { subject: "Math", teacher: "S. Meas", room: "204" }, Tue: { subject: "Physics", teacher: "R. Chea", room: "Lab 2" }, Wed: { subject: "Math", teacher: "S. Meas", room: "204" }, Thu: null, Fri: { subject: "English", teacher: "B. Kim", room: "108" } },
  "9:30": { Mon: { subject: "English", teacher: "B. Kim", room: "108" }, Tue: null, Wed: { subject: "History", teacher: "V. Sok", room: "115" }, Thu: { subject: "Math", teacher: "S. Meas", room: "204" }, Fri: null },
  "11:00": { Mon: { subject: "PE", teacher: "P. Ly", room: "Gym" }, Tue: { subject: "History", teacher: "V. Sok", room: "115" }, Wed: null, Thu: { subject: "Physics", teacher: "R. Chea", room: "Lab 2" }, Fri: { subject: "Math", teacher: "S. Meas", room: "204" } },
  "1:00": { Mon: null, Tue: { subject: "Math", teacher: "S. Meas", room: "204" }, Wed: { subject: "PE", teacher: "P. Ly", room: "Gym" }, Thu: null, Fri: { subject: "History", teacher: "V. Sok", room: "115" } },
  "2:30": { Mon: { subject: "History", teacher: "V. Sok", room: "115" }, Tue: null, Wed: { subject: "English", teacher: "B. Kim", room: "108" }, Thu: { subject: "PE", teacher: "P. Ly", room: "Gym" }, Fri: null },
};

export default function Schedules() {
  const [cls, setCls] = useState("10B");

  return (
    <PageShell title="Schedules" sub={`Weekly timetable — Class ${cls}`}>
      <FilterBar>
        <Select value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="9A">Grade 9A</option>
          <option value="10B">Grade 10B</option>
          <option value="11C">Grade 11C</option>
          <option value="12A">Grade 12A</option>
        </Select>
      </FilterBar>

      <div style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card, overflowX: "auto" }}>
        <table className="w-full text-[12px]" style={{ borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.hairline}`, color: COLORS.slate }}>
              <th className="text-left px-4 py-3 font-normal" style={{ width: 80 }}>Time</th>
              {DAYS.map((d) => <th key={d} className="text-left px-4 py-3 font-normal">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p) => (
              <tr key={p} style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
                <td className="px-4 py-3" style={{ color: COLORS.slate }}>{p}</td>
                {DAYS.map((d) => {
                  const cell = GRID[p][d];
                  return (
                    <td key={d} className="px-4 py-3">
                      {cell ? (
                        <div>
                          <div style={{ color: COLORS.ink }}>{cell.subject}</div>
                          <div style={{ color: COLORS.slate, fontSize: 11 }}>{cell.teacher} · {cell.room}</div>
                        </div>
                      ) : (
                        <span style={{ color: COLORS.hairline }}>—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[12px] mt-3" style={{ color: COLORS.coral }}>
        No conflicts detected for this class this week.
      </p>
    </PageShell>
  );
}
