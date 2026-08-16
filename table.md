# School Attendance Management System — Table Documentation

## Database: `sams`

---

## 1. `teachers` — Teacher Records

| Column       | Type            | Constraints                  | Description                     |
|--------------|-----------------|------------------------------|---------------------------------|
| id           | BIGINT UNSIGNED | PK, AUTO_INCREMENT           | Unique identifier               |
| name         | VARCHAR(255)    | NOT NULL                     | Full name                       |
| gender       | VARCHAR(50)     | NOT NULL                     | Gender                          |
| dob          | DATE            | NOT NULL                     | Date of birth                   |
| phone        | VARCHAR(50)     | NOT NULL                     | Contact number                  |
| email        | VARCHAR(255)    | NOT NULL, UNIQUE             | Email address                   |
| address      | TEXT            | NOT NULL                     | Residential address             |
| position     | VARCHAR(255)    | NOT NULL                     | Job position                    |
| salary       | DECIMAL(10,2)   | NOT NULL                     | Salary amount                   |
| hire_date    | DATE            | NOT NULL                     | Date of hiring                  |
| image        | VARCHAR(255)    | NULLABLE                     | Profile image path              |
| created_at   | TIMESTAMP       | NULLABLE                     | Record creation timestamp       |
| updated_at   | TIMESTAMP       | NULLABLE                     | Record update timestamp         |

**Relationships:**
- 1 to 0..* with `classes` (one teacher manages many classes)
- 1 to 0..* with `schedules` (one teacher has many schedule entries)

**OOAD Parent Class:** `Person`

---

## 2. `staff` — Staff Records

| Column       | Type            | Constraints                  | Description                     |
|--------------|-----------------|------------------------------|---------------------------------|
| id           | BIGINT UNSIGNED | PK, AUTO_INCREMENT           | Unique identifier               |
| name         | VARCHAR(255)    | NOT NULL                     | Full name                       |
| gender       | VARCHAR(50)     | NOT NULL                     | Gender                          |
| dob          | DATE            | NOT NULL                     | Date of birth                   |
| phone        | VARCHAR(50)     | NOT NULL                     | Contact number                  |
| email        | VARCHAR(255)    | NOT NULL, UNIQUE             | Email address                   |
| address      | TEXT            | NOT NULL                     | Residential address             |
| position     | VARCHAR(255)    | NOT NULL                     | Job position                    |
| salary       | DECIMAL(10,2)   | NOT NULL                     | Salary amount                   |
| hire_date    | DATE            | NOT NULL                     | Date of hiring                  |
| image        | VARCHAR(255)    | NULLABLE                     | Profile image path              |
| created_at   | TIMESTAMP       | NULLABLE                     | Record creation timestamp       |
| updated_at   | TIMESTAMP       | NULLABLE                     | Record update timestamp         |

**Relationships:**
- 1 to 0..* with `attendances` (one staff records many attendances)
- 1 to 0..* with `leaves` (one staff processes many leaves)

**OOAD Parent Class:** `Person`

---

## 3. `subjects` — Subject Records (Standalone)

| Column       | Type            | Constraints                  | Description                     |
|--------------|-----------------|------------------------------|---------------------------------|
| id           | BIGINT UNSIGNED | PK, AUTO_INCREMENT           | Unique identifier               |
| subject_name | VARCHAR(255)    | NOT NULL                     | Name of the subject             |
| description  | TEXT            | NULLABLE                     | Optional description            |
| created_at   | TIMESTAMP       | NULLABLE                     | Record creation timestamp       |
| updated_at   | TIMESTAMP       | NULLABLE                     | Record update timestamp         |

**Relationships:**
- 1 to 0..* with `schedules` (one subject appears in many schedules)

**OOAD Class:** Standalone peer class

---

## 4. `classes` — Class Records (Standalone)

