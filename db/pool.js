// Shared MySQL connection pool used by every route.
const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.host,
  port: config.dbPort,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // return DATE columns as 'YYYY-MM-DD' strings
});

module.exports = pool;
