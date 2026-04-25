// blocker-check.js — Check for stale blockers
// Schedule: 0 10 * * 1-5 (10:00 lun-ven)
// Alert if blocker unresolved for > 24h

const state = require('../lib/state');
const notifier = require('../lib/notifier');

const DISCORD_WEBHOOK = process.env.DISCORD_BLOCKER_WEBHOOK_URL || '';
const BLOCKER_THRESHOLD_HOURS = 24;

async function execute() {
  console.log('[blocker-check] Starting blocker check');
  const startTime = Date.now();
  
  try {
    const blockers = state.getActiveBlockers();
    
    if (blockers.length === 0) {
      console.log('[blocker-check] No active blockers found');
      return { success: true, blockersResolved: 0, staleBlockers: 0 };
    }
    
    console.log(`[blocker-check] Found ${blockers.length} active blocker(s)`);
    
    const now = Date.now();
    const staleBlockers = [];
    
    for (const blocker of blockers) {
      const detectedAt = new Date(blocker.detectedAt).getTime();
      const hoursOld = (now - detectedAt) / (1000 * 60 * 60);
      
      if (hoursOld >= BLOCKER_THRESHOLD_HOURS) {
        staleBlockers.push({ ...blocker, hoursOld: Math.round(hoursOld) });
        console.log(`[blocker-check] Stale blocker: ${blocker.taskId} — ${blocker.reason} (${hoursOld.toFixed(1)}h old)`);
      }
    }
    
    // Send alert if stale blockers found
    if (staleBlockers.length > 0 && DISCORD_WEBHOOK) {
      const message = formatBlockerAlert(staleBlockers);
      const success = await notifier.sendToWebhook(DISCORD_WEBHOOK, { content: message });
      
      if (success) {
        console.log(`[blocker-check] Alert sent for ${staleBlockers.length} stale blocker(s)`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[blocker-check] Completed in ${duration}ms`);
    
    return {
      success: true,
      blockersResolved: blockers.length - staleBlockers.length,
      staleBlockers: staleBlockers.length,
      duration
    };
    
  } catch (error) {
    console.error('[blocker-check] Error:', error.message);
    throw error;
  }
}

function formatBlockerAlert(staleBlockers) {
  let message = `🚨 **${staleBlockers.length} Stale Blocker(s) Detected**\n\n`;
  message += `These blockers have been unresolved for more than ${BLOCKER_THRESHOLD_HOURS} hours:\n\n`;
  
  for (const blocker of staleBlockers) {
    message += `📌 **${blocker.taskId}**\n`;
    message += `   Blocked by: ${blocker.blockedBy}\n`;
    message += `   Reason: ${blocker.reason}\n`;
    message += `   Duration: ${blocker.hoursOld}h\n\n`;
  }
  
  message += `@PO — action required to unblock these tasks`;
  return message;
}

// Allow direct execution
if (require.main === module) {
  execute()
    .then(result => {
      console.log('[blocker-check] Result:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('[blocker-check] Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { execute };
