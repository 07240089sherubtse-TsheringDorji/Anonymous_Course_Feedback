
require('dotenv').config();

const app = require('./app');
const { connectMongo, closeMongo } = require('./config/mongo');
const { testConnection } = require('./config/db');

const PORT = Number(process.env.PORT || 3000);

let server;
let shuttingDown = false;

async function startServer() {
  try {
    console.log('Starting Anonymous Course Feedback API...');

    await testConnection();

    await connectMongo();

    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(
        `Health check: http://localhost:${PORT}/api/health`
      );
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exitCode = 1;
      shutdown();
    });

  } catch (error) {
    console.error('Application startup failed:');
    console.error(error);

    try {
      await closeMongo();
    } catch (closeError) {
      console.error('MongoDB cleanup failed:', closeError);
    }

    process.exitCode = 1;
  }
}

async function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }

  try {
    await closeMongo();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error closing MongoDB:', error);
    process.exitCode = 1;
  }
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

startServer();
