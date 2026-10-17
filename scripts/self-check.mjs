import assert from 'node:assert/strict';
import { daysUntilLaunch, nextTasksFor, opportunityScore, weightedPipelineValue } from '../src/renderer/src/opportunity.mjs';

const low = { estRevenue: 500, effort: 5, confidence: 1, urgency: 1 };
const high = { estRevenue: 10000, effort: 1, confidence: 5, urgency: 5 };

assert.ok(opportunityScore(high) > opportunityScore(low), 'better opportunities should score higher');
assert.equal(daysUntilLaunch(new Date('2026-11-18T12:00:00-05:00')), 1);
assert.equal(daysUntilLaunch(new Date('2026-11-20T12:00:00-05:00')), 0);
assert.equal(Math.round(weightedPipelineValue([{ estRevenue: 1000, confidence: 5 }, { estRevenue: 1000, confidence: 1 }])), 1200);
assert.equal(nextTasksFor({ title: 'Clip Desk', lane: 'Creator Ops' }).length, 3);

console.log('self-check passed');
