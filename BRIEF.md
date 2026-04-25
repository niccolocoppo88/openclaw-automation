# OpenClaw Automation — BRIEF

**Version:** 1.0  
**Date:** 2026-04-25  
**Status:** DRAFT  
**Project:** Automazione OpenClaw — cron jobs per task ricorrenti  

---

## 1. Concept & Vision

Automatizzare i task ricorrenti che attualmente gestiamo manualmente: reminder progetti, check status, coordinamento tra agent. L'idea è trasformare OpenClaw da strumento reattivo a **coordinatore proattivo** che lavora in background.

Il bot Telegram è stato il primo passo — ora costruiamo il "cervello operativo" che tiene tutto in moto.

---

## 2. Cosa Automatizziamo (MVP)

### 2.1 Cron Jobs Base

| Cron | Frequenza | Azione |
|------|-----------|--------|
| Project status check | Ogni 2h | Verifica status GitHub repos + notifica se blocker |
| Daily standup reminder | 09:00 lun-ven | Manda reminder a team channel |
| Weekly summary | Ven 18:00 | Riepilogo settimanale attività su Discord |
| Team heartbeat monitor | Ogni 30min | Verifica che gli agent siano vivi |

### 2.2 Notification Triggers

| Trigger | Condizione | Azione |
|---------|------------|--------|
| CI failed | GitHub Actions fallisce su main | Notifica team channel |
| New PR | PR opened/merged | Notifica con dettagli |
| Blocker detected | Task bloccata > 24h | Alert a PO |
| Agent down | Heartbeat non ricevuto | Notifica a Nico |

### 2.3 Coordinator Actions

| Action | Quando | Come |
|--------|--------|------|
| Allinea standup | Ogni mattina | Legge updates dagli agent, compila summary |
| Gestisce escalations | Quando blocker | Notifica il PO (Nico) con contesto |
| Push reminder | Scadenze imminenti | Manda DM a chi di dovere |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────┐
│              OpenClaw Runtime                    │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ Cron Jobs   │  │ Agent       │  │ Notifier │ │
│  │ (scheduler) │  │ Coordinator │  │ (Discord)│ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
└───────────────────────────┬─────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │      Data Layer          │
              │  - Task state (JSON)     │
              │  - Agent status          │
              │  - Notification history   │
              └──────────────────────────┘
```

### 3.1 Components

**Scheduler**
- OpenClaw cron jobs (già integrato)
- Ogni job è un task atomic
- Fallback: se job fallisce, retry con backoff

**Agent Coordinator**
- Legge heartbeat degli altri agent
- Aggrega status in dashboard
- Rileva blocker e fa escalation

**Notifier**
- Invia a Discord (canale/thread/DM)
- Formatta messaggi in base a priority
- Rate limiting per evitare spam

---

## 4. User Flows

### 4.1 Daily Standup Flow
```
07:00 — Scheduler kickoff standup
  │
  ├─→ Legge last updates da memory/ agent sessions
  │
  ├─→ Compila standup message:
  │     "📋 Standup — Apr 25
  │      Thomas: [update]
  │      Goksu: [update]
  │      Piotr: [update]"
  │
  └─→ Invia a #team-standup thread
```

### 4.2 Blocker Detection Flow
```
Cron check (ogni 2h)
  │
  ├─→ Legge TASKS.md / GitHub issues
  │
  ├─→ Verifica task con status=blocked da > 24h
  │
  ├─→ Se blocker trovato:
  │     "🚨 Blocker detected su [task]
  │      [context + last activity]
  │      @PO — action required"
  │
  └─→ Invia a team channel + DM a Nico
```

### 4.3 Agent Health Check Flow
```
Every 30min
  │
  ├─→ Legge heartbeat timestamps
  │
  ├─→ Se agent non ha heartbeat > 15min:
  │     "⚠️ Agent [name] sembra down
  │      Last seen: [timestamp]"
  │
  └─→ Notifica a Nico (DM)
```

---

## 5. Technical Approach

### 5.1 Stack

- **Runtime:** OpenClaw (cron + agent coordination)
- **Storage:** File system (JSON state) + memory/
- **Notifications:** Discord via OpenClaw SDK
- **Monitoring:** Status page semplice (genera markdown)

### 5.2 Key Files

```
openclaw-automation/
├── BRIEF.md
├── TASKS.md
├── SPEC.md
├── KICKOFF.md
├── cron/
│   ├── daily-standup.js
│   ├── blocker-check.js
│   ├── health-check.js
│   └── weekly-summary.js
├── agents/
│   └── coordinator.js
├── lib/
│   ├── notifier.js
│   ├── state.js
│   └── github.js
└── data/
    └── state.json
```

### 5.3 Dependencies

- OpenClaw SDK (già disponibile)
- Discord.js o webhook (per notifications)
- GitHub API (per status checks)

---

## 6. What We Don't Do (MVP)

- No external dashboard web
- No database (filesystem + JSON è sufficiente)
- No mobile push (Discord è abbastanza)
- No complex scheduling (solo cron base)

---

## 7. Success Criteria

1. **Standup automatizzato** — ogni mattina alle 9 arriva standup senza intervento manuale
2. **Blocker detection** — se task bloccata > 24h, PO viene avvisato entro 2h
3. **Agent monitoring** — se agente down, Nico sa entro 30min
4. **Zero manual reminder** — niente più "chi fa cosa oggi?" manuale

---

## 8. Timeline

- **Day 1 (Lun):** Setup project, cron standup
- **Day 2:** Blocker detection + notification
- **Day 3:** Agent health check
- **Day 4:** Testing + refinement
- **Day 5:** Ship MVP

---

## 9. Open Questions

1. Qual è il formato ideale per gli standup updates?
2. Vogliamo un canale Discord dedicato o usiamo quello esistente?
3. Quanto tempo retention per i log/notification history?
