require('dotenv').config();

const bcrypt = require('bcrypt');
const { db, pgp } = require('../config/db');

async function findUser(transaction, email) {
  return transaction.oneOrNone(
    `SELECT id, role
     FROM users
     WHERE LOWER(email) = LOWER($1)`,
    [email]
  );
}

async function createUserIfMissing(transaction, user, role) {
  let existing = await findUser(transaction, user.email);

  if (existing) {
    if (existing.role !== role) {
      throw new Error(
        `The account ${user.email} already exists with a different role.`
      );
    }

    return existing.id;
  }

  const passwordHash = await bcrypt.hash(user.password, 12);

  const created = await transaction.one(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [user.name, user.email, passwordHash, role]
  );

  return created.id;
}

async function seedDatabase() {
  const admin = {
    name: process.env.SEED_ADMIN_NAME,
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD
  };

  const student = {
    name: process.env.SEED_STUDENT_NAME,
    email: process.env.SEED_STUDENT_EMAIL,
    password: process.env.SEED_STUDENT_PASSWORD
  };

  for (const user of [admin, student]) {
    if (
      !user.name ||
      !user.email ||
      !user.password ||
      user.password.length < 12 ||
      user.password.startsWith('ReplaceWith') ||
      user.password.startsWith('replace_with')
    ) {
      throw new Error(
        'Configure valid seed names, emails, and passwords in .env first.'
      );
    }
  }

  await db.tx(async (transaction) => {
    const adminId = await createUserIfMissing(
      transaction,
      admin,
      'admin'
    );

    const studentId = await createUserIfMissing(
      transaction,
      student,
      'student'
    );

    await transaction.none(
      `INSERT INTO courses (code, title, description, created_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO NOTHING`,
      [
        'CS101',
        'Introduction to Computer Science',
        'Sample course for API development and testing.',
        adminId
      ]
    );

    const course = await transaction.one(
      'SELECT id FROM courses WHERE code = $1',
      ['CS101']
    );

    console.log('Database seed completed successfully.');
    console.log('Admin account ID:', adminId);
    console.log('Student account ID:', studentId);
    console.log('Sample course ID:', course.id);
  });
}

seedDatabase()
  .catch((error) => {
    console.error('Database seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pgp.end();
  });