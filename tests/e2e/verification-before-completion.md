# Verification Before Completion

## Core Principle
**Evidence before claims, always.** No completion claims without fresh verification evidence.

## Gate Function
BEFORE claiming any status:

1. **IDENTIFY** what command proves the claim
2. **RUN** the full command (fresh, complete)
3. **READ** full output, check exit code, count failures
4. **VERIFY** output confirms the claim
   - If NO: state actual status with evidence
   - If YES: state claim WITH evidence
5. **ONLY THEN** make the claim

## Required Evidence by Phase

### E2E Pipeline
- `npx playwright test` output showing N/N pass, 0 failures
- Each spec's pass count listed individually

### Audit Phases
- audit-thatsweird: git diff output + summary of applied fixes
- audit-a11y: score out of 100 + finding counts by severity
- audit-perf: Lighthouse scores (performance/a11y/best-practices) + budget status

### Ship Check
- ship-check verdict (GO/NO-GO/CAUTION) with blocker/warning counts

## Red Flags — STOP
- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- About to commit/push/PR without verification
- Trusting agent success reports without independent check
- Partial verification ("linter passed so build is fine")

## When to Apply
ALWAYS before: success/completion claims, committing, PR creation, task completion, moving to next task.
