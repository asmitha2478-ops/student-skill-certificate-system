// Automated test cases. Run with:  npm test
// Needs MySQL running and the .env file filled in. Test rows are prefixed
// with TEST_ and removed again at the end, so your own data is untouched.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { start } = require('../server');
const pool = require('../db/pool');

let server;
let base;
const ids = {};

before(async () => {
  server = await start(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  await cleanup();
});

after(async () => {
  await cleanup();
  server.close();
  await pool.end();
});

async function cleanup() {
  await pool.query("DELETE FROM student WHERE student_name LIKE 'TEST\\_%'");
  await pool.query("DELETE FROM certificate WHERE certificate_name LIKE 'TEST\\_%'");
  await pool.query("DELETE FROM course WHERE course_name LIKE 'TEST\\_%'");
  await pool.query("DELETE FROM skill WHERE skill_name LIKE 'TEST\\_%'");
  await pool.query("DELETE FROM department WHERE department_name LIKE 'TEST\\_%'");
}

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data };
}

// ---------- general ----------
test('TC-01 meta describes all seven entities', async () => {
  const r = await call('GET', '/meta');
  assert.equal(r.status, 200);
  assert.equal(r.data.length, 7);
});

test('TC-02 unknown resource returns 404', async () => {
  assert.equal((await call('GET', '/unknown')).status, 404);
});

// ---------- department ----------
test('TC-03 create department with valid data', async () => {
  const r = await call('POST', '/department', { department_name: 'TEST_Dept' });
  assert.equal(r.status, 201);
  ids.dept = r.data.id;
});

test('TC-04 duplicate department name is rejected', async () => {
  assert.equal((await call('POST', '/department', { department_name: 'TEST_Dept' })).status, 409);
});

test('TC-05 empty department name is rejected', async () => {
  assert.equal((await call('POST', '/department', { department_name: '   ' })).status, 400);
});

test('TC-06 department name over 100 characters is rejected', async () => {
  assert.equal((await call('POST', '/department', { department_name: 'x'.repeat(101) })).status, 400);
});

// ---------- student ----------
const student = (over = {}) => ({
  student_name: 'TEST_Student', email: 'test_student@example.com', phone: '9876543210',
  year: 2, department_id: ids.dept, ...over,
});

test('TC-07 invalid email is rejected', async () => {
  assert.equal((await call('POST', '/student', student({ email: 'not-an-email' }))).status, 400);
});

test('TC-08 invalid phone number is rejected', async () => {
  assert.equal((await call('POST', '/student', student({ phone: 'abc123' }))).status, 400);
});

test('TC-09 year outside 1-6 is rejected', async () => {
  assert.equal((await call('POST', '/student', student({ year: 9 }))).status, 400);
});

test('TC-10 missing student name is rejected', async () => {
  assert.equal((await call('POST', '/student', student({ student_name: '' }))).status, 400);
});

test('TC-11 student with non-existent department is rejected', async () => {
  assert.equal((await call('POST', '/student', student({ department_id: 999999 }))).status, 400);
});

test('TC-12 create student with valid data', async () => {
  const r = await call('POST', '/student', student());
  assert.equal(r.status, 201);
  ids.student = r.data.id;
});

test('TC-13 duplicate email is rejected', async () => {
  assert.equal((await call('POST', '/student', student({ student_name: 'TEST_Other' }))).status, 409);
});

test('TC-14 read one student includes the department name', async () => {
  const r = await call('GET', `/student/${ids.student}`);
  assert.equal(r.status, 200);
  assert.equal(r.data.department_name, 'TEST_Dept');
});

test('TC-15 search finds the student by name fragment', async () => {
  const r = await call('GET', '/student?q=TEST_Stud');
  assert.equal(r.status, 200);
  assert.ok(r.data.some((s) => s.student_id === ids.student));
});

test('TC-16 search with special characters does not break', async () => {
  const r = await call('GET', `/student?q=${encodeURIComponent("%' OR 1=1 --")}`);
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.data));
});

test('TC-17 update student', async () => {
  const r = await call('PUT', `/student/${ids.student}`, student({ student_name: 'TEST_Student Renamed', year: 3 }));
  assert.equal(r.status, 200);
  const after = await call('GET', `/student/${ids.student}`);
  assert.equal(after.data.student_name, 'TEST_Student Renamed');
  assert.equal(after.data.year, 3);
});

test('TC-18 update a student that does not exist returns 404', async () => {
  assert.equal((await call('PUT', '/student/999999', student())).status, 404);
});

test('TC-19 non-numeric key in URL returns 400', async () => {
  assert.equal((await call('GET', '/student/abc')).status, 400);
});

// ---------- skill / student_skill ----------
test('TC-20 create skill and reject invalid category', async () => {
  const bad = await call('POST', '/skill', { skill_name: 'TEST_Skill', skill_category: 'Other' });
  assert.equal(bad.status, 400);
  const ok = await call('POST', '/skill', { skill_name: 'TEST_Skill', skill_category: 'Technical' });
  assert.equal(ok.status, 201);
  ids.skill = ok.data.id;
});

