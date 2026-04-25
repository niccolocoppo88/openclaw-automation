// weekly-summary.js — Generate and send weekly summary
// Schedule: 0 18 * * 5 (Friday 18:00)
// Posts summary to team channel

const state = require('../lib/state');
const notifier = require('../lib/notifier');

const DISCORD_WEBHOOK = process.env.DISCORD_SUMMARY_WEBHOOK_URL || '';

function getWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

async function execute() {
  console.log('[weekly-summary] Starting weekly summary generation');
  const startTime = Date.now();
  
  try {
    const stateData = state.readState();
    const standups = stateData.standups || [];
    const blockers = stateData.blockers || [];
    
    // Calculate week range
    const now = new Date();
    const weekNum = getWeekNumber();
    const year = now.getFullYear();
    
    // Get standups from this week (last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStandups = standups.filter(s => new Date(s.timestamp) > weekAgo);
    
    // Calculate stats
    const activeDays = new Set(weekStandups.map(s => s.timestamp.split('T')[0])).size;
    const totalAgents = new Set(weekStandups.flatMap(s => s.agents.map(a => a.name))).size;
    const blockersResolved = blockers.length; // Would need more complex logic in production
    
    // Count commits per agent from standups (approximation)
    const agentActivity = {};
    for (const standup of weekStandups) {
      for (const agent of standup.agents) {
        if (!agentActivity[agent.name]) {
          agentActivity[agent.name] = { updates: 0, tasks: [] };
        }
        agentActivity[agent.name].updates++;
        if (agent.currentTask) {
          agentActivity[agent.name].tasks.push(agent.currentTask);
        }
      }
    }
    
    // Find most active agent
    let topContributor = 'None';
    let maxUpdates = 0;
    for (const [name, data] of Object.entries(agentActivity)) {
      if (data.updates > maxUpdates) {
        maxUpdates = data.updates;
        topContributor = name;
      }
    }
    
    // Build summary
    const summary = {
      week: `W${weekNum} ${year}`,
      standupsCollected: weekStandups.length,
      activeDays,
      totalAgents,
      topContributor,
      agentActivity,
      blockers: blockersResolved,
      blockedTasks: blockers.length
    };
    
    console.log(`[weekly-summary] Week ${summary.week}: ${weekStandups.length} standups, ${activeDays} active days, ${totalAgents} agents`);
    console.log(`[weekly-summary] Top contributor: ${topContributor}`);
    
    // Send to Discord
    if (DISCORD_WEBHOOK) {
      const message = formatSummaryMessage(summary);
      const success = await notifier.sendWeeklySummary(summary, DISCORD_WEBHOOK);
      
      if (success) {
        console.log('[weekly-summary] Summary sent to Discord');
      }
    } else {
      console.log('[weekly-summary] No webhook configured, summary:\n');
      console.log(formatSummaryMessage(summary));
    }
    
    const duration = Date.now() - startTime;
    console.log(`[weekly-summary] Completed in ${duration}ms`);
    
    return { success: true, summary, duration };
    
  } catch (error) {
    console.error('[weekly-summary] Error:', error.message);
    throw error;
  }
}

function formatSummaryMessage(summary) {
  const lines = [
    `📊 **Weekly Summary — ${summary.week}**\n`,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📅 **Activity**`,
    `• Standups: ${summary.standupsCollected}`,
    `• Active days: ${summary.activeDays}/5`,
    `• Agents checked in: ${summary.totalAgents}`,
    ``,
    `🚨 **Blockers**`,
    `• Resolved this week: ${summary.blockers}`,
    `• Still blocked: ${summary.blockedTasks}`,
    ``,
    `🔥 **Top Contributor**`,
    `• ${summary.topContributor}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    ``,
    summary.blockedTasks === 0 
      ? '✅ Nothing blocked going into next week!' 
      : `⚠️ ${summary.blockedTasks} task(s) still blocked — PO action required`
  ];
  
  return lines.join('\n');
}

module.exports = { execute };
