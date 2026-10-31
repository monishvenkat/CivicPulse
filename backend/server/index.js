import 'dotenv/config';
import dns from 'node:dns';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { User, Grievance } from './models.js';
import { authenticate, allow, issueSession, cookieName } from './auth.js';
import {
  emailOk,
  passwordOk,
  transitions,
  slaHoursByPriority,
  categories,
  priorities,
  statusValues
} from './policies.js';

const app = express();
app.disable('x-powered-by');

// CORS — must be registered before all routes so preflight OPTIONS requests are handled
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : [];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());

const here = path.dirname(fileURLToPath(import.meta.url));
const configuredDns = process.env.DNS_SERVERS?.split(',').map(server => server.trim()).filter(Boolean);
if (configuredDns?.length) {
  dns.setServers(configuredDns);
}

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });

const safeUser = u => ({
  _id: u.id || u._id,
  id: u.id || u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department,
  phone: u.phone,
  active: u.active,
  createdAt: u.createdAt
});

const serialize = g => {
  if (!g) return null;
  return {
    _id: g.id || g._id,
    id: g.id || g._id,
    reference: g.reference,
    citizen: g.citizen?._id ? safeUser(g.citizen) : g.citizen,
    title: g.title,
    description: g.description,
    category: g.category,
    location: g.location,
    priority: g.priority,
    status: g.status,
    assignee: g.assignee?._id ? safeUser(g.assignee) : g.assignee,
    submittedAt: g.submittedAt,
    slaDeadline: g.slaDeadline,
    resolutionNote: g.resolutionNote,
    resolvedAt: g.resolvedAt,
    closedAt: g.closedAt,
    reopenedAt: g.reopenedAt,
    reopenReason: g.reopenReason,
    history: g.history || [],
    assignmentHistory: g.assignmentHistory || [],
    escalation: g.escalation || { level: 0, reason: null, triggeredAt: null, state: 'none' },
    createdAt: g.createdAt,
    updatedAt: g.updatedAt
  };
};

export async function checkAndEscalateOverdueCases() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const now = new Date();
    await Grievance.updateMany(
      {
        status: { $nin: ['Resolved', 'Closed'] },
        slaDeadline: { $lt: now },
        'escalation.state': 'none'
      },
      {
        $set: {
          'escalation.level': 1,
          'escalation.reason': 'Service SLA deadline exceeded',
          'escalation.triggeredAt': now,
          'escalation.state': 'open'
        }
      }
    );
  } catch (e) {
    console.error('Escalation sweep error:', e.message);
  }
}

// Health check
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    ok: connected,
    database: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Database connectivity gatekeeper for other /api routes
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'The database is temporarily unavailable. The server will retry the connection.',
      database: 'disconnected'
    });
  }
  next();
});

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------
app.post('/api/auth/register', authLimit, async (req, res) => {
  const { name, email, password, confirmPassword, phone } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ error: 'Enter a full name between 2 and 100 characters.' });
  }
  if (!emailOk(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (!passwordOk(password)) {
    return res.status(400).json({ error: 'Password must be 10â€“72 characters with uppercase, lowercase, and a number.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    // Role is explicitly hardcoded to citizen - no privilege escalation
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'citizen',
      phone: typeof phone === 'string' ? phone.trim().slice(0, 25) : undefined
    });
    return res.status(201).json({ user: safeUser(user), message: 'Account created successfully.' });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('Registration failed:', e.message);
    return res.status(500).json({ error: 'We could not create your account. Please try again.' });
  }
});

app.post('/api/auth/login', authLimit, async (req, res) => {
  const { email, password } = req.body || {};
  if (!emailOk(email) || typeof password !== 'string') {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  issueSession(res, user);
  return res.json({ user: safeUser(user) });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/'
  });
  res.json({ ok: true, message: 'Logged out successfully.' });
});

