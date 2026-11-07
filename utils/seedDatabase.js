
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
    const existing = await findUser(transaction, user.email);

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

async function seedCourse(transaction, course, adminId) {
    const existingTarget = await transaction.oneOrNone(
        'SELECT id FROM courses WHERE code = $1',
        [course.code]
    );

    const existingLegacy = await transaction.oneOrNone(
        'SELECT id FROM courses WHERE code = $1',
        [course.oldCode]
    );

    if (existingTarget && existingLegacy) {
        throw new Error(
            `Both ${course.oldCode} and ${course.code} exist. ` +
            'Resolve these records before running the seed script.'
        );
    }

    if (existingLegacy) {
        const updated = await transaction.one(
            `UPDATE courses
             SET code = $1,
                 title = $2,
                 description = $3
             WHERE id = $4
             RETURNING id`,
            [
                course.code,
                course.title,
                course.description,
                existingLegacy.id
            ]
        );

        return updated.id;
    }

    if (existingTarget) {
        const updated = await transaction.one(
            `UPDATE courses
             SET title = $1,
                 description = $2
             WHERE id = $3
             RETURNING id`,
            [
                course.title,
                course.description,
                existingTarget.id
            ]
        );

        return updated.id;
    }

    const created = await transaction.one(
        `INSERT INTO courses (code, title, description, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
            course.code,
            course.title,
            course.description,
            adminId
        ]
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

        const backendCourseId = await seedCourse(
            transaction,
            {
                oldCode: 'CS101',
                code: 'CSP301',
                title: 'Backend Web Development',
                description: 'Study backend web development concepts and technologies.'
            },
            adminId
        );

        const frontendCourseId = await seedCourse(
            transaction,
            {
                oldCode: 'CS102',
                code: 'CSP201',
                title: 'Front end Web Development',
                description: 'Study front end web development concepts and technologies.'
            },
            adminId
        );

        console.log('Database seed completed successfully.');
        console.log('Admin account ID:', adminId);
        console.log('Student account ID:', studentId);
        console.log('CSP301 course ID:', backendCourseId);
        console.log('CSP201 course ID:', frontendCourseId);
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
