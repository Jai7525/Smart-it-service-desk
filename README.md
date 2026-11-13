# Smart IT Service Desk & Workflow Automation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-3ECF8E.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.5_Flash-8E75B2.svg?style=flat&logo=google&logoColor=white)](https://aistudio.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enterprise-grade, ITIL-aligned **Smart IT Service Desk & Workflow Automation Platform** designed for modern organizations. Built with **FastAPI**, **SQLModel**, **Supabase PostgreSQL**, **React (TypeScript)**, and powered by **Google Gemini** for intelligent troubleshooting, automated incident classification, least-loaded agent dispatch, and ITIL Change & Service Request lifecycle governance.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [User Roles & Permissions](#user-roles--permissions)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Folder Structure](#project-folder-structure)
- [Installation & Setup](#installation--setup)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Environment Variables](#environment-variables)
- [API Documentation (Swagger/OpenAPI)](#api-documentation-swaggeropenapi)
- [Automated Test Suite](#automated-test-suite)
- [Screenshots & UI Walkthrough](#screenshots--ui-walkthrough)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Problem Statement

Traditional IT help desks suffer from slow resolution cycles, manual ticket routing bottlenecks, lack of employee resolution verification, and disconnected change management governance. 

**Smart IT Service Desk** solves these challenges by providing:
1. **Automated Incident Classification & Dispatch:** ML/Heuristic categorization with least-loaded agent routing across specialized category desks.
2. **Employee Resolution Confirmation:** Tickets cannot transition to `Closed` until the requesting employee confirms the issue is truly resolved.
3. **Enterprise Service Request Catalogue:** Multi-category catalogue with dynamic specification forms and multi-tier manager authorizations.
4. **IT Change Management (CAB):** Multi-dimensional risk score calculator, CAB review actions, and an interactive 30-day change calendar.
5. **Grounded AI Support Assistant:** Integrated with Google Gemini to offer step-by-step IT self-service troubleshooting and one-click incident drafting.

---

## Key Features

### 1. Incident Lifecycle & Mandatory Resolution Confirmation
- **Automated Routing:** Calculates Priority Matrix ($Impact \times Urgency$), generates unique human-readable ticket numbers (`INC-1001`), and assigns to the least-loaded agent on the appropriate category desk (Network, Hardware, Software, Access, General).
- **Active SLA Monitoring:** Background watchdog monitors response and resolution target windows with automated manager warning escalations.
- **Two-Phase Closure Guard:** When an agent marks an issue as `Resolved`, the ticket remains pending employee sign-off. Only explicit Employee Confirmation closes the ticket; a rejection immediately reopens the ticket to `In Progress`.

### 2. Service Requests & Approval Management
- **Enterprise Service Catalogue:** Standardized categories (Software Installation, Hardware Allocation, Corporate VPN Access, Cloud Permissions, Employee Onboarding).
- **Dynamic Specification Forms:** Field validation with custom justification fields.
- **Manager Approval Centre:** Pending authorization inbox with one-click **Approve**, **Reject** (with mandatory reason), or **Request More Information**.
- **Fulfillment & Claim Actions:** Agents can claim approved requests, log fulfillment notes, and transition through the 4-step lifecycle stepper.

### 3. IT Change Management & CAB Calendar
- **Automated Risk Engine:** Multi-factor scoring ($Impact + Complexity + Downtime + Security + Rollback$) generating `Low`, `Medium`, `High`, or `Critical` risk ratings.
- **CAB Review Portal:** Change Advisory Board controls for Managers/Admins with authorization and rejection tracking.
- **Interactive Change Calendar:** 30-day timeline visualization of scheduled implementation windows to detect maintenance collisions.
- **Execution & Rollback Controls:** Real-time logging of execution notes, testing validation, and fallback rollbacks.

### 4. Generative AI Support Assistant (Google Gemini)
- Grounded on approved internal **Knowledge Base** records.
- Clean text formatting free of raw markdown clutter.
- **Structured Incident Drafting:** Detects reported issues in conversation and prepares one-click ticket drafts with auto-populated subjects and categories.

---

## User Roles & Permissions

The platform enforces strict Role-Based Access Control (RBAC) across 4 roles:

| Role | Access & Capabilities |
| :--- | :--- |
| **Employee** | Report incidents, confirm/reject resolutions, browse Service Catalogue, submit service requests, track request steppers, chat with AI Assistant. |
| **IT Support Agent** | Agent Workspace, investigate assigned incidents, update work notes, resolve incidents, claim/fulfill approved service requests, submit and execute RFC changes. |
| **IT Manager** | Executive KPI dashboards, manual ticket reassignment, Manager Approval Centre (Service Requests), CAB review & change authorization, RCA problem management, automation audit logs. |
| **System Administrator** | User directory provision/RBAC, support team configuration, corporate department directory, SLA policy engine thresholds, system-wide automation governance. |

---

## System Architecture

```
                                  +-----------------------------+
                                  |     React 19 + Vite + TS    |
                                  |     (Tailwind CSS UI)       |
                                  +--------------+--------------+
                                                 |
                                     HTTP REST / JSON / JWT
                                                 |
                                  +--------------v--------------+
                                  |      FastAPI Backend        |
                                  |      (Python 3.12+)         |
                                  +-------+--------------+------+
                                          |              |
                      +-------------------+              +--------------------+
                      |                                                       |
        +-------------v-------------+                           +-------------v-------------+
        |   Supabase PostgreSQL     |                           |    Google Gemini API      |
        |  (SQLModel ORM / Auth)    |                           |     (gemini-3.5-flash)    |
        +---------------------------+                           +---------------------------+
```

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend:** Python 3.12+, FastAPI, SQLModel, SQLAlchemy, Pydantic v2, HTTPX.
- **Database & Auth:** Supabase PostgreSQL with Session/Transaction pooling, Supabase Auth.
- **Artificial Intelligence:** Google Gemini REST API (`gemini-3.5-flash`).
- **Testing:** Pytest, pytest-asyncio, FastAPI TestClient.

---

## Project Folder Structure

```
Smart_Ticket/
├── .env.example                 # Template for database & AI credentials
├── .gitignore                   # Excludes secrets, node_modules, .venv, build artifacts
├── pyproject.toml               # Python project configuration & dependencies
├── README.md                    # Project documentation
│
├── src/smart_ticket/            # Backend Application Source
│   ├── main.py                  # FastAPI application entry & CORS middleware
│   ├── models.py                # SQLModel database models & relationships
│   ├── schemas.py               # Pydantic schemas for serialization
│   ├── core/                    # Core configuration, database engine, security
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py          # RBAC decorators & JWT handling
│   ├── api/v1/                  # REST API Endpoints
│   │   ├── admin.py             # User provisioning, teams, SLA policies
│   │   ├── ai.py                # Gemini Assistant with response cleaning
│   │   ├── analytics.py         # Executive KPI aggregations
│   │   ├── auth.py              # Identity & session inspection
│   │   ├── automation.py        # Automation rule triggers & logs
│   │   ├── changes.py           # Change Management & CAB Calendar
│   │   ├── incidents.py         # Incident lifecycle & confirmation endpoints
│   │   ├── knowledge.py         # Knowledge base articles
│   │   ├── notifications.py     # In-app notifications
│   │   ├── problems.py          # Problem records (RCA)
│   │   └── service_requests.py  # Service Catalogue & fulfillment
│   └── services/                # Business Logic Engines
│       ├── assignment.py        # Least-loaded agent dispatch
│       ├── classification.py    # Auto-categorization engine
│       ├── priority.py          # Dynamic priority matrix
│       └── sla.py               # SLA target window calculator
│
├── frontend/                    # Frontend React Application
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx              # Role-aware router & layout
│       ├── components/          # TopNavbar, AppSidebar, StatCard, Badges
│       ├── context/             # AuthContext with mock switcher & JWT
│       ├── pages/               # Role-specific portal views & management pages
│       ├── services/api.ts      # Standardized Fetch client wrapper
│       └── types/               # TypeScript interfaces & enums
│
└── tests/                       # Test Suite
    ├── test_advanced_modules.py # End-to-end Service Requests, Changes & AI tests
    ├── test_api.py              # Core API tests
    ├── test_assignment_rules.py # Workload dispatch engine tests
    ├── test_engines.py          # Priority, SLA & Classification tests
    └── test_resolution_confirmation.py # Employee resolution confirmation tests
```

---

## Installation & Setup

### Prerequisites

- **Python:** 3.12 or newer
- **Node.js:** 18.0 or newer
- **Package Managers:** `pip` (or `uv`) and `npm`
- **Supabase Account:** Free PostgreSQL database project
- **Google AI Studio Account:** Gemini API Key

---

### 1. Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Jai7525/Smart-it-service-desk.git
   cd Smart-it-service-desk
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -e .
   ```

4. **Configure Environment Variables:**
   Copy the example configuration file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your Supabase connection string and Gemini API Key (see [Environment Variables](#environment-variables)).

5. **Start the FastAPI backend server:**
   ```bash
   uvicorn smart_ticket.main:app --host 0.0.0.0 --port 8080 --reload
   ```
   *The backend will be live at `http://127.0.0.1:8080`.*

---

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   *The frontend application will be live at `http://localhost:3000` (or `http://localhost:5173`).*

---

## Environment Variables

Configure the following keys in your `.env` file:

```env
# Application
PROJECT_NAME="Smart IT Service Desk & Workflow Automation Platform"
ENVIRONMENT="development"

# Supabase PostgreSQL Database URL
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DATABASE_URL="postgresql://postgres:your-db-password@db.your-project.supabase.co:5432/postgres"

# Supabase API & Auth
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-supabase-anon-or-service-role-key"
SUPABASE_JWT_SECRET="your-supabase-jwt-secret"

# SLA Windows (Hours)
SLA_CRITICAL_RESPONSE_HOURS=0.5
SLA_CRITICAL_RESOLUTION_HOURS=2.0
SLA_HIGH_RESPONSE_HOURS=1.0
SLA_HIGH_RESOLUTION_HOURS=4.0
SLA_MEDIUM_RESPONSE_HOURS=4.0
SLA_MEDIUM_RESOLUTION_HOURS=24.0
SLA_LOW_RESPONSE_HOURS=8.0
SLA_LOW_RESOLUTION_HOURS=48.0

# Google Gemini Generative AI
GEMINI_API_KEY="your-google-gemini-api-key"
GEMINI_MODEL="gemini-3.5-flash"
```

> **Security Note:** `.env` is explicitly added to `.gitignore`. Never commit API keys or passwords to version control.

---

## API Documentation (Swagger/OpenAPI)

Once the backend is running, interactively explore and test all endpoints:

- **Swagger UI:** [http://127.0.0.1:8080/docs](http://127.0.0.1:8080/docs)
- **ReDoc:** [http://127.0.0.1:8080/redoc](http://127.0.0.1:8080/redoc)
- **OpenAPI Schema:** [http://127.0.0.1:8080/openapi.json](http://127.0.0.1:8080/openapi.json)

---

## Automated Test Suite

The project includes unit, regression, and integration tests covering all critical engines and endpoints.

Run the test suite using `pytest`:
```bash
pytest -v
```

All 16 test suites validate:
- ✅ `test_service_request_lifecycle` (Submission, Approval, Agent Claim & Fulfillment)
- ✅ `test_change_management_lifecycle` (Risk Matrix, CAB Authorization, Execution)
- ✅ `test_ai_support_assistant` (Gemini grounding and draft generation)
- ✅ `test_full_resolution_confirmation_lifecycle` (Mandatory employee resolution check)
- ✅ `test_only_agents_assigned_for_all_categories` (RBAC dispatch integrity)
- ✅ `test_lowest_active_workload_selected` (Least-loaded routing verification)
- ✅ `test_classification_engine`, `test_priority_matrix`, `test_sla_calculation`

---

## Screenshots & UI Walkthrough

*(Add your screenshots to an `assets/` or `docs/images/` folder and link them here)*

| View | Description |
| :--- | :--- |
| **Manager Executive Overview** | High-level metrics, open SLA warnings, team dispatch capacity, and resolution trend charts. |
| **Incident Investigation & Confirmation** | Agent resolution drawer and employee two-phase confirmation dialog. |
| **Service Catalogue & Stepper** | Categorized service offerings with live 4-step progress stepper. |
| **CAB Change Calendar** | 30-day interactive timeline showing scheduled maintenance windows and blackout periods. |
| **AI Support Assistant** | Clean conversational troubleshooting powered by Gemini with one-click incident drafting. |

---

## Future Enhancements

- [ ] **Email & Slack Notifications:** Webhook integrations for outbound alerts when tickets are assigned or require approval.
- [ ] **Multi-language Support:** AI Assistant localization for global organizations.
- [ ] **CMDB (Configuration Management Database):** Direct linking of IT Assets and CIs to Change Requests.
- [ ] **SSO / SAML 2.0:** Enterprise Okta and Azure AD integration for unified corporate login.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

