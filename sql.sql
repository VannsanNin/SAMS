-- ============================================
-- School Attendance Management System (SAMS)
-- MySQL Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS sams
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sams;

-- --------------------------------------------
-- 1. teachers
-- Parent class: Person (concrete table)
-- Fields inherited: id, name, gender, dob, phone, email, address
-- Own fields: position, salary, hire_date, image
-- --------------------------------------------
CREATE TABLE teachers (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  gender     VARCHAR(50)  NOT NULL,
  dob        DATE         NOT NULL,
  phone      VARCHAR(50)  NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  address    TEXT         NOT NULL,
  position   VARCHAR(255) NOT NULL,
  salary     DECIMAL(10,2) NOT NULL,
  hire_date  DATE         NOT NULL,
  image      VARCHAR(255) NULL,
  created_at TIMESTAMP    NULL DEFAULT NULL,
  updated_at TIMESTAMP    NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 2. staff
-- Parent class: Person (concrete table)
-- Fields inherited: id, name, gender, dob, phone, email, address
-- Own fields: position, salary, hire_date, image
-- --------------------------------------------
CREATE TABLE staff (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  gender     VARCHAR(50)  NOT NULL,
  dob        DATE         NOT NULL,
  phone      VARCHAR(50)  NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  address    TEXT         NOT NULL,
  position   VARCHAR(255) NOT NULL,
  salary     DECIMAL(10,2) NOT NULL,
  hire_date  DATE         NOT NULL,
  image      VARCHAR(255) NULL,
  created_at TIMESTAMP    NULL DEFAULT NULL,
  updated_at TIMESTAMP    NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 3. subjects
-- Standalone class
-- --------------------------------------------
CREATE TABLE subjects (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_name VARCHAR(255) NOT NULL,
  description  TEXT         NULL,
  created_at   TIMESTAMP    NULL DEFAULT NULL,
  updated_at   TIMESTAMP    NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 4. classes
-- Standalone class (related to Teacher, Student, Schedule)
-- FK: teacher_id → teachers.id
-- --------------------------------------------
CREATE TABLE classes (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  class_name    VARCHAR(255) NOT NULL,
  teacher_id    BIGINT UNSIGNED NOT NULL,
  academic_year VARCHAR(50)  NOT NULL,
  created_at    TIMESTAMP    NULL DEFAULT NULL,
  updated_at    TIMESTAMP    NULL DEFAULT NULL,

  CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 5. students
-- Parent class: Person (concrete table)
-- Fields inherited: id, name, gender, dob, phone, email, address
-- Own fields: class_id, parent_name, parent_phone, image
-- FK: class_id → classes.id
-- --------------------------------------------
CREATE TABLE students (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  gender       VARCHAR(50)  NOT NULL,
  dob          DATE         NOT NULL,
  phone        VARCHAR(50)  NOT NULL,
  email        VARCHAR(255) NOT NULL UNIQUE,
  address      TEXT         NOT NULL,
  class_id     BIGINT UNSIGNED NOT NULL,
  parent_name  VARCHAR(255) NOT NULL,
  parent_phone VARCHAR(50)  NOT NULL,
  image        VARCHAR(255) NULL,
  created_at   TIMESTAMP    NULL DEFAULT NULL,
  updated_at   TIMESTAMP    NULL DEFAULT NULL,

  CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 6. schedules
-- Standalone class (related to Class, Subject, Teacher)
-- FK: class_id → classes.id
-- FK: subject_id → subjects.id
-- FK: teacher_id → teachers.id
-- --------------------------------------------
CREATE TABLE schedules (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  class_id   BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NOT NULL,
  day        VARCHAR(20)  NOT NULL,
  time_start TIME         NOT NULL,
  time_end   TIME         NOT NULL,
  created_at TIMESTAMP    NULL DEFAULT NULL,
  updated_at TIMESTAMP    NULL DEFAULT NULL,

  CONSTRAINT fk_schedules_class   FOREIGN KEY (class_id)   REFERENCES classes(id)   ON DELETE CASCADE,
  CONSTRAINT fk_schedules_subject FOREIGN KEY (subject_id) REFERENCES subjects(id)  ON DELETE CASCADE,
  CONSTRAINT fk_schedules_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 7. attendances
-- Parent class: Event (concrete table)
-- Fields inherited: id, staff_id, date
-- Own fields: student_id, schedule_id, status
-- FK: student_id → students.id
-- FK: schedule_id → schedules.id
-- FK: staff_id → staff.id
-- --------------------------------------------
CREATE TABLE attendances (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id  BIGINT UNSIGNED NOT NULL,
  schedule_id BIGINT UNSIGNED NOT NULL,
  staff_id    BIGINT UNSIGNED NOT NULL,
  date        DATE         NOT NULL,
  status      VARCHAR(50)  NOT NULL COMMENT 'present, absent, late, excused',
  created_at  TIMESTAMP    NULL DEFAULT NULL,
  updated_at  TIMESTAMP    NULL DEFAULT NULL,

  CONSTRAINT fk_attendance_student   FOREIGN KEY (student_id)  REFERENCES students(id)  ON DELETE CASCADE,
  CONSTRAINT fk_attendance_schedule  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_staff     FOREIGN KEY (staff_id)    REFERENCES staff(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 8. leaves
-- Parent class: Event (concrete table)
-- Fields inherited: id, staff_id, date
-- Own fields: student_id, date_from, date_to, reason, status
-- FK: student_id → students.id
-- FK: staff_id → staff.id
-- --------------------------------------------
CREATE TABLE leaves (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  staff_id   BIGINT UNSIGNED NOT NULL,
  date_from  DATE         NOT NULL,
  date_to    DATE         NOT NULL,
  reason     TEXT         NOT NULL,
  status     VARCHAR(50)  NOT NULL COMMENT 'pending, approved, rejected',
  created_at TIMESTAMP    NULL DEFAULT NULL,
  updated_at TIMESTAMP    NULL DEFAULT NULL,

  CONSTRAINT fk_leave_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_staff   FOREIGN KEY (staff_id)   REFERENCES staff(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 9. users
-- Stores login credentials for all roles
-- FK: student_id → students.id (nullable for admin/teacher)
-- FK: teacher_id → teachers.id (nullable for admin/student)
-- --------------------------------------------
CREATE TABLE users (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  email             VARCHAR(255) NOT NULL UNIQUE,
  email_verified_at TIMESTAMP    NULL DEFAULT NULL,
  password          VARCHAR(255) NOT NULL,
  remember_token    VARCHAR(100) NULL,
  role              VARCHAR(50)  NOT NULL DEFAULT 'student' COMMENT 'admin, teacher, student, class_president',
  student_id        BIGINT UNSIGNED NULL,
  teacher_id        BIGINT UNSIGNED NULL,
  created_at        TIMESTAMP    NULL DEFAULT NULL,
  updated_at        TIMESTAMP    NULL DEFAULT NULL,

  CONSTRAINT fk_users_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  CONSTRAINT fk_users_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE personal_access_tokens (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tokenable_type VARCHAR(255) NOT NULL,
  tokenable_id   BIGINT UNSIGNED NOT NULL,
  name           VARCHAR(255) NOT NULL,
  token          VARCHAR(64) NOT NULL UNIQUE,
  abilities      TEXT NULL,
  last_used_at   TIMESTAMP NULL DEFAULT NULL,
  expires_at     TIMESTAMP NULL DEFAULT NULL,
  created_at     TIMESTAMP NULL DEFAULT NULL,
  updated_at     TIMESTAMP NULL DEFAULT NULL,

  INDEX fk_personal_access_tokens_tokenable_idx (tokenable_type, tokenable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
  email      VARCHAR(255) PRIMARY KEY,
  token      VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
  id            VARCHAR(255) PRIMARY KEY,
  user_id       BIGINT UNSIGNED NULL,
  ip_address    VARCHAR(45) NULL,
  user_agent    TEXT NULL,
  payload       LONGTEXT NOT NULL,
  last_activity INT NOT NULL,

  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
