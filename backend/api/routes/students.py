"""
routes/students.py — Student CRUD, resume upload, matches, applications, notifications.
"""

import os
import shutil
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db, get_db_session
from database.models import Application, Job, Match, Notification, Recruiter, Student, StudentProfile
from utils.auth import get_current_user

router = APIRouter(prefix="/students", tags=["Students"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _get_own_student(user: dict, db: Session) -> Student:
    """Get the Student record for the currently logged-in student user."""
    s = db.query(Student).filter_by(user_id=user["sub"]).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student profile not found. Please contact admin.")
    return s


def _serialize_student(student: Student, profile: StudentProfile | None) -> dict:
    return {
        "id": student.id,
        "user_id": student.user_id,
        "full_name": student.full_name,
        "roll_number": student.roll_number,
        "branch": student.branch,
        "graduation_year": student.graduation_year,
        "cgpa": student.cgpa,
        "phone": student.phone,
        "linkedin_url": student.linkedin_url,
        "resume_path": student.resume_path,
        "profile_score": student.profile_score,
        "status": student.status,
        "has_resume": bool(student.resume_path),
        "email": student.user.email if student.user else None,
        "profile": {
            "canonical_skills":   profile.canonical_skills if profile else [],
            "skills_by_category": profile.skills_by_category if profile else {},
            "skill_radar":        profile.skill_radar if profile else {},
            "skill_gaps":         profile.skill_gaps if profile else [],
            "profile_score":      profile.profile_score if profile else 0,
            "last_parsed_at":     profile.last_parsed_at.isoformat() if profile and profile.last_parsed_at else None,
            "raw_parsed_data":    profile.raw_parsed_data if profile else None,
        } if profile else None,
    }


# ─── /students/me endpoints (for the logged-in student) ──────────────────────

@router.get("/me")
def get_my_profile(
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Students only")
    s = _get_own_student(user, db)
    return {"success": True, "data": _serialize_student(s, s.profile)}


@router.post("/me/resume")
async def upload_my_resume(
    resume: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Students only")

    s = _get_own_student(user, db)
    student_id = s.id

    ext = os.path.splitext(resume.filename or "")[1].lower()
    if ext not in (".pdf", ".docx"):
        raise HTTPException(status_code=422, detail="Only PDF and DOCX files are accepted")

    # Save file
    save_path = os.path.join(UPLOAD_DIR, f"{student_id}{ext}")
    with open(save_path, "wb") as f:
        shutil.copyfileobj(resume.file, f)

    s.resume_path = save_path
    db.commit()

    # Run agent pipeline
    try:
        from agents.resume_parser.agent import ResumeParsingAgent
        from agents.student_profiling.agent import StudentProfilingAgent
        from agents.matching_engine.agent import MatchingEngineAgent

        parser = ResumeParsingAgent()
        result = await parser.run({
            "student_id": student_id,
            "file_path": save_path,
            "file_type": ext.lstrip("."),
        })

        profiler = StudentProfilingAgent()
        profile_result = await profiler.run({
            "student_id": student_id,
            "parsed_resume": result.get("parsed", {}),
        })

        profile_data = profile_result.get("profile", {})

        # Persist profile using a fresh session
        with get_db() as session:
            profile = session.query(StudentProfile).filter_by(student_id=student_id).first()
            if not profile:
                profile = StudentProfile(student_id=student_id)
                session.add(profile)
            profile.canonical_skills   = profile_data.get("canonical_skills", [])
            profile.skills_by_category = profile_data.get("skills_by_category", {})
            profile.skill_radar        = profile_data.get("skill_radar", {})
            profile.skill_gaps         = profile_data.get("skill_gaps", [])
            profile.profile_score      = profile_data.get("profile_score", 0)
            profile.last_parsed_at     = datetime.utcnow()
            profile.raw_parsed_data    = result.get("parsed", {})

            student_obj = session.query(Student).filter_by(id=student_id).first()
            if student_obj:
                student_obj.profile_score = profile_data.get("profile_score", 0)

        # Run matching for this student
        matcher = MatchingEngineAgent()
        await matcher.run({"mode": "student", "student_id": student_id})

        parsed = result.get("parsed", {})
        return {
            "success": True,
            "data": {
                "message": "Resume parsed and profile updated",
                "profile_score": profile_data.get("profile_score", 0),
                "skills_found": len(profile_data.get("canonical_skills", [])),
                "name": parsed.get("name", ""),
                "email": parsed.get("email", ""),
                "phone": parsed.get("phone", ""),
                "skills": profile_data.get("canonical_skills", []),
                "skill_radar": profile_data.get("skill_radar", {}),
                "skill_gaps": profile_data.get("skill_gaps", []),
                "raw": parsed,
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)[:300]}")


@router.get("/me/matches")
def get_my_matches(
    limit: int = Query(20, ge=1, le=50),
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Students only")

    s = _get_own_student(user, db)

    if not s.resume_path:
        return {"success": True, "data": [], "no_resume": True}

    matches = (
        db.query(Match)
        .filter_by(student_id=s.id, eligible=True)
        .order_by(Match.score.desc())
        .limit(limit)
        .all()
    )

    result = []
    for m in matches:
        job = db.query(Job).filter_by(id=m.job_id, status="active").first()
        if job:
            rec = db.query(Recruiter).filter_by(id=job.recruiter_id).first()
            result.append({
                "match_id": m.id,
                "score": round(m.score, 1),
                "skill_overlap": m.skill_overlap or [],
                "missing_skills": m.missing_skills or [],
                "job": {
                    "id": job.id,
                    "title": job.title,
                    "company": rec.company_name if rec else "Unknown",
                    "location": job.location,
                    "ctc_min": job.ctc_min,
                    "ctc_max": job.ctc_max,
                    "required_skills": job.required_skills or [],
                    "application_deadline": job.application_deadline.isoformat() if job.application_deadline else None,
                },
            })

    return {"success": True, "data": result}


@router.get("/me/applications")
def get_my_applications(
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Students only")

    s = _get_own_student(user, db)
    apps = db.query(Application).filter_by(student_id=s.id).order_by(Application.applied_at.desc()).all()

    result = []
    for app in apps:
        job = db.query(Job).filter_by(id=app.job_id).first()
        rec = db.query(Recruiter).filter_by(id=job.recruiter_id).first() if job else None
        result.append({
            "id": app.id,
            "status": app.status,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "last_updated": app.last_updated.isoformat() if app.last_updated else None,
            "ctc_offered": app.ctc_offered,
            "job": {
                "id": job.id if job else None,
                "title": job.title if job else "Unknown Role",
                "company": rec.company_name if rec else "Unknown",
                "location": job.location if job else None,
            },
        })

    return {"success": True, "data": result}


@router.get("/me/notifications")
def get_my_notifications(
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Students only")

    notifs = (
        db.query(Notification)
        .filter_by(user_id=user["sub"])
        .order_by(Notification.created_at.desc())
        .all()
    )
    return {
        "success": True,
        "data": [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifs
        ]
    }


@router.patch("/me/notifications/{notif_id}/read")
def mark_my_notification_read(
    notif_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Students only")
    notif = db.query(Notification).filter_by(id=notif_id, user_id=user["sub"]).first()
    if notif:
        notif.is_read = True
    return {"success": True}


# ─── Admin: list all students ──────────────────────────────────────────────────

@router.get("")
def list_students(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    branch: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] not in ("admin", "recruiter"):
        raise HTTPException(status_code=403, detail="Admin or recruiter only")

    query = db.query(Student)
    if branch:
        query = query.filter(Student.branch == branch)
    if status:
        query = query.filter(Student.status == status)
    if search:
        query = query.filter(Student.full_name.ilike(f"%{search}%"))

    total = query.count()
    students = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "success": True,
        "data": [_serialize_student(s, s.profile) for s in students],
        "meta": {"page": page, "limit": limit, "total": total},
    }


@router.get("/{student_id}")
def get_student(
    student_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] == "student":
        s = db.query(Student).filter_by(id=student_id, user_id=user["sub"]).first()
        if not s:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        s = db.query(Student).filter_by(id=student_id).first()

    if not s:
        raise HTTPException(status_code=404, detail="Student not found")

    return {"success": True, "data": _serialize_student(s, s.profile)}


@router.get("/{student_id}/resume/download")
def download_resume(
    student_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    """Download the student's resume file (admin/recruiter only, or own student)."""
    if user["role"] == "student":
        s = db.query(Student).filter_by(id=student_id, user_id=user["sub"]).first()
        if not s:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        s = db.query(Student).filter_by(id=student_id).first()

    if not s or not s.resume_path:
        raise HTTPException(status_code=404, detail="Resume not found")

    path = s.resume_path
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Resume file missing on server")

    from fastapi.responses import FileResponse
    filename = f"{(s.full_name or 'resume').replace(' ', '_')}_resume{os.path.splitext(path)[1]}"
    return FileResponse(path, filename=filename, media_type="application/octet-stream")


@router.post("/{student_id}/resume")
async def upload_resume(
    student_id: str,
    resume: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] == "student":
        s = db.query(Student).filter_by(id=student_id, user_id=user["sub"]).first()
        if not s:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        s = db.query(Student).filter_by(id=student_id).first()

    if not s:
        raise HTTPException(status_code=404, detail="Student not found")

    ext = os.path.splitext(resume.filename or "")[1].lower()
    if ext not in (".pdf", ".docx"):
        raise HTTPException(status_code=422, detail="Only PDF and DOCX files are accepted")

    save_path = os.path.join(UPLOAD_DIR, f"{student_id}{ext}")
    with open(save_path, "wb") as f:
        shutil.copyfileobj(resume.file, f)

    s.resume_path = save_path
    db.commit()

    try:
        from agents.resume_parser.agent import ResumeParsingAgent
        from agents.student_profiling.agent import StudentProfilingAgent
        from agents.matching_engine.agent import MatchingEngineAgent

        parser = ResumeParsingAgent()
        result = await parser.run({
            "student_id": student_id,
            "file_path": save_path,
            "file_type": ext.lstrip("."),
        })

        profiler = StudentProfilingAgent()
        profile_result = await profiler.run({
            "student_id": student_id,
            "parsed_resume": result.get("parsed", {}),
        })

        profile_data = profile_result.get("profile", {})

        with get_db() as session:
            profile = session.query(StudentProfile).filter_by(student_id=student_id).first()
            if not profile:
                profile = StudentProfile(student_id=student_id)
                session.add(profile)
            profile.canonical_skills   = profile_data.get("canonical_skills", [])
            profile.skills_by_category = profile_data.get("skills_by_category", {})
            profile.skill_radar        = profile_data.get("skill_radar", {})
            profile.skill_gaps         = profile_data.get("skill_gaps", [])
            profile.profile_score      = profile_data.get("profile_score", 0)
            profile.last_parsed_at     = datetime.utcnow()
            profile.raw_parsed_data    = result.get("parsed", {})

            student_obj = session.query(Student).filter_by(id=student_id).first()
            if student_obj:
                student_obj.profile_score = profile_data.get("profile_score", 0)

        matcher = MatchingEngineAgent()
        await matcher.run({"mode": "student", "student_id": student_id})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": True,
            "data": {"message": f"Resume uploaded. Parsing failed: {str(e)[:200]}"},
        }

    return {
        "success": True,
        "data": {
            "message": "Resume parsed and matched",
            "profile_score": profile_result.get("profile", {}).get("profile_score", 0),
            "skills_found": len(profile_result.get("profile", {}).get("canonical_skills", [])),
        }
    }


@router.get("/{student_id}/matches")
def get_student_matches(
    student_id: str,
    limit: int = Query(20, ge=1, le=50),
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] == "student":
        s = db.query(Student).filter_by(id=student_id, user_id=user["sub"]).first()
        if not s:
            raise HTTPException(status_code=403, detail="Access denied")

    matches = (
        db.query(Match)
        .filter_by(student_id=student_id, eligible=True)
        .order_by(Match.score.desc())
        .limit(limit)
        .all()
    )

    result = []
    for m in matches:
        job = db.query(Job).filter_by(id=m.job_id).first()
        if job:
            rec = db.query(Recruiter).filter_by(id=job.recruiter_id).first()
            result.append({
                "match_id": m.id,
                "score": round(m.score, 1),
                "skill_overlap": m.skill_overlap or [],
                "missing_skills": m.missing_skills or [],
                "job": {
                    "id": job.id,
                    "title": job.title,
                    "company": rec.company_name if rec else "Unknown",
                    "location": job.location,
                    "ctc_min": job.ctc_min,
                    "ctc_max": job.ctc_max,
                    "required_skills": job.required_skills or [],
                    "status": job.status,
                },
            })

    return {"success": True, "data": result}


@router.get("/{student_id}/applications")
def get_student_applications(
    student_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] == "student":
        s = db.query(Student).filter_by(id=student_id, user_id=user["sub"]).first()
        if not s:
            raise HTTPException(status_code=403, detail="Access denied")

    apps = db.query(Application).filter_by(student_id=student_id).order_by(Application.applied_at.desc()).all()
    result = []
    for app in apps:
        job = db.query(Job).filter_by(id=app.job_id).first()
        rec = db.query(Recruiter).filter_by(id=job.recruiter_id).first() if job else None
        result.append({
            "id": app.id,
            "status": app.status,
            "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "last_updated": app.last_updated.isoformat() if app.last_updated else None,
            "ctc_offered": app.ctc_offered,
            "job": {
                "id": job.id if job else None,
                "title": job.title if job else None,
                "company": rec.company_name if rec else "Unknown",
                "location": job.location if job else None,
            },
        })

    return {"success": True, "data": result}


@router.get("/{student_id}/notifications")
def get_notifications(
    student_id: str,
    user=Depends(get_current_user),
    db: Session = Depends(get_db_session),
):
    if user["role"] == "student":
        s = db.query(Student).filter_by(id=student_id, user_id=user["sub"]).first()
        if not s:
            raise HTTPException(status_code=403, detail="Access denied")
        uid = user["sub"]
    else:
        s = db.query(Student).filter_by(id=student_id).first()
        uid = s.user_id if s else student_id

    notifs = db.query(Notification).filter_by(user_id=uid).order_by(Notification.created_at.desc()).all()
    return {
        "success": True,
        "data": [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "body": n.body,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifs
        ]
    }
