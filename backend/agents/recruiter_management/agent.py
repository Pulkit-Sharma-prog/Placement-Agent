"""
Agent 7: Recruiter Management Agent — Enhanced

Manages recruiter profiles, computes multi-factor engagement scores,
generates shortlist PDFs, provides performance metrics, and
tracks recruiter activity history.
"""

import os
import sys
from datetime import datetime, timedelta
from typing import Any, Dict, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents.base_agent import BaseAgent


class RecruiterManagementAgent(BaseAgent):
    name = "RecruiterManagementAgent"

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        action = input_data.get("action", "update_engagement")
        recruiter_id = input_data.get("recruiter_id")

        if action == "update_engagement":
            return await self._update_engagement(recruiter_id)
        elif action == "generate_shortlist":
            job_id = input_data.get("job_id")
            limit = input_data.get("limit", 20)
            return await self._generate_shortlist(recruiter_id, job_id, limit)
        elif action == "performance_metrics":
            return await self._performance_metrics(recruiter_id)
        elif action == "recommend_candidates":
            job_id = input_data.get("job_id")
            return await self._recommend_candidates(recruiter_id, job_id)
        else:
            return {"error": f"Unknown action: {action}"}

    async def _update_engagement(self, recruiter_id: str) -> dict:
        from database.connection import get_db
        from database.models import Application, Job, Recruiter

        with get_db() as db:
            rec = db.query(Recruiter).filter_by(id=recruiter_id).first()
            if not rec:
                return {"error": "Recruiter not found"}

            jobs = db.query(Job).filter_by(recruiter_id=recruiter_id).all()
            active_jobs = [j for j in jobs if j.status == "active"]
            jobs_posted = len(jobs)

            total_apps = 0
            shortlisted = 0
            interviews = 0
            offers = 0
            for j in jobs:
                apps = db.query(Application).filter_by(job_id=j.id).all()
                total_apps += len(apps)
                for a in apps:
                    if a.status == "shortlisted":
                        shortlisted += 1
                    elif a.status == "interview_scheduled":
                        interviews += 1
                    elif a.status in ("offered", "accepted"):
                        offers += 1

            # Multi-factor engagement score (0–100)
            # Active jobs: up to 25 pts
            active_pts = min(25, len(active_jobs) * 8)
            # Applications received: up to 25 pts
            app_pts = min(25, total_apps * 2)
            # Processing (shortlist + interview): up to 25 pts
            process_pts = min(25, (shortlisted + interviews) * 5)
            # Offers made: up to 25 pts
            offer_pts = min(25, offers * 10)

            score = active_pts + app_pts + process_pts + offer_pts
            # Recency boost: +10 if active in last 7 days
            if rec.last_active and (datetime.utcnow() - rec.last_active).days <= 7:
                score = min(100, score + 10)

            rec.engagement_score = min(100, score)
            rec.last_active = datetime.utcnow()

        return {
            "recruiter_id": recruiter_id,
            "engagement_score": rec.engagement_score,
            "breakdown": {
                "active_jobs": active_pts,
                "applications": app_pts,
                "processing": process_pts,
                "offers": offer_pts,
            },
        }

    async def _generate_shortlist(self, recruiter_id: str, job_id: str, limit: int) -> dict:
        from database.connection import get_db
        from database.models import Match, Student, StudentProfile

        with get_db() as db:
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
                        "phone": student.phone,
                        "linkedin_url": student.linkedin_url,
                        "email": student.user.email if student.user else None,
                    })

        return {"job_id": job_id, "shortlist": shortlist, "count": len(shortlist)}

    async def _performance_metrics(self, recruiter_id: str) -> dict:
        """Compute comprehensive recruiter performance metrics."""
        from database.connection import get_db
        from database.models import Application, Job, Match, Recruiter

        with get_db() as db:
            rec = db.query(Recruiter).filter_by(id=recruiter_id).first()
            if not rec:
                return {"error": "Recruiter not found"}

            jobs = db.query(Job).filter_by(recruiter_id=recruiter_id).all()
            active_jobs = [j for j in jobs if j.status == "active"]
            closed_jobs = [j for j in jobs if j.status == "closed"]

            # Application pipeline
            all_apps = []
            for j in jobs:
                apps = db.query(Application).filter_by(job_id=j.id).all()
                all_apps.extend(apps)

            status_counts = {}
            for a in all_apps:
                status_counts[a.status] = status_counts.get(a.status, 0) + 1

            # Avg match score across all jobs
            all_match_scores = []
            for j in jobs:
                matches = db.query(Match).filter_by(job_id=j.id, eligible=True).all()
                all_match_scores.extend([m.score for m in matches])

            avg_match = round(sum(all_match_scores) / len(all_match_scores), 1) if all_match_scores else 0

            # Conversion funnel
            total_applicants = len(all_apps)
            shortlisted = status_counts.get("shortlisted", 0)
            interviewed = status_counts.get("interview_scheduled", 0)
            offered = status_counts.get("offered", 0) + status_counts.get("accepted", 0)
            rejected = status_counts.get("rejected", 0)

            # Hiring rate
            hiring_rate = round((offered / total_applicants * 100) if total_applicants > 0 else 0, 1)

            return {
                "recruiter_id": recruiter_id,
                "company": rec.company_name,
                "engagement_score": rec.engagement_score,
                "metrics": {
                    "total_jobs_posted": len(jobs),
                    "active_jobs": len(active_jobs),
                    "closed_jobs": len(closed_jobs),
                    "total_applicants": total_applicants,
                    "shortlisted": shortlisted,
                    "interviewed": interviewed,
                    "offered": offered,
                    "rejected": rejected,
                    "hiring_rate": hiring_rate,
                    "avg_match_score": avg_match,
                    "total_candidates_matched": len(all_match_scores),
                },
                "funnel": {
                    "applied": total_applicants,
                    "shortlisted": shortlisted,
                    "interviewed": interviewed,
                    "offered": offered,
                },
            }

    async def _recommend_candidates(self, recruiter_id: str, job_id: str) -> dict:
        """Recommend top candidates for a job with fit reasons."""
        from database.connection import get_db
        from database.models import Match, Student, StudentProfile

        with get_db() as db:
            matches = (
                db.query(Match)
                .filter_by(job_id=job_id, eligible=True)
                .order_by(Match.score.desc())
                .limit(10)
                .all()
            )

            recommendations = []
            for m in matches:
                student = db.query(Student).filter_by(id=m.student_id).first()
                profile = db.query(StudentProfile).filter_by(student_id=m.student_id).first()
                if not student:
                    continue

                # Build fit reasons
                reasons = []
                overlap = m.skill_overlap or []
                if len(overlap) >= 5:
                    reasons.append(f"Strong skill match ({len(overlap)} overlapping skills)")
                elif len(overlap) >= 3:
                    reasons.append(f"Good skill match ({len(overlap)} overlapping skills)")

                if student.cgpa and student.cgpa >= 8.5:
                    reasons.append("High academic performance")
                elif student.cgpa and student.cgpa >= 7.5:
                    reasons.append("Good academic standing")

                if profile and profile.profile_score and profile.profile_score >= 70:
                    reasons.append("Well-rounded profile")

                parsed = profile.raw_parsed_data if profile else {}
                if parsed.get("experience") and len(parsed["experience"]) >= 2:
                    reasons.append(f"{len(parsed['experience'])} work experiences")
                if parsed.get("projects") and len(parsed["projects"]) >= 3:
                    reasons.append(f"{len(parsed['projects'])} projects completed")

                recommendations.append({
                    "student_id": m.student_id,
                    "name": student.full_name,
                    "branch": student.branch,
                    "cgpa": student.cgpa,
                    "match_score": m.score,
                    "profile_score": profile.profile_score if profile else 0,
                    "skill_overlap": overlap[:6],
                    "missing_skills": (m.missing_skills or [])[:4],
                    "fit_reasons": reasons,
                })

        return {"job_id": job_id, "recommendations": recommendations}

    def generate_shortlist_pdf(self, job_id: str, shortlist: list, job_title: str, company: str) -> bytes:
        """Generate a PDF shortlist using reportlab."""
        try:
            from io import BytesIO
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.lib.units import cm
            from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

            buf = BytesIO()
            doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
            styles = getSampleStyleSheet()
            story = []

            story.append(Paragraph(f"Candidate Shortlist — {job_title}", styles["Title"]))
            story.append(Paragraph(
                f"Company: {company} | Generated: {datetime.utcnow().strftime('%Y-%m-%d')} | "
                f"Total Candidates: {len(shortlist)}",
                styles["Normal"],
            ))
            story.append(Spacer(1, 0.5 * cm))

            headers = ["#", "Name", "Branch", "CGPA", "Match %", "Profile", "Key Skills"]
            rows = [headers]
            for i, c in enumerate(shortlist, 1):
                rows.append([
                    str(i),
                    c.get("name", ""),
                    c.get("branch", ""),
                    str(c.get("cgpa", "")),
                    f"{c.get('match_score', 0):.0f}%",
                    f"{c.get('profile_score', 0)}",
                    ", ".join(c.get("skills", [])[:4]),
                ])

            table = Table(rows, colWidths=[0.8 * cm, 3.5 * cm, 2.2 * cm, 1.3 * cm, 1.8 * cm, 1.5 * cm, 6.5 * cm])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6C63FF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F0F4FF")]),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("PADDING", (0, 0), (-1, -1), 4),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            story.append(table)

            doc.build(story)
            return buf.getvalue()

        except Exception as e:
            self.log(f"PDF generation failed: {e}", "ERROR")
            return b""
