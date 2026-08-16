# SAMS — School Attendance Management System

A full-stack School Attendance Management System built with **Laravel** (backend API) and **React + Vite + Tailwind CSS v4** (frontend), connected to **MySQL**.

---

## Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Backend    | Laravel 13, PHP 8.3, Sanctum Auth  |
| Frontend   | React 19, Vite 8, Tailwind CSS v4  |
| Database   | MySQL 8                            |
| Auth       | Token-based (Sanctum Bearer tokens) |

---

## Features

- **Role-based authentication** — Admin, Teacher, Student, Class President
- **Student management** — CRUD with class assignment, filters, import/export
- **Teacher management** — CRUD with department, position, assigned subjects/classes, status, filters, import/export
- **Course management** — CRUD with course code, credits, department, semester, academic year, status, assigned teachers, filters, import/export
- **Staff management** — CRUD with position, salary, attendance/leave tracking, filters, import/export
- **Subject management** — CRUD
- **Class management** — CRUD with department, semester, room, homeroom teacher, assigned courses, student roster, schedule view, filters, import/export
- **Timetable / Schedule management** — CRUD with room + recurrence, weekly grid view, teacher/class/room conflict detection
- **Attendance tracking** — Mark present/absent/late/excused per student per schedule (bulk + individual), filters, export
- **Attendance reports** — Student, class, course, and department reports with trends and low-attendance alerts
- **Leave management** — Submit, approve/reject, and track leave requests with filters and export
- **Dashboard** — Overview counts for all entities

---

## Getting Started

### Prerequisites

- PHP 8.1+
- Composer
- Node.js 20+
- MySQL 8

### 1. Clone & Install

```bash
# Backend
cd backend-laravel
composer install
cp .env.example .env   # already done if using this repo
php artisan key:generate

# Frontend
cd ../fontend-react
npm install
```

### 2. Configure Database

Edit `backend-laravel/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sams
DB_USERNAME=root
DB_PASSWORD=your_password
```

Then create the database and run migrations:

```bash
mysql -u root -p -e "CREATE DATABASE sams CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cd backend-laravel
php artisan migrate:fresh --seed
```

### 3. Run

