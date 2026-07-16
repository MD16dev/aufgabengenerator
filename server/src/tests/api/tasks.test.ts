import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Tasks API Endpoints', () => {
  it('should return a generated 2x2 determinant task on GET /api/tasks/lin_alg_det', async () => {
    const res = await request(app)
      .get('/api/tasks/lin_alg_det')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('type', 'lin_alg_det');
    expect(res.body).toHaveProperty('mathQuery');
    expect(res.body).toHaveProperty('answer');
    expect(res.body).toHaveProperty('explanation');
    expect(Array.isArray(res.body.explanation)).toBe(true);
  });

  it('should return 404 for an unknown task type', async () => {
    const res = await request(app)
      .get('/api/tasks/does_not_exist')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(res.body).toHaveProperty('error');
  });

  it('should respond to health check on GET /health', async () => {
    const res = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toEqual({ status: 'OK' });
  });
});
