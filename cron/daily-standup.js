// daily-standup.js — Daily standup cron job
// Schedule: 0 9 * * 1-5 (09:00 lun-ven)
// Timeout: 60s

const state = require('../lib/state');
const notifier = require('../lib/notifier');

// Environment variables (set in .env or OpenClaw config)
const DISCORD_WEBHOOK = process.env.DISCORD_STANDUP_WEBHOOK_URL || '';
const TIMEZONE = process.env.CRON_TIMEZONE || 'Europe/Warsaw';

/**
 * Collect standup data from agent sessions
 * Reads from memory/ directory or state.json
 * @returns {Array} Array of agent standup data
 */
async function collectStandupData() {
  const agentsStatus = state.getAllAgentsStatus();
  
  const agents = Object.keys(agentsStatus).map(name => {
    const agentData = agentsStatus[name];
    return {
      name,
      status: agentData.status || 'unknown',
      update: agentData.lastUpdate || 'No update available',
      next: agentData.currentTask ? `Working on: ${agentData.currentTask}` : 'No active task'
    };
  });
  
  // If no agents in state, use mock data for testing
  if (agents.length === 0) {
    return [
      { name: 'Thomas', status: 'active', update: 'Setting up cron structure', next: 'TASK-001' },
      { name: 'Goksu', status: 'active', update: 'Preparing test plan', next: 'TASK-005' },
      { name: 'Piotr', status: 'active', update: 'Reviewing infrastructure', next: 'TASK-007' }
    ];
  }
  
  return agents;
}

/**
 * Format standup message
 * @param {Array} agents - Agent standup data
 * @returns {string} Formatted message
 */
function formatStandupMessage(agents) {
  const date = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  let message = `📋 **Daily Standup — ${date}**\n\n`;
  
  for (const agent of agents) {
    message += `👤 **${agent.name}**\n`;
    message += `   • Status: ${agent.status}\n`;
    message += `   • ${agent.update}\n`;
    message += `   • ${agent.next}\n\n`;
  }
  
  return message;
}

/**
 * Main execution function
 * Called by the scheduler
 */
async function execute() {
  console.log('[daily-standup] Starting standup generation');
  const startTime = Date.now();
  
  try {
    // Collect data from all agents
    const agents = await collectStandupData();
    console.log(`[daily-standup] Collected data for ${agents.length} agents`);
    
    // Update standup in state
    const stateData = state.readState();
    if (!stateData.standups) stateData.standups = [];
    
    stateData.standups.push({
      timestamp: new Date().toISOString(),
      agents
    });
    
    // Keep only last 30 standups
    if (stateData.standups.length > 30) {
      stateData.standups = stateData.standups.slice(-30);
    }
    
    state.writeState(stateData);
    
    // Send to Discord if webhook configured
    if (DISCORD_WEBHOOK) {
      const success = await notifier.sendStandup({ agents }, DISCORD_WEBHOOK);
      if (success) {
        console.log('[daily-standup] Standup sent to Discord');
      } else {
        console.log('[daily-standup] Failed to send standup to Discord');
      }
    } else {
      console.log('[daily-standup] No Discord webhook configured, skipping notification');
      console.log('[daily-standup] Message would be:\n', formatStandupMessage(agents));
    }
    
    const duration = Date.now() - startTime;
    console.log(`[daily-standup] Completed in ${duration}ms`);
    
    return { success: true, agents, duration };
    
  } catch (error) {
    console.error('[daily-standup] Error:', error.message);
    throw error;
  }
}

// Allow direct execution for testing
if (require.main === module) {
  execute()
    .then(result => {
      console.log('[daily-standup] Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('[daily-standup] Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { execute, collectStandupData, formatStandupMessage };