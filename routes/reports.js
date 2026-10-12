// Important SQL queries, run through the application.
// The SQL text is shown in the browser next to each result, which is handy
// for a demo or report. Values are always passed as ? parameters.
const express = require('express');
const pool = require('../db/pool');
const { HttpError, asyncHandler } = require('./errors');

const router = express.Router();

const reports = [
  {
    id: 'students-by-department',
    title: 'Students in each department',
    description: 'Counts the students in every department, including departments with none (LEFT JOIN + GROUP BY).',
    params: [],
    sql: `SELECT d.department_name, COUNT(s.student_id) AS total_students
FROM department d
LEFT JOIN student s ON s.department_id = d.department_id
GROUP BY d.department_id, d.department_name
ORDER BY total_students DESC, d.department_name`,
  },
  {
    id: 'students-with-skill',
    title: 'Students who have a skill',
    description: 'Lists every student with the chosen skill, strongest first (3-table JOIN).',
    params: [{ name: 'skill_id', label: 'Skill', type: 'lookup', ref: 'skill' }],
    sql: `SELECT s.student_id, s.student_name, d.department_name, ss.proficiency_level
FROM student_skill ss
JOIN student s ON s.student_id = ss.student_id
JOIN department d ON d.department_id = s.department_id
WHERE ss.skill_id = ?
ORDER BY FIELD(ss.proficiency_level, 'Expert', 'Advanced', 'Intermediate', 'Beginner'), s.student_name`,
  },
  {
    id: 'skills-of-student',
    title: 'Skills of one student',
    description: 'Shows all skills and proficiency levels of the chosen student.',
    params: [{ name: 'student_id', label: 'Student', type: 'lookup', ref: 'student' }],
    sql: `SELECT k.skill_name, k.skill_category, ss.proficiency_level
FROM student_skill ss
JOIN skill k ON k.skill_id = ss.skill_id
WHERE ss.student_id = ?
ORDER BY k.skill_category, k.skill_name`,
  },
  {
    id: 'skill-popularity',
    title: 'Most common skills',
    description: 'Ranks skills by the number of students who have them (LEFT JOIN + GROUP BY).',
    params: [],
    sql: `SELECT k.skill_name, k.skill_category, COUNT(ss.student_id) AS students
FROM skill k
LEFT JOIN student_skill ss ON ss.skill_id = k.skill_id
GROUP BY k.skill_id, k.skill_name, k.skill_category
ORDER BY students DESC, k.skill_name`,
  },
  {
    id: 'certificates-per-student',
    title: 'Certificates earned per student',
    description: 'Counts the certificates each student has earned, including students with none.',
    params: [],
    sql: `SELECT s.student_id, s.student_name, COUNT(sc.certificate_id) AS certificates_earned
FROM student s
LEFT JOIN student_certificate sc ON sc.student_id = s.student_id
GROUP BY s.student_id, s.student_name
ORDER BY certificates_earned DESC, s.student_name`,
  },
  {
    id: 'certificates-of-student',
    title: 'Certificates of one student',
    description: 'Shows each certificate the chosen student holds, with its course (JOIN + LEFT JOIN).',
    params: [{ name: 'student_id', label: 'Student', type: 'lookup', ref: 'student' }],
    sql: `SELECT c.certificate_name, c.issuing_organization, co.course_name,
       sc.credential_id, sc.issue_date, sc.expiry_date
FROM student_certificate sc
JOIN certificate c ON c.certificate_id = sc.certificate_id
LEFT JOIN course co ON co.course_id = c.course_id
WHERE sc.student_id = ?
ORDER BY sc.issue_date DESC`,
  },
  {
    id: 'students-without-certificates',
    title: 'Students with no certificates',
    description: 'Finds students who have not earned any certificate yet (NOT EXISTS subquery).',
    params: [],
    sql: `SELECT s.student_id, s.student_name, s.email, d.department_name
FROM student s
JOIN department d ON d.department_id = s.department_id
WHERE NOT EXISTS (
  SELECT 1 FROM student_certificate sc WHERE sc.student_id = s.student_id
)
ORDER BY s.student_name`,
  },
  {
    id: 'expiring-soon',
    title: 'Certificates expiring soon',
    description: 'Lists certificates that expire within the chosen number of days.',
    params: [{ name: 'days', label: 'Days ahead', type: 'int', min: 1, max: 3650, default: 60 }],
    sql: `SELECT s.student_name, c.certificate_name, sc.credential_id, sc.expiry_date,
       DATEDIFF(sc.expiry_date, CURDATE()) AS days_left
FROM student_certificate sc
JOIN student s ON s.student_id = sc.student_id
JOIN certificate c ON c.certificate_id = sc.certificate_id
WHERE sc.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
ORDER BY sc.expiry_date`,
  },
  {
    id: 'expired',
    title: 'Expired certificates',
    description: 'Lists certificates whose expiry date has already passed.',
    params: [],
    sql: `SELECT s.student_name, s.email, c.certificate_name, sc.credential_id, sc.expiry_date,
       DATEDIFF(CURDATE(), sc.expiry_date) AS days_since_expiry
FROM student_certificate sc
JOIN student s ON s.student_id = sc.student_id
JOIN certificate c ON c.certificate_id = sc.certificate_id
WHERE sc.expiry_date < CURDATE()
ORDER BY sc.expiry_date`,
  },
  {
    id: 'certificates-by-course',
    title: 'Certificates earned per course',
    description: 'Shows, for every course, how many certificates it leads to and how often they were earned.',
    params: [],
    sql: `SELECT co.course_name, co.platform,
       COUNT(DISTINCT c.certificate_id) AS certificates,
       COUNT(sc.student_id) AS times_earned
FROM course co
LEFT JOIN certificate c ON c.course_id = co.course_id
LEFT JOIN student_certificate sc ON sc.certificate_id = c.certificate_id
GROUP BY co.course_id, co.course_name, co.platform
ORDER BY times_earned DESC, co.course_name`,
  },
];

router.get('/', (req, res) => {
  res.json(reports);
});

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const report = reports.find((r) => r.id === req.params.id);
    if (!report) throw new HttpError(404, 'Unknown report.');

    const values = report.params.map((p) => {
      const raw = req.query[p.name];
      if (raw === undefined || raw === '') throw new HttpError(400, `${p.label} is required.`);
      if (!/^\d+$/.test(String(raw))) throw new HttpError(400, `${p.label} must be a whole number.`);
      const n = Number(raw);
      if ((p.min !== undefined && n < p.min) || (p.max !== undefined && n > p.max)) {
        throw new HttpError(400, `${p.label} must be between ${p.min} and ${p.max}.`);
      }
      return n;
    });

    const [rows, fields] = await pool.query(report.sql, values);
    res.json({ columns: fields.map((f) => f.name), rows });
  })
);

module.exports = router;
