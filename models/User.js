const { db } = require('../config/db');

async function findUserByEmail(email) {
  return db.oneOrNone(
    `SELECT id, name, email, password_hash, role, created_at
     FROM users
     WHERE lower(email) = lower($1)`,
    [email]
  );
}

async function findUserById(id) {
  return db.oneOrNone(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );
}

async function createUser({ name, email, passwordHash }) {
  return db.one(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, lower($2), $3, 'student')
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash]
  );
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser
};