| Column       | Type            | Constraints                  | Description                     |
|--------------|-----------------|------------------------------|---------------------------------|
| id           | BIGINT UNSIGNED | PK, AUTO_INCREMENT           | Unique identifier               |
| class_name   | VARCHAR(255)    | NOT NULL                     | Name of the class (e.g. 10-A)   |
| teacher_id   | BIGINT UNSIGNED | FK → teachers.id             | Homeroom teacher                |
| academic_year| VARCHAR(50)     | NOT NULL                     | Academic year (e.g. 2025-2026)  |
| created_at   | TIMESTAMP       | NULLABLE                     | Record creation timestamp       |
| updated_at   | TIMESTAMP       | NULLABLE                     | Record update timestamp         |

**Relationships:**
- 1 to 0..* with `students` (one class has many students)
- 1 to 0..* with `schedules` (one class has many schedules)
- * to 1 with `teachers` (many classes belong to one teacher)

**OOAD Class:** Standalone peer class

---

## 5. `students` — Student Records

| Column       | Type            | Constraints                  | Description                     |
|--------------|-----------------|------------------------------|---------------------------------|
| id           | BIGINT UNSIGNED | PK, AUTO_INCREMENT           | Unique identifier               |
| name         | VARCHAR(255)    | NOT NULL                     | Full name                       |
| gender       | VARCHAR(50)     | NOT NULL                     | Gender                          |
| dob          | DATE            | NOT NULL                     | Date of birth                   |
| phone        | VARCHAR(50)     | NOT NULL                     | Contact number                  |
| email        | VARCHAR(255)    | NOT NULL, UNIQUE             | Email address                   |
| address      | TEXT            | NOT NULL                     | Residential address             |
| class_id     | BIGINT UNSIGNED | FK → classes.id              | Enrolled class                  |
| parent_name  | VARCHAR(255)    | NOT NULL                     | Parent/guardian name            |
| parent_phone | VARCHAR(50)     | NOT NULL                     | Parent/guardian phone           |
| image        | VARCHAR(255)    | NULLABLE                     | Profile image path              |
| created_at   | TIMESTAMP       | NULLABLE                     | Record creation timestamp       |
| updated_at   | TIMESTAMP       | NULLABLE                     | Record update timestamp         |

**Relationships:**
- * to 1 with `classes` (many students belong to one class)
- 1 to 0..* with `attendances` (one student has many attendance records)
- 1 to 0..* with `leaves` (one student has many leave records)

**OOAD Parent Class:** `Person`

---

## 6. `schedules` — Schedule Records (Standalone)

| Column     | Type            | Constraints                  | Description                     |
|------------|-----------------|------------------------------|---------------------------------|
| id         | BIGINT UNSIGNED | PK, AUTO_INCREMENT           | Unique identifier               |
| class_id   | BIGINT UNSIGNED | FK → classes.id              | Class                           |
| subject_id | BIGINT UNSIGNED | FK → subjects.id             | Subject                         |
| teacher_id | BIGINT UNSIGNED | FK → teachers.id             | Teacher                         |
| day        | VARCHAR(20)     | NOT NULL                     | Day of week (e.g. Monday)       |
| time_start | TIME            | NOT NULL                     | Start time                      |
| time_end   | TIME            | NOT NULL                     | End time                        |
| created_at | TIMESTAMP       | NULLABLE                     | Record creation timestamp       |
| updated_at | TIMESTAMP       | NULLABLE                     | Record update timestamp         |

**Relationships:**
- * to 1 with `classes` (many schedules belong to one class)
- * to 1 with `subjects` (many schedules reference one subject)
- * to 1 with `teachers` (many schedules assigned to one teacher)

**OOAD Class:** Standalone peer class

---

## 7. `attendances` — Attendance Records

