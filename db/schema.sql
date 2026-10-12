-- Student Skill and Certificate Management System
-- Database schema (7 tables). Run automatically by the app, or manually in MySQL Workbench.

CREATE DATABASE IF NOT EXISTS skillcert_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillcert_db;

-- 1. Department
CREATE TABLE IF NOT EXISTS department (
  department_id   INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(100) NOT NULL,
  CONSTRAINT uq_department_name UNIQUE (department_name)
);

-- 2. Student
CREATE TABLE IF NOT EXISTS student (
  student_id    INT AUTO_INCREMENT PRIMARY KEY,
  student_name  VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL,
  phone         VARCHAR(16)  NULL,
  `year`        TINYINT      NOT NULL,
  department_id INT          NOT NULL,
  CONSTRAINT uq_student_email UNIQUE (email),
  CONSTRAINT chk_student_year CHECK (`year` BETWEEN 1 AND 6),
  CONSTRAINT fk_student_department FOREIGN KEY (department_id)
    REFERENCES department (department_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 3. Skill
CREATE TABLE IF NOT EXISTS skill (
  skill_id       INT AUTO_INCREMENT PRIMARY KEY,
  skill_name     VARCHAR(100) NOT NULL,
  skill_category ENUM('Technical', 'Non-Technical') NOT NULL,
  CONSTRAINT uq_skill_name UNIQUE (skill_name)
);

-- 4. Student_Skill (composite primary key)
CREATE TABLE IF NOT EXISTS student_skill (
  student_id        INT NOT NULL,
  skill_id          INT NOT NULL,
  proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') NOT NULL,
  PRIMARY KEY (student_id, skill_id),
  CONSTRAINT fk_ss_student FOREIGN KEY (student_id)
    REFERENCES student (student_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ss_skill FOREIGN KEY (skill_id)
    REFERENCES skill (skill_id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 5. Course
CREATE TABLE IF NOT EXISTS course (
  course_id   INT AUTO_INCREMENT PRIMARY KEY,
  course_name VARCHAR(150) NOT NULL,
  duration    VARCHAR(50)  NOT NULL,
  platform    VARCHAR(100) NOT NULL
);

-- 6. Certificate
CREATE TABLE IF NOT EXISTS certificate (
  certificate_id       INT AUTO_INCREMENT PRIMARY KEY,
  certificate_name     VARCHAR(150) NOT NULL,
  issuing_organization VARCHAR(150) NOT NULL,
  validity             VARCHAR(50)  NOT NULL,
  course_id            INT NULL,
  CONSTRAINT fk_certificate_course FOREIGN KEY (course_id)
    REFERENCES course (course_id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 7. Student_Certificate (composite primary key)
CREATE TABLE IF NOT EXISTS student_certificate (
  student_id     INT NOT NULL,
  certificate_id INT NOT NULL,
  credential_id  VARCHAR(100) NOT NULL,
  issue_date     DATE NOT NULL,
  expiry_date    DATE NULL,
  PRIMARY KEY (student_id, certificate_id),
  CONSTRAINT uq_credential_id UNIQUE (credential_id),
  CONSTRAINT chk_sc_dates CHECK (expiry_date IS NULL OR expiry_date >= issue_date),
  CONSTRAINT fk_sc_student FOREIGN KEY (student_id)
    REFERENCES student (student_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sc_certificate FOREIGN KEY (certificate_id)
    REFERENCES certificate (certificate_id) ON UPDATE CASCADE ON DELETE CASCADE
);
