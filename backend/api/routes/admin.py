"""
routes/admin.py — Admin-only endpoints: agent status, manual trigger, dashboard KPIs.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db_session
from database.models import Application, Job, Recruiter, Student
from utils.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])

AGENT_REGISTRY = {
    "resume_parser":       "agents.resume_parser.agent.ResumeParsingAgent",
    "student_profiling":   "agents.student_profiling.agent.StudentProfilingAgent",
    "job_processing":      "agents.job_processing.agent.JobProcessingAgent",
    "matching_engine":     "agents.matching_engine.agent.MatchingEngineAgent",
    "interview_tracker":   "agents.interview_tracker.agent.InterviewTrackerAgent",
    "recommendation":      "agents.recommendation.agent.RecommendationAgent",
    "recruiter_management":"agents.recruiter_management.agent.RecruiterManagementAgent",
    "analytics":           "agents.analytics.agent.AnalyticsAgent",
}

_agent_last_run: dict = {}


def _require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


@router.get("/agents/status")
def get_agent_status(user=Depends(_require_admin)):
    result = {}
    for name, cls_path in AGENT_REGISTRY.items():
        result[name] = {
            "status": "ready",
            "last_run": _agent_last_run.get(name),
            "class": cls_path.split(".")[-1],
        }
    return {"success": True, "data": result}


@router.post("/agents/{agent_name}/run")
async def run_agent(
    agent_name: str,
    user=Depends(_require_admin),
    db: Session = Depends(get_db_session),
):
    if agent_name not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_name}' not found")

    cls_path = AGENT_REGISTRY[agent_name]
    module_path, cls_name = cls_path.rsplit(".", 1)

    try:
        import importlib
        module = importlib.import_module(module_path)
        cls = getattr(module, cls_name)
        agent = cls()
        result = await agent.run({})
        _agent_last_run[agent_name] = datetime.utcnow().isoformat()
        return {"success": True, "data": {"agent": agent_name, "result": result}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {e}")


@router.get("/dashboard")
def get_admin_dashboard(user=Depends(_require_admin), db: Session = Depends(get_db_session)):
    total_students = db.query(Student).count()
    placed = db.query(Student).filter_by(status="placed").count()
    active_jobs = db.query(Job).filter_by(status="active").count()
    total_recruiters = db.query(Recruiter).count()
    total_applications = db.query(Application).count()

    placement_rate = round(placed / total_students * 100, 1) if total_students else 0

    # Recent applications
    recent_apps = db.query(Application).order_by(Application.applied_at.desc()).limit(5).all()
    recent = []
    for app in recent_apps:
        student = db.query(Student).filter_by(id=app.student_id).first()
        job = db.query(Job).filter_by(id=app.job_id).first()
        rec = db.query(Recruiter).filter_by(id=job.recruiter_id).first() if job else None
        recent.append({
            "student": student.full_name if student else "Unknown",
            "job": job.title if job else "Unknown",
            "company": rec.company_name if rec else "Unknown",
            "status": app.status,
        })

    return {
        "success": True,
        "data": {
            "total_students": total_students,
            "placed": placed,
            "placement_rate": placement_rate,
            "active_jobs": active_jobs,
            "total_recruiters": total_recruiters,
            "total_applications": total_applications,
            "recent_activity": recent,
        }
    }
