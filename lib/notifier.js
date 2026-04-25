// notifier.js — Discord notification helper for OpenClaw Automation

const fetch = require('node-fetch');

// Rate limiting configuration
const RATE_LIMIT = {
  teamChannel: { maxPerMinute: 1, lastSent: null },
  dmNico: { maxPerMinute: 2, lastSent: null },
  thread: { maxPerMinute: 3, lastSent: null }
};

/**
 * Check if we can send (rate limiting)
 * @param {string} channelType - Type of channel (teamChannel, dmNico, thread)
 * @returns {boolean} Whether we can send
 */
function canSend(channelType) {
  const config = RATE_LIMIT[channelType];
  if (!config) return false;
  
  const now = Date.now();
  const minuteMs = 60000;
  
  if (config.lastSent && (now - config.lastSent) < minuteMs) {
    console.log(`[notifier] Rate limited for ${channelType}, last sent ${Math.round((now - config.lastSent)/1000)}s ago`);
    return false;
  }
  return true;
}

/**
 * Update rate limit timestamp
 * @param {string} channelType - Type of channel
 */
function markSent(channelType) {
  const config = RATE_LIMIT[channelType];
  if (config) {
    config.lastSent = Date.now();
  }
}

/**
 * Send message to Discord webhook
 * @param {string} webhookUrl - Discord webhook URL
 * @param {Object} payload - Message payload
 * @returns {boolean} Success status
 */
async function sendToWebhook(webhookUrl, payload) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error(`[notifier] Webhook error: ${response.status} ${response.statusText}`);
      return false;
    }
    
    console.log('[notifier] Message sent successfully');
    return true;
  } catch (error) {
    console.error('[notifier] Error sending message:', error.message);
    return false;
  }
}

/**
 * Send standup message to team channel
 * @param {Object} standupData - Standup data { agents: [...] }
 * @param {string} webhookUrl - Discord webhook URL
 */
async function sendStandup(standupData, webhookUrl) {
  if (!canSend('teamChannel')) {
    console.log('[notifier] Standup skipped due to rate limiting');
    return false;
  }
  
  const agents = standupData.agents || [];
  let message = `📋 **Daily Standup — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**\n\n`;
  
  for (const agent of agents) {
    message += `👤 **${agent.name}**\n`;
    message += `   • Status: ${agent.status || 'unknown'}\n`;
    if (agent.update) message += `   • ${agent.update}\n`;
    if (agent.next) message += `   • Next: ${agent.next}\n`;
    message += '\n';
  }
  
  const payload = { content: message };
  const success = await sendToWebhook(webhookUrl, payload);
  if (success) markSent('teamChannel');
  return success;
}

/**
 * Send blocker alert to team channel + DM to Nico
 * @param {Object} blocker - Blocker data { taskId, reason, blockedBy, duration }
 * @param {string} teamWebhook - Team channel webhook
 * @param {string} dmWebhook - DM to Nico webhook
 */
async function sendBlockerAlert(blocker, teamWebhook, dmWebhook) {
  const message = `🚨 **Blocker Detected**\n\nTask: ${blocker.taskId}\nBlocked by: ${blocker.blockedBy}\nDuration: ${blocker.duration || 'unknown'}\nReason: ${blocker.reason}\n\n@PO — action required`;
  
  // Send to team channel
  if (canSend('teamChannel')) {
    await sendToWebhook(teamWebhook, { content: message });
    markSent('teamChannel');
  }
  
  // Send DM to Nico
  if (canSend('dmNico')) {
    await sendToWebhook(dmWebhook, { content: message });
    markSent('dmNico');
  }
}

/**
 * Send agent down alert to Nico
 * @param {Object} agent - Agent data { name, lastSeen }
 * @param {string} dmWebhook - DM to Nico webhook
 */
async function sendAgentDownAlert(agent, dmWebhook) {
  if (!canSend('dmNico')) {
    console.log('[notifier] Agent down alert skipped due to rate limiting');
    return false;
  }
  
  const message = `⚠️ **Agent Down**\n\nAgent: ${agent.name}\nLast seen: ${agent.lastSeen}\nStatus: UNRESPONSIVE`;
  
  const success = await sendToWebhook(dmWebhook, { content: message });
  if (success) markSent('dmNico');
  return success;
}

/**
 * Send weekly summary
 * @param {Object} summary - Summary data { commits, tasks, prs, blockers, topContributor }
 * @param {string} webhookUrl - Discord webhook URL
 */
async function sendWeeklySummary(summary, webhookUrl) {
  if (!canSend('teamChannel')) {
    console.log('[notifier] Weekly summary skipped due to rate limiting');
    return false;
  }
  
  const message = `📊 **Weekly Summary — ${summary.week || 'this week'}**\n\n`
    + `Commits: ${summary.commits || 0}\n`
    + `Tasks completed: ${summary.tasks || 0}\n`
    + `New PRs: ${summary.prs || 0}\n`
    + `Blockers resolved: ${summary.blockers || 0}\n\n`
    + `🔥 Top contributor: ${summary.topContributor || 'unknown'}\n\n`
    + (summary.blockedTasks === 0 ? 'Nothing blocked going into next week ✅' : `⚠️ ${summary.blockedTasks} tasks still blocked`);
  
  const payload = { content: message };
  const success = await sendToWebhook(webhookUrl, payload);
  if (success) markSent('teamChannel');
  return success;
}

module.exports = {
  canSend,
  sendToWebhook,
  sendStandup,
  sendBlockerAlert,
  sendAgentDownAlert,
  sendWeeklySummary
};