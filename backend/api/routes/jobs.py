"""
routes/jobs.py — Job CRUD, shortlisting, PDF export.
"""

import asyncio
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db_session
from database.models import Application, Match, Recruiter, Job, Student, StudentProfile
from utils.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def _serialize_job(job: Job, db: Session) -> dict:
    rec = db.query(Recruiter).filter_by(id=job.recruiter_id).first() if job.recruiter_id else None
    return {
        "id": job.id,
        "recruiter_id": job.recruiter_id,
        "company": rec.company_name if rec else "Unknown",
        "title": job.title,
        "description": job.description,
        "location": job.location,
        "ctc_min": job.ctc_min,
        "ctc_max": job.ctc_max,
        "required_skills": job.required_skills,
        "preferred_skills": job.preferred_skills,
        "min_cgpa": job.min_cgpa,
        "eligible_branches": job.eligible_branches,
        "graduation_year": job.graduation_year,
        "status": job.status,
        "application_deadline": job.application_deadline.isoformat() if job.application_deadline else None,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "applications_count": db.query(Application).filter_by(job_id=job.id).count(),
    }


@router.get("")
def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    branch: Optional[str] = None,
    min_ctc: Optional[int] = None,
    max_ctc: Optional[int] = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    query = db.query(Job).filter_by(status="active")
    if search:
        query = query.filter(Job.title.ilike(f"%{search}%"))
    if min_ctc:
        query = query.filter(Job.ctc_min >= min_ctc)
    if max_ctc:
        query = query.filter(Job.ctc_max <= max_ctc)

    total = query.count()
    jobs = query.order_by(Job.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [_serialize_job(j, db) for j in jobs],
        "meta": {"page": page, "limit": limit, "total": total},
    }


@router.get("/{job_id}")
def get_job(job_id: str, user=Depends(get_current_user), db: Session = Depends(get_db_session)):
    job = db.query(Job).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"success": True, "data": _serialize_job(job, db)}


class JobCreateRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    location: Optional[str] = ""
    ctc_min: Optional[int] = None
    ctc_max: Optional[int] = None
    required_skills: list = []
    preferred_skills: list = []
    min_cgpa: Optional[float] = None
    eligible_branches: list = []
    graduation_year: Optional[int] = None
    application_deadline: Optional[str] = None


