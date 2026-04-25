#!/usr/bin/env node
// test-runner.js — Run individual cron jobs for testing
// Usage: node tests/run-standalone.js [job-name]
// Examples:
//   node tests/run-standalone.js daily-standup
//   node tests/run-standalone.js health-check
//   node tests/run-standalone.js blocker-check
//   node tests/run-standalone.js weekly-summary

const path = require('path');

// Job mapping
const jobs = {
  'daily-standup': require('../cron/daily-standup'),
  'health-check': require('../cron/health-check'),
  'blocker-check': require('../cron/blocker-check'),
  'weekly-summary': require('../cron/weekly-summary')
};

// Parse arguments
const args = process.argv.slice(2);
const jobName = args[0];

if (!jobName) {
  console.log('Usage: node tests/run-standalone.js [job-name]');
  console.log('');
  console.log('Available jobs:');
  for (const name of Object.keys(jobs)) {
    console.log(`  - ${name}`);
  }
  process.exit(1);
}

const job = jobs[jobName];
if (!job) {
  console.error(`Unknown job: ${jobName}`);
  console.error('Available jobs:', Object.keys(jobs).join(', '));
  process.exit(1);
}

// Run job
console.log(`[test-runner] Running job: ${jobName}`);
console.log('─'.repeat(50));

const startTime = Date.now();

job.execute()
  .then(result => {
    const duration = Date.now() - startTime;
    console.log('─'.repeat(50));
    console.log(`[test-runner] ✅ Job ${jobName} completed in ${duration}ms`);
    console.log('[test-runner] Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(error => {
    const duration = Date.now() - startTime;
    console.log('─'.repeat(50));
    console.error(`[test-runner] ❌ Job ${jobName} failed after ${duration}ms`);
    console.error('[test-runner] Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
