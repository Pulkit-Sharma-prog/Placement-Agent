"""
routes/recruiters.py — Recruiter profile management.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db_session
from database.models import Application, Job, Recruiter, User
from utils.auth import get_current_user

router = APIRouter(prefix="/recruiters", tags=["Recruiters"])


def _serialize_recruiter(rec: Recruiter, db: Session) -> dict:
    jobs = db.query(Job).filter_by(recruiter_id=rec.id).all()
    return {
        "id": rec.id,
        "user_id": rec.user_id,
        "company_name": rec.company_name,
        "sector": rec.sector,
        "contact_name": rec.contact_name,
        "website": rec.website,
        "preferences": rec.preferences,
        "engagement_score": rec.engagement_score,
        "jobs_posted": len(jobs),
        "last_active": rec.last_active.isoformat() if rec.last_active else None,
    }


@router.get("")
def list_recruiters(user=Depends(get_current_user), db: Session = Depends(get_db_session)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    recs = db.query(Recruiter).all()
    return {"success": True, "data": [_serialize_recruiter(r, db) for r in recs]}


@router.get("/{recruiter_id}")
def get_recruiter(
    recruiter_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] == "recruiter":
        rec = db.query(Recruiter).filter_by(id=recruiter_id, user_id=user["sub"]).first()
        if not rec:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        rec = db.query(Recruiter).filter_by(id=recruiter_id).first()

    if not rec:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    return {"success": True, "data": _serialize_recruiter(rec, db)}


class RecruiterUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    sector: Optional[str] = None
    contact_name: Optional[str] = None
    website: Optional[str] = None
    preferences: Optional[dict] = None


@router.put("/{recruiter_id}")
def update_recruiter(
    recruiter_id: str,
    req: RecruiterUpdateRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] == "recruiter":
        rec = db.query(Recruiter).filter_by(id=recruiter_id, user_id=user["sub"]).first()
    else:
        rec = db.query(Recruiter).filter_by(id=recruiter_id).first()

    if not rec:
        raise HTTPException(status_code=404, detail="Recruiter not found")

    for field, val in req.model_dump(exclude_none=True).items():
        setattr(rec, field, val)

    return {"success": True, "data": _serialize_recruiter(rec, db)}


@router.get("/{recruiter_id}/jobs")
def get_recruiter_jobs(
    recruiter_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] == "recruiter":
        rec = db.query(Recruiter).filter_by(id=recruiter_id, user_id=user["sub"]).first()
        if not rec:
            raise HTTPException(status_code=403, detail="Access denied")

    jobs = db.query(Job).filter_by(recruiter_id=recruiter_id).order_by(Job.created_at.desc()).all()

    result = []
    for job in jobs:
        result.append({
            "id": job.id,
            "title": job.title,
            "location": job.location,
            "ctc_min": job.ctc_min,
            "ctc_max": job.ctc_max,
            "status": job.status,
            "required_skills": job.required_skills,
            "applications_count": db.query(Application).filter_by(job_id=job.id).count(),
            "created_at": job.created_at.isoformat() if job.created_at else None,
        })

    return {"success": True, "data": result}
