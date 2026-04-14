"""
Agent 3: Job Processing Agent — Enhanced

Parses job descriptions to extract required/preferred skills using the
comprehensive skills database (300+ skills, 754+ aliases).
Normalizes to canonical names, classifies seniority, role category,
and computes skill demand metrics.
"""

import os
import re
import sys
from typing import Any, Dict, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents.base_agent import BaseAgent
from agents.resume_parser.skills_db import (
    ALIAS_TO_CANONICAL,
    CANONICAL_TO_CATEGORY,
    CATEGORY_TO_SKILLS,
)

SENIORITY_KEYWORDS = {
    "entry":  ["entry", "junior", "fresher", "graduate", "0-2", "0 to 2", "intern", "trainee", "associate"],
    "mid":    ["mid", "intermediate", "2-5", "3-5", "experienced", "2+ years", "3+ years"],
    "senior": ["senior", "lead", "principal", "staff", "architect", "5+", "7+", "manager", "head"],
}

ROLE_CATEGORIES = {
    "Software Engineering": [
        "software engineer", "sde", "developer", "programmer", "backend",
        "frontend", "fullstack", "full stack", "web developer", "application developer",
    ],
    "Data Science": [
        "data scientist", "ml engineer", "machine learning", "ai engineer",
        "data analyst", "research scientist", "deep learning", "nlp",
    ],
    "DevOps/Cloud": [
        "devops", "cloud", "sre", "infrastructure", "platform engineer",
        "site reliability", "cloud engineer",
    ],
    "Product": [
        "product manager", "product owner", "pm", "scrum master", "agile",
    ],
    "QA/Testing": [
        "qa", "quality", "test", "automation tester", "sdet",
    ],
    "Data Engineering": [
        "data engineer", "pipeline", "etl", "spark", "hadoop", "airflow",
    ],
    "Cybersecurity": [
        "security", "cybersecurity", "infosec", "penetration", "soc analyst",
    ],
    "UI/UX Design": [
        "ui/ux", "ux designer", "ui designer", "product designer", "figma",
    ],
}

# Compensation tier mapping (based on CTC ranges in INR lakhs)
CTC_TIERS = {
    "competitive": (0, 500000),
    "good":        (500000, 1000000),
    "excellent":   (1000000, 2000000),
    "premium":     (2000000, float("inf")),
}


class JobProcessingAgent(BaseAgent):
    name = "JobProcessingAgent"

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        job_id = input_data["job_id"]
        raw_job = input_data["raw_job"]

        title = raw_job.get("title", "")
        description = raw_job.get("description", "")
        full_text = f"{title} {description}"
        full_text_lower = full_text.lower()

        self.log(f"Processing job {job_id}: {title}")

        required_skills = self._extract_skills(full_text)
        preferred_skills = self._extract_preferred_skills(full_text, required_skills)
        skill_string = self._build_skill_string(required_skills, preferred_skills, full_text_lower)
        seniority = self._classify_seniority(full_text_lower)
        role_category = self._classify_role(full_text_lower)
        skill_categories = self._categorize_skills(required_skills + preferred_skills)
        ctc_tier = self._classify_ctc(raw_job.get("ctc_min"), raw_job.get("ctc_max"))

        # Compute skill demand snapshot
        demand_analysis = self._analyze_skill_demand(required_skills)

        return {
            "job_id": job_id,
            "processed": {
                "required_skills": required_skills,
                "preferred_skills": preferred_skills,
                "skill_string": skill_string,
                "seniority": seniority,
                "role_category": role_category,
                "skill_categories": skill_categories,
                "ctc_tier": ctc_tier,
                "demand_analysis": demand_analysis,
            },
        }

    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from text using the comprehensive 300+ skills database."""
        found = []
        text_lower = text.lower()

        # Check all aliases against the text
        for alias, canonical in ALIAS_TO_CANONICAL.items():
            pattern = r"\b" + re.escape(alias) + r"\b"
            if re.search(pattern, text_lower):
                if canonical not in found:
                    found.append(canonical)

        return found[:20]

    def _extract_preferred_skills(self, text: str, required: List[str]) -> List[str]:
        """Extract skills from 'preferred/nice-to-have' sections."""
        text_lower = text.lower()
        preferred_section = ""
        for phrase in ["preferred", "nice to have", "bonus", "plus", "good to have", "desirable"]:
            idx = text_lower.find(phrase)
            if idx != -1:
                preferred_section += text_lower[idx : idx + 500]

        if not preferred_section:
            return []

        found = []
        for alias, canonical in ALIAS_TO_CANONICAL.items():
            pattern = r"\b" + re.escape(alias) + r"\b"
            if re.search(pattern, preferred_section):
                if canonical not in required and canonical not in found:
                    found.append(canonical)
        return found[:10]

    def _build_skill_string(self, required: List[str], preferred: List[str], text: str) -> str:
        """Build a searchable skill string for TF-IDF matching."""
        all_skills = required + preferred
        return " ".join(all_skills)

    def _classify_seniority(self, text: str) -> str:
        for level, keywords in SENIORITY_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                return level
        return "entry"

    def _classify_role(self, text: str) -> str:
        for category, keywords in ROLE_CATEGORIES.items():
            if any(kw in text for kw in keywords):
                return category
        return "Software Engineering"

    def _categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """Group extracted skills by category."""
        result = {}
        for skill in skills:
            cat = CANONICAL_TO_CATEGORY.get(skill, "Other")
            result.setdefault(cat, []).append(skill)
        return result

    def _classify_ctc(self, ctc_min: int | None, ctc_max: int | None) -> str:
        """Classify compensation tier."""
        val = ctc_max or ctc_min or 0
        for tier, (lo, hi) in CTC_TIERS.items():
            if lo <= val < hi:
                return tier
        return "competitive"

    def _analyze_skill_demand(self, required_skills: List[str]) -> Dict[str, Any]:
        """Analyse how many students in the database have each required skill."""
        try:
            from database.connection import get_db
            from database.models import StudentProfile

            skill_counts = {}
            with get_db() as db:
                profiles = db.query(StudentProfile).all()
                total_students = len(profiles)
                for skill in required_skills:
                    count = sum(
                        1 for p in profiles if skill in (p.canonical_skills or [])
                    )
                    skill_counts[skill] = {
                        "students_with_skill": count,
                        "total_students": total_students,
                        "availability_pct": round((count / total_students * 100) if total_students > 0 else 0, 1),
                    }

            return {
                "skill_availability": skill_counts,
                "total_students": total_students,
                "avg_availability": round(
                    sum(s["availability_pct"] for s in skill_counts.values()) / len(skill_counts)
                    if skill_counts else 0,
                    1,
                ),
            }
        except Exception:
            return {}