app.post('/api/auth/forgot-password', authLimit, async (req, res) => {
  if (!emailOk(req.body?.email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  // Clear honest response as requested by problem statement
  res.json({
    message: 'If an account exists, recovery instructions have been recorded. Note: Password recovery email service is not configured in this demonstration environment.'
  });
});

// ----------------------------------------------------
// PROTECTED API MIDDLEWARE
// ----------------------------------------------------
app.use('/api', authenticate);
app.use('/api', (req, res, next) => {
  const origin = req.get('origin');
  const expected = process.env.CLIENT_ORIGIN;
  if (origin && expected && origin !== expected) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }
  next();
});

// ----------------------------------------------------
// DASHBOARD & ANALYTICS ROUTES
// ----------------------------------------------------
const getDashboardStats = async (req, res) => {
  await checkAndEscalateOverdueCases();
  const role = req.user.role;
  const now = new Date();

  if (role === 'citizen') {
    const base = { citizen: req.user._id };
    const [total, inProgress, overdue, resolved, recent] = await Promise.all([
      Grievance.countDocuments(base),
      Grievance.countDocuments({ ...base, status: { $in: ['Submitted', 'Acknowledged', 'In Progress', 'Awaiting Information'] } }),
      Grievance.countDocuments({ ...base, status: { $nin: ['Resolved', 'Closed'] }, slaDeadline: { $lt: now } }),
      Grievance.countDocuments({ ...base, status: { $in: ['Resolved', 'Closed'] } }),
      Grievance.find(base).sort({ createdAt: -1 }).limit(5).populate('assignee', 'name email department')
    ]);

    return res.json({
      stats: {
        total,
        open: inProgress,
        inProgress,
        overdue,
        resolved
      },
      recent: recent.map(serialize)
    });
  }

  if (role === 'case_worker') {
    const base = { assignee: req.user._id };
    const [total, pending, inProgress, awaitingInfo, overdue, resolved, priorityAgg, recent] = await Promise.all([
      Grievance.countDocuments(base),
      Grievance.countDocuments({ ...base, status: { $in: ['Submitted', 'Acknowledged'] } }),
      Grievance.countDocuments({ ...base, status: 'In Progress' }),
      Grievance.countDocuments({ ...base, status: 'Awaiting Information' }),
      Grievance.countDocuments({ ...base, status: { $nin: ['Resolved', 'Closed'] }, slaDeadline: { $lt: now } }),
      Grievance.countDocuments({ ...base, status: { $in: ['Resolved', 'Closed'] } }),
      Grievance.aggregate([
        { $match: { ...base, status: { $nin: ['Resolved', 'Closed'] } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Grievance.find(base).sort({ slaDeadline: 1 }).limit(8).populate('citizen', 'name email phone')
    ]);

    const priorityDistribution = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    priorityAgg.forEach(p => { if (priorityDistribution[p._id] !== undefined) priorityDistribution[p._id] = p.count; });

    return res.json({
      stats: {
        total,
        open: pending + inProgress + awaitingInfo,
        pending,
        inProgress,
        awaitingInfo,
        overdue,
        resolved,
        priorityDistribution
      },
      approaching: recent.map(serialize)
    });
  }

  // Manager & Administrator
  const [
    total,
    pending,
    inProgress,
    awaitingInfo,
    resolved,
    closed,
    overdue,
    escalated,
    statusAgg,
    priorityAgg,
    categoryAgg,
    workerWorkload
  ] = await Promise.all([
    Grievance.countDocuments(),
    Grievance.countDocuments({ status: { $in: ['Submitted', 'Acknowledged'] } }),
    Grievance.countDocuments({ status: 'In Progress' }),
    Grievance.countDocuments({ status: 'Awaiting Information' }),
    Grievance.countDocuments({ status: 'Resolved' }),
    Grievance.countDocuments({ status: 'Closed' }),
    Grievance.countDocuments({ status: { $nin: ['Resolved', 'Closed'] }, slaDeadline: { $lt: now } }),
    Grievance.countDocuments({ 'escalation.state': { $in: ['open', 'acknowledged'] } }),
    Grievance.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Grievance.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Grievance.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { role: 'case_worker', active: true } },
      {
        $lookup: {
          from: 'grievances',
          let: { workerId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$assignee', '$$workerId'] },
                    { $not: { $in: ['$status', ['Resolved', 'Closed']] } }
                  ]
                }
              }
            }
          ],
          as: 'activeCases'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          department: 1,
          activeCaseCount: { $size: '$activeCases' }
        }
      }
    ])
  ]);

  let userStats = null;
  if (role === 'admin') {
    const [totalUsers, activeUsers, roleAgg] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
    ]);
    const byRole = { citizen: 0, case_worker: 0, manager: 0, admin: 0 };
    roleAgg.forEach(r => { if (byRole[r._id] !== undefined) byRole[r._id] = r.count; });
    userStats = { totalUsers, activeUsers, byRole };
  }

  const statusDistribution = {};
  statusValues.forEach(s => { statusDistribution[s] = 0; });
  statusAgg.forEach(s => { if (s._id) statusDistribution[s._id] = s.count; });

  const priorityDistribution = {};
  priorities.forEach(p => { priorityDistribution[p] = 0; });
  priorityAgg.forEach(p => { if (p._id) priorityDistribution[p._id] = p.count; });

  const categoryDistribution = {};
  categoryAgg.forEach(c => { if (c._id) categoryDistribution[c._id] = c.count; });

  res.json({
    stats: {
      total,
      open: pending + inProgress + awaitingInfo,
      pending,
      inProgress,
      awaitingInfo,
      resolved,
      closed,
      overdue,
      escalated,
      statusDistribution,
      priorityDistribution,
      categoryDistribution,
      workerWorkload,
      userStats
    }
  });
};

