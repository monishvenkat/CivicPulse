import mongoose from 'mongoose';
import { categories, priorities, statusValues } from './policies.js';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['citizen', 'case_worker', 'manager', 'admin'], default: 'citizen', required: true },
  active: { type: Boolean, default: true },
  phone: { type: String, trim: true },
  department: { type: String, trim: true }
}, { timestamps: true });

userSchema.index({ role: 1, active: 1 });

const historySchema = new Schema({
  previousStatus: { type: String, enum: [...statusValues, null], default: null },
  status: { type: String, enum: statusValues, required: true },
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, trim: true, maxlength: 1000 },
  at: { type: Date, default: Date.now }
}, { _id: false });

const assignmentSchema = new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, trim: true, maxlength: 500 },
  at: { type: Date, default: Date.now }
}, { _id: false });

const escalationSchema = new Schema({
  level: { type: Number, default: 0, min: 0 },
  reason: { type: String, default: null },
  triggeredAt: { type: Date, default: null },
  state: { type: String, enum: ['none', 'open', 'acknowledged', 'resolved'], default: 'none' }
}, { _id: false });

const grievanceSchema = new Schema({
  reference: { type: String, required: true, unique: true, trim: true, uppercase: true },
  citizen: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 20, maxlength: 4000 },
  category: { type: String, required: true, enum: categories },
  location: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
  priority: { type: String, enum: priorities, default: 'Medium', required: true },
  status: { type: String, enum: statusValues, default: 'Submitted', required: true },
  assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  submittedAt: { type: Date, default: Date.now, required: true },
  slaDeadline: { type: Date, required: true },
  resolutionNote: { type: String, trim: true, maxlength: 2000 },
  resolvedAt: { type: Date },
  closedAt: { type: Date },
  reopenedAt: { type: Date },
  reopenReason: { type: String, trim: true, maxlength: 1000 },
  history: { type: [historySchema], default: [] },
  assignmentHistory: { type: [assignmentSchema], default: [] },
  escalation: { type: escalationSchema, default: () => ({}) }
}, { timestamps: true });

// Performance indexes
grievanceSchema.index({ citizen: 1, createdAt: -1 });
grievanceSchema.index({ assignee: 1, createdAt: -1 });
grievanceSchema.index({ status: 1, slaDeadline: 1 });
grievanceSchema.index({ citizen: 1, status: 1, slaDeadline: 1 });
grievanceSchema.index({ assignee: 1, status: 1, slaDeadline: 1 });
grievanceSchema.index({ category: 1, status: 1 });
grievanceSchema.index({ 'escalation.state': 1 });

export const User = model('User', userSchema);
export const Grievance = model('Grievance', grievanceSchema);
