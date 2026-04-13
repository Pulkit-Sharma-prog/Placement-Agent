"""
routes/applications.py — Apply to jobs, update application status.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db_session
from database.models import Application, ApplicationEvent, Job, Match, Recruiter, Student
from utils.auth import get_current_user

router = APIRouter(prefix="/applications", tags=["Applications"])


class ApplyRequest(BaseModel):
    job_id: str


class StatusUpdateRequest(BaseModel):
    status: str
    metadata: dict = {}


@router.post("")
def apply_to_job(
    req: ApplyRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Students only")

    student = db.query(Student).filter_by(user_id=user["sub"]).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")

    job = db.query(Job).filter_by(id=req.job_id, status="active").first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or closed")

    existing = db.query(Application).filter_by(student_id=student.id, job_id=req.job_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already applied to this job")

    app = Application(student_id=student.id, job_id=req.job_id, status="applied")
    db.add(app)
    db.flush()

    event = ApplicationEvent(application_id=app.id, from_status=None, to_status="applied")
    event.event_metadata = {}
    db.add(event)

    return {
        "success": True,
        "data": {
            "application_id": app.id,
            "status": "applied",
            "job_id": req.job_id,
        }
    }


@router.patch("/{application_id}/status")
async def update_status(
    application_id: str,
    req: StatusUpdateRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter or Admin only")

    app = db.query(Application).filter_by(id=application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    from agents.interview_tracker.agent import InterviewTrackerAgent
    tracker = InterviewTrackerAgent()
    result = await tracker.run({
        "application_id": application_id,
        "new_state": req.status,
        "metadata": req.metadata,
    })

    if not result.get("transition_valid"):
        raise HTTPException(status_code=400, detail=result.get("error", "Invalid transition"))

    return {"success": True, "data": result}


@router.get("")
def list_applications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    student_id: Optional[str] = None,
    job_id: Optional[str] = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    query = db.query(Application)
    if status:
        query = query.filter(Application.status == status)
    if student_id:
        query = query.filter(Application.student_id == student_id)
    if job_id:
        query = query.filter(Application.job_id == job_id)

    total = query.count()
    apps = query.order_by(Application.applied_at.desc()).offset((page - 1) * limit).limit(limit).all()

    result = []
    for app in apps:
        student = db.query(Student).filter_by(id=app.student_id).first()
        job = db.query(Job).filter_by(id=app.job_id).first()
        rec = db.query(Recruiter).filter_by(id=job.recruiter_id).first() if job else None
        result.append({
            "id": app.id,
            "status": app.status,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "student": {"id": student.id, "name": student.full_name, "branch": student.branch} if student else None,
            "job": {"id": job.id, "title": job.title, "company": rec.company_name if rec else None} if job else None,
        })

    return {
        "success": True,
        "data": result,
        "meta": {"page": page, "limit": limit, "total": total},
    }