app.get('/api/dashboard', getDashboardStats);
app.get('/api/dashboard/stats', getDashboardStats);

// ----------------------------------------------------
// GRIEVANCES ROUTES
// ----------------------------------------------------

// List grievances according to authenticated user role and query filters
app.get('/api/grievances', async (req, res) => {
  await checkAndEscalateOverdueCases();
  const filter = {};

  if (req.user.role === 'citizen') {
    filter.citizen = req.user._id;
  } else if (req.user.role === 'case_worker') {
    filter.assignee = req.user._id;
  }

  if (req.query.status) {
    const statuses = req.query.status.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length === 1) filter.status = statuses[0];
    else if (statuses.length > 1) filter.status = { $in: statuses };
  }

  if (req.query.priority && priorities.includes(req.query.priority)) {
    filter.priority = req.query.priority;
  }

  if (req.query.category && categories.includes(req.query.category)) {
    filter.category = req.query.category;
  }

  if (req.query.overdue === 'true') {
    filter.status = { $nin: ['Resolved', 'Closed'] };
    filter.slaDeadline = { $lt: new Date() };
  }

  if (req.query.escalated === 'true') {
    filter['escalation.state'] = { $in: ['open', 'acknowledged'] };
  }

  if (req.query.unassigned === 'true') {
    filter.assignee = null;
  }

  if (req.query.q) {
    const escaped = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [
      { title: regex },
      { reference: regex },
      { location: regex },
      { category: regex }
    ];
  }

  const limit = Math.min(Math.max(1, Number(req.query.limit) || 100), 200);
  const skip = Math.max(0, Number(req.query.skip) || 0);

  const [items, totalCount] = await Promise.all([
    Grievance.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignee', 'name email department')
      .populate('citizen', 'name email phone'),
    Grievance.countDocuments(filter)
  ]);

  res.json({
    grievances: items.map(serialize),
    total: totalCount
  });
});

// Citizen explicit endpoint: My grievances
app.get('/api/grievances/mine', allow('citizen'), async (req, res) => {
  const filter = { citizen: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const escaped = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ title: regex }, { reference: regex }, { location: regex }];
  }

  const items = await Grievance.find(filter)
    .sort({ createdAt: -1 })
    .populate('assignee', 'name email department');

  res.json({ grievances: items.map(serialize) });
});

