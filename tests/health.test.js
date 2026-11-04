
const request = require('supertest');
const app = require('../app');

describe('Health Check API', () => {
  test('should return successful health status', async () => {
    const response = await request(app)
      .get('/api/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
  });
});
