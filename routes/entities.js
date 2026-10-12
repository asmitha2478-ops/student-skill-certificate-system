// One definition per table. The same definitions drive:
//   - the REST API (list / search / create / update / delete)
//   - server-side validation
//   - the forms and tables that the browser renders (via GET /api/meta)
//
// `select` always uses the alias `t` for the main table.

const entities = {
  department: {
    label: 'Departments',
    singular: 'Department',
    table: 'department',
    pk: ['department_id'],
    select: `SELECT t.department_id, t.department_name FROM department t`,
    order: 't.department_name',
    search: ['t.department_name'],
    lookup: `SELECT department_id AS value, department_name AS label FROM department ORDER BY department_name`,
    columns: [
      { key: 'department_id', label: 'ID' },
      { key: 'department_name', label: 'Department' },
    ],
    fields: [
      { name: 'department_id', label: 'ID', type: 'int', auto: true },
      { name: 'department_name', label: 'Department name', type: 'text', required: true, max: 100 },
    ],
  },

  student: {
    label: 'Students',
    singular: 'Student',
    table: 'student',
    pk: ['student_id'],
    select: `SELECT t.student_id, t.student_name, t.email, t.phone, t.\`year\`, t.department_id, d.department_name
             FROM student t JOIN department d ON d.department_id = t.department_id`,
    order: 't.student_name',
    search: ['t.student_name', 't.email', 't.phone', 'd.department_name', 't.`year`'],
    lookup: `SELECT student_id AS value, CONCAT(student_name, ' (#', student_id, ')') AS label FROM student ORDER BY student_name`,
    columns: [
      { key: 'student_id', label: 'ID' },
      { key: 'student_name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'year', label: 'Year' },
      { key: 'department_name', label: 'Department' },
    ],
    fields: [
      { name: 'student_id', label: 'ID', type: 'int', auto: true },
      { name: 'student_name', label: 'Student name', type: 'text', required: true, max: 100 },
      { name: 'email', label: 'Email', type: 'email', required: true, max: 120 },
      { name: 'phone', label: 'Phone', type: 'phone', hint: '10 to 15 digits, optional leading +' },
      { name: 'year', label: 'Year of study', type: 'int', required: true, min: 1, max: 6 },
      { name: 'department_id', label: 'Department', type: 'fk', ref: 'department', required: true },
    ],
  },

  skill: {
    label: 'Skills',
    singular: 'Skill',
    table: 'skill',
    pk: ['skill_id'],
    select: `SELECT t.skill_id, t.skill_name, t.skill_category FROM skill t`,
    order: 't.skill_name',
    search: ['t.skill_name', 't.skill_category'],
    lookup: `SELECT skill_id AS value, skill_name AS label FROM skill ORDER BY skill_name`,
    columns: [
      { key: 'skill_id', label: 'ID' },
      { key: 'skill_name', label: 'Skill' },
      { key: 'skill_category', label: 'Category' },
    ],
    fields: [
      { name: 'skill_id', label: 'ID', type: 'int', auto: true },
      { name: 'skill_name', label: 'Skill name', type: 'text', required: true, max: 100 },
      { name: 'skill_category', label: 'Category', type: 'enum', required: true, options: ['Technical', 'Non-Technical'] },
    ],
  },

  student_skill: {
    label: 'Student skills',
    singular: 'Student skill',
    table: 'student_skill',
    pk: ['student_id', 'skill_id'],
    select: `SELECT t.student_id, t.skill_id, t.proficiency_level, s.student_name, k.skill_name, k.skill_category
             FROM student_skill t
             JOIN student s ON s.student_id = t.student_id
             JOIN skill k ON k.skill_id = t.skill_id`,
    order: 's.student_name, k.skill_name',
    search: ['s.student_name', 'k.skill_name', 'k.skill_category', 't.proficiency_level'],
    columns: [
      { key: 'student_name', label: 'Student' },
      { key: 'skill_name', label: 'Skill' },
      { key: 'skill_category', label: 'Category' },
      { key: 'proficiency_level', label: 'Proficiency' },
    ],
    fields: [
      { name: 'student_id', label: 'Student', type: 'fk', ref: 'student', required: true },
      { name: 'skill_id', label: 'Skill', type: 'fk', ref: 'skill', required: true },
      {
        name: 'proficiency_level', label: 'Proficiency level', type: 'enum', required: true,
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      },
    ],
  },

  course: {
    label: 'Courses',
    singular: 'Course',
    table: 'course',
    pk: ['course_id'],
    select: `SELECT t.course_id, t.course_name, t.duration, t.platform FROM course t`,
    order: 't.course_name',
    search: ['t.course_name', 't.duration', 't.platform'],
    lookup: `SELECT course_id AS value, course_name AS label FROM course ORDER BY course_name`,
    columns: [
      { key: 'course_id', label: 'ID' },
      { key: 'course_name', label: 'Course' },
      { key: 'duration', label: 'Duration' },
      { key: 'platform', label: 'Platform' },
    ],
    fields: [
      { name: 'course_id', label: 'ID', type: 'int', auto: true },
      { name: 'course_name', label: 'Course name', type: 'text', required: true, max: 150 },
      { name: 'duration', label: 'Duration', type: 'text', required: true, max: 50, hint: 'For example: 8 weeks' },
      { name: 'platform', label: 'Platform', type: 'text', required: true, max: 100, hint: 'For example: Coursera' },
    ],
  },

  certificate: {
    label: 'Certificates',
    singular: 'Certificate',
    table: 'certificate',
    pk: ['certificate_id'],
    select: `SELECT t.certificate_id, t.certificate_name, t.issuing_organization, t.validity, t.course_id, c.course_name
             FROM certificate t LEFT JOIN course c ON c.course_id = t.course_id`,
    order: 't.certificate_name',
    search: ['t.certificate_name', 't.issuing_organization', 't.validity', 'c.course_name'],
    lookup: `SELECT certificate_id AS value, certificate_name AS label FROM certificate ORDER BY certificate_name`,
    columns: [
      { key: 'certificate_id', label: 'ID' },
      { key: 'certificate_name', label: 'Certificate' },
      { key: 'issuing_organization', label: 'Issued by' },
      { key: 'validity', label: 'Validity' },
      { key: 'course_name', label: 'Course' },
    ],
    fields: [
      { name: 'certificate_id', label: 'ID', type: 'int', auto: true },
      { name: 'certificate_name', label: 'Certificate name', type: 'text', required: true, max: 150 },
      { name: 'issuing_organization', label: 'Issuing organization', type: 'text', required: true, max: 150 },
      { name: 'validity', label: 'Validity', type: 'text', required: true, max: 50, hint: 'For example: 3 years, or Lifetime' },
      { name: 'course_id', label: 'Course', type: 'fk', ref: 'course' },
    ],
  },

  student_certificate: {
    label: 'Student certificates',
    singular: 'Student certificate',
    table: 'student_certificate',
    pk: ['student_id', 'certificate_id'],
    select: `SELECT t.student_id, t.certificate_id, t.credential_id, t.issue_date, t.expiry_date,
                    s.student_name, c.certificate_name, c.issuing_organization,
                    CASE
                      WHEN t.expiry_date IS NULL THEN 'No expiry'
                      WHEN t.expiry_date < CURDATE() THEN 'Expired'
                      WHEN t.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'Expiring soon'
                      ELSE 'Valid'
                    END AS status
             FROM student_certificate t
             JOIN student s ON s.student_id = t.student_id
             JOIN certificate c ON c.certificate_id = t.certificate_id`,
    order: 's.student_name, t.issue_date',
    search: ['s.student_name', 'c.certificate_name', 'c.issuing_organization', 't.credential_id'],
    columns: [
      { key: 'student_name', label: 'Student' },
      { key: 'certificate_name', label: 'Certificate' },
      { key: 'credential_id', label: 'Credential ID' },
      { key: 'issue_date', label: 'Issued' },
      { key: 'expiry_date', label: 'Expires' },
      { key: 'status', label: 'Status', badge: true },
    ],
    fields: [
      { name: 'student_id', label: 'Student', type: 'fk', ref: 'student', required: true },
      { name: 'certificate_id', label: 'Certificate', type: 'fk', ref: 'certificate', required: true },
      { name: 'credential_id', label: 'Credential ID', type: 'text', required: true, max: 100 },
      { name: 'issue_date', label: 'Issue date', type: 'date', required: true },
      { name: 'expiry_date', label: 'Expiry date', type: 'date', hint: 'Leave empty if the certificate does not expire' },
    ],
    check: (v) =>
      v.expiry_date && v.issue_date && v.expiry_date < v.issue_date
        ? 'Expiry date cannot be earlier than the issue date.'
        : null,
  },
};

module.exports = entities;
