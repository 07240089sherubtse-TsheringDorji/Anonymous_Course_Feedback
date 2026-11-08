
require('dotenv').config();

const pgPromise = require('pg-promise');
const pgp = pgPromise();

const db = pgp({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'anonymous_course_feedback',
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,

  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,

  connectionTimeoutMillis: 10000,
  application_name: 'anonymous-course-feedback-api'
});

async function testConnection() {
  try {
    const result = await db.one(`
      SELECT
        current_database() AS database,
        current_schema() AS schema,
        current_user AS db_user,
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name = 'created_at'
        ) AS users_has_created_at
    `);

    console.log('PostgreSQL connection successful.');
    console.log('Database details:', result);

  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
    throw error;
  }
}

module.exports = {
  db,
  pgp,
  testConnection
};
