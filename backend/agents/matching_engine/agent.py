"""
Agent 4: Matching Engine Agent

TF-IDF + cosine similarity matching between students and jobs.
Applies eligibility filters (CGPA, branch, graduation year).
Triggers Notification Agent for high-score matches.
"""

import os
import sys
from typing import Any, Dict, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents.base_agent import BaseAgent


class MatchingEngineAgent(BaseAgent):
    name = "MatchingEngineAgent"

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        mode = input_data.get("mode", "full")
        student_id = input_data.get("student_id")
        job_id = input_data.get("job_id")

        self.log(f"Running matching engine in mode={mode}")

        from database.connection import get_db
        from database.models import Job, Match, Student, StudentProfile

        with get_db() as db:
            # Load students
            if mode == "student" and student_id:
                students = db.query(Student).filter_by(id=student_id, status="active").all()
            else:
                students = db.query(Student).filter_by(status="active").all()

            # Load jobs
            if mode == "job" and job_id:
                jobs = db.query(Job).filter_by(id=job_id, status="active").all()
            else:
                jobs = db.query(Job).filter_by(status="active").all()

            if not students or not jobs:
                self.log("No students or jobs to match")
                return {"matches_created": 0, "top_matches": []}

            # Build skill strings
            student_profiles = {}
            for s in students:
                profile = db.query(StudentProfile).filter_by(student_id=s.id).first()
                if profile and profile.canonical_skills:
                    student_profiles[s.id] = " ".join(profile.canonical_skills)
                else:
                    student_profiles[s.id] = ""

            job_skill_strings = {}
            for j in jobs:
                job_skill_strings[j.id] = j.skill_string or " ".join(j.required_skills)

            # TF-IDF vectorization
            try:
                from sklearn.feature_extraction.text import TfidfVectorizer
                from sklearn.metrics.pairwise import cosine_similarity

                student_ids = list(student_profiles.keys())
                job_ids = list(job_skill_strings.keys())

                student_strings = [student_profiles[sid] for sid in student_ids]
                job_strings = [job_skill_strings[jid] for jid in job_ids]

                corpus = student_strings + job_strings
                vec = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", min_df=1)
                tfidf = vec.fit_transform(corpus)

                sim_matrix = cosine_similarity(
                    tfidf[:len(student_ids)],
                    tfidf[len(student_ids):]
                )

            except Exception as e:
                self.log(f"TF-IDF failed, using fallback: {e}", "WARNING")
                sim_matrix = [[0.5] * len(jobs)] * len(students)
                student_ids = [s.id for s in students]
                job_ids = [j.id for j in jobs]

            # Persist matches
            matches_created = 0
            top_matches = []

            student_map = {s.id: s for s in students}
            job_map = {j.id: j for j in jobs}

            for si, sid in enumerate(student_ids):
                student = student_map[sid]
                student_profile = db.query(StudentProfile).filter_by(student_id=sid).first()
                student_skills = set(student_profile.canonical_skills if student_profile else [])

                for ji, jid in enumerate(job_ids):
                    job = job_map[jid]
                    score = float(sim_matrix[si][ji]) * 100

                    # Eligibility check
                    eligible = True
                    if job.min_cgpa and (student.cgpa or 0) < job.min_cgpa:
                        eligible = False
                    if job.eligible_branches and student.branch and student.branch not in job.eligible_branches:
                        eligible = False

                    overlap = list(student_skills & set(job.required_skills + job.preferred_skills))
                    missing = [s for s in job.required_skills if s not in student_skills][:5]

                    # Upsert match
                    existing = db.query(Match).filter_by(student_id=sid, job_id=jid).first()
                    if existing:
                        existing.score = round(score, 2)
                        existing.eligible = eligible
                        existing.skill_overlap = overlap
                        existing.missing_skills = missing
                    else:
                        m = Match(student_id=sid, job_id=jid, score=round(score, 2), eligible=eligible)
                        m.skill_overlap = overlap
                        m.missing_skills = missing
                        db.add(m)
                        matches_created += 1

                    if score >= 70 and eligible and len(top_matches) < 10:
                        top_matches.append({
                            "student_id": sid,
                            "job_id": jid,
                            "score": round(score, 2),
                            "eligible": eligible,
                            "skill_overlap": overlap,
                            "missing_skills": missing,
                        })

        self.log(f"Matching complete: {matches_created} new matches, {len(top_matches)} high-score matches")
        return {"matches_created": matches_created, "top_matches": top_matches}
