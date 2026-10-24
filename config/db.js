require('dotenv').config();

const pgPromise = require('pg-promise');

const pgp = pgPromise();

const db = pgp({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'anonymous_course_feedback',
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  connectionTimeoutMillis: 5000,
  application_name: 'anonymous-course-feedback-api'
});

async function testConnection() {
  try {
    const result = await db.one(`
      SELECT
        current_database() AS database,
        CURRENT_TIMESTAMP AS server_time
    `);

    console.log('PostgreSQL connection successful.');
    console.log('Database:', result.database);
    console.log('Server time:', result.server_time);
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pgp.end();
  }
}

module.exports = {
  db,
  pgp,
  testConnection
};