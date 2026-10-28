import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import dns from 'node:dns';
import { app } from './index.js';
import { User, Grievance } from './models.js';
import { slaHoursByPriority } from './policies.js';

const configuredDns = process.env.DNS_SERVERS?.split(',').map(s => s.trim()).filter(Boolean);
if (configuredDns?.length) {
  dns.setServers(configuredDns);
}

test.before(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civic_pulse';
  for (let i = 0; i < 30; i++) {
    if (mongoose.connection.readyState === 1) break;
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    } catch (e) {
      // wait and retry
    }
    if (mongoose.connection.readyState === 1) break;
    await new Promise(r => setTimeout(r, 400));
  }
  assert.equal(mongoose.connection.readyState, 1, 'MongoDB must be connected before tests execute');
});

test.after(async () => {
  try {
    await User.deleteMany({ email: /test.*@workflow-test\.local/ });
    await Grievance.deleteMany({ title: /\[WORKFLOW-TEST\]/ });
    await mongoose.disconnect();
  } catch {}
});

test('Civic Pulse Full End-to-End Workflow & Security Suite', async t => {
  const testId = Date.now().toString(36);
  const citizenEmail = `test-citizen-${testId}@workflow-test.local`;
  const citizen2Email = `test-citizen2-${testId}@workflow-test.local`;
  const workerEmail = `test-worker-${testId}@workflow-test.local`;
  const managerEmail = `test-manager-${testId}@workflow-test.local`;
  const password = 'TestPassword123';

  let citizenCookie = '';
  let citizen2Cookie = '';
  let workerCookie = '';
  let managerCookie = '';
  let grievanceId = '';
  let workerId = '';

  await t.test('1. Registration enforces citizen role and input validation', async () => {
    // Malformed email
    const badEmail = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'invalid-email', password, confirmPassword: password });
    assert.equal(badEmail.status, 400);

    // Weak password
    const weakPass = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: citizenEmail, password: 'weak', confirmPassword: 'weak' });
    assert.equal(weakPass.status, 400);

    // Mismatched passwords
    const mismatch = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: citizenEmail, password, confirmPassword: 'Different123' });
    assert.equal(mismatch.status, 400);

    // Valid citizen registration
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane Citizen', email: citizenEmail, password, confirmPassword: password, phone: '555-0199' });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'citizen');
    assert.equal(res.body.user.email, citizenEmail);

    // Register second citizen
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other Citizen', email: citizen2Email, password, confirmPassword: password });
    assert.equal(res2.status, 201);

    // Duplicate email rejected
    const dup = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane Duplicate', email: citizenEmail, password, confirmPassword: password });
    assert.equal(dup.status, 409);
  });

  await t.test('2. Provision staff accounts directly in DB for testing', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    const passwordHash = await bcrypt.hash(password, 10);

    const worker = await User.create({
      name: 'Tom Worker',
      email: workerEmail,
      passwordHash,
      role: 'case_worker',
      department: 'Roads & Works'
    });
    workerId = worker._id.toString();

    const manager = await User.create({
      name: 'Sarah Manager',
      email: managerEmail,
      passwordHash,
      role: 'manager',
      department: 'Operations'
    });
    assert.ok(manager._id);
  });

  await t.test('3. Login authentication returns session cookies and user profiles', async () => {
    // Citizen 1 Login
    const cRes = await request(app)
      .post('/api/auth/login')
      .send({ email: citizenEmail, password });
    assert.equal(cRes.status, 200);
    citizenCookie = cRes.headers['set-cookie'];
    assert.ok(citizenCookie, 'Session cookie must be set');

    // Citizen 2 Login
    const c2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: citizen2Email, password });
    assert.equal(c2Res.status, 200);
    citizen2Cookie = c2Res.headers['set-cookie'];

    // Worker Login
    const wRes = await request(app)
      .post('/api/auth/login')
      .send({ email: workerEmail, password });
    assert.equal(wRes.status, 200);
    assert.equal(wRes.body.user.role, 'case_worker');
    workerCookie = wRes.headers['set-cookie'];

    // Manager Login
    const mRes = await request(app)
      .post('/api/auth/login')
      .send({ email: managerEmail, password });
    assert.equal(mRes.status, 200);
    assert.equal(mRes.body.user.role, 'manager');
    managerCookie = mRes.headers['set-cookie'];
  });

  await t.test('4. Citizen submits grievance with SLA priority deadline calculation', async () => {
    const payload = {
      title: '[WORKFLOW-TEST] Collapsed storm drain causing roadway sinkhole',
      description: 'The underground stormwater pipe collapsed under Elm Street, creating a visible 3-foot sinkhole in the road. Water is pooling rapidly.',
      category: 'Water & Sanitation',
      location: '120 Elm Street at 5th Avenue',
      priority: 'Critical' // SLA = 4 hours
    };

    const res = await request(app)
      .post('/api/grievances')
      .set('Cookie', citizenCookie)
      .send(payload);

    assert.equal(res.status, 201);
    assert.ok(res.body.grievance.reference.startsWith('CP-'));
    assert.equal(res.body.grievance.status, 'Submitted');
    assert.equal(res.body.grievance.priority, 'Critical');

    grievanceId = res.body.grievance.id;

    // Verify SLA deadline is ~4 hours from submission
    const submittedAt = new Date(res.body.grievance.submittedAt).getTime();
    const slaDeadline = new Date(res.body.grievance.slaDeadline).getTime();
    const diffHours = Math.round((slaDeadline - submittedAt) / (3600 * 1000));
    assert.equal(diffHours, slaHoursByPriority.Critical);

    // Initial audit history recorded
    assert.equal(res.body.grievance.history.length, 1);
    assert.equal(res.body.grievance.history[0].status, 'Submitted');
  });

  await t.test('5. Citizen data isolation: citizen cannot view another citizen private case', async () => {
    const denied = await request(app)
      .get(`/api/grievances/${grievanceId}`)
      .set('Cookie', citizen2Cookie);

    assert.equal(denied.status, 403);
    assert.ok(denied.body.error.includes('permission'));
  });

  await t.test('6. Non-manager cannot assign case, manager can assign to active worker', async () => {
    // Citizen attempts assignment -> Forbidden
    const deniedCitizen = await request(app)
      .post(`/api/grievances/${grievanceId}/assign`)
      .set('Cookie', citizenCookie)
      .send({ workerId, reason: 'Illegal assignment' });
    assert.equal(deniedCitizen.status, 403);

    // Manager assigns to worker -> Success
    const assigned = await request(app)
      .post(`/api/grievances/${grievanceId}/assign`)
      .set('Cookie', managerCookie)
      .send({ workerId, reason: 'Assigned to water and road repair specialist' });

    assert.equal(assigned.status, 200);
    assert.equal(assigned.body.grievance.assignee.name, 'Tom Worker');
    assert.equal(assigned.body.grievance.assignmentHistory.length, 1);
    assert.equal(assigned.body.grievance.assignmentHistory[0].reason, 'Assigned to water and road repair specialist');
  });

  await t.test('7. Workflow transitions: strict validation & resolution note requirements', async () => {
    // Invalid transition: Submitted -> Resolved directly (Must be Acknowledged first)
    const invalidSkip = await request(app)
      .patch(`/api/grievances/${grievanceId}/status`)
      .set('Cookie', workerCookie)
      .send({ status: 'Resolved', note: 'Done' });
    assert.equal(invalidSkip.status, 400);

    // Valid transition 1: Submitted -> Acknowledged
    const ack = await request(app)
      .patch(`/api/grievances/${grievanceId}/status`)
      .set('Cookie', workerCookie)
      .send({ status: 'Acknowledged', note: 'Case inspected and acknowledged' });
    assert.equal(ack.status, 200);
    assert.equal(ack.body.grievance.status, 'Acknowledged');

    // Valid transition 2: Acknowledged -> In Progress
    const inProg = await request(app)
      .patch(`/api/grievances/${grievanceId}/status`)
      .set('Cookie', workerCookie)
      .send({ status: 'In Progress', note: 'Excavation crew deployed' });
    assert.equal(inProg.status, 200);
    assert.equal(inProg.body.grievance.status, 'In Progress');

    // Attempt to Resolve without mandatory resolution note -> 400
    const missingNote = await request(app)
      .patch(`/api/grievances/${grievanceId}/status`)
      .set('Cookie', workerCookie)
      .send({ status: 'Resolved', note: '' });
    assert.equal(missingNote.status, 400);
    assert.ok(missingNote.body.error.includes('resolution note'));

    // Resolve with proper resolution note -> 200
    const resolved = await request(app)
      .patch(`/api/grievances/${grievanceId}/status`)
      .set('Cookie', workerCookie)
      .send({ status: 'Resolved', note: 'Culvert replaced with reinforced precast concrete. Asphalt restored.' });
    assert.equal(resolved.status, 200);
    assert.equal(resolved.body.grievance.status, 'Resolved');
    assert.ok(resolved.body.grievance.resolvedAt);
    assert.equal(resolved.body.grievance.resolutionNote, 'Culvert replaced with reinforced precast concrete. Asphalt restored.');
  });

  await t.test('8. Reopening requires reason and restores case to In Progress', async () => {
    // Missing reason -> 400
    const missingReason = await request(app)
      .post(`/api/grievances/${grievanceId}/reopen`)
      .set('Cookie', citizenCookie)
      .send({ reason: '' });
    assert.equal(missingReason.status, 400);

    // Valid reopen by citizen owner -> 200
    const reopened = await request(app)
      .post(`/api/grievances/${grievanceId}/reopen`)
      .set('Cookie', citizenCookie)
      .send({ reason: 'Asphalt settled by 2 inches overnight after heavy rain.' });
    assert.equal(reopened.status, 200);
    assert.equal(reopened.body.grievance.status, 'In Progress');
    assert.ok(reopened.body.grievance.reopenedAt);
    assert.equal(reopened.body.grievance.reopenReason, 'Asphalt settled by 2 inches overnight after heavy rain.');
  });

  await t.test('9. Dashboard stats accurately reflect real database metrics', async () => {
    const dash = await request(app)
      .get('/api/dashboard/stats')
      .set('Cookie', managerCookie);

    assert.equal(dash.status, 200);
    assert.ok(dash.body.stats.total >= 1);
    assert.ok(dash.body.stats.statusDistribution);
    assert.ok(dash.body.stats.priorityDistribution);
  });

  await t.test('10. Role boundaries and unauthenticated access restrictions', async () => {
    // Unauthenticated access rejected with 401
    const unauth = await request(app).get('/api/dashboard/stats');
    assert.equal(unauth.status, 401);

    // Citizen attempting administrative user listing rejected with 403
    const citizenAdminAccess = await request(app)
      .get('/api/users')
      .set('Cookie', citizenCookie);
    assert.equal(citizenAdminAccess.status, 403);

    // Case worker attempting administrative user listing rejected with 403
    const workerAdminAccess = await request(app)
      .get('/api/users')
      .set('Cookie', workerCookie);
    assert.equal(workerAdminAccess.status, 403);

    // Citizen attempting worker allocation listing rejected with 403
    const citizenWorkerList = await request(app)
      .get('/api/users/workers')
      .set('Cookie', citizenCookie);
    assert.equal(citizenWorkerList.status, 403);
  });
});
