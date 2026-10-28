import test from 'node:test';import assert from 'node:assert/strict';
import {passwordOk,emailOk,transitions} from './policies.js';
test('email validation rejects malformed addresses',()=>{assert.equal(emailOk('citizen@example.com'),true);assert.equal(emailOk('not-an-email'),false);assert.equal(emailOk('a@b'),false)});
test('password policy requires length and mixed case with a digit',()=>{assert.equal(passwordOk('GoodPassword123'),true);assert.equal(passwordOk('short1A'),false);assert.equal(passwordOk('alllowercase123'),false);assert.equal(passwordOk('NoDigitsHereAA'),false);assert.equal(passwordOk('A'.repeat(73)+'1a'),false)});
test('workflow allows only documented status transitions',()=>{assert.deepEqual(transitions.Submitted,['Acknowledged']);assert.ok(transitions['In Progress'].includes('Resolved'));assert.deepEqual(transitions.Closed,[]);assert.equal(transitions.Submitted.includes('Closed'),false)});
