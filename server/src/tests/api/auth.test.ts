import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../utils/db';

describe('Auth & Score API Endpoints', () => {
  const uniqueUsername = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const password = 'password123';
  let token = '';

  afterAll(async () => {
    // Clean up test user records to keep the database clean
    try {
      const testUser = await prisma.user.findUnique({
        where: { username: uniqueUsername }
      });
      if (testUser) {
        await prisma.solvedTask.deleteMany({
          where: { userId: testUser.id }
        });
        await prisma.user.delete({
          where: { id: testUser.id }
        });
      }
    } catch (err) {
      // Ignore if user doesn't exist
    }
  });

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

  describe('Admin user management', () => {
    let adminToken = '';
    let adminUserId = '';
    let targetUserId = '';

    beforeAll(async () => {
      const originalAdmin = process.env.ADMIN_USERNAMES;
      process.env.ADMIN_USERNAMES = `mgmt_admin_${Date.now()}`;

      const adminRes = await request(app)
        .post('/api/auth/register')
        .send({ username: process.env.ADMIN_USERNAMES, password: 'password123' })
        .expect(201);
      adminToken = adminRes.body.token;
      adminUserId = adminRes.body.user.id;

      const targetRes = await request(app)
        .post('/api/auth/register')
        .send({ username: `mgmt_target_${Date.now()}`, password: 'password123' })
        .expect(201);
      targetUserId = targetRes.body.user.id;

      process.env.ADMIN_USERNAMES = originalAdmin || '';
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { id: { in: [adminUserId, targetUserId] } } });
    });

    it('should reject user list for non-admin users', async () => {
      await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should list users for an admin', async () => {
      const res = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const target = res.body.find((u: any) => u.id === targetUserId);
      expect(target).toBeDefined();
      expect(target.isAdmin).toBe(false);
    });

    it('should promote a user to admin', async () => {
      const res = await request(app)
        .patch(`/api/auth/users/${targetUserId}/admin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isAdmin: true })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.user.isAdmin).toBe(true);

      // The promoted user's token now carries admin rights
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: res.body.user.username, password: 'password123' })
        .expect(200);
      expect(loginRes.body.user.isAdmin).toBe(true);
    });

    it('should not allow an admin to change their own admin rights', async () => {
      await request(app)
        .patch(`/api/auth/users/${adminUserId}/admin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isAdmin: false })
        .expect(400);
    });

    it('should reject promoting a user with an invalid payload', async () => {
      await request(app)
        .patch(`/api/auth/users/${targetUserId}/admin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isAdmin: 'yes' })
        .expect(400);
    });
  });
});
