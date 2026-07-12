const { Pool } = require('pg');
require('dotenv').config();

const isLocal = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
