# OpenClaw Automation — Test Plan

**Version:** 1.0  
**Date:** 2026-04-25  
**Assignee:** Goksu  
**Tasks:** TASK-005 (Cron Test Plan), TASK-006 (Integration Test)

---

## 1. Test Scope

This test plan covers:
- **TASK-005:** Cron Test Plan — timing, retry, edge cases
- **TASK-006:** Integration Test — end-to-end flows

### Files Under Test
- `cron/daily-standup.js`
- `cron/blocker-check.js` (when implemented)
- `cron/health-check.js` (when implemented)
- `cron/weekly-summary.js` (when implemented)
- `lib/state.js`
- `lib/notifier.js`

---

## 2. TASK-005: Cron Test Plan

### 2.1 Timing Accuracy Tests

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|--------|
| CRON-001 | daily-standup fires at 09:00 Mon-Fri | Cron expression `0 9 * * 1-5` matches target times | ⬜ |
| CRON-002 | blocker-check fires at 10:00 Mon-Fri | Cron expression `0 10 * * 1-5` fires at 10:00 Monday-Friday | ⬜ |
| CRON-003 | health-check fires every 15 minutes | Cron expression `*/15 * * * *` fires at :00, :15, :30, :45 | ⬜ |
| CRON-004 | weekly-summary fires Friday at 18:00 | Cron expression `0 18 * * 5` matches Friday 18:00 | ⬜ |
| CRON-005 | No firing on weekends for daily-standup | Cron expression excludes Sat-Sun | ⬜ |

### 2.2 Retry / Error Handling Tests

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|--------|
| RETRY-001 | Cron fails → retry 3 times | Exponential backoff: 1min, 2min, 4min | ⬜ |
| RETRY-002 | All retries fail → log error + skip notification | State preserved, error logged | ⬜ |
| RETRY-003 | Discord webhook fails → graceful degradation | Fallback to console log, no crash | ⬜ |
| RETRY-004 | State file corrupted → restore from backup | Backup restored, incident logged | ⬜ |

### 2.3 Edge Cases

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|--------|
| EDGE-001 | Server restart mid-cron → no double execution | Idempotent execution, state check | ⬜ |
| EDGE-002 | Timezone shift (DST) → correct firing | Timezone `Europe/Warsaw` handled | ⬜ |
| EDGE-003 | Cron fires during previous run → skip | Previous run must complete before next | ⬜ |
| EDGE-004 | No agents in state → use mock data | Fallback to default standup format | ⬜ |
| EDGE-005 | Empty agent list → standup still sends | Valid empty standup generated | ⬜ |
| EDGE-006 | Very long agent update text → truncation | Updates truncated to reasonable length | ⬜ |

---

## 3. TASK-006: Integration Tests

### 3.1 Daily Standup Flow

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|--------|
| INT-001 | Standup executes end-to-end | Message sent to Discord webhook | ⬜ |
| INT-002 | Standup data collected from state | All agents with heartbeat in last 24h included | ⬜ |
| INT-003 | Standup saved to state | Standup history preserved (last 30) | ⬜ |
| INT-004 | No Discord webhook → console log | Message logged, no error thrown | ⬜ |
| INT-005 | Multiple agents → format correct | All agents formatted in message | ⬜ |

### 3.2 Blocker Detection Flow

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|--------|
| INT-010 | Blocker detected → notification sent | Alert posted within 2h of blocker appearing | ⬜ |
| INT-011 | Blocker resolved → notification sent | Resolution announced to team | ⬜ |
| INT-012 | Blocker > 24h → escalation | Nico notified if blocker persists | ⬜ |
| INT-013 | No blockers → no notification | Silent operation, no false positive | ⬜ |

### 3.3 Health Check Flow

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|--------|
| INT-020 | Agent silent > 5min → alert | DM sent to Nico with agent name + last seen | ⬜ |
| INT-021 | Agent recovers → notification | Confirmation that agent is back | ⬜ |
| INT-022 | All agents healthy → no alert | Silent operation | ⬜ |
| INT-023 | Health check itself fails → retry | 3 retries before giving up | ⬜ |

### 3.4 Weekly Summary Flow

| Test ID | Test Case | Expected Result | Status |
|---------|-----------|----------------|--------|
| INT-030 | Friday 18:00 → summary generated | All stats aggregated correctly | ⬜ |
| INT-031 | Summary posted to team channel | Message arrives in #team-talks | ⬜ |
| INT-032 | No activity → empty summary | Zero counts, no crash | ⬜ |

---

## 4. Test Data (Mocks)

See `tests/mocks/` directory for mock data files:
- `mock-state.json` — simulated state data
- `mock-agents.json` — simulated agent heartbeats
- `mock-blockers.json` — simulated blocker records

---

## 5. Test Execution

### Manual Testing
```bash
# Test daily-standup directly
node cron/daily-standup.js

# Test state management
node -e "const s = require('./lib/state'); console.log(s.readState());"

# Test notifier
node -e "const n = require('./lib/notifier'); n.canSend('teamChannel') && console.log('can send');"
```

### Automated Testing (Future)
```bash
npm test
```

---

## 6. Success Criteria

For TASK-005 and TASK-006 to be considered DONE:
- [ ] All Timing Accuracy tests pass (CRON-001 to CRON-005)
- [ ] All Retry tests pass (RETRY-001 to RETRY-004)
- [ ] All Edge Case tests pass (EDGE-001 to EDGE-006)
- [ ] All Integration tests pass (INT-001 to INT-033)
- [ ] No race conditions detected
- [ ] Rate limiting enforced correctly
