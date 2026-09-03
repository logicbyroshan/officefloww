# Operating Guidelines for AI Coding Agents (AGENTS.md)

This is the permanent operational guide for AI coding agents working in the **OfficeFloww** repository. Adhere strictly to these principles.

---

## 1. Core Operating Principles

- **Understand Before Modifying**: Fully analyze the requested task and inspect relevant code before making any edits.
- **Targeted Inspection**: Never dump or scan the entire repository. Inspect only the files directly relevant to your task.
- **Minimal Changes**: Prefer the smallest, cleanest change that correctly accomplishes the goal. Avoid opportunistic refactoring.
- **Do Not Break Existing Functionality**: Do not modify, overwrite, or remove existing business logic, invariants, or endpoints without explicit justification.
- **Respect Existing Architecture**: Follow established patterns (FastAPI modular monolith, SQLAlchemy async, standard envelopes, React design tokens).
- **No Unjustified Dependencies**: Do not add third-party libraries or packages unless explicitly requested.
- **Zero Secrets Exposure**: Never expose, generate, log, or commit secrets, passwords, API tokens, or `.env` files.
- **Verify Efficiently**: Run the smallest relevant test or typecheck for the affected component. Do not execute redundant, expensive test sweeps repeatedly.
- **Diff Hygiene**: Always inspect git status and diff before reporting completion to ensure zero unintended changes.

---

## 2. Agent Context System (`.agent/`)

Use `.agent/` files intelligently on demand. Do **not** read every context file for every task:

| File | Purpose | When to Consult |
| :--- | :--- | :--- |
| [`.agent/CONTEXT.md`](file:///.agent/CONTEXT.md) | Current project snapshot, stack, invariants, active work, and known constraints. | When starting a new feature, understanding component boundaries, or checking system state. |
| [`.agent/DECISIONS.md`](file:///.agent/DECISIONS.md) | Architectural and design decisions (ADRs) with rationale and impact. | When designing new architecture, altering existing patterns, or resolving domain questions. |
| [`.agent/CHANGELOG.md`](file:///.agent/CHANGELOG.md) | Historical milestones and notable changes. | When reviewing recent updates or tracing when a capability was introduced. |

**Context Update Rule**: Update `.agent/CONTEXT.md`, `.agent/DECISIONS.md`, or `.agent/CHANGELOG.md` **only** when a task makes a meaningful, permanent architectural change or delivers a notable milestone. Never record task-by-task execution diaries.

---

## 3. Project-Specific Invariants & Rules

1. **Deterministic Financial & Accounting Calculations**:
   - All financial math (quotations, costings, GST, labour piece-rates, scrap deductions) **must** use Python `decimal.Decimal`.
   - Never use floating point or AI-generated probabilistic estimations for financials or ledgers.
2. **Double-Entry & Ledger Integrity**:
   - Stock movements, labour material credits, and quantity transactions use append-only ledger entries. Never mutate historical ledger records directly.
3. **The 5 Core Business Invariants**:
   - **Stock**: $\text{Available} = \text{Physical} - \text{Reserved}$. Holds placed on confirmation; physical deduction occurs only on machine issue.
   - **Production File Lock**: `ProductionBatch` requires an `APPROVED` `FileVersion`.
   - **Labour Material Credit**: Unconsumed materials held by outside contractors are credited towards subsequent orders.
   - **Labour Compensation**: Payable amounts are strictly $Q_{\text{accepted}} \times \text{Rate}$. Scrap and issued quantities are mathematically excluded.
   - **Tripartite Order Completion**: An order cannot be marked `COMPLETED` unless workflows are complete/skipped, packing verified, and net good units match ordered counts.
4. **Standardized API Response Envelopes**:
   - Success: `{"success": true, "data": ..., "meta": ...}`
   - Error: `{"success": false, "error": {"code": "...", "message": "...", "details": [...]}}`
5. **AI Assistant Safety Boundary**:
   - AI assistant endpoints (`apps/api/app/ai/`) are strictly read-only tools. They must never perform database mutations.

---

## 4. Verification Cheat Sheet

- **Backend Tests**: `pytest apps/api/tests/test_<domain>.py` (or full suite: `pytest apps/api/tests`)
- **TypeScript Packages**: `npx -y -p typescript tsc --project packages/<pkg>/tsconfig.json --noEmit`
- **Desktop Bundle**: `npm run build --prefix apps/desktop` (uses esbuild)
- **OpenAPI Schema Sync**: `python scripts/generate_contracts.py`
