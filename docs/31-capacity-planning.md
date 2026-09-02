# 31. Capacity Planning, Workload & Absence Handover

## 1. Overview
The **Capacity Planning Engine** tracks resource utilization across machines, floor operators, and outside assembly contractors to eliminate production bottlenecks and prevent employee burnout.

---

## 2. Resource Capacity Metrics
The system calculates daily and weekly workload allocation using standardized 8-hour shift models:

$$\text{Utilization \%} = \left(\frac{\text{Allocated Hours}}{\text{Total Capacity Hours}}\right) \times 100$$

### Workload Classification
- **NORMAL** (< 75% utilization): Healthy queue; ready to accept new expedited jobs.
- **HIGH** (75% - 99% utilization): Approaching shift capacity limit.
- **OVERLOADED** ($\ge$ 100% utilization): Queue exceeds available runtime; triggers automated task rebalancing recommendations.

---

## 3. Employee Absence & Automated Handover Engine

When an employee reports leave (e.g. sick leave, expo travel, personal emergency):

```mermaid
sequenceDiagram
    autonumber
    actor Employee as Absent Employee / Supervisor
    participant Engine as Absence Handover Engine
    participant DB as System Database
    actor Manager as Production Manager

    Employee->>Engine: Submit Absence Record (Dates + Reason)
    Engine->>DB: Query all Active Tasks assigned to Employee
    Engine->>DB: Find qualified substitute staff (matching Role & lowest workload)
    Engine->>Engine: Generate HandoverPlan recommendations
    Engine-->>Manager: Present Handover Plan for Review
    Manager->>Engine: Approve & Execute Handover
    Engine->>DB: Reassign Tasks & attach Handover Audit Note
    Engine-->>Manager: Handover Executed (0 Blockers Remaining)
```

### Sensitive Decision Guardrail
Task handovers and staff reallocations are **recommended** by the system, but require **manager approval** before executing mutations. The system never makes disciplinary or payroll deductions automatically.
