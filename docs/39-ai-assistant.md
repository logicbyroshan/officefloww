# 39. Management AI Assistant & Deterministic Tool Architecture

## 1. Safety & Responsibility Principles
1. **Zero Probabilistic Financial Calculations**: The AI never directly computes stock, financial totals, GST, piece rates, or ledger balances.
2. **Zero Direct Database Mutations**: The AI assistant interacts exclusively through read-only deterministic backend query tools. All mutations must occur through authorized REST endpoints.
3. **Evidence-Based Answers**: Every generated answer references verifiable raw data evidence.

---

## 2. Controlled Read-Only Tool Layer

```mermaid
graph LR
    User[Executive / Manager Query] --> Assistant[Management AI Assistant]
    Assistant --> Tools[Deterministic Tool Layer]
    Tools --> T1[get_orders_at_risk]
    Tools --> T2[get_low_stock]
    Tools --> T3[get_employee_workload]
    Tools --> T4[get_labour_performance]
    Tools --> T5[get_pending_payments]
    Tools --> T6[get_order_status]
    
    T1 --> DB[(PostgreSQL Database)]
    T2 --> DB
    T3 --> DB
    T4 --> DB
    T5 --> DB
    T6 --> DB
    
    DB --> Tools
    Tools --> Assistant
    Assistant --> Answer[Executive Explanation with Data Evidence]
```

---

## 3. Supported Natural Language Questions
- *"What needs attention today?"*
- *"What orders are at risk of missing deadlines?"*
- *"Which materials will run out soon?"*
- *"Who has too much workload on the floor?"*
- *"Who is the fastest MPL labourer?"*
- *"How much money is pending across client invoices?"*
- *"Generate daily executive briefing."*
