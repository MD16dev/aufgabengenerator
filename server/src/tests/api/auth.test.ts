import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('Auth & Score API Endpoints', () => {
  const uniqueUsername = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const password = 'password123';
  let token = '';

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: uniqueUsername, password })
      .expect(201);

    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username', uniqueUsername);
    token = res.body.token;
  });

  it('should not register duplicate username', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: uniqueUsername, password })
      .expect(400);
  });

  it('should login the registered user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: uniqueUsername, password })
      .expect(200);

    expect(res.body).toHaveProperty('token');
  });

  it('should fetch the profile with token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('username', uniqueUsername);
    expect(res.body).toHaveProperty('solvedCount');
  });

  it('should reject profile fetch without token', async () => {
    await request(app)
      .get('/api/auth/me')
      .expect(401);
  });

  it('should solve a task and increment points in the DB', async () => {
    const res = await request(app)
      .post('/api/tasks/solve')
      .set('Authorization', `Bearer ${token}`)
      .send({ taskTypeId: 'lin_alg_det' })
      .expect(201);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('solvedCount', 1);

    // Profile solvedCount should now be 1
    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profileRes.body.solvedCount).toBe(1);
  });
});