// Submit a grievance (Citizens only)
app.post('/api/grievances', allow('citizen'), async (req, res) => {
  const { title, description, category, location, priority = 'Medium' } = req.body || {};

  if (typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 120) {
    return res.status(400).json({ error: 'Title must be between 5 and 120 characters.' });
  }
  if (typeof description !== 'string' || description.trim().length < 20 || description.trim().length > 4000) {
    return res.status(400).json({ error: 'Description must be between 20 and 4000 characters.' });
  }
  if (!categories.includes(category)) {
    return res.status(400).json({ error: 'Select a valid category.' });
  }
  if (typeof location !== 'string' || location.trim().length < 2 || location.trim().length > 200) {
    return res.status(400).json({ error: 'Enter a valid location or service area (2â€“200 characters).' });
  }

  const chosenPriority = priorities.includes(priority) ? priority : 'Medium';
  const hours = slaHoursByPriority[chosenPriority] || 48;
  const slaDeadline = new Date(Date.now() + hours * 3600 * 1000);

  // Generate unique human-readable reference number
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const reference = `CP-${dateStr}-${randSuffix}`;

  const grievance = await Grievance.create({
    reference,
    citizen: req.user._id,
    title: title.trim(),
    description: description.trim(),
    category,
    location: location.trim(),
    priority: chosenPriority,
    status: 'Submitted',
    slaDeadline,
    history: [
      {
        previousStatus: null,
        status: 'Submitted',
        actor: req.user._id,
        note: 'Grievance submitted by citizen',
        at: new Date()
      }
    ]
  });

  const populated = await Grievance.findById(grievance._id).populate('citizen', 'name email phone');
  res.status(201).json({ grievance: serialize(populated), message: 'Grievance submitted successfully.' });
});

// Get individual grievance by ID or Reference
app.get('/api/grievances/:id', async (req, res) => {
  await checkAndEscalateOverdueCases();
  const query = mongoose.Types.ObjectId.isValid(req.params.id)
    ? { _id: req.params.id }
    : { reference: req.params.id.toUpperCase() };

  const g = await Grievance.findOne(query)
    .populate('assignee', 'name email department phone')
    .populate('citizen', 'name email phone')
    .populate('history.actor', 'name role department')
    .populate('assignmentHistory.actor', 'name role')
    .populate('assignmentHistory.from', 'name email department')
    .populate('assignmentHistory.to', 'name email department');

  if (!g) {
    return res.status(404).json({ error: 'Grievance not found.' });
  }

  // Isolation check: citizens can only view their own grievances
  if (req.user.role === 'citizen' && !g.citizen._id.equals(req.user._id)) {
    return res.status(403).json({ error: 'You do not have permission to view this grievance.' });
  }

  // Case workers can only view cases assigned to them
  if (req.user.role === 'case_worker' && (!g.assignee || !g.assignee._id.equals(req.user._id))) {
    return res.status(403).json({ error: 'This grievance is not assigned to your account.' });
  }

  res.json({ grievance: serialize(g) });
});

// Update grievance status with strict transition rules
app.patch('/api/grievances/:id/status', allow('case_worker', 'manager', 'admin'), async (req, res) => {
  const { status, note = '' } = req.body || {};
  const g = await Grievance.findById(req.params.id);
  if (!g) return res.status(404).json({ error: 'Grievance not found.' });

  // If case worker, verify case assignment
  if (req.user.role === 'case_worker' && (!g.assignee || !g.assignee.equals(req.user._id))) {
    return res.status(403).json({ error: 'This grievance is not assigned to you.' });
  }

  // Validate state transition
  const allowedNext = transitions[g.status] || [];
  if (!allowedNext.includes(status)) {
    return res.status(400).json({
      error: `Invalid transition: cannot change status from '${g.status}' to '${status}'. Allowed next transitions: ${allowedNext.join(', ') || 'None'}.`
    });
  }

  if (typeof note !== 'string' || note.length > 2000) {
    return res.status(400).json({ error: 'Notes must be 2000 characters or fewer.' });
  }

  // Resolution note mandatory when moving to Resolved
  if (status === 'Resolved' && note.trim().length < 5) {
    return res.status(400).json({ error: 'A resolution note of at least 5 characters is required when resolving a case.' });
  }

  const previousStatus = g.status;
  g.status = status;

  if (status === 'Resolved') {
    g.resolutionNote = note.trim();
    g.resolvedAt = new Date();
    if (g.escalation.state === 'open' || g.escalation.state === 'acknowledged') {
      g.escalation.state = 'resolved';
    }
  }

  if (status === 'Closed') {
    g.closedAt = new Date();
  }

  g.history.push({
    previousStatus,
    status,
    actor: req.user._id,
    note: note.trim() || undefined,
    at: new Date()
  });

  await g.save();
  const populated = await Grievance.findById(g._id)
    .populate('assignee', 'name email department')
    .populate('citizen', 'name email phone');

  res.json({ grievance: serialize(populated), message: `Status updated to ${status}.` });
});

