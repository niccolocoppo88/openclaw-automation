# OpenClaw Automation — TASKS

**Version:** 1.0  
**Date:** 2026-04-25  

---

## Agent Assignments

| Agent | Role | Tasks |
|-------|------|-------|
| Thomas | Cron Developer | TASK-001 → TASK-004 |
| Goksu | QA + Testing | TASK-005 → TASK-006 |
| Piotr | Infrastructure | TASK-007 → TASK-008 |
| Elisa | PO + Coordinator | TASK-009 → TASK-010 |

---

## TASK-001: Daily Standup Cron
**Assignee:** Thomas  
**Priority:** HIGH  
**Description:**
- Crea cron job per standup giornaliero (09:00 lun-ven)
- Legge updates da memory/ delle agent sessions
- Compila e invia standup message a Discord

**Acceptance Criteria:**
- Standup arriva ogni mattina senza intervento manuale
- Message include tutti e 3 gli agent updates
- Formato pulito e leggibile

---

## TASK-002: Blocker Detection Cron
**Assignee:** Thomas  
**Priority:** HIGH  
**Description:**
- Cron job ogni 2h che verifica task bloccate
- Legge TASKS.md / GitHub issues
- Se blocker > 24h → notifica PO (Nico)

**Acceptance Criteria:**
- Blocker detection funziona entro 2h
- Notifica include contesto (task, chi è bloccato, da quanto)
- No false positive (solo blocker reali)

---

## TASK-003: Agent Health Check Cron
**Assignee:** Thomas  
**Priority:** HIGH  
**Description:**
- Cron ogni 30min verifica heartbeat degli agent
- Se agent down > 15min → notifica Nico (DM)
- Stato salvato in data/state.json

**Acceptance Criteria:**
- Agent down rilevato entro 30min
- Notifica DM a Nico con agent name + last seen
- Recovery detection (agent torna online → notifica)

---

## TASK-004: Weekly Summary Cron
**Assignee:** Thomas  
**Priority:** MEDIUM  
**Description:**
- Cron il venerdì alle 18:00
- Aggrega attività della settimana
- Invia summary a team channel

**Acceptance Criteria:**
- Summary include: commits, task completate, blockers risolti
- Formato leggibile (bullet points)
- Arriva il venerdì sera

---

## TASK-005: Cron Test Plan
**Assignee:** Goksu  
**Priority:** HIGH  
**Description:**
- Test plan per tutti i cron jobs
- Verifica timing (cron fire al momento giusto)
- Verifica fallback (retry on failure)
- Edge cases: server restart, timezone, DST

**Acceptance Criteria:**
- Tutti i test passano
- Timing accuracy verificato
- Failure handling testato

---

## TASK-006: Integration Test — End-to-End Flow
**Assignee:** Goksu  
**Priority:** HIGH  
**Description:**
- Test completo standup flow
- Test blocker detection flow
- Test health check flow

**Acceptance Criteria:**
- Ogni flow testato da A a Z
- Notification verify (arrivano correttamente)
- No race conditions

---

## TASK-007: State Management Infrastructure
**Assignee:** Piotr  
**Priority:** HIGH  
**Description:**
- Setup data/state.json con schema
- Script per leggere/scrivere state
- Backup automatico dello state

**Acceptance Criteria:**
- State persistente tra restart
- Schema documentato
- Backup funziona

---

## TASK-008: Discord Notification Setup
**Assignee:** Piotr  
**Priority:** HIGH  
**Description:**
- Configura webhook/canale per notifications
- Formattazione messaggi (embed vs plain text)
- Rate limiting per evitare spam

**Acceptance Criteria:**
- Notifications arrivano al canale corretto
- Formattazione consistent
- Rate limit gestito (max 1 msg/min per tipo)

---

## TASK-009: Project Setup + Kickoff
**Assignee:** Elisa  
**Priority:** HIGH  
**Status:** IN PROGRESS  
**Description:**
- Crea repo/folder structure
- Scrive BRIEF.md, TASKS.md, SPEC.md, KICKOFF.md
- Assegna task al team
- Kickoff meeting

**Acceptance Criteria:**
- Tutti i file creati
- Team allineato su obiettivi
- Kickoff completato

---

## TASK-010: Coordinate Implementation
**Assignee:** Elisa  
**Priority:** HIGH  
**Description:**
- Monitora progresso di tutti gli agent
- Update status a Nico quotidiano
- Identifica blockers e risolvi

**Acceptance Criteria:**
- Nico mai sorpreso da status
- Blockers risolti entro 1h
- Updates regolari su Discord

---

## Task Status Summary

| Task | Status | Assignee |
|-----|--------|----------|
| TASK-001 | ⬜ TODO | Thomas |
| TASK-002 | ⬜ TODO | Thomas |
| TASK-003 | ⬜ TODO | Thomas |
| TASK-004 | ⬜ TODO | Thomas |
| TASK-005 | ⬜ TODO | Goksu |
| TASK-006 | ⬜ TODO | Goksu |
| TASK-007 | ⬜ TODO | Piotr |
| TASK-008 | ⬜ TODO | Piotr |
| TASK-009 | 🔄 IN PROGRESS | Elisa |
| TASK-010 | ⬜ TODO | Elisa |

---

## Notes

1. **Cron library:** Useremo cron standard di Node.js o equivalent
2. **Discord:** Webhook per ora, bot token se serve
3. **State:** File JSON locale, non servq database
4. **Testing:** Mock GitHub API per test senza toccare repos reali
