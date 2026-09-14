import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { apiFetch } from "../api";
import { COLORS, PageShell, KPI, KpiRow, Panel, Badge, Select, TextInput } from "../components/shared";

const API = "/api";

const GRADES = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Grade ${i + 1}` }));

const gradeFor = (pct) =>
  pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : pct >= 50 ? "E" : "F";
const gradeTone = (g) =>
  ({ A: "sage", B: "indigo", C: "amber", D: "amber", E: "coral", F: "coral" }[g] || "slate");

const gradeColorHex = {
  A: COLORS.sage,
  B: COLORS.indigo,
  C: COLORS.amber,
  D: "#FB923C",
  E: COLORS.coral,
  F: "#DC2626",
};

export default function Grades() {
  const [gradeLevel, setGradeLevel] = useState("");
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadGrades = useCallback((gl) => {
    if (!gl) return;
    setLoading(true);
    setGrades(null);
    apiFetch(`${API}/grades/grade-level/${gl}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setGrades(d))
      .catch(() => setGrades(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (gradeLevel) loadGrades(gradeLevel);
  }, [gradeLevel, loadGrades]);

  const results = grades?.results || [];
  const stats = grades?.stats || {};

  const filtered = results.filter((r) =>
    r.student_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Grade distribution for chart
  const distribution = {};
  results.forEach((r) => {
    const g = r.grade || gradeFor(r.percentage ?? 0);
    distribution[g] = (distribution[g] || 0) + 1;
  });
  const distData = Object.entries(distribution)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => a.grade.localeCompare(b.grade));
  const distColors = distData.map((d) => gradeColorHex[d.grade] || COLORS.indigo);

  // Subject breakdown across students (top 6 subjects by avg)
  const subjectAvg = {};
  results.forEach((r) => {
    (r.subjects || []).forEach((s) => {
      if (!subjectAvg[s.subject]) subjectAvg[s.subject] = { total: 0, count: 0 };
      subjectAvg[s.subject].total += s.percentage ?? 0;
      subjectAvg[s.subject].count += 1;
    });
  });
  const subjectData = Object.entries(subjectAvg)
    .map(([subject, v]) => ({ subject: subject?.substring(0, 12) || "—", avg: Math.round(v.total / v.count) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 6);

  return (
    <PageShell title="Grades" sub="Grade level performance overview and student grade breakdown">
      {/* Grade selector */}
      <div className="flex items-end gap-3 mb-5">
        <div className="flex-1 max-w-xs">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Select Grade Level
          </label>
          <select
            className="px-3 py-2 text-[13px] w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition rounded-xl"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
          >
            <option value="">Choose a grade...</option>
            {GRADES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!gradeLevel && !loading && (
        <Panel className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
          Select a grade level above to view grades.
        </Panel>
      )}

      {loading && (
        <Panel className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
          Loading grades...
        </Panel>
      )}

      {gradeLevel && !loading && grades && (
        <>
          {/* KPIs */}
          <KpiRow>
            <KPI label="Students" value={stats.total_students ?? 0} tone="indigo" />
            <KPI label="Average %" value={`${stats.average_percentage ?? 0}%`} tone="amber" />
            <KPI label="Average GPA" value={stats.average_gpa ?? 0} tone="sage" />
            <KPI
              label="Pass Rate"
              value={`${stats.total_students > 0 ? Math.round(((stats.pass_count ?? 0) / (stats.total_students ?? 1)) * 100) : 0}%`}
              tone={stats.pass_count > stats.fail_count ? "sage" : "coral"}
            />
          </KpiRow>

          {/* Section breakdown */}
          {grades.sections && Object.keys(grades.sections).length > 1 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {Object.entries(grades.sections).map(([section, count]) => (
                <div key={section} className="impeccable-card px-4 py-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Section {section}</span>
                  <Badge text={`${count} students`} tone="indigo" />
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          {distData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              {/* Grade distribution */}
              <div className="impeccable-card p-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Grade Distribution
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={distData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="grade" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip />
                    <Bar dataKey="count" name="Students" fill={COLORS.indigo} radius={[4, 4, 0, 0]} barSize={36}>
                      {distData.map((d, i) => (
                        <Cell key={i} fill={distColors[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Subject averages */}
              {subjectData.length > 0 && (
                <div className="impeccable-card p-4">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                    Subject Averages
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={subjectData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={45} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip />
                      <Bar dataKey="avg" name="Avg %" fill={COLORS.amber} radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Students table */}
          <div className="impeccable-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Student Grades
              </h3>
              <TextInput placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-700/60">
                  <tr>
                    {["#", "Student", "Code", "Sec", "Total", "Obtained", "Average", "GPA", "Grade"].map((h) => (
                      <th key={h} className="px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                        {search ? "No students match your search." : "No grades available for this grade level."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.student_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{r.rank}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{r.student_name}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.student_code}</td>
                        <td className="px-4 py-3"><Badge text={r.section || "—"} tone="slate" /></td>
                        <td className="px-4 py-3">{r.total_marks}</td>
                        <td className="px-4 py-3 font-semibold">{r.obtained_marks}</td>
                        <td className="px-4 py-3 font-semibold">{r.percentage}%</td>
                        <td className="px-4 py-3 font-semibold">{r.gpa}</td>
                        <td className="px-4 py-3">
                          <Badge text={r.grade || gradeFor(r.percentage)} tone={gradeTone(r.grade || gradeFor(r.percentage))} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}