// Assign or Reassign grievance (Managers & Admins)
const handleAssignment = async (req, res) => {
  const workerId = req.body?.workerId || req.body?.assigneeId;
  const reason = req.body?.reason || '';

  const [g, worker] = await Promise.all([
    Grievance.findById(req.params.id),
    User.findById(workerId)
  ]);

  if (!g) return res.status(404).json({ error: 'Grievance not found.' });
  if (!worker || worker.role !== 'case_worker' || !worker.active) {
    return res.status(400).json({ error: 'Select an active case worker.' });
  }
  if (typeof reason !== 'string' || reason.length > 500) {
    return res.status(400).json({ error: 'Assignment reason must be 500 characters or fewer.' });
  }

  const previousAssignee = g.assignee;
  g.assignee = worker._id;
  // Preserve SLA deadline silently - do not reset SLA!
  g.assignmentHistory.push({
    from: previousAssignee,
    to: worker._id,
    actor: req.user._id,
    reason: reason.trim(),
    at: new Date()
  });

  await g.save();
  const populated = await Grievance.findById(g._id)
    .populate('assignee', 'name email department')
    .populate('citizen', 'name email phone');

  res.json({ grievance: serialize(populated), message: `Grievance assigned to ${worker.name}.` });
};

app.post('/api/grievances/:id/assign', allow('manager', 'admin'), handleAssignment);
app.patch('/api/grievances/:id/assignment', allow('manager', 'admin'), handleAssignment);

// Reopen a grievance (Citizen owner, Manager, Admin)
app.post('/api/grievances/:id/reopen', async (req, res) => {
  const { reason = '' } = req.body || {};
  const g = await Grievance.findById(req.params.id);
  if (!g) return res.status(404).json({ error: 'Grievance not found.' });

  // Citizen must be the owner, or actor must be manager or admin
  if (req.user.role === 'citizen' && !g.citizen.equals(req.user._id)) {
    return res.status(403).json({ error: 'You do not have permission to reopen this grievance.' });
  }
  if (req.user.role === 'case_worker') {
    return res.status(403).json({ error: 'Case workers cannot reopen cases.' });
  }

  if (!['Resolved', 'Closed'].includes(g.status)) {
    return res.status(400).json({ error: `Only resolved or closed grievances can be reopened. Current status: ${g.status}.` });
  }

  if (typeof reason !== 'string' || reason.trim().length < 5) {
    return res.status(400).json({ error: 'A reopening reason of at least 5 characters is required.' });
  }

  const previousStatus = g.status;
  g.status = 'In Progress';
  g.reopenedAt = new Date();
  g.reopenReason = reason.trim();

  g.history.push({
    previousStatus,
    status: 'In Progress',
    actor: req.user._id,
    note: `Reopened: ${reason.trim()}`,
    at: new Date()
  });

  await g.save();
  const populated = await Grievance.findById(g._id)
    .populate('assignee', 'name email department')
    .populate('citizen', 'name email phone');

  res.json({ grievance: serialize(populated), message: 'Grievance reopened and moved to In Progress.' });
});

// ----------------------------------------------------
// ESCALATIONS ROUTES
// ----------------------------------------------------
app.get('/api/escalations', allow('manager', 'admin'), async (req, res) => {
  await checkAndEscalateOverdueCases();
  const escalations = await Grievance.find({
    $or: [
      { 'escalation.state': { $in: ['open', 'acknowledged'] } },
      { status: { $nin: ['Resolved', 'Closed'] }, slaDeadline: { $lt: new Date() } }
    ]
  })
    .sort({ slaDeadline: 1 })
    .populate('assignee', 'name email department')
    .populate('citizen', 'name email phone');

  res.json({ escalations: escalations.map(serialize), count: escalations.length });
});

