# PlacementsAI — AI-Powered College Placement System

A full-stack multi-agent platform for automating college placement workflows. Includes resume parsing, student profiling, job-student matching (TF-IDF), application tracking, recruiter management, and analytics dashboards.

---

## Architecture

```
placements-agent/
├── backend/             # FastAPI + SQLAlchemy + 8 AI agents
│   ├── agents/          # resume_parser, student_profiling, job_processing,
│   │                    # matching_engine, interview_tracker, recommendation,
│   │                    # recruiter_management, analytics
│   ├── api/             # FastAPI app + REST routes
│   ├── database/        # ORM models, connection, seed data
│   └── utils/           # JWT auth helpers
├── frontend/            # React 19 + Vite + Tailwind CSS v4
│   └── src/
│       ├── pages/       # student/, recruiter/, admin/, auth/
│       ├── components/  # layout/, ui/, charts/
│       ├── store/       # Zustand auth store
│       └── lib/         # Axios API client
└── venv/                # Python virtualenv (shared)
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**

---

## Setup & Run

### 1. Backend

```bash
cd placements-agent

# Activate virtualenv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies (if not already installed)
pip install fastapi uvicorn sqlalchemy passlib python-jose[cryptography] \
    scikit-learn reportlab python-multipart python-docx spacy pdfplumber \
    aiosmtplib apscheduler bcrypt==4.0.1

python -m spacy download en_core_web_sm

# Seed the database (creates placements.db with 20 students, 15 jobs, matches)
cd backend
python -m database.seed_data

# Start the API server
uvicorn api.main:app --reload --port 8000
```

API is available at: `http://localhost:8000/api/v1`  
Swagger docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd placements-agent/frontend

npm install
npm run dev
```

App is available at: `http://localhost:5173`

---

## Demo Credentials

| Role      | Email                      | Password   |
|-----------|----------------------------|------------|
| Admin     | admin@placements.edu       | admin123   |
| Recruiter | recruiter1@google.com      | recruiter1 |
| Student   | student1@college.edu       | student1   |

---

## Key Features

### Student Portal
- **Dashboard** — match score overview, top job recommendations, application status
- **Job Matches** — browse jobs ranked by AI match score (TF-IDF cosine similarity)
- **Applications** — track application pipeline stage by stage
- **Profile** — upload resume (PDF/DOCX), view parsed data and skill radar
- **Notifications** — real-time match alerts, interview reminders

### Recruiter Portal
- **Dashboard** — candidate shortlist, job performance stats
- **Post Job** — 3-step form: basic info → requirements → preview
- **Candidates** — searchable table with profile scores and skill badges
- **Job Postings** — manage all active/closed postings
- **Interviews** — schedule view with candidate details

### Admin Dashboard
- **Overview** — placement rate, avg CTC, total offers, funnel visualization
- **Analytics** — monthly trends, branch breakdown, CTC distribution, skill demand
- **Students** — full student management with search and branch filter
- **Recruiters** — recruiter cards with engagement scores

---

## API Overview

Base URL: `/api/v1`

| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| POST   | `/auth/login`                     | Login → JWT token              |
| POST   | `/auth/register`                  | Student registration           |
| GET    | `/students`                       | List students (paginated)      |
| POST   | `/students/{id}/resume`           | Upload + parse resume          |
| GET    | `/students/{id}/matches`          | AI job matches for student     |
| GET    | `/jobs`                           | List jobs                      |
| POST   | `/jobs`                           | Post new job                   |
| GET    | `/jobs/{id}/shortlist`            | Ranked candidates for job      |
| POST   | `/applications`                   | Apply to job                   |
| PATCH  | `/applications/{id}/status`       | Update application status      |
| GET    | `/analytics/overview`             | KPI summary                    |
| GET    | `/analytics/monthly-offers`       | Monthly offer trends           |
| POST   | `/admin/agents/{name}/run`        | Trigger agent manually         |

---

## Running Tests

```bash
cd placements-agent
venv\Scripts\activate
cd backend
python -m pytest tests/ -v
```

---

## Tech Stack

**Backend:** Python, FastAPI, SQLAlchemy 2.x, SQLite, scikit-learn (TF-IDF), spaCy, pdfplumber, reportlab, python-jose (JWT), passlib (bcrypt)

**Frontend:** React 19, Vite 8, Tailwind CSS v4, Framer Motion, TanStack Query v5, Zustand, Recharts, Axios, Sonner (toasts), Lucide React

**AI Agents:** 8 specialized agents — ResumeParserAgent, StudentProfilingAgent, JobProcessingAgent, MatchingEngineAgent, InterviewTrackerAgent, RecommendationAgent, RecruiterManagementAgent, AnalyticsAgent
