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
    expect(res.body.user).toHaveProperty('displayName', uniqueUsername);
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
    expect(res.body).toHaveProperty('displayName', uniqueUsername);
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

  it('should update profile fields successfully', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        displayName: 'NeuerName',
        profilePic: 'data:image/png;base64,iVBORw0KGgoAAAANS...'
      })
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.user).toHaveProperty('displayName', 'NeuerName');
    expect(res.body.user).toHaveProperty('profilePic', 'data:image/png;base64,iVBORw0KGgoAAAANS...');

    // Verify via /me endpoint
    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profileRes.body.displayName).toBe('NeuerName');
    expect(profileRes.body.profilePic).toBe('data:image/png;base64,iVBORw0KGgoAAAANS...');
  });

  it('should fail profile update with short display name', async () => {
    await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'a' })
      .expect(400);
  });

  it('should change password successfully', async () => {
    // Change password
    await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'newpassword123' })
      .expect(200);

    // Try logging in with the old password (should fail)
    await request(app)
      .post('/api/auth/login')
      .send({ username: uniqueUsername, password })
      .expect(401);

    // Login with the new password (should succeed)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: uniqueUsername, password: 'newpassword123' })
      .expect(200);

    expect(loginRes.body).toHaveProperty('token');
  });

  it('should fetch filtered leaderboards', async () => {
    // Fetch global
    const globalRes = await request(app)
      .get('/api/tasks/leaderboard')
      .expect(200);
    expect(Array.isArray(globalRes.body)).toBe(true);

    // Fetch filtered by module
    const moduleRes = await request(app)
      .get('/api/tasks/leaderboard?module=Lineare Algebra')
      .expect(200);
    expect(Array.isArray(moduleRes.body)).toBe(true);

    // Fetch filtered by task
    const taskRes = await request(app)
      .get('/api/tasks/leaderboard?taskId=lin_alg_det')
      .expect(200);
    expect(Array.isArray(taskRes.body)).toBe(true);
  });
});