app.post('/api/grievances/:id/escalation/acknowledge', allow('manager', 'admin'), async (req, res) => {
  const g = await Grievance.findById(req.params.id);
  if (!g) return res.status(404).json({ error: 'Grievance not found.' });

  if (g.escalation.state !== 'open') {
    return res.status(400).json({ error: 'There is no open escalation to acknowledge for this grievance.' });
  }

  g.escalation.state = 'acknowledged';
  await g.save();
  res.json({ grievance: serialize(g), message: 'Escalation acknowledged.' });
});

// ----------------------------------------------------
// USER ADMINISTRATION (Manager / Admin)
// ----------------------------------------------------
app.get('/api/users/workers', allow('manager', 'admin'), async (req, res) => {
  const workers = await User.aggregate([
    { $match: { role: 'case_worker', active: true } },
    {
      $lookup: {
        from: 'grievances',
        let: { wId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$assignee', '$$wId'] },
                  { $not: { $in: ['$status', ['Resolved', 'Closed']] } }
                ]
              }
            }
          }
        ],
        as: 'activeCases'
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        department: 1,
        role: 1,
        active: 1,
        workload: { $size: '$activeCases' }
      }
    },
    { $sort: { workload: 1, name: 1 } }
  ]);

  res.json({ workers: workers.map(safeUser) });
});

app.get('/api/users', allow('admin'), async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) {
    const escaped = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ name: regex }, { email: regex }, { department: regex }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ users: users.map(safeUser), total: users.length });
});

app.post('/api/users', allow('admin'), async (req, res) => {
  const { name, email, password, role, department, phone } = req.body || {};
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ error: 'Enter a name between 2 and 100 characters.' });
  }
  if (!emailOk(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (!passwordOk(password)) {
    return res.status(400).json({ error: 'Password must be 10â€“72 characters with uppercase, lowercase, and a number.' });
  }
  if (!['case_worker', 'manager', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Choose a privileged role (case_worker, manager, admin).' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      department: typeof department === 'string' ? department.trim().slice(0, 100) : undefined,
      phone: typeof phone === 'string' ? phone.trim().slice(0, 25) : undefined
    });
    res.status(201).json({ user: safeUser(user), message: `Account for ${user.name} created.` });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    throw e;
  }
});

app.patch('/api/users/:id/active', allow('admin'), async (req, res) => {
  if (typeof req.body?.active !== 'boolean') {
    return res.status(400).json({ error: 'Active must be true or false.' });
  }
  if (req.params.id === req.user.id && req.body.active === false) {
    return res.status(400).json({ error: 'You cannot deactivate your own account.' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { active: req.body.active },
    { new: true, runValidators: true }
  );

  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: safeUser(user), message: `Account ${user.active ? 'activated' : 'deactivated'}.` });
});

// Frontend is served separately on Vercel — no static file serving needed here

// Global error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
});

// Server bootstrap
const isTestMode = process.env.NODE_ENV === 'test' ||
  process.argv.some(a => a.includes('test')) ||
  process.execArgv.includes('--test') ||
  process.env.npm_lifecycle_event === 'test';
const port = Number(process.env.PORT) || 4000;
let serverInstance = null;
let intervalId = null;

if (!isTestMode) {
  serverInstance = app.listen(port, () => console.log(`Civic Pulse API listening on http://localhost:${port}`));

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civic_pulse';
  let retryMs = 5000;

  async function connectDatabase() {
    if (mongoose.connection.readyState === 1) return;
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('MongoDB connected successfully');
      retryMs = 5000;
      await checkAndEscalateOverdueCases();
    } catch (error) {
      console.error(`MongoDB connection failed (${error.code || error.name}). Retrying in ${Math.round(retryMs / 1000)}s.`);
      const wait = retryMs;
      retryMs = Math.min(retryMs * 2, 30000);
      setTimeout(connectDatabase, wait).unref();
    }
  }

  void connectDatabase();
  intervalId = setInterval(() => { void checkAndEscalateOverdueCases(); }, 60000);
}

export { app };
