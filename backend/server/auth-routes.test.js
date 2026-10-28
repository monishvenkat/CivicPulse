import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import dns from 'node:dns';
import { app } from './index.js';
import { User } from './models.js';

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
    } catch {}
    if (mongoose.connection.readyState === 1) break;
    await new Promise(r => setTimeout(r, 400));
  }
  assert.equal(mongoose.connection.readyState, 1);
});

test.after(async () => {
  try {
    await User.deleteMany({ email: /auth-scenario-.*@civicpulse\.test/ });
    await mongoose.disconnect();
  } catch {}
});

test('Citizen vs Official Authentication & Segregation Test Suite', async t => {
  const testId = Date.now().toString(36);
  const citizenEmail = `auth-scenario-citizen-${testId}@civicpulse.test`;
  const workerEmail = `auth-scenario-worker-${testId}@civicpulse.test`;
  const managerEmail = `auth-scenario-manager-${testId}@civicpulse.test`;
  const adminEmail = `auth-scenario-admin-${testId}@civicpulse.test`;
  const password = 'ScenarioPass123';

  // 1. Citizen registration creates citizen role only (ignoring role manipulation)
  await t.test('1. Registration strictly forces citizen role, even if role=admin is requested', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Citizen Tester',
        email: citizenEmail,
        password,
        confirmPassword: password,
        role: 'admin' // Attempted privilege escalation
      });

    assert.equal(regRes.status, 201);
    assert.equal(regRes.body.user.role, 'citizen', 'Role must remain citizen');
  });

  // Provision official test accounts directly
  await t.test('2. Provision test official accounts (worker, manager, admin)', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    const passwordHash = await bcrypt.hash(password, 10);

    await User.create([
      { name: 'Worker Tester', email: workerEmail, passwordHash, role: 'case_worker', department: 'Public Works' },
      { name: 'Manager Tester', email: managerEmail, passwordHash, role: 'manager', department: 'Operations' },
      { name: 'Admin Tester', email: adminEmail, passwordHash, role: 'admin', department: 'Administration' }
    ]);
  });

  let citizenCookie = '';
  let workerCookie = '';
  let managerCookie = '';
  let adminCookie = '';

  // 3. Citizen login returns citizen profile
  await t.test('3. Citizen login successfully returns verified citizen role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: citizenEmail, password });

    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, 'citizen');
    citizenCookie = res.headers['set-cookie'];
    assert.ok(citizenCookie);
  });

  // 4. Official logins return verified official roles
  await t.test('4. Official logins return verified staff roles', async () => {
    // Worker
    const wRes = await request(app)
      .post('/api/auth/login')
      .send({ email: workerEmail, password });
    assert.equal(wRes.status, 200);
    assert.equal(wRes.body.user.role, 'case_worker');
    workerCookie = wRes.headers['set-cookie'];

    // Manager
    const mRes = await request(app)
      .post('/api/auth/login')
      .send({ email: managerEmail, password });
    assert.equal(mRes.status, 200);
    assert.equal(mRes.body.user.role, 'manager');
    managerCookie = mRes.headers['set-cookie'];

    // Admin
    const aRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password });
    assert.equal(aRes.status, 200);
    assert.equal(aRes.body.user.role, 'admin');
    adminCookie = aRes.headers['set-cookie'];
  });

  // 5. Invalid credentials rejection
  await t.test('5. Invalid credentials return 401 error', async () => {
    const badPass = await request(app)
      .post('/api/auth/login')
      .send({ email: citizenEmail, password: 'WrongPassword999' });
    assert.equal(badPass.status, 401);
    assert.equal(badPass.body.error, 'Email or password is incorrect.');

    const badEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@civicpulse.test', password });
    assert.equal(badEmail.status, 401);
  });

  // 6. Access restrictions: Citizen barred from official-only endpoints
  await t.test('6. Citizen barred from official-only backend operations', async () => {
    // Worker listing (manager/admin only)
    const workersRes = await request(app)
      .get('/api/users/workers')
      .set('Cookie', citizenCookie);
    assert.equal(workersRes.status, 403);

    // Escalations listing (manager/admin only)
    const escalationsRes = await request(app)
      .get('/api/escalations')
      .set('Cookie', citizenCookie);
    assert.equal(escalationsRes.status, 403);

    // User management (admin only)
    const usersRes = await request(app)
      .get('/api/users')
      .set('Cookie', citizenCookie);
    assert.equal(usersRes.status, 403);
  });

  // 7. Case worker barred from admin-only endpoints
  await t.test('7. Case worker barred from administrative user management', async () => {
    const usersRes = await request(app)
      .get('/api/users')
      .set('Cookie', workerCookie);
    assert.equal(usersRes.status, 403);
  });

  // 8. Unauthenticated access rejected with 401
  await t.test('8. Unauthenticated access to /api/auth/me or /api/dashboard rejected with 401', async () => {
    const meRes = await request(app).get('/api/auth/me');
    assert.equal(meRes.status, 401);

    const dashRes = await request(app).get('/api/dashboard');
    assert.equal(dashRes.status, 401);
  });

  // 9. Logout clears session cookie
  await t.test('9. Logout clears civic_session cookie', async () => {
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', citizenCookie);
    assert.equal(logoutRes.status, 200);
    const cookies = logoutRes.headers['set-cookie'] || [];
    assert.ok(cookies.some(c => c.includes('civic_session=;')));
  });
});