test('TC-21 assign skill to student', async () => {
  const r = await call('POST', '/student_skill', { student_id: ids.student, skill_id: ids.skill, proficiency_level: 'Beginner' });
  assert.equal(r.status, 201);
});

test('TC-22 assigning the same skill twice is rejected (composite key)', async () => {
  const r = await call('POST', '/student_skill', { student_id: ids.student, skill_id: ids.skill, proficiency_level: 'Expert' });
  assert.equal(r.status, 409);
});

test('TC-23 invalid proficiency level is rejected', async () => {
  const r = await call('POST', '/student_skill', { student_id: ids.student, skill_id: ids.skill, proficiency_level: 'God' });
  assert.equal(r.status, 400);
});

test('TC-24 update proficiency level', async () => {
  const r = await call('PUT', `/student_skill/${ids.student}/${ids.skill}`, { proficiency_level: 'Advanced' });
  assert.equal(r.status, 200);
  const one = await call('GET', `/student_skill/${ids.student}/${ids.skill}`);
  assert.equal(one.data.proficiency_level, 'Advanced');
});

// ---------- course / certificate / student_certificate ----------
test('TC-25 create course and certificate', async () => {
  const c = await call('POST', '/course', { course_name: 'TEST_Course', duration: '4 weeks', platform: 'TestHub' });
  assert.equal(c.status, 201);
  ids.course = c.data.id;
  const bad = await call('POST', '/certificate', { certificate_name: 'TEST_Cert', issuing_organization: 'TestOrg', course_id: ids.course });
  assert.equal(bad.status, 400); // validity missing
  const ok = await call('POST', '/certificate', { certificate_name: 'TEST_Cert', issuing_organization: 'TestOrg', validity: '1 year', course_id: ids.course });
  assert.equal(ok.status, 201);
  ids.cert = ok.data.id;
});

const award = (over = {}) => ({
  student_id: ids.student, certificate_id: ids.cert, credential_id: 'TEST-CRED-1',
  issue_date: '2026-01-10', expiry_date: '2027-01-10', ...over,
});

test('TC-26 expiry date before issue date is rejected', async () => {
  assert.equal((await call('POST', '/student_certificate', award({ expiry_date: '2025-01-01' }))).status, 400);
});

test('TC-27 impossible date is rejected', async () => {
  assert.equal((await call('POST', '/student_certificate', award({ issue_date: '2026-13-45' }))).status, 400);
});

test('TC-28 award certificate to student', async () => {
  assert.equal((await call('POST', '/student_certificate', award())).status, 201);
});

test('TC-29 awarding the same certificate twice is rejected', async () => {
  assert.equal((await call('POST', '/student_certificate', award({ credential_id: 'TEST-CRED-2' }))).status, 409);
});

test('TC-30 certificate expiry can be left empty', async () => {
  const r = await call('PUT', `/student_certificate/${ids.student}/${ids.cert}`, { credential_id: 'TEST-CRED-1', issue_date: '2026-01-10', expiry_date: '' });
  assert.equal(r.status, 200);
  const one = await call('GET', `/student_certificate/${ids.student}/${ids.cert}`);
  assert.equal(one.data.status, 'No expiry');
});

// ---------- referential integrity ----------
test('TC-31 department that still has students cannot be deleted', async () => {
  assert.equal((await call('DELETE', `/department/${ids.dept}`)).status, 409);
});

// ---------- SQL query reports ----------
test('TC-32 every report without parameters runs successfully', async () => {
  const list = await call('GET', '/reports');
  assert.ok(list.data.length >= 10);
  for (const rep of list.data.filter((x) => x.params.length === 0)) {
    const r = await call('GET', `/reports/${rep.id}`);
    assert.equal(r.status, 200, rep.id);
    assert.ok(Array.isArray(r.data.rows), rep.id);
  }
});

test('TC-33 report with a parameter returns the matching student', async () => {
  const r = await call('GET', `/reports/students-with-skill?skill_id=${ids.skill}`);
  assert.equal(r.status, 200);
  assert.ok(r.data.rows.some((row) => row.student_id === ids.student));
});

test('TC-34 report rejects missing and non-numeric parameters', async () => {
  assert.equal((await call('GET', '/reports/students-with-skill')).status, 400);
  assert.equal((await call('GET', '/reports/students-with-skill?skill_id=abc')).status, 400);
  assert.equal((await call('GET', '/reports/expiring-soon?days=0')).status, 400);
});

test('TC-35 unknown report returns 404', async () => {
  assert.equal((await call('GET', '/reports/nope')).status, 404);
});

// ---------- delete + cascade ----------
test('TC-36 deleting a student also removes their skills and certificates', async () => {
  assert.equal((await call('DELETE', `/student/${ids.student}`)).status, 200);
  assert.equal((await call('GET', `/student_skill/${ids.student}/${ids.skill}`)).status, 404);
  assert.equal((await call('GET', `/student_certificate/${ids.student}/${ids.cert}`)).status, 404);
});

test('TC-37 deleting a record that does not exist returns 404', async () => {
  assert.equal((await call('DELETE', `/student/${ids.student}`)).status, 404);
});

test('TC-38 department can be deleted once it has no students', async () => {
  assert.equal((await call('DELETE', `/department/${ids.dept}`)).status, 200);
});