```bash
# Terminal 1 — Laravel API
cd backend-laravel
php artisan serve              # http://localhost:8000

# Terminal 2 — React frontend
cd fontend-react
npm run dev                    # http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to `localhost:8000`.

---

## Demo Accounts

After running `php artisan db:seed`, these accounts are available:

| Role             | Email                     | Password      |
|------------------|---------------------------|---------------|
| **Admin**        | admin@school.edu          | admin123      |
| **Teacher**      | teacher@school.edu        | teacher123    |
| **Class President** | student1@school.edu    | student123    |
| **Student**      | student2@school.edu       | student123    |
| **Student**      | student3@school.edu       | student123    |
| **Student**      | student4@school.edu       | student123    |
| **Student**      | student5@school.edu       | student123    |

---

## API Endpoints

All endpoints (except `/api/login`) require `Authorization: Bearer {token}` header.

### Auth

| Method | Endpoint       | Description                     |
|--------|----------------|---------------------------------|
| POST   | `/api/login`   | Get token (no auth required)    |
| POST   | `/api/logout`  | Revoke token                    |
| GET    | `/api/me`      | Current user + profile          |
| GET    | `/api/dashboard` | Aggregated dashboard stats (counts, today's summary, 30-day trend, monthly rates, breakdowns by class/subject/department, top performers, alerts, today's schedule, recent records, period reports) |

> **Note:** "Departments" are derived from the `department` field on the students table (e.g. Science, Social Science, Languages).

### CRUD Resources

Each resource exposes standard RESTful routes:

| Method   | Endpoint                     | Action       |
|----------|------------------------------|--------------|
| GET      | `/api/{resource}`            | List all     |
| POST     | `/api/{resource}`            | Create       |
| GET      | `/api/{resource}/{id}`       | Show one     |
| PUT/PATCH| `/api/{resource}/{id}`       | Update       |
| DELETE   | `/api/{resource}/{id}`       | Delete       |

**Resources:** `students`, `teachers`, `staff`, `subjects`, `classes`, `schedules`, `attendances`, `leaves`

**Students & Teachers also expose:**

| Method   | Endpoint                    | Action                                   |
|----------|-----------------------------|------------------------------------------|
| GET      | `/api/students/filters`     | Filter dropdown options                  |
| GET      | `/api/students/export`      | Export filtered rows to CSV              |
| POST     | `/api/students/import`      | Import students from CSV/XLSX            |
| GET      | `/api/teachers/filters`     | Filter dropdown options (incl. subjects/classes) |
| GET      | `/api/teachers/export`      | Export filtered teachers to CSV          |
| POST     | `/api/teachers/import`      | Import teachers from CSV/XLSX            |
| GET      | `/api/subjects/filters`     | Filter dropdown options (incl. teachers) |
| GET      | `/api/subjects/export`      | Export filtered courses to CSV           |
| POST     | `/api/subjects/import`      | Import courses from CSV/XLSX             |
| GET      | `/api/classes/filters`      | Filter dropdown options (incl. teachers/courses) |
| GET      | `/api/classes/export`       | Export filtered classes to CSV           |
| POST     | `/api/classes/import`       | Import classes from CSV/XLSX             |
| GET      | `/api/schedules/filters`    | Filter dropdown options (days, rooms, etc.) |
| GET      | `/api/schedules/conflicts`  | Preview teacher/class/room time conflicts |
| GET      | `/api/schedules/export`     | Export filtered timetable to CSV         |
| GET      | `/api/staff/filters`        | Filter dropdown options (positions, genders) |
| GET      | `/api/staff/export`         | Export filtered staff to CSV             |
| POST     | `/api/staff/import`         | Import staff from CSV/XLSX               |
| GET      | `/api/leaves/filters`       | Filter dropdown options (statuses, students, staff) |
| GET      | `/api/leaves/export`        | Export filtered leave requests to CSV    |
| POST     | `/api/leaves/{leave}/approve` | Approve a pending leave request        |
| POST     | `/api/leaves/{leave}/reject`  | Reject a pending leave request         |
| GET      | `/api/attendances/filters`  | Filter dropdown options (statuses, students, staff, classes, schedules) |
| GET      | `/api/attendances/export`   | Export filtered attendance records to CSV |
| POST     | `/api/attendances/bulk`     | Bulk record/update attendance for a schedule |
| GET      | `/api/reports/attendance`   | Attendance summary: by class/course/department, 30-day trend, low-attendance list (filters: `class_id`, `department`, `date_from`, `date_to`, `threshold`) |
| GET      | `/api/reports/attendance/student` | Per-course attendance breakdown for one student (`student_id` required) |
| GET      | `/api/reports/attendance/filters` | Report dropdown options (classes, departments, students) |

> **Conflict detection:** `store`/`update` on `/api/schedules` are rejected with HTTP 422 if the new slot overlaps an existing one for the same **teacher**, **class**, or **room** on the same day (self is excluded when updating). Use `GET /api/schedules/conflicts` to preview conflicts live in the form.

- **Import** accepts `.csv` or `.xlsx`; requires `name` + `email` for people, `course name` for courses, `class name` for classes. Teacher rows may include `courses`/`subjects` and `classes` columns (semicolon- or comma-separated names/IDs) to auto-assign pivots; course rows may include a `teachers` column; class rows may include `teacher` (by name) and `courses` columns. Staff rows require `name` + `email` (position, salary, hire date optional).
- **Export** honors the same query filters as the list endpoint.
- **Leaves** are created with `status=pending`; admin approves or rejects via the dedicated endpoints (or by updating `status` directly).

---

## Database Schema

See [`sql.sql`](./sql.sql) for the full SQL schema and [`table.md`](./table.md) for detailed table documentation.

8 tables + 3 Laravel system tables:

| # | Table                    | OOAD Parent | Description               |
|---|--------------------------|-------------|---------------------------|
| 1 | `teachers`               | Person      | Teacher profiles          |
| 2 | `staff`                  | Person      | Staff profiles            |
| 3 | `subjects`               | —           | Courses (course code, credits, department, semester, academic year, status) |
| 4 | `classes`                | —           | Classes (name/code, department, semester, room) |
| 5 | `students`               | Person      | Student profiles          |
| 6 | `schedules`              | —           | Weekly timetable (day, time, room, recurrence) |
| 7 | `attendances`            | Event       | Attendance records        |
| 8 | `leaves`                 | Event       | Leave requests            |
| 9 | `teacher_subject`        | —           | Pivot: teachers ↔ subjects |
| 10 | `teacher_class`          | —           | Pivot: teachers ↔ classes  |
| 11 | `class_subject`          | —           | Pivot: classes ↔ courses   |
| 12 | `users`                  | —           | Login accounts + roles    |
| — | `personal_access_tokens` | —           | Sanctum API tokens        |
| — | `password_reset_tokens`  | —           | Password resets           |
| — | `sessions`               | —           | Session storage           |

---

## OOAD Class Design

```
Person (abstract)
├── Student     → table: students     (class_id, parent_name, parent_phone, image)
├── Teacher     → table: teachers     (department, position, salary, hire_date, status, teacher_id, image)
└── Staff       → table: staff        (position, salary, hire_date, image)

Event (abstract)
├── Attendance  → table: attendances  (student_id, schedule_id, status)
└── Leave       → table: leaves       (student_id, date_from, date_to, reason, status)

Standalone:
  Subject (Course) → table: subjects     (course_code, subject_name, credits, description, department, semester, academic_year, status)
  SchoolClass   → table: classes      (class_name, teacher_id, department, academic_year, semester, room)
  Schedule      → table: schedules    (class_id, subject_id, teacher_id, day, time_start, time_end, room, recurrence)

Associations (many-to-many):
  Teacher ↔ Subject  → table: teacher_subject  (teacher_id, subject_id)  # teachers teach courses
  Teacher ↔ Class    → table: teacher_class    (teacher_id, class_id)    # teachers supervise classes
  Class    ↔ Subject  → table: class_subject    (class_id, subject_id)    # courses per class
```

---

## Seeded Data

Running `php artisan db:seed` inserts:

- **7 teachers** (1 Head Teacher + 6 across Mathematics, Science, Languages, Social Science)
- **1 staff** (Sreyneang Chen)
- **8 courses** (Mathematics, Khmer Literature, English, Physics, Chemistry, History, Geography, Computer Science — with codes, credits, departments, semesters, years, statuses)
- **3 classes** (10-A, 10-B, 11-A — with department, semester, room, assigned courses)
- **78 students** (50 male, 28 female — Khmer names)
- **15 schedules** (5 days × 3 classes — 2h blocks, rooms, weekly recurring)
- **~52 attendances** & **~16 leaves**
- **7 user accounts** (1 admin, 1 teacher, 5 students)