| Column      | Type            | Constraints                  | Description                                  |
|-------------|-----------------|------------------------------|----------------------------------------------|
| id          | BIGINT UNSIGNED | PK, AUTO_INCREMENT           | Unique identifier                            |
| student_id  | BIGINT UNSIGNED | FK → students.id             | Student attending                            |
| schedule_id | BIGINT UNSIGNED | FK → schedules.id            | Schedule entry                                |
| staff_id    | BIGINT UNSIGNED | FK → staff.id                | Staff who recorded attendance                |
| date        | DATE            | NOT NULL                     | Attendance date                              |
| status      | VARCHAR(50)     | NOT NULL                     | `present`, `absent`, `late`, `excused`       |
| created_at  | TIMESTAMP       | NULLABLE                     | Record creation timestamp                    |
| updated_at  | TIMESTAMP       | NULLABLE                     | Record update timestamp                      |

**Relationships:**
- * to 1 with `students` (many attendances belong to one student)
- * to 1 with `schedules` (many attendances reference one schedule)
- * to 1 with `staff` (many attendances recorded by one staff)

**OOAD Parent Class:** `Event`

---

## 8. `leaves` — Leave Records

| Column    | Type            | Constraints                  | Description                             |
|-----------|-----------------|------------------------------|-----------------------------------------|
| id        | BIGINT UNSIGNED | PK, AUTO_INCREMENT           | Unique identifier                       |
| student_id| BIGINT UNSIGNED | FK → students.id             | Student requesting leave                |
| staff_id  | BIGINT UNSIGNED | FK → staff.id                | Staff who processes the leave           |
| date_from | DATE            | NOT NULL                     | Leave start date                        |
| date_to   | DATE            | NOT NULL                     | Leave end date                          |
| reason    | TEXT            | NOT NULL                     | Reason for leave                        |
| status    | VARCHAR(50)     | NOT NULL                     | `pending`, `approved`, `rejected`       |
| created_at| TIMESTAMP       | NULLABLE                     | Record creation timestamp               |
| updated_at| TIMESTAMP       | NULLABLE                     | Record update timestamp                 |

**Relationships:**
- * to 1 with `students` (many leaves belong to one student)
- * to 1 with `staff` (many leaves processed by one staff)

**OOAD Parent Class:** `Event`

---

## 9. `users` — Login User Accounts

| Column           | Type            | Constraints                  | Description                                      |
|------------------|-----------------|------------------------------|--------------------------------------------------|
| id               | BIGINT UNSIGNED | PK, AUTO_INCREMENT           | Unique identifier                                |
| name             | VARCHAR(255)    | NOT NULL                     | Display name                                     |
| email            | VARCHAR(255)    | NOT NULL, UNIQUE             | Login email                                      |
| email_verified_at| TIMESTAMP       | NULLABLE                     | Email verification timestamp                     |
| password         | VARCHAR(255)    | NOT NULL                     | Hashed password                                  |
| remember_token   | VARCHAR(100)    | NULLABLE                     | "Remember me" token                              |
| role             | VARCHAR(50)     | NOT NULL, DEFAULT 'student'  | `admin`, `teacher`, `student`, `class_president` |
| student_id       | BIGINT UNSIGNED | FK → students.id, NULLABLE   | Linked student (for student/class_president)     |
| teacher_id       | BIGINT UNSIGNED | FK → teachers.id, NULLABLE   | Linked teacher (for teacher role)                |
| created_at       | TIMESTAMP       | NULLABLE                     | Record creation timestamp                        |
| updated_at       | TIMESTAMP       | NULLABLE                     | Record update timestamp                          |

**Relationships:**
- 1 to 1 with `students` (nullable — for student/class_president accounts)
- 1 to 1 with `teachers` (nullable — for teacher accounts)

---

## 10. `personal_access_tokens` — API Token Storage (Sanctum)

