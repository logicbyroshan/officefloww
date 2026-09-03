# 12 — Role-Based User Experience (RBAC)

PrintFlow enforces strict role-based access control (RBAC) customized for each operational role at Adharsh Bhopal:

---

## 1. Workstation Seed Accounts (`@adharshbhopal.in`)

| Role Identifier | Default User | Authorized Workspaces | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| `OWNER` / `ADMIN` | Rohan Sharma | All 7 Workspaces | Complete executive control, overrides, settings, financials |
| `MANAGER` | Priya Nair | All 7 Workspaces | Shop-floor supervision, task dispatch, client approvals |
| `SALES` | Vikram Malhotra | `Dashboard`, `Tasks`, `Clients`, `Settings` | Client onboarding, quotation drafting, order tracking |
| `DESIGNER` | Sneha Roy | `Dashboard`, `Tasks`, `Clients`, `Settings` | Prepress vector repeats, proof generation, artwork signoffs |
| `DATA_OPERATOR` | Amit Verma | `Dashboard`, `Tasks`, `Clients`, `Settings` | Student photo/roster data preparation, barcode generation |
| `PRODUCTION_MANAGER` | Rajesh Gupta | `Dashboard`, `Tasks`, `Staff`, `Stock`, `Clients`, `Settings` | Machine batching, line load balancing, operator allocation |
| `MACHINE_OPERATOR` | Dinesh Kumar | `Dashboard`, `Tasks`, `Stock`, `Settings` | Sublimation rotary press run, temperature logging, task advance |
| `PACKING_OPERATOR` | Sunil Yadav | `Dashboard`, `Tasks`, `Settings` | Verification, bundle packaging, carton barcode labeling |
| `ACCOUNTS` | Ananya Deshmukh | `Dashboard`, `Tasks`, `Clients`, `Billing`, `Settings` | GST tax invoices, bank reconciliation, payment recording |
| `LABOUR` | Ramesh Unit | `Dashboard`, `Tasks` | Contractor piece-rate queue, finished hardware count reporting |

---

## 2. Institutional Domain Validation

All user accounts must have an `@adharshbhopal.in` email domain to authenticate on desktop manufacturing terminals. External emails are rejected at the authentication barrier.
