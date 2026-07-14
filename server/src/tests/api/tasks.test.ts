import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Tasks API Endpoints', () => {
  it('should return a generated 2x2 determinant task on GET /api/tasks/determinant', async () => {
    const res = await request(app)
      .get('/api/tasks/determinant')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('type', 'lin_alg_det');
    expect(res.body).toHaveProperty('matrix');
    expect(res.body).toHaveProperty('latex');
    expect(res.body).toHaveProperty('answer');
    expect(res.body).toHaveProperty('steps');
    expect(Array.isArray(res.body.steps)).toBe(true);
  });

  it('should respond to health check on GET /health', async () => {
    const res = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toEqual({ status: 'OK' });
  });
});