| Column        | Type            | Constraints                  | Description                     |
|---------------|-----------------|------------------------------|---------------------------------|
| id            | BIGINT UNSIGNED | PK, AUTO_INCREMENT           | Unique identifier               |
| tokenable_type| VARCHAR(255)    | NOT NULL                     | Model class (App\Models\User)   |
| tokenable_id  | BIGINT UNSIGNED | NOT NULL                     | ID of the owning user           |
| name          | VARCHAR(255)    | NOT NULL                     | Token name                      |
| token         | VARCHAR(64)     | NOT NULL, UNIQUE             | SHA-256 hashed token            |
| abilities     | TEXT            | NULLABLE                     | JSON array of abilities         |
| last_used_at  | TIMESTAMP       | NULLABLE                     | Last usage timestamp            |
| expires_at    | TIMESTAMP       | NULLABLE                     | Expiration timestamp            |
| created_at    | TIMESTAMP       | NULLABLE                     | Record creation timestamp       |
| updated_at    | TIMESTAMP       | NULLABLE                     | Record update timestamp         |

---

## 11. `password_reset_tokens` — Password Reset Storage

| Column     | Type            | Constraints                  | Description                     |
|------------|-----------------|------------------------------|---------------------------------|
| email      | VARCHAR(255)    | PK                           | User email                      |
| token      | VARCHAR(255)    | NOT NULL                     | Reset token                     |
| created_at | TIMESTAMP       | NULLABLE                     | Record creation timestamp       |

---

## 12. `sessions` — Session Storage

| Column       | Type            | Constraints                  | Description                     |
|--------------|-----------------|------------------------------|---------------------------------|
| id           | VARCHAR(255)    | PK                           | Session ID                      |
| user_id      | BIGINT UNSIGNED | NULLABLE, INDEX              | Authenticated user ID           |
| ip_address   | VARCHAR(45)     | NULLABLE                     | Client IP address               |
| user_agent   | TEXT            | NULLABLE                     | Browser user agent              |
| payload      | LONGTEXT        | NOT NULL                     | Session data                    |
| last_activity| INT             | NOT NULL, INDEX              | Unix timestamp of last activity |

---

## Login Endpoints

| Method | Endpoint       | Auth Required | Description                     |
|--------|---------------|---------------|---------------------------------|
| POST   | `/api/login`  | No            | Authenticate and receive token  |
| POST   | `/api/logout` | Yes (Bearer)  | Revoke current token            |
| GET    | `/api/me`     | Yes (Bearer)  | Get current user + profile      |

### Role-based Access

Requests must include `Authorization: Bearer {token}` header.

| Role            | Description                                      |
|-----------------|--------------------------------------------------|
| `admin`         | Full system access                               |
| `teacher`       | View/manage classes, schedules, attendance       |
| `class_president`| Student with elevated permissions                |
| `student`       | View own attendance and leave records            |

---

## Relationship Summary

| Relationship             | Multiplicity | Description                                   |
|--------------------------|--------------|-----------------------------------------------|
| Class → Student          | 1 to 0..*    | One class has zero or more students           |
| Teacher → Class          | 1 to 0..*    | One teacher manages zero or more classes      |
| Schedule → Class         | * to 1       | Many schedules belong to one class            |
| Schedule → Subject       | * to 1       | Many schedules reference one subject          |
| Schedule → Teacher       | * to 1       | Many schedules assigned to one teacher         |
| Student → Attendance     | 1 to 0..*    | One student has zero or more attendance records|
| Student → Leave          | 1 to 0..*    | One student has zero or more leave records    |
| Staff → Attendance       | 1 to 0..*    | One staff records zero or more attendances    |
| Staff → Leave            | 1 to 0..*    | One staff processes zero or more leaves       |

## OOAD Inheritance Mapping

| Database Table | OOAD Parent Class | Inheritance Strategy         |
|----------------|-------------------|------------------------------|
| students       | Person            | Concrete Table Inheritance   |
| teachers       | Person            | Concrete Table Inheritance   |
| staff          | Person            | Concrete Table Inheritance   |
| attendances    | Event             | Concrete Table Inheritance   |
| leaves         | Event             | Concrete Table Inheritance   |
| subjects       | —                 | Standalone Peer Class        |
| classes        | —                 | Standalone Peer Class        |
| schedules      | —                 | Standalone Peer Class        |
