// scheduler.js — Main scheduler for OpenClaw Automation cron jobs
const cron = require('node-cron');
const { execute: executeStandup } = require('./cron/daily-standup');
const { execute: executeBlocker } = require('./cron/blocker-check');
const { execute: executeHealth } = require('./cron/health-check');
const { execute: executeSummary } = require('./cron/weekly-summary');

// Environment variables
const TIMEZONE = process.env.CRON_TIMEZONE || 'Europe/Warsaw';
const DRY_RUN = process.env.CRON_DRY_RUN === 'true';

// Scheduled jobs
const jobs = [
  {
    name: 'daily-standup',
    schedule: '0 9 * * 1-5', // 09:00 Monday-Friday
    timezone: TIMEZONE,
    execute: executeStandup,
    description: 'Daily standup notification to team channel'
  },
  {
    name: 'blocker-check',
    schedule: '0 10 * * 1-5', // 10:00 Monday-Friday
    timezone: TIMEZONE,
    execute: executeBlocker,
    description: 'Check for stale blockers and alert if unresolved > 24h'
  },
  {
    name: 'health-check',
    schedule: '*/15 * * * *', // Every 15 minutes
    timezone: TIMEZONE,
    execute: executeHealth,
    description: 'Monitor agent heartbeats and alert if agent down > 5min'
  },
  {
    name: 'weekly-summary',
    schedule: '0 18 * * 5', // Friday 18:00
    timezone: TIMEZONE,
    execute: executeSummary,
    description: 'Send weekly summary to team channel'
  }
];

/**
 * Start all scheduled jobs
 */
function startScheduler() {
  console.log('[scheduler] Starting OpenClaw Automation scheduler');
  console.log(`[scheduler] Timezone: ${TIMEZONE}`);
  console.log(`[scheduler] Dry run: ${DRY_RUN}`);
  console.log('[scheduler] Registered jobs:');
  
  for (const job of jobs) {
    console.log(`  - ${job.name}: ${job.schedule} (${job.timezone}) — ${job.description}`);
  }
  
  let started = 0;
  
  for (const job of jobs) {
    cron.schedule(job.schedule, async () => {
      console.log(`[scheduler] Running job: ${job.name}`);
      const startTime = Date.now();
      
      try {
        if (DRY_RUN) {
          console.log(`[scheduler] [DRY RUN] Would execute: ${job.name}`);
          console.log(`[scheduler] [DRY RUN] Description: ${job.description}`);
          return;
        }
        
        await job.execute();
        const duration = Date.now() - startTime;
        console.log(`[scheduler] Job ${job.name} completed in ${duration}ms`);
      } catch (error) {
        console.error(`[scheduler] Job ${job.name} failed:`, error.message);
        // In production, would send alert here
      }
    }, {
      timezone: job.timezone
    });
    
    started++;
    console.log(`[scheduler] Scheduled: ${job.name}`);
  }
  
  console.log(`[scheduler] ${started}/${jobs.length} jobs started`);
  console.log('[scheduler] Scheduler running. Press Ctrl+C to stop.');
}

/**
 * Run a specific job manually (for testing)
 * @param {string} jobName - Name of job to run
 */
async function runJobManually(jobName) {
  const job = jobs.find(j => j.name === jobName);
  if (!job) {
    console.error(`[scheduler] Unknown job: ${jobName}`);
    console.log(`[scheduler] Available jobs: ${jobs.map(j => j.name).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`[scheduler] Running ${jobName} manually...`);
  try {
    await job.execute();
    console.log(`[scheduler] ${jobName} completed successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`[scheduler] ${jobName} failed:`, error.message);
    process.exit(1);
  }
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'run' && args[1]) {
    // Run specific job manually: node scheduler.js run daily-standup
    runJobManually(args[1]);
  } else if (args[0] === 'list') {
    // List all jobs
    console.log('[scheduler] Available jobs:');
    for (const job of jobs) {
      console.log(`  - ${job.name}: ${job.schedule} — ${job.description}`);
    }
  } else {
    // Start scheduler
    startScheduler();
  }
}

module.exports = { startScheduler, runJobManually, jobs };
