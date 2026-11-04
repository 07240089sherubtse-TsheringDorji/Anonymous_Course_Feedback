
const { getDb } = require('../config/mongo');

const COLLECTION_NAME = 'feedback';


async function createFeedback(courseId, rating, comment) {
  const collection = getDb().collection(COLLECTION_NAME);


  const createdAt = new Date();
  createdAt.setUTCHours(0, 0, 0, 0);

  const feedbackDocument = {
    courseId,
    rating,
    comment,
    createdAt
  };

  const result = await collection.insertOne(feedbackDocument);

  return {
    id: result.insertedId,
    ...feedbackDocument
  };
}

async function deleteFeedbackById(feedbackId) {
  const collection = getDb().collection(COLLECTION_NAME);

  return collection.deleteOne({
    _id: feedbackId
  });
}

module.exports = {
  createFeedback,
  deleteFeedbackById
};
