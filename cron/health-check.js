// health-check.js — Monitor agent heartbeats
// Schedule: */15 * * * * (every 15 minutes)
// Alert if agent heartbeat is stale (> 5 minutes)

const state = require('../lib/state');
const notifier = require('../lib/notifier');

const DISCORD_WEBHOOK = process.env.DISCORD_HEALTH_WEBHOOK_URL || '';
const HEARTBEAT_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

async function execute() {
  console.log('[health-check] Starting health check');
  const startTime = Date.now();
  
  try {
    const agents = state.getAllAgentsStatus();
    const agentNames = Object.keys(agents);
    
    if (agentNames.length === 0) {
      console.log('[health-check] No agents registered in state');
      return { success: true, agentsChecked: 0, agentsDown: 0 };
    }
    
    console.log(`[health-check] Checking ${agentNames.length} agent(s)`);
    
    const now = Date.now();
    const agentsDown = [];
    
    for (const name of agentNames) {
      const agent = agents[name];
      const lastHeartbeat = new Date(agent.lastHeartbeat).getTime();
      const staleMs = now - lastHeartbeat;
      
      if (staleMs > HEARTBEAT_THRESHOLD_MS) {
        agentsDown.push({
          name,
          lastHeartbeat: agent.lastHeartbeat,
          staleMs,
          currentTask: agent.currentTask
        });
        console.log(`[health-check] Agent DOWN: ${name} (stale for ${Math.round(staleMs/60000)}min)`);
      } else {
        console.log(`[health-check] Agent OK: ${name} (last heartbeat ${Math.round(staleMs/1000)}s ago)`);
      }
    }
    
    // Send alert if agents down
    if (agentsDown.length > 0 && DISCORD_WEBHOOK) {
      for (const agent of agentsDown) {
        const message = formatAgentDownMessage(agent);
        await notifier.sendAgentDownAlert(agent, DISCORD_WEBHOOK);
        console.log(`[health-check] Alert sent for agent: ${agent.name}`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[health-check] Completed in ${duration}ms — ${agentsDown.length} agent(s) down`);
    
    return {
      success: true,
      agentsChecked: agentNames.length,
      agentsDown: agentsDown.length,
      duration
    };
    
  } catch (error) {
    console.error('[health-check] Error:', error.message);
    throw error;
  }
}

function formatAgentDownMessage(agent) {
  return `⚠️ **Agent Down — ${agent.name}**\n\n`
    + `Last heartbeat: ${agent.lastHeartbeat}\n`
    + `Stale for: ${Math.round(agent.staleMs / 60000)} minutes\n`
    + `Last task: ${agent.currentTask || 'unknown'}\n\n`
    + `@team — investigate`;
}

module.exports = { execute };
