
const { db } = require('../config/db');


async function findEnrollment(studentId, courseId) {
  return db.oneOrNone(
    `SELECT id
     FROM enrollments
     WHERE student_id = $1 AND course_id = $2`,
    [studentId, courseId]
  );
}


async function findSubmission(studentId, courseId) {
  return db.oneOrNone(
    `SELECT id, student_id, course_id, submitted_on
     FROM feedback_submissions
     WHERE student_id = $1 AND course_id = $2`,
    [studentId, courseId]
  );
}


async function createSubmission(studentId, courseId) {
  return db.one(
    `INSERT INTO feedback_submissions
       (student_id, course_id, submitted_on)
     VALUES ($1, $2, CURRENT_DATE)
     RETURNING id, student_id, course_id, submitted_on`,
    [studentId, courseId]
  );
}


async function deleteSubmissionById(submissionId) {
  return db.oneOrNone(
    `DELETE FROM feedback_submissions
     WHERE id = $1
     RETURNING id`,
    [submissionId]
  );
}

module.exports = {
  findEnrollment,
  findSubmission,
  createSubmission,
  deleteSubmissionById
};
