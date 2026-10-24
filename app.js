require('dotenv').config();

const express = require('express');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRoutes);

app.use('/api/auth', authRoutes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;