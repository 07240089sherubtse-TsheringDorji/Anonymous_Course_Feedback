
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

        return await createEnrollmentResponse(studentId, courseId, res);
    } catch (error) {
        next(error);
    }
}

async function enrollSelf(req, res, next) {
    try {
        const studentId = Number(req.user.id);
        const courseId = Number(req.body.courseId);

        if (!Number.isInteger(studentId) || studentId < 1) {
            return res.status(401).json({
                success: false,
                message: 'Invalid student account'
            });
        }

        return await createEnrollmentResponse(studentId, courseId, res);
    } catch (error) {
        next(error);
    }
}

async function createEnrollmentResponse(studentId, courseId, res) {
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
            message: 'You are already enrolled in this course'
        });
    }

    try {
        const enrollment = await Enrollment.createEnrollment(
            studentId,
            courseId
        );

        return res.status(201).json({
            success: true,
            message: 'You have successfully enrolled in this course',
            data: { enrollment }
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'You are already enrolled in this course'
            });
        }

        throw error;
    }
}

async function getMyEnrollments(req, res, next) {
    try {
        const studentId = Number(req.user.id);

        const enrollments =
            await Enrollment.findEnrollmentsByStudentId(studentId);

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

async function getAvailableCourses(req, res, next) {
    try {
        const studentId = Number(req.user.id);

        const courses =
            await Enrollment.findAvailableCoursesByStudentId(studentId);

        return res.status(200).json({
            success: true,
            message: 'Available courses retrieved successfully',
            data: {
                count: courses.length,
                courses
            }
        });
    } catch (error) {
        next(error);
    }
}

async function unenrollSelf(req, res, next) {
    try {
        const studentId = Number(req.user.id);
        const courseId = Number(req.params.courseId);

        if (!Number.isInteger(studentId) || studentId < 1) {
            return res.status(401).json({
                success: false,
                message: 'Invalid student account'
            });
        }

        const student = await Enrollment.findStudentById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const enrollment = await Enrollment.deleteEnrollment(
            studentId,
            courseId
        );

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'You are not enrolled in this course'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'You have successfully unenrolled from this course',
            data: { enrollment }
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
    enrollSelf,
    getMyEnrollments,
    getAvailableCourses,
    unenrollSelf,
    getStudentEnrollments,
    checkEnrollment,
    removeEnrollment
};
