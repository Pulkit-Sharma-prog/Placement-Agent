# PlacementsAI — AI-Powered College Placement System

A full-stack multi-agent platform for automating college placement workflows:
resume parsing, student profiling, TF-IDF job matching, application tracking,
recruiter management, and analytics dashboards.

---

## Project layout

```
placements-agent/
├── backend/             # FastAPI + SQLAlchemy + 8 AI agents
│   ├── agents/          # resume_parser, student_profiling, job_processing,
│   │                    # matching_engine, interview_tracker, recommendation,
│   │                    # recruiter_management, analytics
│   ├── api/             # FastAPI app, routes, shared limiter
│   ├── database/        # ORM models, connection, seed data
│   ├── utils/           # JWT auth + upload validation helpers
│   ├── alembic/         # DB migrations (see alembic/README.md)
│   └── tests/           # pytest suite
├── frontend/            # React 19 + Vite + Tailwind CSS v4
│   └── src/
│       ├── pages/       # student/, recruiter/, admin/, auth/, shared/
│       ├── components/  # layout/, ui/, charts/, ErrorBoundary
│       ├── store/       # Zustand auth store
│       └── lib/         # Axios API client
├── requirements.txt     # Python deps (shared across backend + tests)
├── render.yaml          # Render.com deploy config
└── .python-version      # Pinned Python version
```

---

## Prerequisites

- **Python** 3.11 (see `.python-version`)
- **Node.js** 18+

---

## Setup

### 1. Backend

```bash
cd placements-agent

# Create and activate a virtualenv
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Database

On a fresh checkout, either run the seed script (creates `placements.db`
with sample students, jobs, and matches) or apply migrations against an
empty DB.

```bash
cd backend

# Option A — demo data
python -m database.seed_data

# Option B — empty schema via Alembic
alembic upgrade head
```

If you already have a `placements.db` from `create_tables()`, stamp it as
current before your next migration:

```bash
alembic stamp head
```

See `backend/alembic/README.md` for the full migration workflow.

### 3. Run the API

```bash
cd backend
uvicorn api.main:app --reload --port 8000
```

- API base:   `http://localhost:8000/api/v1`
- Swagger UI: `http://localhost:8000/docs`
- Health:     `http://localhost:8000/health`

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`. The Vite dev server proxies `/api/*`
and `/health` to `127.0.0.1:8000`, so no CORS or env setup is needed for
local development.

---

## Environment variables

Backend (all optional in dev):

| Var                | Purpose                                                                 |
|--------------------|-------------------------------------------------------------------------|
| `ENV`              | `production` activates the default-SECRET_KEY safety check              |
| `SECRET_KEY`       | JWT signing key. **Must** be set in production.                         |
| `DATABASE_URL`     | SQLAlchemy URL. Defaults to SQLite in `backend/database/placements.db`  |
| `FRONTEND_URL`     | Appended to the CORS allow-list                                          |
| `CORS_ORIGINS`     | Comma-separated override for the whole CORS allow-list                  |
| `GOOGLE_CLIENT_ID` | Client ID for Google Sign-In                                            |

Frontend:

| Var                  | Purpose                                                      |
|----------------------|--------------------------------------------------------------|
| `VITE_API_BASE_URL`  | Override the default `/api/v1` base URL (same-origin/proxy) |

---

## Demo credentials

| Role      | Email                  | Password   |
|-----------|------------------------|------------|
| Admin     | admin@placements.edu   | admin123   |
| Recruiter | recruiter1@google.com  | recruiter1 |
| Student   | student1@college.edu   | student1   |

---

## Running tests

```bash
cd backend
pytest tests/ -v
```

---

## Key features

**Student Portal** — dashboard, job matches (TF-IDF cosine similarity),
application tracker, resume upload with AI parsing, notifications.

**Recruiter Portal** — candidate shortlist, 3-step job posting form,
searchable candidate table, interview schedule.

**Admin Dashboard** — placement KPIs, monthly trends, branch breakdown,
CTC distribution, skill demand, full student/recruiter management.

---

## Security notes

- Login is rate-limited to **5 attempts / minute / IP** (slowapi).
- Registration is rate-limited to **10 / hour / IP**.
- Resume uploads are capped at **10 MiB** and restricted to PDF/DOCX.
- JWT tokens are 24-hour; `SECRET_KEY` must be overridden in production.

---

## Tech stack

**Backend:** Python 3.11, FastAPI, SQLAlchemy 2, Alembic, SQLite,
scikit-learn (TF-IDF), spaCy, pdfplumber, python-docx, APScheduler,
slowapi, python-jose (JWT), passlib (bcrypt).

**Frontend:** React 19, Vite, Tailwind CSS v4, Framer Motion,
TanStack Query v5, Zustand, Recharts, Axios, Sonner, Lucide React.

**AI Agents:** ResumeParserAgent, StudentProfilingAgent, JobProcessingAgent,
MatchingEngineAgent, InterviewTrackerAgent, RecommendationAgent,
RecruiterManagementAgent, AnalyticsAgent.
