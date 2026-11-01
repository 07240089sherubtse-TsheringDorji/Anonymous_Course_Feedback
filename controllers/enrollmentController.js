
const Enrollment = require('../models/Enrollment');

async function enrollStudent(req, res, next) {
  try {
    const studentId = Number(req.body.studentId);
    const courseId = Number(req.body.courseId);

    const student = await Enrollment.findStudentById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const course = await Enrollment.findCourseById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const existingEnrollment =
      await Enrollment.findEnrollmentByStudentAndCourse(
        studentId,
        courseId
      );

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    const enrollment = await Enrollment.createEnrollment(
      studentId,
      courseId
    );

    return res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: { enrollment }
    });
  } catch (error) {
    // Handles duplicate submissions, including concurrent requests.
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    next(error);
  }
}

async function getMyEnrollments(req, res, next) {
  try {
    const enrollments =
      await Enrollment.findEnrollmentsByStudentId(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Your enrollments retrieved successfully',
      data: {
        count: enrollments.length,
        enrollments
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentEnrollments(req, res, next) {
  try {
    const studentId = Number(req.params.studentId);

    const student = await Enrollment.findStudentById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const enrollments =
      await Enrollment.findEnrollmentsByStudentId(studentId);

    return res.status(200).json({
      success: true,
      message: 'Student enrollments retrieved successfully',
      data: {
        student: {
          id: student.id,
          name: student.name,
          email: student.email
        },
        count: enrollments.length,
        enrollments
      }
    });
  } catch (error) {
    next(error);
  }
}

async function checkEnrollment(req, res, next) {
  try {
    const studentId = Number(req.params.studentId);
    const courseId = Number(req.params.courseId);

    const enrollment =
      await Enrollment.findEnrollmentByStudentAndCourse(
        studentId,
        courseId
      );

    return res.status(200).json({
      success: true,
      message: enrollment
        ? 'Student is enrolled in this course'
        : 'Student is not enrolled in this course',
      data: {
        enrolled: Boolean(enrollment),
        enrollment: enrollment || null
      }
    });
  } catch (error) {
    next(error);
  }
}

async function removeEnrollment(req, res, next) {
  try {
    const studentId = Number(req.params.studentId);
    const courseId = Number(req.params.courseId);

    const enrollment = await Enrollment.deleteEnrollment(
      studentId,
      courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enrollment removed successfully',
      data: { enrollment }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  enrollStudent,
  getMyEnrollments,
  getStudentEnrollments,
  checkEnrollment,
  removeEnrollment
};
