
const { db } = require('../config/db');

async function createCourse({ code, title, description, createdBy }) {
  return db.one(
    `INSERT INTO courses (code, title, description, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, code, title, description, created_by`,
    [code, title, description, createdBy]
  );
}

async function findAllCourses() {
  return db.any(
    `SELECT id, code, title, description, created_by
     FROM courses
     ORDER BY id ASC`
  );
}

async function findCourseById(id) {
  return db.oneOrNone(
    `SELECT id, code, title, description, created_by
     FROM courses
     WHERE id = $1`,
    [id]
  );
}

async function updateCourse(id, { code, title, description }) {
  return db.oneOrNone(
    `UPDATE courses
     SET code = $2,
         title = $3,
         description = $4
     WHERE id = $1
     RETURNING id, code, title, description, created_by`,
    [id, code, title, description]
  );
}


async function deleteCourse(id) {
  return db.oneOrNone(
    `DELETE FROM courses AS c
     WHERE c.id = $1
       AND NOT EXISTS (
         SELECT 1
         FROM enrollments AS e
         WHERE e.course_id = c.id
       )
       AND NOT EXISTS (
         SELECT 1
         FROM feedback_submissions AS f
         WHERE f.course_id = c.id
       )
     RETURNING c.id`,
    [id]
  );
}


module.exports = {
  createCourse,
  findAllCourses,
  findCourseById,
  updateCourse,
  deleteCourse
};
