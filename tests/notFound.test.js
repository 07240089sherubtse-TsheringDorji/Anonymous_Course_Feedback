
const request = require('supertest');
const app = require('../app');

describe('Invalid API Routes', () => {
  test('should return 404 for an unknown route', async () => {
    const response = await request(app)
      .get('/api/unknown-route');

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
