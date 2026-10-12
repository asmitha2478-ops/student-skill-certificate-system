-- Sample data (inserted only when the department table is empty)
USE skillcert_db;

INSERT INTO department (department_id, department_name) VALUES
  (1, 'Computer Science'),
  (2, 'Information Technology'),
  (3, 'Electronics and Communication'),
  (4, 'Mechanical Engineering');

INSERT INTO student (student_id, student_name, email, phone, `year`, department_id) VALUES
  (1, 'Aarav Sharma', 'aarav.sharma@example.com', '9876543210', 3, 1),
  (2, 'Diya Patel',   'diya.patel@example.com',   '9876501234', 2, 1),
  (3, 'Rohan Mehta',  'rohan.mehta@example.com',  '9123456780', 4, 2),
  (4, 'Sneha Iyer',   'sneha.iyer@example.com',   '9988776655', 1, 2),
  (5, 'Kabir Singh',  'kabir.singh@example.com',  NULL,         3, 3),
  (6, 'Ananya Rao',   'ananya.rao@example.com',   '9090909090', 2, 3),
  (7, 'Vikram Nair',  'vikram.nair@example.com',  '9012345678', 4, 4),
  (8, 'Meera Das',    'meera.das@example.com',    '9345678901', 1, 1);

INSERT INTO skill (skill_id, skill_name, skill_category) VALUES
  (1, 'Python',           'Technical'),
  (2, 'Java',             'Technical'),
  (3, 'SQL',              'Technical'),
  (4, 'Web Development',  'Technical'),
  (5, 'Data Analysis',    'Technical'),
  (6, 'Communication',    'Non-Technical'),
  (7, 'Leadership',       'Non-Technical'),
  (8, 'Problem Solving',  'Non-Technical');

INSERT INTO student_skill (student_id, skill_id, proficiency_level) VALUES
  (1, 1, 'Advanced'),
  (1, 3, 'Intermediate'),
  (1, 6, 'Intermediate'),
  (2, 1, 'Intermediate'),
  (2, 4, 'Advanced'),
  (3, 2, 'Expert'),
  (3, 3, 'Advanced'),
  (4, 1, 'Beginner'),
  (4, 6, 'Advanced'),
  (5, 5, 'Intermediate'),
  (6, 4, 'Intermediate'),
  (6, 7, 'Advanced'),
  (7, 8, 'Intermediate'),
  (8, 3, 'Beginner');

INSERT INTO course (course_id, course_name, duration, platform) VALUES
  (1, 'Python for Everybody',                  '8 weeks',  'Coursera'),
  (2, 'Database Management Systems',           '10 weeks', 'NPTEL'),
  (3, 'Full-Stack Web Development',            '12 weeks', 'Udemy'),
  (4, 'Data Analysis with Excel and Power BI', '6 weeks',  'edX'),
  (5, 'Effective Communication Skills',        '4 weeks',  'LinkedIn Learning');

INSERT INTO certificate (certificate_id, certificate_name, issuing_organization, validity, course_id) VALUES
  (1, 'Python Programming Certificate',      'Coursera',          'Lifetime', 1),
  (2, 'Database Systems Certification',      'NPTEL',             '3 years',  2),
  (3, 'Full-Stack Developer Certificate',    'Udemy',             'Lifetime', 3),
  (4, 'Data Analytics Professional',         'Microsoft',         '2 years',  4),
  (5, 'Business Communication Certificate',  'LinkedIn Learning', '1 year',   5);

INSERT INTO student_certificate (student_id, certificate_id, credential_id, issue_date, expiry_date) VALUES
  (1, 1, 'COURSERA-PY-48213', '2025-03-15', NULL),
  (1, 2, 'NPTEL-DB-77120',    '2025-05-20', '2028-05-20'),
  (2, 3, 'UDEMY-FS-30987',    '2025-08-01', NULL),
  (2, 5, 'LI-COM-90412',      DATE_SUB(CURDATE(), INTERVAL 11 MONTH), DATE_ADD(CURDATE(), INTERVAL 20 DAY)),
  (3, 2, 'NPTEL-DB-55231',    '2023-01-10', '2026-01-10'),
  (4, 5, 'LI-COM-12098',      '2024-11-02', '2025-11-02'),
  (5, 4, 'MS-DA-66310',       '2025-06-12', '2027-06-12'),
  (6, 3, 'UDEMY-FS-41872',    '2025-09-09', NULL);
