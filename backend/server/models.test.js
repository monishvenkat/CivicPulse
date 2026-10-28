import test from 'node:test';
import assert from 'node:assert/strict';
import { User, Grievance } from './models.js';

test('user schema supports auth and account administration operations',()=>{
  assert.equal(User.schema.path('email').options.unique,true);
  assert.equal(User.schema.path('passwordHash').options.select,false);
  assert.deepEqual(User.schema.path('role').enumValues,['citizen','case_worker','manager','admin']);
  assert.ok(User.schema.indexes().some(([keys])=>keys.role===1&&keys.active===1));
});

test('grievance schema stores owner, assignment, SLA, and workflow audit references',()=>{
  for(const field of ['citizen','assignee','reference','status','slaDeadline','history','assignmentHistory','escalation.state']) assert.ok(Grievance.schema.path(field),`missing ${field}`);
  assert.equal(Grievance.schema.path('reference').options.unique,true);
  assert.equal(Grievance.schema.path('citizen').options.ref,'User');
  assert.equal(Grievance.schema.path('assignee').options.ref,'User');
  assert.ok(Grievance.schema.indexes().some(([keys])=>keys.citizen===1&&keys.status===1&&keys.slaDeadline===1));
  assert.ok(Grievance.schema.indexes().some(([keys])=>keys.assignee===1&&keys.status===1&&keys.slaDeadline===1));
});

test('status and assignment audit records keep actor references and transition data',()=>{
  const history=Grievance.schema.path('history').schema;
  const assignment=Grievance.schema.path('assignmentHistory').schema;
  assert.ok(history.path('previousStatus'));
  assert.equal(history.path('actor').options.ref,'User');
  assert.ok(assignment.path('from'));
  assert.ok(assignment.path('to'));
  assert.equal(assignment.path('actor').options.ref,'User');
});
