"""
Agent 2: Student Profiling Agent

Normalizes raw skills, computes profile score, generates skill radar,
identifies skill gaps, and groups skills by category.
Uses skills_db.py instead of a static JSON taxonomy.
"""

import os
import sys
from typing import Any, Dict, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents.base_agent import BaseAgent
from agents.resume_parser.skills_db import (
    ALIAS_TO_CANONICAL,
    CANONICAL_TO_CATEGORY,
    CATEGORY_TO_SKILLS,
    ALL_CATEGORIES,
)

# Skills considered high-demand in the current job market
IN_DEMAND_SKILLS = [
    "Docker", "Kubernetes", "System Design", "AWS", "Go",
    "TypeScript", "GraphQL", "Redis", "Kafka", "Terraform",
    "Python", "React", "Machine Learning", "PostgreSQL", "FastAPI",
    "Next.js", "Node.js", "CI/CD", "Microservices", "Data Structures",
    "Deep Learning", "Cloud Computing", "Linux", "Git",
]

COMPLETENESS_WEIGHTS = {
    "has_resume":         20,
    "has_education":      15,
    "has_experience":     20,
    "has_skills":         20,
    "has_projects":       15,
    "has_certifications": 10,
}


class StudentProfilingAgent(BaseAgent):
    name = "StudentProfilingAgent"

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        student_id = input_data["student_id"]
        parsed = input_data.get("parsed_resume", {})

        self.log(f"Profiling student {student_id}")

        # The parser already returns canonical names; normalize again for safety
        raw_skills = parsed.get("skills", [])
        canonical_skills = self._normalize_skills(raw_skills)

        # Group skills by category
        skills_by_category = self._group_by_category(canonical_skills)

        # Skill radar — one score per category (0–100)
        radar = self._build_radar(canonical_skills)

        # Profile completeness
        completeness = {
            "has_resume":         True,
            "has_education":      bool(parsed.get("education")),
            "has_experience":     bool(parsed.get("experience")),
            "has_skills":         len(canonical_skills) > 0,
            "has_projects":       bool(parsed.get("projects")),
            "has_certifications": bool(parsed.get("certifications")),
        }
        profile_score = sum(COMPLETENESS_WEIGHTS[k] for k, v in completeness.items() if v)
        profile_score = min(100, profile_score + min(10, len(canonical_skills) // 2))

        # Skill gaps — in-demand skills the student doesn't have
        skill_gaps = [s for s in IN_DEMAND_SKILLS if s not in canonical_skills][:8]

        return {
            "student_id": student_id,
            "profile": {
                "canonical_skills":    canonical_skills,
                "skills_by_category":  skills_by_category,
                "skill_count":         len(canonical_skills),
                "profile_score":       profile_score,
                "profile_completeness": completeness,
                "skill_radar":         radar,
                "skill_gaps":          skill_gaps,
            }
        }

    def _normalize_skills(self, raw_skills: List[str]) -> List[str]:
        """Re-canonicalize skills — handles any leftover aliases from older data."""
        normalized = set()
        for skill in raw_skills:
            key = skill.lower().strip()
            canonical = ALIAS_TO_CANONICAL.get(key, skill)
            normalized.add(canonical)
        return sorted(normalized)

    def _group_by_category(self, skills: List[str]) -> Dict[str, List[str]]:
        """Return {category: [skill, ...]} for skills that have a known category."""
        grouped: Dict[str, List[str]] = {}
        for skill in skills:
            cat = CANONICAL_TO_CATEGORY.get(skill, "Other")
            grouped.setdefault(cat, []).append(skill)
        # Sort categories by number of skills (descending)
        return dict(sorted(grouped.items(), key=lambda x: len(x[1]), reverse=True))

    def _build_radar(self, skills: List[str]) -> Dict[str, int]:
        """
        For each category, compute: (matched_skills / total_skills_in_category) * 100.
        Uses CATEGORY_TO_SKILLS from skills_db — covers all 15 categories.
        """
        skill_set = {s.lower() for s in skills}
        radar = {}

        for category in ALL_CATEGORIES:
            cat_skills = CATEGORY_TO_SKILLS.get(category, [])
            if not cat_skills:
                radar[category] = 0
                continue
            matched = sum(1 for s in cat_skills if s.lower() in skill_set)
            # Scale: multiply by 2 so even modest coverage shows up visually
            radar[category] = min(100, int(matched / len(cat_skills) * 200))

        return radar
