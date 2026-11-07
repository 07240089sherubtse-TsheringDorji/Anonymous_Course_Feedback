
const { db } = require('../config/db');

async function findStudentById(studentId) {
    return db.oneOrNone(
        `SELECT id, name, email, role
         FROM users
         WHERE id = $1 AND role = 'student'`,
        [studentId]
    );
}

async function findCourseById(courseId) {
    return db.oneOrNone(
        `SELECT id, code, title
         FROM courses
         WHERE id = $1`,
        [courseId]
    );
}

async function createEnrollment(studentId, courseId) {
    return db.one(
        `INSERT INTO enrollments (student_id, course_id)
         VALUES ($1, $2)
         RETURNING id, student_id, course_id, enrolled_at`,
        [studentId, courseId]
    );
}

async function findEnrollmentsByStudentId(studentId) {
    return db.any(
        `SELECT
            e.id AS enrollment_id,
            e.student_id,
            e.course_id,
            e.enrolled_at,
            c.code AS course_code,
            c.title AS course_title,
            c.description AS course_description
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.student_id = $1
         ORDER BY e.enrolled_at DESC`,
        [studentId]
    );
}

async function findAvailableCoursesByStudentId(studentId) {
    return db.any(
        `SELECT
            c.id AS course_id,
            c.code AS course_code,
            c.title AS course_title,
            c.description AS course_description
         FROM courses c
         WHERE NOT EXISTS (
             SELECT 1
             FROM enrollments e
             WHERE e.course_id = c.id
               AND e.student_id = $1
         )
         ORDER BY c.title ASC`,
        [studentId]
    );
}

async function findEnrollmentByStudentAndCourse(studentId, courseId) {
    return db.oneOrNone(
        `SELECT id, student_id, course_id, enrolled_at
         FROM enrollments
         WHERE student_id = $1 AND course_id = $2`,
        [studentId, courseId]
    );
}

async function deleteEnrollment(studentId, courseId) {
    return db.oneOrNone(
        `DELETE FROM enrollments
         WHERE student_id = $1 AND course_id = $2
         RETURNING id, student_id, course_id`,
        [studentId, courseId]
    );
}

module.exports = {
    findStudentById,
    findCourseById,
    createEnrollment,
    findEnrollmentsByStudentId,
    findAvailableCoursesByStudentId,
    findEnrollmentByStudentAndCourse,
    deleteEnrollment
};
