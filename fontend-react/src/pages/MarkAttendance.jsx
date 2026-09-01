import React, { useState } from "react";
import { COLORS, PageShell, Select } from "../components/shared";

const ROSTER = [
  { id: "S-1001", name: "Sopheak Chan" },
  { id: "S-1002", name: "Dara Ly" },
  { id: "S-1003", name: "Rithy Sok" },
  { id: "S-1004", name: "Chenda Prum" },
  { id: "S-1005", name: "Vibol Heng" },
];

const STATUSES = ["present", "late", "absent"];
const toneFor = (s) => (s === "present" ? COLORS.sage : s === "late" ? COLORS.amber : COLORS.coral);

export default function MarkAttendance() {
  const [cls, setCls] = useState("10B");
  const [date, setDate] = useState("2026-09-01");
  const [marks, setMarks] = useState(Object.fromEntries(ROSTER.map((s) => [s.id, "present"])));
  const [submitted, setSubmitted] = useState(false);

  const setMark = (id, status) => setMarks((m) => ({ ...m, [id]: status }));

  return (
    <PageShell title="Mark Attendance" sub="Select a class and date, then mark each student">
      <div className="flex gap-3 mb-6">
        <Select value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="9A">Grade 9A</option>
          <option value="10B">Grade 10B</option>
          <option value="11C">Grade 11C</option>
        </Select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 text-[13px]"
          style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card, color: COLORS.ink }}
        />
        {submitted && (
          <span className="text-[12px] self-center" style={{ color: COLORS.sage }}>✓ Marked for {date}</span>
        )}
      </div>

      <div style={{ border: `1px solid ${COLORS.hairline}`, background: COLORS.card }}>
        {ROSTER.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: i < ROSTER.length - 1 ? `1px solid ${COLORS.hairline}` : "none" }}
          >
            <span style={{ color: COLORS.ink }}>{s.name}</span>
            <div className="flex gap-2">
              {STATUSES.map((st) => (
                <button
                  key={st}
                  onClick={() => setMark(s.id, st)}
                  className="text-[12px] px-3 py-1 capitalize"
                  style={{
                    border: `1px solid ${toneFor(st)}`,
                    color: marks[s.id] === st ? "#fff" : toneFor(st),
                    background: marks[s.id] === st ? toneFor(st) : "transparent",
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setSubmitted(true)}
        className="mt-4 px-4 py-2 text-[13px] text-white"
        style={{ background: COLORS.ink }}
      >
        Submit Attendance
      </button>
    </PageShell>
  );
}
