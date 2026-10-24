require('dotenv').config();

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const databaseName =
  process.env.MONGODB_DB || 'anonymous_course_feedback';

if (!uri) {
  throw new Error('MONGODB_URI is missing from the environment configuration.');
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000
});

let database = null;

async function connectMongo() {
  if (database) {
    return database;
  }

  await client.connect();

  await client.db('admin').command({ ping: 1 });

  database = client.db(databaseName);

  console.log('MongoDB connection successful.');
  console.log('MongoDB database:', databaseName);

  return database;
}

function getDb() {
  if (!database) {
    throw new Error(
      'MongoDB is not connected. Call connectMongo() first.'
    );
  }

  return database;
}

async function closeMongo() {
  database = null;
  await client.close();
}

module.exports = {
  connectMongo,
  getDb,
  closeMongo
};