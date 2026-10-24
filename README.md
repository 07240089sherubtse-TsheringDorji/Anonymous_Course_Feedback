# Anonymous Course Feedback System

A backend REST API that allows students to submit anonymous feedback
about courses and enables administrators to review course feedback
and rating summaries.

## Technology Stack

- Node.js
- Express.js
- PostgreSQL with pg-promise
- MongoDB native driver
- bcrypt
- JSON Web Tokens (JWT)
- express-validator
- Postman
- Jest and Supertest
- Git and GitHub

## Database Design

PostgreSQL will store users, courses, enrollments, and feedback
submission tracking.

MongoDB will store anonymous feedback documents containing a course
ID, rating, comment, and a date rounded to the day.

Feedback documents will not store student IDs, names, or email
addresses.

## Project Status

Environment setup and repository initialization are in progress.

API implementation and database configuration will be completed
in subsequent laboratory sessions.