# SAMS vs. High-School Attendance Spec — Gap Analysis

## TL;DR

The current system already implements **~70% of Phase 1** and roughly **25% of Phase 2**. The three most consequential gaps are not missing features but **architecture**:

1. **No authorization enforcement** — every authenticated user (including students) can hit every endpoint and do everything: approve/reject leaves, delete students, import data, etc. Role checks exist only as unused `User::isAdmin()` helpers.
2. **No parent role / accounts** — the entire parent side of the spec is absent.
3. **No notification / audit / config infrastructure** — most Phase 2/3 features depend on these.

---

## 1. What already exists (mapped to spec)

| Spec item | Status |
|---|---|
| **Auth** (login/logout/me, Sanctum tokens) | ✅ Done |
| **Roles** admin / teacher / student / class_president | ⚠️ Role *field* only — no enforcement |
| **Admin dashboard** — counts, today summary, 30-day trend, by class/dept, alerts, today's timetable, recent activity | ✅ Rich (`DashboardController@index` + `Dashboard.jsx`) |
| **Student management** — CRUD, search, filters, import/export, profile w/ attendance stats | ✅ Done (incl. parent_name/parent_phone) |
| **Teacher management** — CRUD, subjects/classes assignment, teaching stats, weekly timetable | ✅ Done |
| **Staff management** — CRUD, leave/attendance tracking | ✅ Done (extra vs. spec) |
| **Subject/Course management** — code, credits, dept, semester, year, teachers | ✅ Done |
| **Class management** — homeroom teacher, room, courses, roster, schedule view | ✅ Done |
| **Timetable** — schedules w/ day/time/room/recurrence, weekly grid, **conflict detection** | ✅ Done |
| **Period attendance** (student→class→subject→period→teacher) | ✅ Done via `schedule_id` on attendance |
| **Take attendance** — bulk mark-all-present/absent, per-student statuses | ✅ Done (`MarkAttendance.jsx`) |
| **Statuses present/absent/late/excused** | ⚠️ 4 of 6 spec statuses (missing `leave`, `sick`) |
| **Attendance history + filters + export** | ✅ Done |
| **Student attendance % + per-course breakdown** | ✅ Done (`show` + reports) |
| **Leave requests w/ approve/reject** | ⚠️ Partially — endpoints exist but any role can approve |
| **Basic + advanced reports** (class/course/dept, trends, low-attendance) | ✅ Done |
| **Warnings** (at-risk/critical thresholds) | ⚠️ Computed only; not persisted/configurable |
| **Import** students/teachers/staff/subjects/classes (CSV/XLSX) | ✅ Done (hand-rolled parser) |
| **Export** | ⚠️ CSV only — no Excel/PDF |

---

## 2. Gaps by spec section

### 🔴 Critical (security/architecture — do first)

| Spec # | Requirement | Gap |
|---|---|---|
| 15, 25 | **RBAC + permissions** | No middleware, policies, gates, or `authorize()` calls anywhere. A student token can `DELETE /api/students`, approve leaves, import data. Frontend has no route guards either. |
| 26 | Password reset, change password, failed-login tracking | No endpoints. Login isn't rate-limited. |
| 1, 16 | **Parent role + parent accounts** | `parent` role doesn't exist; no parent_user/parent_student relationship; parent_name/phone is just a string on students. |
| 7 | Academic year / semester / term as managed entities | Only free-text `academic_year`/`semester` string columns. No start/end dates, holidays, school days, term model. |
| 31 | Backup & restore | Nothing. |
| 27 | Audit log | Nothing — no `created_by`/`updated_by`, no activity table, no observer. |

### 🟠 High (Phase 2 core)

| Spec # | Requirement | Gap |
|---|---|---|
| 7 | Attendance locking | No lock after submission; anyone can edit any record anytime. |
| 19 | Attendance corrections | No separate correction workflow with approval. |
| 10 | Late management | No `minutes_late`, arrival time, reason, warning level. `late` is just a status string. |
| 11 | Absence management | No reason/approved-unapproved/categories. |
| 12 | Leave request workflow | No student/parent→teacher approval chain (only admin-driven approve/reject). No attachment, approved-by, comments. |
| 13, 23 | **Parent notifications** | No notification system at all (no `notifications` table, no mailables). |
| 14 | Warning thresholds configurable | Thresholds (`75/80/70`) hardcoded in `ReportController` and `DashboardController`. |
| 18 | Excel/PDF export | CSV only. No maatwebsite/excel, no PDF. |
| 24 | School calendar | No events/exams/holidays table — `holidays`/`exams_today` are hardcoded empty arrays in dashboard. |
| 25 | Announcements | Nothing. |

### 🟡 Medium (Phase 3 + polish)

| Spec # | Requirement | Gap |
|---|---|---|
| 20 | QR code attendance | Nothing. |
| 21 | Student ID/barcode/NFC | Nothing. |
| 29 | Mobile-responsive teacher attendance | Pages are responsive, but the **sidebar is fixed `w-64` with no drawer** — unusable on phones. |
| 30 | School configuration (name, logo, rules, periods) | Nothing persists settings; all hardcoded. |
| 33 | Useful HS features: transfer, promotion, dropout, event attendance | Statuses exist (`graduated`, `suspended`, `transferred`) but no workflows. No event attendance. |
| 17, 19 | Teacher report, missing-attendance report | Dashboard has "teachers without submission" alert but no full teacher report. |
| — | Print buttons | Only CSVs; no print-friendly report view. |
| — | "Attendance analytics" best/lowest classes, most absent/late students | Partially in reports; some (most absent/late students) missing. |

---

## 3. Recommended roadmap

**Sprint 1 — Secure the foundation (P0, ~few days)**
1. Role middleware + policies (or `authorize` in controllers) — Admin full, Teacher only their classes/schedules, Student own attendance, Class President limited.
2. Frontend route guards + role-filtered sidebar.
3. Parent role + user accounts + `student ↔ parent` relation.
4. Failed-login throttling + password change/reset endpoints.

**Sprint 2 — Parent experience (highest spec value)**
5. Parent dashboard (children, today's attendance, %, notifications).
6. In-app notifications: `notifications` table + notification center page (later plug email/SMS/Telegram).
7. Notify parents on absent/late via observers.

**Sprint 3 — Admin school-management depth**
8. Academic years/semesters/terms models + holidays + school days.
9. Attendance settings (late threshold, warning thresholds, working days, period times) persisted in a `settings` table.
10. Attendance locking + corrections workflow.
11. Leave request workflow (student/parent → teacher/homeroom approve/reject).
12. Absence & late modules (reasons, minutes late, categories, warning levels).

**Sprint 4 — Reporting & ops**
13. Excel export + PDF (maatwebsite/excel, laravel-dompdf).
14. Audit log table + middleware/observer recording.
15. Calendar + announcements.
16. Backup (spatie/laravel-backup + schedule).

**Sprint 5 — Advanced (optional)**
17. Mobile drawer sidebar, QR attendance, student ID/barcode, analytics upgrades, event attendance.
