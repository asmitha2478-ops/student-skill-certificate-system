// Creates the database, all seven tables and (optionally) sample data.
// Safe to run on every start: tables use IF NOT EXISTS and sample data
// is only inserted when the department table is empty.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./config');

const readSql = (file) =>
  fs
    .readFileSync(path.join(__dirname, file), 'utf8')
    .replace(/skillcert_db/g, config.database);

async function initDatabase() {
  const conn = await mysql.createConnection({
    host: config.host,
    port: config.dbPort,
    user: config.user,
    password: config.password,
    multipleStatements: true,
  });

  try {
    await conn.query(readSql('schema.sql'));

    if (config.seed) {
      const [rows] = await conn.query(
        `SELECT COUNT(*) AS n FROM \`${config.database}\`.department`
      );
      if (rows[0].n === 0) {
        await conn.query(readSql('seed.sql'));
        console.log('Sample data inserted.');
      }
    }
  } finally {
    await conn.end();
  }
}

module.exports = { initDatabase };
