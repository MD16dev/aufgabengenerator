import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../utils/db';

describe('Feedback API Endpoints', () => {
  const testMessageGuest = 'Das ist ein Test-Feedback von einem Gast-Benutzer.';
  const testMessageUser = 'Das ist ein Test-Bugreport von einem angemeldeten Benutzer.';
  const testEmail = 'gast@test.de';
  
  let createdFeedbackIds: string[] = [];
  let testUserId = '';
  let token = '';

  afterAll(async () => {
    // Clean up created feedback records
    try {
      if (createdFeedbackIds.length > 0) {
        await prisma.feedback.deleteMany({
          where: {
            id: { in: createdFeedbackIds }
          }
        });
      }

      // Clean up test user if created
      if (testUserId) {
        await prisma.solvedTask.deleteMany({
          where: { userId: testUserId }
        });
        await prisma.user.delete({
          where: { id: testUserId }
        });
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should successfully submit feedback as a guest', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        category: 'FEEDBACK',
        message: testMessageGuest,
        email: testEmail
      })
      .expect(201);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.feedback).toHaveProperty('id');
    expect(res.body.feedback).toHaveProperty('category', 'FEEDBACK');
    expect(res.body.feedback).toHaveProperty('message', testMessageGuest);
    expect(res.body.feedback).toHaveProperty('email', testEmail);

    createdFeedbackIds.push(res.body.feedback.id);
  });

  it('should reject feedback with a message shorter than 5 characters', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        category: 'FEEDBACK',
        message: 'Hi',
        email: testEmail
      })
      .expect(400);

    expect(res.body.error).toHaveProperty('message');
  });

  it('should reject feedback with an invalid category', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        category: 'INVALID_CAT',
        message: testMessageGuest,
        email: testEmail
      })
      .expect(400);

    expect(res.body.error).toHaveProperty('message');
  });

  it('should successfully submit feedback as an authenticated user', async () => {
    // 1. Register a test user
    const username = `feedback_user_${Date.now()}`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ username, password: 'password123' })
      .expect(201);

    token = registerRes.body.token;
    testUserId = registerRes.body.user.id;

    // 2. Submit bug report with token
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'BUG',
        message: testMessageUser
      })
      .expect(201);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.feedback).toHaveProperty('id');
    expect(res.body.feedback).toHaveProperty('category', 'BUG');
    expect(res.body.feedback).toHaveProperty('message', testMessageUser);
    expect(res.body.feedback.email).toBeNull();

    createdFeedbackIds.push(res.body.feedback.id);

    // Verify it was correctly stored with the user's ID in the database
    const storedFeedback = await prisma.feedback.findUnique({
      where: { id: res.body.feedback.id }
    });
    expect(storedFeedback).not.toBeNull();
    expect(storedFeedback?.userId).toBe(testUserId);
  });

  it('should reject admin feedback list without authentication', async () => {
    await request(app)
      .get('/api/feedback')
      .expect(401);
  });

  it('should reject admin feedback list for non-admin users', async () => {
    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(res.body.error).toHaveProperty('message');
  });

  it('should allow admin to fetch all feedback entries', async () => {
    const originalAdmin = process.env.ADMIN_USERNAME;
    process.env.ADMIN_USERNAME = `feedback_user_${Date.now()}`;

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminRegisterRes = await request(app)
      .post('/api/auth/register')
      .send({ username: adminUsername, password: 'password123' })
      .expect(201);

    const adminToken = adminRegisterRes.body.token;
    const adminUserId = adminRegisterRes.body.user.id;

    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    process.env.ADMIN_USERNAME = originalAdmin;

    await prisma.user.delete({ where: { id: adminUserId } });
  });

  it('should reject GitHub issue creation without GITHUB_TOKEN', async () => {
    const originalAdmin = process.env.ADMIN_USERNAME;
    const originalToken = process.env.GITHUB_TOKEN;
    process.env.ADMIN_USERNAME = `gh_admin_${Date.now()}`;
    delete process.env.GITHUB_TOKEN;

    const adminRegisterRes = await request(app)
      .post('/api/auth/register')
      .send({ username: process.env.ADMIN_USERNAME, password: 'password123' })
      .expect(201);

    const adminToken = adminRegisterRes.body.token;
    const adminUserId = adminRegisterRes.body.user.id;
    const feedbackId = createdFeedbackIds[0];

    const res = await request(app)
      .post(`/api/feedback/${feedbackId}/github-issue`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(500);

    expect(res.body.error.message).toContain('GITHUB_TOKEN');

    process.env.ADMIN_USERNAME = originalAdmin;
    if (originalToken) process.env.GITHUB_TOKEN = originalToken;

    await prisma.user.delete({ where: { id: adminUserId } });
  });
});
