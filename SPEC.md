# OpenClaw Automation — SPEC

**Version:** 1.0  
**Date:** 2026-04-25  
**Status:** DRAFT  

---

## 1. System Overview

Automazione dei task ricorrenti tramite OpenClaw cron jobs. Il sistema coordina gli agent, monitora lo stato dei progetti, e notifica il team quando necessario.

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Runtime                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │ Cron Jobs   │  │ Coordinator │  │ Notifier             ││
│  │ Scheduler   │  │ Agent       │  │ Discord Webhook      ││
│  └─────────────┘  └─────────────┘  └─────────────────────┘│
└───────────────────────────┬─────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │      Data Layer           │
              │  data/state.json          │
              │  memory/                 │
              └──────────────────────────┘
```

---

## 2. Cron Jobs Specification

### 2.1 daily-standup

**Schedule:** `0 9 * * 1-5` (09:00 lun-ven)  
**Timeout:** 60s

**Flow:**
1. Read agent sessions from memory/
2. Extract last updates (last 24h)
3. Format standup message
4. POST to Discord webhook

**Output Example:**
```
📋 Daily Standup — Apr 25, 2026

👤 Thomas:
   • Ken Bus: fixed audio toggle bug
   • Next: start observability

👤 Goksu:
   • QA checklist complete
   • Next: test automation

👤 Piotr:
   • Docker setup done
   • Next: CI/CD pipeline
```

### 2.2 blocker-check

**Schedule:** `0 */2 * * *` (ogni 2h)  
**Timeout:** 30s

**Flow:**
1. Read TASKS.md and GitHub issues
2. Find tasks with `blocked` status > 24h
3. If blocker found → notify PO

**Notification Format:**
```
🚨 Blocker Detected

Task: [TASK-ID] — [title]
Blocked by: [reason]
Duration: [X hours]
Last activity: [timestamp]
@PO — action required
```

### 2.3 health-check

**Schedule:** `*/30 * * * *` (ogni 30min)  
**Timeout:** 15s

**Flow:**
1. Read heartbeat timestamps from state.json
2. Compare with current time
3. If agent silent > 15min → alert Nico

**Notification Format (DM):**
```
⚠️ Agent Down

Agent: [name]
Last seen: [timestamp]
Status: UNRESPONSIVE
```

### 2.4 weekly-summary

**Schedule:** `0 18 * * 5` (ven 18:00)  
**Timeout:** 120s

**Flow:**
1. Aggregate week's activity from memory/
2. Count: commits, tasks completed, blockers
3. POST summary to team channel

**Output Example:**
```
📊 Weekly Summary — Apr 21-25, 2026

Commits: 47 (+23 vs last week)
Tasks completed: 12
New PRs: 8
Blockers resolved: 3

🔥 Top contributor: Thomas (18 commits)
🐛 Most fixed: Ken Bus audio issues

Nothing blocked going into next week ✅
```

---

## 3. Data Schema

### 3.1 state.json

```json
{
  "version": 1,
  "lastUpdated": "2026-04-25T12:00:00Z",
  "agents": {
    "Thomas": {
      "lastHeartbeat": "2026-04-25T11:45:00Z",
      "status": "active",
      "currentTask": "TASK-001"
    },
    "Goksu": {
      "lastHeartbeat": "2026-04-25T11:50:00Z",
      "status": "active",
      "currentTask": "TASK-005"
    },
    "Piotr": {
      "lastHeartbeat": "2026-04-25T11:30:00Z",
      "status": "active",
      "currentTask": "TASK-007"
    }
  },
  "blockers": [],
  "standups": []
}
```

### 3.2 Notification Log

```json
{
  "id": "notif-001",
  "type": "blocker_detected",
  "timestamp": "2026-04-25T10:00:00Z",
  "payload": { ... },
  "status": "sent",
  "channel": "discord"
}
```

---

## 4. API Specification

### 4.1 Internal Events

| Event | Payload | Handler |
|-------|---------|---------|
| `standup:trigger` | `{ date }` | daily-standup |
| `blocker:check` | `{ tasks }` | blocker-check |
| `health:check` | `{ agents }` | health-check |
| `summary:generate` | `{ week }` | weekly-summary |

### 4.2 External Notifications

| Channel | Method | Rate Limit |
|---------|--------|------------|
| Discord team channel | Webhook | 1 msg/min |
| Discord DM to Nico | Webhook | 2 msg/min |
| Discord thread | Webhook | 3 msg/min |

---

## 5. Error Handling

| Scenario | Handling |
|----------|----------|
| Cron execution fails | Retry 3x with exponential backoff (1min, 2min, 4min) |
| Discord webhook fails | Log error, keep state, skip notification |
| State file corrupted | Restore from backup, log incident |
| Agent silent (not down) | Mark as "unknown" status, notify after 1h |

---

## 6. Configuration

### 6.1 Environment Variables

```bash
# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_DM_WEBHOOK_URL=https://discord.com/api/webhooks/...

# OpenClaw
CRON_TIMEZONE=Europe/Warsaw
HEARTBEAT_TIMEOUT_MINUTES=15
BLOCKER_THRESHOLD_HOURS=24

# GitHub (for blocker check)
GITHUB_TOKEN=ghp_...
GITHUB_OWNER=niccolocoppo88
```

### 6.2 Cron Expression Reference

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6) (0 is Sunday)
│ │ │ │ │
│ * * * * *
```

---

## 7. File Structure

```
openclaw-automation/
├── BRIEF.md
├── TASKS.md
├── SPEC.md                    ← This file
├── KICKOFF.md
├── cron/
│   ├── daily-standup.js
│   ├── blocker-check.js
│   ├── health-check.js
│   └── weekly-summary.js
├── lib/
│   ├── notifier.js           # Discord notification helper
│   ├── state.js              # State read/write
│   ├── github.js             # GitHub API client
│   └── formatter.js          # Message formatting
├── data/
│   ├── state.json            # Runtime state
│   └── backup/               # State backups
└── tests/
    ├── cron.test.js
    └── notifier.test.js
```

---

## 8. Dependencies

```json
{
  "cron": "^3.0.0",
  "node-fetch": "^3.0.0"
}
```

Note: Using built-in OpenClaw SDK for Discord notifications and scheduling.

---

## 9. Security Considerations

1. **Discord webhooks** — URL segrete, mai in commit
2. **GitHub token** — environment variable, mai in code
3. **State file** — contiene timestamps e status, non dati sensibili
4. **Rate limiting** — previene accidental spam

---

## 10. Monitoring & Observability

### 10.1 Health Metrics

| Metric | How |
|--------|-----|
| Cron execution success rate | Log each run |
| Notification delivery rate | Track status |
| Agent response time | Heartbeat delta |
| False positive rate (agent down) | Track recovery |

### 10.2 Alerting

- Cron failure > 3 retries → notify Nico
- State file corruption → notify Nico
- Agent down confirmed → notify Nico

---

## 11. Future Enhancements (v2)

- **Multi-project support** — automate across multiple repos
- **GitHub Projects sync** — bi-directional sync
- **Email notifications** — as backup to Discord
- **Analytics dashboard** — track team velocity over time
- **Custom cron expressions** — user-defined schedules
