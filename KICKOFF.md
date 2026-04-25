# OpenClaw Automation — KICKOFF

**Date:** 2026-04-25  
**Project:** OpenClaw Automation  
**Team:** Thomas (Coder), Goksu (QA), Piotr (DevOps), Elisa (PO)  

---

## 🎯 Obiettivo

Costruire un sistema di automazione per OpenClaw che gestisca i task ricorrenti automaticamente: standup giornalieri, rilevamento blocker, monitoraggio agent, e summary settimanali.

---

## 📅 Timeline

| Day | Focus | Deliverable |
|-----|-------|-------------|
| **Lun 26** | Setup + Standup cron | Standup automatico funzionante |
| **Mar 27** | Blocker detection | Notifiche blocker attive |
| **Mer 28** | Health check | Monitoraggio agent attivo |
| **Gio 29** | Integration + Testing | Tutti i flussi end-to-end |
| **Ven 30** | Polish + Ship | MVP shipped |

---

## 👥 Ruoli

| Role | Agent | Responsibilities |
|------|-------|-----------------|
| Cron Developer | Thomas | Implementa tutti i cron jobs |
| QA | Goksu | Test plan + integration testing |
| DevOps | Piotr | State management + Discord setup |
| PO | Elisa | Coordinamento + status updates |

---

## 📋 Prime Task (Kick-off immediato)

### Thomas — Day 1
- [ ] Leggere SPEC.md e capire architettura
- [ ] Setup cron/ directory con struttura base
- [ ] Implementare daily-standup.js ( skeleton + test)
- [ ] Test locale con mock data

### Goksu — Day 1
- [ ] Leggere SPEC.md e QA requirements
- [ ] Preparare test plan template
- [ ] Identificare edge cases per standup flow
- [ ] Setup test environment

### Piotr — Day 1
- [ ] Leggere SPEC.md e infrastructure requirements
- [ ] Setup data/ directory + state.json base
- [ ] Configurare Discord webhook test
- [ ] Creare formatter.js base

### Elisa — Day 1
- [x] Creare BRIEF.md ✅
- [x] Creare TASKS.md ✅
- [x] Creare SPEC.md ✅
- [ ] Questo KICKOFF.md
- [ ] Kickoff meeting (ora)

---

## 🔗 Communication Channels

| Channel | Use |
|---------|-----|
| `#automazione-openclaw` (thread) | Main discussion |
| `#automazione-openclaw/standup` | Daily standup outputs |
| `#automazione-openclaw/alerts` | Blocker + health alerts |

---

## 📊 Definition of Done

Un cron job è "done" quando:
1. Code written and reviewed
2. Test plan executed
3. Notifies correctly to Discord
4. Error handling works (retry, fallback)
5. Documentation updated

---

## 🚨 Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Discord webhook rate limit | Queue + backoff, max 1 msg/min per type |
| State file corruption | Backup before write, restore on failure |
| Agent false positive (down) | 15min threshold, recovery detection |
| Cron timezone issues | Use Europe/Warsaw explicitly |

---

## ⏰ OpenClaw Cron Configuration

I cron jobs vengono registrati in `~/.openclaw/openclaw.json` sotto `cron.jobs[]`:

```json
{
  "cron": {
    "jobs": [
      {
        "name": "daily-standup",
        "schedule": "0 9 * * 1-5",
        "command": "node /path/to/openclaw-automation/cron/daily-standup.js",
        "timezone": "Europe/Warsaw",
        "enabled": true
      },
      {
        "name": "blocker-check",
        "schedule": "0 10 * * 1-5",
        "command": "node /path/to/openclaw-automation/cron/blocker-check.js",
        "timezone": "Europe/Warsaw",
        "enabled": true
      },
      {
        "name": "health-check",
        "schedule": "*/15 * * * *",
        "command": "node /path/to/openclaw-automation/cron/health-check.js",
        "timezone": "Europe/Warsaw",
        "enabled": true
      },
      {
        "name": "weekly-summary",
        "schedule": "0 18 * * 5",
        "command": "node /path/to/openclaw-automation/cron/weekly-summary.js",
        "timezone": "Europe/Warsaw",
        "enabled": true
      }
    ]
  }
}
```

**Note:** Il path `openclaw-automation` deve puntare alla directory dove è installato il progetto. Su sandbox: `/workspace/openclaw-automation/`.

### Schedules confermate
| Job | Schedule | Note |
|-----|----------|------|
| daily-standup | 09:00 UTC+2 weekday | Lun-Ven |
| blocker-check | 10:00 UTC+2 weekday | Lun-Ven |
| health-check | */15 min | Continuo |
| weekly-summary | 18:00 UTC+2 Friday | Weekly |

### Variabili ambiente richieste
```bash
# .env (da .env.example)
DISCORD_STANDUP_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...
STATE_FILE_PATH=/workspace/openclaw-automation/data/state.json
```

---

## 📁 Reference Docs

- SPEC.md — Technical specification
- TASKS.md — Task breakdown and assignments
- OpenClaw cron docs (internal)

---

## ✅ Kickoff Checklist

- [x] BRIEF.md created
- [x] TASKS.md created  
- [x] SPEC.md created
- [ ] KICKOFF.md created (this)
- [ ] Team read all docs
- [ ] Questions resolved
- [ ] First tasks assigned

---

**Next:** Thomas/Goksu/Piotr — leggete i documenti e iniziate Day 1. Io monitoro e coordino. 🏐
