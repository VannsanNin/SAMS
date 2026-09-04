# SAMS — School Attendance Management System

[![Laravel](https://img.shields.io/badge/Backend-Laravel%2013-FF2D20?style=for-the-badge&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Database](https://img.shields.io/badge/Database-MySQL%208-4479A1?style=for-the-badge&logo=mysql)](https://mysql.com)
[![Design System](https://img.shields.io/badge/UI%20System-Impeccable%20Design-6366F1?style=for-the-badge)](#impeccable-design-system)

A full-stack, enterprise-grade **School Attendance Management System (SAMS)** tailored for Cambodian primary and secondary schools (Grade 1 to Grade 12). Built with a **Laravel 13 REST API** backend, **React 19 + Vite 8** frontend, and styled using the **Impeccable Design System**.

---

## 🎨 Impeccable Design System

SAMS features an updated modern visual aesthetic adhering to the **Impeccable Design System** standards:

- **Typography**: Google Fonts integration using **Plus Jakarta Sans** for display headers, **Inter** for readable body UI, and **JetBrains Mono** for numerical IDs and timestamps.
- **Glassmorphic Interfaces**: Ambient dark slate gradients, high-contrast surface panels (`.impeccable-card`), rounded-2xl containers, and frosted-glass top headers (`.impeccable-glass`).
- **Role-Aware Dashboards**: Tailored views for **Admin**, **Teacher**, **Student**, and **Parent** with dynamic Recharts color palettes (emerald, indigo, amber, red).
- **Interactive Operational Views**: Bulk roster attendance marking with live statistics chips, filter toolbars, and instant quick-fill demo sign-in buttons.

---

## 🛠️ Tech Stack

| Layer      | Technology                                    | Description |
|------------|-----------------------------------------------|-------------|
| **Backend** | Laravel 13 (PHP 8.3)                         | RESTful API & business logic layer |
| **Authentication** | Laravel Sanctum                       | Bearer token-based stateless API authentication |
| **Frontend** | React 19 + Vite 8                            | Ultra-fast Single Page Application (SPA) |
| **Styling**  | Tailwind CSS v4                              | Modern utility styling & custom CSS tokens |
| **Charts**   | Recharts                                     | Dynamic interactive grade & attendance visualizations |
| **Database** | MySQL 8 (utf8mb4_unicode_ci)                 | Relational data storage |

---

## ✨ Features

### 🔑 Authentication & Roles
- **Role-Based Access Control (RBAC)** — Dedicated experiences and permissions for **Admin**, **Teacher**, **Student**, **Class President**, and **Parent**.
- **Glassmorphic Login** — Quick-fill demo account selector for instant role testing.

### 📊 Dashboards & Analytics
- **Admin Dashboard**: System-wide KPIs, overall attendance trends, departmental score distributions, and quick management links.
- **Teacher Dashboard**: Today's class schedules, quick roster marking actions, subject grade statistics, and student attendance alerts.
- **Student Dashboard**: Grade trend graphs, subject performance breakdowns, attendance percentages, upcoming assignments, and timetable view.

### 📋 School Management & Operations
- **Student Directory**: Complete student lifecycle management, filtering by grade/status, search, CSV import/export, and modal profiles.
- **Teacher Directory**: Faculty directory, department management, subject & homeroom class assignments, and workload tracking.
- **Class & Timetable Management**: Section allocations, room assignments, weekly grid views, and live **conflict detection** (teacher, class, or room double-booking prevention).
- **Attendance & Leave Management**: Bulk daily roster attendance marking, interactive status toggles (*Present*, *Late*, *Absent*), leave request workflows with admin approval/rejection.
- **Reports & Audit Logs**: Historical attendance logs, course summary breakdowns, low-attendance threshold warnings, and CSV data export.

---

## 🚀 Getting Started

### Prerequisites

- **PHP**: `^8.1` or higher
- **Composer**: `^2.0`
- **Node.js**: `^20.0` or higher
- **MySQL**: `^8.0`

---

### 1. Clone & Dependencies

```bash
# Clone the repository
git clone https://github.com/VannsanNin/SAMS.git
cd SAMS

# Install Backend Dependencies
cd backend-laravel
composer install
cp .env.example .env
php artisan key:generate

# Install Frontend Dependencies
cd ../fontend-react
npm install
```

---

### 2. Configure Database

Edit `backend-laravel/.env` with your local MySQL credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sams
DB_USERNAME=root
DB_PASSWORD=your_password
```

Create the database and run migrations with sample seed data:

```bash
# Create Database
mysql -u root -p -e "CREATE DATABASE sams CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run Migrations & Seed
cd backend-laravel
php artisan migrate:fresh --seed
```

---

### 3. Running Locally

Start both the backend API server and frontend development server:

```bash
# Terminal 1 — Laravel API Backend (http://localhost:8000)
cd backend-laravel
php artisan serve

# Terminal 2 — React Vite Frontend (http://localhost:5173)
cd fontend-react
npm run dev
```

> **Note**: Vite's development server automatically proxies requests from `/api/*` to `http://localhost:8000`.

---

## 👥 Demo Accounts

After running `php artisan db:seed`, the following test accounts are pre-configured:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@school.edu` | `admin123` | Full system control & settings |
| **Teacher** | `teacher@school.edu` | `teacher123` | Class management & attendance marking |
| **Student (Class Pres.)** | `student1@school.edu` | `student123` | Student dashboard & class roster helper |
| **Student** | `student2@school.edu` | `student123` | Student portal & timetable view |
| **Student** | `student3@school.edu` | `student123` | Student portal |
| **Parent** | `parent1@school.edu` | `parent123` | Student progress monitoring |

---

## 📡 API Overview

All API endpoints (except `/api/login`) require an `Authorization: Bearer {token}` HTTP header.

### Core Endpoints

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Auth** | `POST` | `/api/login` | Authenticate user & obtain Sanctum Bearer token |
| | `POST` | `/api/logout` | Revoke active token |
| | `GET` | `/api/me` | Fetch authenticated user profile & permissions |
| **Dashboard**| `GET` | `/api/dashboard` | Aggregated statistical counters, charts, & trend metrics |
| **Resources**| `GET`, `POST`, `PUT`, `DELETE` | `/api/students` | Manage student records |
| | `GET`, `POST`, `PUT`, `DELETE` | `/api/teachers` | Manage faculty members |
| | `GET`, `POST`, `PUT`, `DELETE` | `/api/classes` | Manage class sections & assigned courses |
| | `GET`, `POST`, `PUT`, `DELETE` | `/api/schedules` | Manage weekly schedules with conflict checks |
| | `GET`, `POST` | `/api/attendances` | Fetch records & bulk mark attendance roster |
| | `GET`, `POST` | `/api/leaves` | Submit and approve/reject student/staff leave requests |
| **Reports** | `GET` | `/api/reports/attendance` | Attendance summaries by class, course, and department |

---

## 🗄️ Database Architecture & OOAD Design

```
Person (Abstract)
├── Student     → Table: `students`     (class_id, parent_name, parent_phone, image)
├── Teacher     → Table: `teachers`     (department, position, salary, hire_date, status)
└── Staff       → Table: `staff`        (position, salary, hire_date, image)

Event (Abstract)
├── Attendance  → Table: `attendances`  (student_id, schedule_id, status)
└── Leave       → Table: `leaves`       (student_id, date_from, date_to, reason, status)

Core Domain Models:
├── Subject     → Table: `subjects`     (course_code, subject_name, credits, department)
├── Class       → Table: `classes`      (class_name, teacher_id, department, room)
└── Schedule    → Table: `schedules`    (class_id, subject_id, teacher_id, day, time_start, time_end)
```

---

## 🔒 Production Readiness Checklist

Before going live:
1. **Environment Setup**: Set `APP_ENV=production`, `APP_DEBUG=false`, and configure a valid `APP_URL` with HTTPS.
2. **Timezone**: Ensure `APP_TIMEZONE=Asia/Phnom_Penh` is configured in `config/app.php`.
3. **Database Backups**: Use `php artisan sams:backup` to trigger automated, timestamped database backups stored securely in `storage/app/private/backups`.
4. **Security**: Update default seed password credentials and enforce Sanctum token rotation.

---

## 📜 License

This project is open-source software licensed under the [MIT License](LICENSE).
