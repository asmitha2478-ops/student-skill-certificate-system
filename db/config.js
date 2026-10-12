require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.DB_HOST || 'localhost',
  dbPort: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'skillcert_db',
  seed: String(process.env.SEED_SAMPLE_DATA || 'true').toLowerCase() === 'true',
};
