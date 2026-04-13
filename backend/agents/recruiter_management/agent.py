"""
Agent 7: Recruiter Management Agent

Manages recruiter profiles, computes engagement scores,
generates shortlist PDFs for top matched candidates.
"""

import os
import sys
from datetime import datetime
from typing import Any, Dict

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
        else:
            return {"error": f"Unknown action: {action}"}

    async def _update_engagement(self, recruiter_id: str) -> dict:
        from database.connection import get_db
        from database.models import Application, Job, Match, Recruiter

        with get_db() as db:
            rec = db.query(Recruiter).filter_by(id=recruiter_id).first()
            if not rec:
                return {"error": "Recruiter not found"}

            jobs = db.query(Job).filter_by(recruiter_id=recruiter_id).all()
            jobs_posted = len(jobs)

            applications_received = sum(
                db.query(Application).filter_by(job_id=j.id).count()
                for j in jobs
            )

            # Engagement = active_jobs * 20 + min(applications, 5) * 10
            score = min(100, jobs_posted * 20 + min(applications_received, 5) * 10 + 20)
            rec.engagement_score = score
            rec.last_active = datetime.utcnow()

        return {"recruiter_id": recruiter_id, "engagement_score": score}

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
                        "skills": profile.canonical_skills[:5] if profile else [],
                        "skill_overlap": m.skill_overlap,
                    })

        return {"job_id": job_id, "shortlist": shortlist, "count": len(shortlist)}

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
            doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
            styles = getSampleStyleSheet()
            story = []

            story.append(Paragraph(f"Candidate Shortlist — {job_title}", styles["Title"]))
            story.append(Paragraph(f"Company: {company} | Generated: {datetime.utcnow().strftime('%Y-%m-%d')}", styles["Normal"]))
            story.append(Spacer(1, 0.5*cm))

            headers = ["#", "Name", "Branch", "CGPA", "Match %", "Key Skills"]
            rows = [headers]
            for i, c in enumerate(shortlist, 1):
                rows.append([
                    str(i),
                    c.get("name", ""),
                    c.get("branch", ""),
                    str(c.get("cgpa", "")),
                    f"{c.get('match_score', 0):.0f}%",
                    ", ".join(c.get("skills", [])[:3]),
                ])

            table = Table(rows, colWidths=[1*cm, 4*cm, 2.5*cm, 1.5*cm, 2*cm, 7*cm])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6C63FF")),
                ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
                ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F0F4FF")]),
                ("GRID",       (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("FONTSIZE",   (0, 0), (-1, -1), 9),
                ("PADDING",    (0, 0), (-1, -1), 4),
            ]))
            story.append(table)

            doc.build(story)
            return buf.getvalue()

        except Exception as e:
            self.log(f"PDF generation failed: {e}", "ERROR")
            return b""
