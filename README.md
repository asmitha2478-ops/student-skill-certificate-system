# Student Skill and Certificate Management System

A complete DBMS mini-project: a website (HTML, CSS, JavaScript) backed by a Node.js + Express
server and a **MySQL** database. You do **not** need to create the database yourself. The app
creates the database, all 7 tables and some sample data the first time it starts.

## What you need installed
1. **Node.js 18 or newer** (https://nodejs.org)
2. **MySQL Server 8.0.16 or newer** (https://dev.mysql.com/downloads/mysql/), running on your computer
3. **VS Code** (optional, but this guide uses it)

## Run it in 4 steps
1. Unzip the folder and open it in VS Code (**File > Open Folder**).
2. Open the `.env` file and change `DB_PASSWORD` to your MySQL root password.
   (If your MySQL user is not `root`, change `DB_USER` too.)
3. Open the terminal in VS Code (**Terminal > New Terminal**) and run:
   ```
   npm install
   npm start
   ```
4. Open **http://localhost:3000** in your browser.

When it works, the terminal shows: `Connected to MySQL database "skillcert_db".`

## What is in the website
| Page | What you can do |
|---|---|
| Overview | See how many records each table holds |
| Departments, Students, Skills, Student skills, Courses, Certificates, Student certificates | Add, view, edit and delete records (CRUD) and search each table |
| SQL queries | Run 10 important SQL queries (JOINs, GROUP BY, NOT EXISTS, date queries); the SQL is shown next to the result |

Project requirements and where to find them:

| Requirement | Where it is |
|---|---|
| Simple user interface | `public/index.html`, `public/style.css`, `public/app.js` |
| Database connectivity | `db/pool.js` (connection pool), `db/config.js` + `.env` (settings) |
| CRUD operations | `routes/crud.js` with the table definitions in `routes/entities.js` |
| Search / retrieval | Search box on every table page (`GET /api/<table>?q=...`) |
| Important SQL queries through the application | `routes/reports.js`, shown on the "SQL queries" page |
| Input validation | Browser checks in `public/app.js`; full server checks in `routes/validate.js`; database rules (keys, UNIQUE, CHECK, ENUM) in `db/schema.sql` |
| Test cases | `tests/api.test.js` (38 automated tests) and `docs/TEST_CASES.md` (manual test table) |

## Database
Tables follow your design: `department`, `student`, `skill`, `student_skill` (composite key),
`course`, `certificate`, `student_certificate` (composite key). See `db/schema.sql`.

Delete rules:
- Deleting a **student**, **skill** or **certificate** also deletes the matching rows in `student_skill` / `student_certificate`.
- A **department** that still has students cannot be deleted.
- Deleting a **course** keeps its certificates and clears their course.

To use the SQL files by hand in MySQL Workbench, run `db/schema.sql`, then `db/seed.sql`.

## Run the automated tests
```
npm test
```
The tests start the server, create rows whose names begin with `TEST_`, check the results, and delete them again.

## Problems?
| Message | Fix |
|---|---|
| `MySQL is not running` | Start the MySQL service (Windows: Services > MySQL80 > Start) |
| `MySQL rejected the username or password` | Fix `DB_USER` / `DB_PASSWORD` in `.env` |
| `Port 3000 is already in use` | Change `PORT` in `.env` |
| `npm` is not recognised | Install Node.js, then reopen VS Code |

## Folder layout
```
.env                 settings (MySQL password, port)
server.js            starts the website and the API
db/                  schema.sql, seed.sql, connection and set-up code
routes/              API: entities.js, crud.js, reports.js, validate.js, errors.js
public/              the website: index.html, style.css, app.js
tests/api.test.js    automated tests
docs/TEST_CASES.md   manual test cases
```