@router.post("")
async def create_job(
    req: JobCreateRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter or Admin only")

    # Get recruiter record
    from database.models import Recruiter
    rec = db.query(Recruiter).filter_by(user_id=user["sub"]).first()

    deadline = None
    if req.application_deadline:
        try:
            deadline = datetime.fromisoformat(req.application_deadline)
        except Exception:
            pass

    job = Job(
        recruiter_id=rec.id if rec else None,
        title=req.title,
        description=req.description,
        location=req.location,
        ctc_min=req.ctc_min,
        ctc_max=req.ctc_max,
        min_cgpa=req.min_cgpa,
        graduation_year=req.graduation_year,
        status="active",
        application_deadline=deadline,
    )
    job.required_skills = req.required_skills
    job.preferred_skills = req.preferred_skills
    job.eligible_branches = req.eligible_branches
    job.skill_string = " ".join(req.required_skills + req.preferred_skills)
    db.add(job)
    db.flush()
    job_id = job.id
    db.commit()

    # Run job processing + matching in background
    try:
        from agents.job_processing.agent import JobProcessingAgent
        from agents.matching_engine.agent import MatchingEngineAgent

        processor = JobProcessingAgent()
        result = await processor.run({
            "job_id": job_id,
            "raw_job": {
                "title": req.title,
                "description": req.description,
                "location": req.location,
                "ctc_min": req.ctc_min,
                "ctc_max": req.ctc_max,
            }
        })

        # Update skill string with processed result
        from database.connection import get_db
        with get_db() as session:
            j = session.query(Job).filter_by(id=job_id).first()
            if j and result.get("processed"):
                p = result["processed"]
                if not j.required_skills:
                    j.required_skills = p.get("required_skills", [])
                if not j.preferred_skills:
                    j.preferred_skills = p.get("preferred_skills", [])
                j.skill_string = p.get("skill_string", j.skill_string)

        matcher = MatchingEngineAgent()
        await matcher.run({"mode": "job", "job_id": job_id})
    except Exception as e:
        pass  # Don't fail job creation if agents fail

    with get_db_session().__next__() if False else db:
        job = db.query(Job).filter_by(id=job_id).first()
        return {"success": True, "data": _serialize_job(job, db) if job else {"id": job_id}}


@router.put("/{job_id}")
def update_job(
    job_id: str,
    req: JobCreateRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    job = db.query(Job).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if user["role"] == "recruiter":
        rec = db.query(Recruiter).filter_by(user_id=user["sub"]).first()
        if not rec or job.recruiter_id != rec.id:
            raise HTTPException(status_code=403, detail="Not your job")

    for field, val in req.model_dump(exclude_none=True).items():
        if field in ("required_skills", "preferred_skills", "eligible_branches"):
            setattr(job, field, val)
        elif hasattr(job, field):
            setattr(job, field, val)

    return {"success": True, "data": _serialize_job(job, db)}


@router.delete("/{job_id}")
def delete_job(job_id: str, user=Depends(get_current_user), db: Session = Depends(get_db_session)):
    job = db.query(Job).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if user["role"] == "recruiter":
        rec = db.query(Recruiter).filter_by(user_id=user["sub"]).first()
        if not rec or job.recruiter_id != rec.id:
            raise HTTPException(status_code=403, detail="Not your job")

    job.status = "closed"
    return {"success": True, "data": {"message": "Job closed"}}


@router.get("/{job_id}/shortlist")
def get_shortlist(
    job_id: str,
    limit: int = Query(20, ge=1, le=50),
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter or Admin only")

    matches = (
        db.query(Match)
        .filter_by(job_id=job_id, eligible=True)
        .order_by(Match.score.desc())
        .limit(limit)
        .all()
    )

    shortlist = []
    for m in matches:
        student = db.query(Student).filter_by(id=m.student_id).first()
        profile = db.query(StudentProfile).filter_by(student_id=m.student_id).first()
        if student:
            shortlist.append({
                "student_id": m.student_id,
                "name": student.full_name,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "match_score": m.score,
                "profile_score": profile.profile_score if profile else 0,
                "skills": profile.canonical_skills[:6] if profile else [],
                "skill_overlap": m.skill_overlap,
                "missing_skills": m.missing_skills,
                "linkedin_url": student.linkedin_url,
            })

    return {"success": True, "data": shortlist}


@router.get("/skill-demand")
def get_skill_demand(
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Return which skills are most in-demand across active jobs,
    and for students, which of their skills match the most jobs."""
    active_jobs = db.query(Job).filter_by(status="active").all()

    skill_demand = {}  # skill -> count of jobs requiring it
    for job in active_jobs:
        for skill in (job.required_skills or []):
            skill_demand[skill] = skill_demand.get(skill, 0) + 1
        for skill in (job.preferred_skills or []):
            skill_demand[skill] = skill_demand.get(skill, 0) + 0.5

    sorted_demand = sorted(skill_demand.items(), key=lambda x: -x[1])[:20]

    result = {
        "total_active_jobs": len(active_jobs),
        "top_demanded_skills": [
            {"skill": s, "demand_count": round(c, 1)} for s, c in sorted_demand
        ],
    }

    # If student, also show which of their skills are in demand
    if user["role"] == "student":
        student = db.query(Student).filter_by(user_id=user["sub"]).first()
        if student:
            profile = db.query(StudentProfile).filter_by(student_id=student.id).first()
            if profile and profile.canonical_skills:
                my_skills = set(profile.canonical_skills)
                matching = [
                    {"skill": s, "demand_count": round(c, 1)}
                    for s, c in sorted_demand if s in my_skills
                ]
                missing_high_demand = [
                    {"skill": s, "demand_count": round(c, 1)}
                    for s, c in sorted_demand[:10] if s not in my_skills
                ]
                result["your_in_demand_skills"] = matching
                result["skills_to_learn"] = missing_high_demand

    return {"success": True, "data": result}


@router.get("/{job_id}/shortlist/pdf")
def get_shortlist_pdf(
    job_id: str,
    limit: int = Query(20, ge=1, le=50),
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter or Admin only")

    job = db.query(Job).filter_by(id=job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    rec = db.query(Recruiter).filter_by(id=job.recruiter_id).first()
    company = rec.company_name if rec else "Unknown"

    # Get shortlist data
    matches = (
        db.query(Match)
        .filter_by(job_id=job_id, eligible=True)
        .order_by(Match.score.desc())
        .limit(limit)
        .all()
    )
    shortlist = []
    for m in matches:
        student = db.query(Student).filter_by(id=m.student_id).first()
        profile = db.query(StudentProfile).filter_by(student_id=m.student_id).first()
        if student:
            shortlist.append({
                "name": student.full_name,
                "branch": student.branch,
                "cgpa": student.cgpa,
                "match_score": m.score,
                "skills": profile.canonical_skills[:4] if profile else [],
            })

    from agents.recruiter_management.agent import RecruiterManagementAgent
    agent = RecruiterManagementAgent()
    pdf_bytes = agent.generate_shortlist_pdf(job_id, shortlist, job.title, company)

    if not pdf_bytes:
        raise HTTPException(status_code=500, detail="PDF generation failed")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="shortlist_{job_id[:8]}.pdf"'},
    )
