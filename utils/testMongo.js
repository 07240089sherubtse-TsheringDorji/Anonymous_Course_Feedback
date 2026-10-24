require('dotenv').config();

const {
  connectMongo,
  getDb,
  closeMongo
} = require('../config/mongo');

async function testMongo() {
  try {
    await connectMongo();

    const db = getDb();
    const feedbackCollection = db.collection('feedback');

    await feedbackCollection.createIndex({ courseId: 1 });

    await feedbackCollection.createIndex({ createdAt: 1 });

    const createdAt = new Date();
    createdAt.setUTCHours(0, 0, 0, 0);

    const testDocument = {
      courseId: 1,
      rating: 5,
      comment: 'Temporary MongoDB connection test',
      createdAt
    };

    const insertResult =
      await feedbackCollection.insertOne(testDocument);

    console.log(
      'Test document inserted:',
      insertResult.insertedId.toString()
    );

    const savedDocument =
      await feedbackCollection.findOne({
        _id: insertResult.insertedId
      });

    if (!savedDocument) {
      throw new Error('Inserted document could not be retrieved.');
    }

    console.log('Test document retrieved successfully.');
    console.log({
      courseId: savedDocument.courseId,
      rating: savedDocument.rating,
      comment: savedDocument.comment,
      createdAt: savedDocument.createdAt
    });

    await feedbackCollection.deleteOne({
      _id: insertResult.insertedId
    });

    console.log('Temporary test document removed.');
    console.log('MongoDB test completed successfully.');
  } catch (error) {
    console.error('MongoDB test failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closeMongo();
  }
}

testMongo();