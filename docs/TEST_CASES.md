# Test cases

Run the application, then follow each case in the browser. Fill in the last column.
`TC-A..` rows are manual browser checks. The automated tests (`npm test`) cover the same rules through the API.

| ID | Feature | Steps / input | Expected result | Pass/Fail |
|---|---|---|---|---|
| TC-A01 | Start-up | Run `npm start` with MySQL running | Terminal shows "Connected to MySQL database"; website opens | |
| TC-A02 | Auto database set-up | Start the app on a computer with no `skillcert_db` database | Database, 7 tables and sample data are created | |
| TC-A03 | Wrong password | Put a wrong `DB_PASSWORD` in `.env`, run `npm start` | Clear message about username or password; app stops | |
| TC-A04 | Overview | Open Overview | Seven tables listed with record counts | |
| TC-A05 | Add department | Departments > Add department > "Civil Engineering" > Add | Success message; row appears in the table | |
| TC-A06 | Duplicate department | Add "Civil Engineering" again | Error "That department name is already in use." | |
| TC-A07 | Required field | Add department with the name empty | Browser stops the form: field is required | |
| TC-A08 | Add student | Students > Add student with valid data | Student appears with department name shown | |
| TC-A09 | Invalid email | Student email = `abc` | Form blocked; email must be valid | |
| TC-A10 | Invalid phone | Student phone = `12345` | Form blocked; 10 to 15 digits required | |
| TC-A11 | Year range | Student year = `9` | Form blocked; must be at most 6 | |
| TC-A12 | Duplicate email | Add a student using an existing email | Error "That student email is already in use." | |
| TC-A13 | Edit student | Edit a student, change the year, Save changes | Table shows the new year | |
| TC-A14 | Search | Type part of a student's name in the search box | Only matching students are listed | |
| TC-A15 | Search, no match | Type `zzzz` | "No students match" message | |
| TC-A16 | Assign skill | Student skills > Add > choose student, skill, level | New row appears | |
| TC-A17 | Duplicate assignment | Assign the same skill to the same student again | Error "This record already exists." | |
| TC-A18 | Edit skill level | Edit a student skill | Student and skill are locked; level can change | |
| TC-A19 | Award certificate | Student certificates > Add with valid dates | Row appears with a status badge | |
| TC-A20 | Date rule | Expiry date earlier than issue date | Error "Expiry date cannot be earlier than the issue date." | |
| TC-A21 | Empty expiry | Leave expiry date empty | Saved; status shows "No expiry" | |
| TC-A22 | Expiry status | View the sample data | Expired, Expiring soon and Valid badges all appear | |
| TC-A23 | Delete blocked | Delete a department that has students | Error that other records depend on it | |
| TC-A24 | Cascade delete | Delete a student that has skills and certificates | Student removed; their rows vanish from Student skills and Student certificates | |
| TC-A25 | Confirm delete | Click Delete, then Cancel in the prompt | Nothing is deleted | |
| TC-A26 | Query without input | SQL queries > Students in each department | Result table and the SQL text appear | |
| TC-A27 | Query with input | SQL queries > Students who have a skill > choose Python > Run query | Students with Python, strongest first | |
| TC-A28 | Query validation | Certificates expiring soon with days = `0` | Browser stops the form (minimum 1) | |
| TC-A29 | Students with no certificates | Run that query | Lists students such as Vikram Nair and Meera Das (sample data) | |
| TC-A30 | Small screen | Make the browser window narrow | Menu moves to the top; tables scroll sideways | |

## Automated test cases (`npm test`)
TC-01 to TC-38 in `tests/api.test.js`: API structure, create/read/update/delete, duplicate keys,
missing and invalid values (email, phone, year, dates, enums), foreign keys, search (including special characters),
all SQL query reports, cascade deletes and delete restrictions.
