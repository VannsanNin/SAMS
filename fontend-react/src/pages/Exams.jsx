import React, { useCallback, useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Modal from "../components/Modal";
import { apiFetch } from "../api";
import { COLORS, PageShell, KPI, KpiRow, Panel, Badge, FilterBar, TextInput, Select, RowAction } from "../components/shared";

const API = "/api";

const GRADES = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Grade ${i + 1}` }));
const EXAM_TYPES = ["quiz", "midterm", "final", "monthly", "practical", "oral"];
const STATUSES = ["draft", "scheduled", "ongoing", "completed", "cancelled"];
const STATUS_TONE = { draft: "slate", scheduled: "amber", ongoing: "ink", completed: "sage", cancelled: "coral" };
const TYPE_TONE = { quiz: "amber", midterm: "ink", final: "coral", monthly: "slate", practical: "sage", oral: "indigo" };

const inputCls = "px-3 py-2 text-[13px] w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition";
const labelCls = "text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5";

const EMPTY_EXAM = { name: "", type: "midterm", subject_id: "", grade_level: "", date: "", time_start: "", time_end: "", total_marks: 100, passing_marks: 50, room: "", description: "", academic_year: "2025-2026", semester: "Semester 1", status: "draft" };

const pct = (obtained, total) => total > 0 ? Math.round((obtained / total) * 100) : 0;
const gradeFor = (pct) => pct >= 90 ? "A" : pct >= 80 ? "B" : pct >= 70 ? "C" : pct >= 60 ? "D" : pct >= 50 ? "E" : "F";
const gradeTone = (g) => ({ A: "sage", B: "indigo", C: "amber", D: "amber", E: "coral", F: "coral" }[g] || "slate");

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleDateString();
}

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "", type: "", grade_level: "" });
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_EXAM);
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState({ type: "", text: "" });
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = ["admin", "principal"].includes(currentUser.role);

  // Score entry state
  const [scoreOpen, setScoreOpen] = useState(null);
  const [scoreExam, setScoreExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [scoreSaving, setScoreSaving] = useState(false);

  // Results state
  const [resultsOpen, setResultsOpen] = useState(null);
  const [results, setResults] = useState(null);

  // Report cards state
  const [reportsOpen, setReportsOpen] = useState(null);
  const [reports, setReports] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  const flash = (text, type = "success") => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 5000);
  };

  const loadExams = useCallback((pg = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set("page", pg);
    apiFetch(`${API}/exams?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => {
        setExams(res.data || []);
        setMeta({ current_page: res.current_page, last_page: res.last_page, from: res.from, to: res.to, total: res.total });
      })
      .catch(() => flash("Failed to load exams", "error"))
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => {
    apiFetch(`${API}/subjects?per_page=200`)
      .then((r) => r.ok ? r.json() : null)
      .then((res) => setSubjects((res?.data || []).map((s) => ({ id: s.id, name: s.subject_name }))))
      .catch(() => {});
    loadExams(1);
  }, []);

  const submitCreate = async () => {
    if (!form.name || !form.subject_id || !form.grade_level || !form.date) {
      flash("Name, subject, grade level, and date are required", "error");
      return;
    }
    setSaving(true);
    const res = await apiFetch(`${API}/exams`, {
      method: "POST",
      body: JSON.stringify({
        ...form,
        subject_id: Number(form.subject_id),
        grade_level: Number(form.grade_level),
        total_marks: Number(form.total_marks),
        passing_marks: Number(form.passing_marks),
      }),
    });
    setSaving(false);
    if (res.ok) {
      flash("Exam created");
      setCreateOpen(false);
      setForm(EMPTY_EXAM);
      loadExams(1);
    } else {
      const d = await res.json().catch(() => ({}));
      flash(d.errors ? Object.values(d.errors).flat().join("; ") : (d.message || "Failed to create"), "error");
    }
  };

  // ── Score entry ──────────────────────────────────────────────
  const openScoreEntry = async (exam) => {
    setScoreExam(exam);
    setScoreOpen(true);
    const gradeLevel = exam.grade_level;
    const studentsRes = await apiFetch(`${API}/students?grade_level=${gradeLevel}&per_page=200`);
    const marksRes = await apiFetch(`${API}/exams/${exam.id}/marks`);
    const roster = studentsRes.ok ? (await studentsRes.json()).data || [] : [];
    const marksData = marksRes.ok ? await marksRes.json() : [];
    const existingMarks = {};
    (Array.isArray(marksData) ? marksData : []).forEach((m) => { existingMarks[m.student_id] = m; });
    setStudents(roster);
    setMarks(roster.map((s) => ({
      student_id: s.id,
      student_name: s.name,
      student_code: s.student_id,
      section: s.class?.class_name || "—",
      marks_obtained: existingMarks[s.id]?.marks_obtained ?? "",
      marks_obtained_practical: existingMarks[s.id]?.marks_obtained_practical ?? "",
      remarks: existingMarks[s.id]?.remarks ?? "",
      is_absent: existingMarks[s.id]?.is_absent ?? false,
      is_excused: existingMarks[s.id]?.is_excused ?? false,
    })));
  };

  const updateMark = (studentId, field, value) => {
    setMarks((prev) => prev.map((m) => m.student_id === studentId ? { ...m, [field]: value } : m));
  };

  const submitMarks = async () => {
    setScoreSaving(true);
    const payload = marks.map((m) => ({
      student_id: m.student_id,
      marks_obtained: m.marks_obtained === "" ? null : Number(m.marks_obtained),
      marks_obtained_practical: m.marks_obtained_practical === "" ? null : Number(m.marks_obtained_practical),
      remarks: m.remarks || null,
      is_absent: m.is_absent,
      is_excused: m.is_excused,
    }));
    const res = await apiFetch(`${API}/exams/${scoreExam.id}/marks`, { method: "POST", body: JSON.stringify({ marks: payload }) });
    setScoreSaving(false);
    if (res.ok) { flash("Marks saved successfully"); setScoreOpen(null); loadExams(page); }
    else { const d = await res.json().catch(() => ({})); flash(d.message || "Failed to save marks", "error"); }
  };

  const markCompleted = async (exam) => {
    const res = await apiFetch(`${API}/exams/${exam.id}`, { method: "PUT", body: JSON.stringify({ status: "completed" }) });
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      loadExams(page);
      if (d.report_cards_generated) {
        flash(`Exam completed — report cards auto-generated for ${d.report_cards_generated} students`);
      } else {
        flash("Exam marked as completed");
      }
    }
    else flash("Failed to update status", "error");
  };

  // ── Report cards ──────────────────────────────────────────────
  const openReports = async (exam) => {
    setReportsOpen(exam);
    setReports(null);
    const params = new URLSearchParams({ grade_level: exam.grade_level, per_page: 100 });
    if (exam.academic_year) params.set("academic_year", exam.academic_year);
    if (exam.semester) params.set("semester", exam.semester);
    const res = await apiFetch(`${API}/result-cards?${params.toString()}`);
    if (res.ok) {
      const d = await res.json();
      setReports(d.data || []);
    } else {
      setReports([]);
    }
  };

  const regenerateReports = async () => {
    setRegenerating(true);
    const res = await apiFetch(`${API}/grades/grade-level/${reportsOpen.grade_level}/report-cards`, {
      method: "POST",
      body: JSON.stringify({
        academic_year: reportsOpen.academic_year || "2025-2026",
        semester: reportsOpen.semester || "Semester 1",
      }),
    });
    setRegenerating(false);
    if (res.ok) {
      const d = await res.json();
      flash(d.generated_count ? `Report cards regenerated for ${d.generated_count} students` : "Report cards generated");
      setReports(d.result_cards || []);
    } else {
      const d = await res.json().catch(() => ({}));
      flash(d.message || "Failed to generate report cards", "error");
    }
  };

  // ── View results ──────────────────────────────────────────────
  const openResults = async (exam) => {
    setResultsOpen(exam);
    const res = await apiFetch(`${API}/exams/${exam.id}/results`);
    if (res.ok) setResults(await res.json());
    else setResults(null);
  };

  const chartData = results?.results?.length
    ? results.results.slice(0, 12).map((r) => ({ name: r.student_name?.split(" ")[0] || `#${r.student_id}`, score: Number(r.percentage) }))
    : [];

  return (
    <PageShell
      title="Exams"
      sub="Schedule exams and enter student marks"
      action={isAdmin ? "New Exam" : undefined}
      onAction={() => { setForm(EMPTY_EXAM); setCreateOpen(true); }}
    >
      {msg.text && (
        <div className={`mb-4 px-4 py-2.5 text-xs font-semibold rounded-xl border ${msg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
          {msg.text}
        </div>
      )}

      {/* KPIs */}
      <KpiRow>
        <KPI label="Total Exams" value={meta?.total ?? exams.length} tone="indigo" />
        <KPI label="Scheduled" value={exams.filter((e) => e.status === "scheduled").length} tone="amber" />
        <KPI label="Completed" value={exams.filter((e) => e.status === "completed").length} tone="sage" />
        <KPI label="Draft" value={exams.filter((e) => e.status === "draft").length} tone="slate" />
      </KpiRow>

      {/* Filters */}
      <FilterBar>
        <TextInput placeholder="Search exams..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <Select value={filters.grade_level} onChange={(e) => setFilters({ ...filters, grade_level: e.target.value })}>
          <option value="">All grades</option>
          {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All types</option>
          {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <button className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition" onClick={() => loadExams(1)}>Apply</button>
      </FilterBar>

      {/* Exams table */}
      <div className="impeccable-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/60">
              <tr>
                {["Exam", "Type", "Grade", "Subject", "Date", "Marks", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">Loading...</td></tr>
              ) : exams.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">No exams found.</td></tr>
              ) : exams.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{e.name}</td>
                  <td className="px-4 py-3 capitalize"><Badge text={e.type} tone={TYPE_TONE[e.type] || "slate"} /></td>
                  <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">Grade {e.grade_level}</td>
                  <td className="px-4 py-3">{e.subject?.subject_name || "—"}</td>
                  <td className="px-4 py-3">{fmtDate(e.date)}</td>
                  <td className="px-4 py-3">{e.passing_marks}/{e.total_marks}</td>
                  <td className="px-4 py-3"><Badge text={e.status} tone={STATUS_TONE[e.status] || "slate"} /></td>
                  <td className="px-4 py-3">
                    <RowAction tone="indigo" onClick={() => openScoreEntry(e)}>Enter Marks</RowAction>
                    {e.status === "completed" && <RowAction tone="amber" onClick={() => openResults(e)}>Results</RowAction>}
                    {e.status === "completed" && <RowAction tone="sage" onClick={() => openReports(e)}>Report Cards</RowAction>}
                    {e.status !== "completed" && <RowAction tone="sage" onClick={() => markCompleted(e)}>Mark Complete</RowAction>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Showing {meta.from}–{meta.to} of {meta.total}</span>
            <div className="flex gap-1">
              <button disabled={meta.current_page === 1} onClick={() => { setPage(meta.current_page - 1); loadExams(meta.current_page - 1); }} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40">Prev</button>
              <span className="px-3 py-1.5">Page {meta.current_page} / {meta.last_page}</span>
              <button disabled={meta.current_page === meta.last_page} onClick={() => { setPage(meta.current_page + 1); loadExams(meta.current_page + 1); }} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Exam Modal ─── */}
      {createOpen && (
        <Modal title="Schedule Exam" onClose={() => setCreateOpen(false)} wide footer={
          <div className="flex justify-end gap-3">
            <button className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md" onClick={submitCreate} disabled={saving}>{saving ? "Saving..." : "Create Exam"}</button>
          </div>
        }>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className={labelCls}>Exam Name *</label><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Midterm Examination" /></div>
            <div><label className={labelCls}>Type *</label>
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Grade Level *</label>
              <select className={inputCls} value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })}>
                <option value="">Select grade</option>
                {GRADES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Subject *</label>
              <select className={inputCls} value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Date *</label><input className={inputCls} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><label className={labelCls}>Room</label><input className={inputCls} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>
            <div><label className={labelCls}>Total Marks</label><input className={inputCls} type="number" min="1" value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: e.target.value })} /></div>
            <div><label className={labelCls}>Passing Marks</label><input className={inputCls} type="number" min="0" value={form.passing_marks} onChange={(e) => setForm({ ...form, passing_marks: e.target.value })} /></div>
            <div><label className={labelCls}>Academic Year</label><input className={inputCls} value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} /></div>
            <div><label className={labelCls}>Semester</label><input className={inputCls} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></div>
            <div className="col-span-2"><label className={labelCls}>Description</label><textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
        </Modal>
      )}

      {/* ── Score Entry Modal ─── */}
      {scoreOpen && scoreExam && (
        <Modal title={`Enter Marks — ${scoreExam.name} (Grade ${scoreExam.grade_level})`} onClose={() => setScoreOpen(null)} wide footer={
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">{marks.length} students across all sections · Total {scoreExam.total_marks} marks</span>
            <div className="flex gap-3">
              <button className="px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setScoreOpen(null)}>Cancel</button>
              <button className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md" onClick={submitMarks} disabled={scoreSaving}>{scoreSaving ? "Saving..." : "Save Marks"}</button>
            </div>
          </div>
        }>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Enter marks for each student in Grade {scoreExam.grade_level}. Marks above {scoreExam.total_marks} will be rejected. Check "Absent" if the student did not sit for the exam.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-700/60">
                <tr>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2 w-16">Section</th>
                  <th className="px-3 py-2 w-20">Score</th>
                  <th className="px-3 py-2 w-24">Practical</th>
                  <th className="px-3 py-2 w-16">%</th>
                  <th className="px-3 py-2 w-12">Grade</th>
                  <th className="px-3 py-2 w-20">Absent</th>
                  <th className="px-3 py-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {marks.map((m) => {
                  const score = m.marks_obtained === "" ? null : Number(m.marks_obtained);
                  const p = pct(score ?? 0, scoreExam.total_marks);
                  const g = gradeFor(p);
                  return (
                    <tr key={m.student_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{m.student_name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{m.student_code}</div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge text={m.section} tone="slate" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" max={scoreExam.total_marks} className="w-16 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          value={m.marks_obtained} disabled={m.is_absent}
                          onChange={(e) => updateMark(m.student_id, "marks_obtained", e.target.value)} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" max={scoreExam.total_marks} className="w-20 px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          value={m.marks_obtained_practical} disabled={m.is_absent}
                          onChange={(e) => updateMark(m.student_id, "marks_obtained_practical", e.target.value)} />
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                        {m.is_absent ? "—" : `${p}%`}
                      </td>
                      <td className="px-3 py-2">
                        {m.is_absent ? "—" : <Badge text={g} tone={gradeTone(g)} />}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input type="checkbox" checked={m.is_absent}
                          onChange={(e) => { updateMark(m.student_id, "is_absent", e.target.checked); if (e.target.checked) updateMark(m.student_id, "marks_obtained", ""); }}
                          className="w-4 h-4 accent-indigo-600" />
                      </td>
                      <td className="px-3 py-2">
                        <input className="w-28 px-2 py-1.5 text-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          value={m.remarks} placeholder="Note..."
                          onChange={(e) => updateMark(m.student_id, "remarks", e.target.value)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* ── View Results Modal ─── */}
      {resultsOpen && (
        <Modal title={`Results — ${resultsOpen.name} (Grade ${resultsOpen.grade_level})`} onClose={() => { setResultsOpen(null); setResults(null); }} wide>
          {results ? (
            <>
              <KpiRow cols={4}>
                <KPI label="Total Students" value={results.stats?.total ?? 0} tone="indigo" />
                <KPI label="Average" value={`${results.stats?.average ?? 0}%`} tone="amber" />
                <KPI label="Pass Rate" value={`${results.stats?.pass_rate ?? 0}%`} tone="sage" />
                <KPI label="Highest" value={`${results.stats?.highest ?? 0}%`} tone="ink" />
              </KpiRow>

              {chartData.length > 0 && (
                <div className="mb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} interval={0} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip />
                      <Bar dataKey="score" name="Score %" fill={COLORS.indigo} radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-700/60">
                    <tr>
                      <th className="px-4 py-2">Rank</th>
                      <th className="px-4 py-2">Student</th>
                      <th className="px-4 py-2">Section</th>
                      <th className="px-4 py-2">Score</th>
                      <th className="px-4 py-2">%</th>
                      <th className="px-4 py-2">Grade</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {(results.results || []).map((r) => {
                      const g = gradeFor(Number(r.percentage));
                      return (
                        <tr key={r.student_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-2 font-bold text-indigo-600 dark:text-indigo-400">#{r.rank}</td>
                          <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100">{r.student_name}</td>
                          <td className="px-4 py-2"><Badge text={r.section || "—"} tone="slate" /></td>
                          <td className="px-4 py-2">{r.marks_obtained}/{resultsOpen.total_marks}</td>
                          <td className="px-4 py-2 font-semibold">{r.percentage}%</td>
                          <td className="px-4 py-2"><Badge text={g} tone={gradeTone(g)} /></td>
                          <td className="px-4 py-2"><Badge text={r.status} tone={r.status === "pass" ? "sage" : "coral"} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">Loading results...</div>
          )}
        </Modal>
      )}

      {/* ── Report Cards Modal ─── */}
      {reportsOpen && (
        <Modal title={`Report Cards — Grade ${reportsOpen.grade_level} (${reportsOpen.subject?.subject_name || "All Subjects"})`} onClose={() => { setReportsOpen(null); setReports(null); }} wide footer={
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {reports ? `${reports.length} report cards` : "Loading..."}
            </span>
            <button className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md" onClick={regenerateReports} disabled={regenerating}>
              {regenerating ? "Regenerating..." : "Regenerate Reports"}
            </button>
          </div>
        }>
          {reports ? (
            reports.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
                No report cards yet. Save marks and mark the exam complete to auto-generate reports.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-700/60">
                    <tr>
                      <th className="px-4 py-2">Rank</th>
                      <th className="px-4 py-2">Student</th>
                      <th className="px-4 py-2">Code</th>
                      <th className="px-4 py-2">Section</th>
                      <th className="px-4 py-2">Obtained</th>
                      <th className="px-4 py-2">%</th>
                      <th className="px-4 py-2">GPA</th>
                      <th className="px-4 py-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {[...reports]
                      .sort((a, b) => Number(b.gpa) - Number(a.gpa))
                      .map((r, idx) => {
                        const pctNum = Number(r.percentage);
                        const finalGrade = r.grade || gradeFor(pctNum);
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-2 font-bold text-indigo-600 dark:text-indigo-400">#{idx + 1}</td>
                            <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-100">{r.student?.name}</td>
                            <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{r.student?.student_id}</td>
                            <td className="px-4 py-2"><Badge text={r.student?.class?.class_name || "—"} tone="slate" /></td>
                            <td className="px-4 py-2">{r.obtained_marks}/{r.total_marks}</td>
                            <td className="px-4 py-2 font-semibold">{pctNum}%</td>
                            <td className="px-4 py-2 font-semibold">{r.gpa}</td>
                            <td className="px-4 py-2"><Badge text={finalGrade} tone={gradeTone(finalGrade)} /></td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500">Loading report cards...</div>
          )}
        </Modal>
      )}
    </PageShell>
  );
}
