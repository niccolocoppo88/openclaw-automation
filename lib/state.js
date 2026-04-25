// state.js — State management for OpenClaw Automation
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../data/state.json');

// Default state structure
const DEFAULT_STATE = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  agents: {},
  blockers: [],
  standups: []
};

/**
 * Read state from file
 * @returns {Object} Current state
 */
function readState() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return { ...DEFAULT_STATE };
    }
    const data = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[state] Error reading state:', error.message);
    return { ...DEFAULT_STATE };
  }
}

/**
 * Write state to file (with backup)
 * @param {Object} state - State to write
 */
function writeState(state) {
  try {
    // Create backup before writing
    if (fs.existsSync(STATE_FILE)) {
      const backupDir = path.join(__dirname, '../data/backup');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync(STATE_FILE, path.join(backupDir, `state-${timestamp}.json`));
    }

    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log('[state] State saved successfully');
  } catch (error) {
    console.error('[state] Error writing state:', error.message);
    throw error;
  }
}

/**
 * Update agent heartbeat
 * @param {string} agentName - Name of the agent
 * @param {string} status - Agent status (active, idle, down)
 * @param {string} currentTask - Current task being worked on
 */
function updateAgentHeartbeat(agentName, status = 'active', currentTask = null) {
  const state = readState();
  if (!state.agents) state.agents = {};
  
  state.agents[agentName] = {
    lastHeartbeat: new Date().toISOString(),
    status,
    currentTask
  };
  
  writeState(state);
  console.log(`[state] Updated heartbeat for ${agentName}: ${status}`);
}

/**
 * Get agent status
 * @param {string} agentName - Name of the agent
 * @returns {Object} Agent status or null if not found
 */
function getAgentStatus(agentName) {
  const state = readState();
  return state.agents?.[agentName] || null;
}

/**
 * Get all agents last heartbeat
 * @returns {Object} Map of agent names to their status
 */
function getAllAgentsStatus() {
  const state = readState();
  return state.agents || {};
}

/**
 * Add blocker record
 * @param {string} taskId - Task ID that is blocked
 * @param {string} reason - Reason for blocking
 * @param {string} blockedBy - Who/what is blocking
 */
function addBlocker(taskId, reason, blockedBy) {
  const state = readState();
  if (!state.blockers) state.blockers = [];
  
  state.blockers.push({
    taskId,
    reason,
    blockedBy,
    detectedAt: new Date().toISOString()
  });
  
  writeState(state);
}

/**
 * Get active blockers
 * @returns {Array} List of active blockers
 */
function getActiveBlockers() {
  const state = readState();
  return state.blockers || [];
}

/**
 * Clear resolved blockers
 * @param {string} taskId - Task ID to clear
 */
function clearBlocker(taskId) {
  const state = readState();
  if (!state.blockers) return;
  
  state.blockers = state.blockers.filter(b => b.taskId !== taskId);
  writeState(state);
}

module.exports = {
  readState,
  writeState,
  updateAgentHeartbeat,
  getAgentStatus,
  getAllAgentsStatus,
  addBlocker,
  getActiveBlockers,
  clearBlocker
};