require('dotenv').config();

const express = require('express');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();

app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/feedback', feedbackRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

