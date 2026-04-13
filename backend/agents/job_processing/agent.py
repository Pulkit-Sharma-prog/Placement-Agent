"""
Agent 3: Job Processing Agent

Parses job descriptions to extract required/preferred skills,
normalizes to taxonomy, classifies seniority and role category.
"""

import json
import os
import re
import sys
from typing import Any, Dict, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents.base_agent import BaseAgent

_TAXONOMY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "student_profiling", "skills_taxonomy.json"
)
with open(_TAXONOMY_PATH) as f:
    TAXONOMY = json.load(f)

NORMALIZATIONS = {k.lower(): v for k, v in TAXONOMY["normalizations"].items()}
ALL_SKILLS = [s for cat in TAXONOMY["categories"].values() for s in cat]

SENIORITY_KEYWORDS = {
    "entry":  ["entry", "junior", "fresher", "graduate", "0-2", "0 to 2", "intern"],
    "mid":    ["mid", "intermediate", "2-5", "3-5", "experienced"],
    "senior": ["senior", "lead", "principal", "staff", "architect", "5+", "7+"],
}

ROLE_CATEGORIES = {
    "Software Engineering": ["software engineer", "sde", "developer", "programmer", "backend", "frontend", "fullstack", "full stack"],
    "Data Science":         ["data scientist", "ml engineer", "machine learning", "ai engineer", "data analyst", "research"],
    "DevOps/Cloud":         ["devops", "cloud", "sre", "infrastructure", "platform engineer"],
    "Product":              ["product manager", "product owner", "pm", "scrum"],
    "QA/Testing":           ["qa", "quality", "test", "automation"],
    "Data Engineering":     ["data engineer", "pipeline", "etl", "spark", "hadoop"],
}


class JobProcessingAgent(BaseAgent):
    name = "JobProcessingAgent"

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        job_id = input_data["job_id"]
        raw_job = input_data["raw_job"]

        title = raw_job.get("title", "")
        description = raw_job.get("description", "")
        full_text = f"{title} {description}".lower()

        self.log(f"Processing job {job_id}: {title}")

        required_skills = self._extract_required_skills(full_text)
        preferred_skills = self._extract_preferred_skills(full_text, required_skills)
        skill_string = self._build_skill_string(required_skills, preferred_skills, full_text)
        seniority = self._classify_seniority(full_text)
        role_category = self._classify_role(full_text)

        return {
            "job_id": job_id,
            "processed": {
                "required_skills": required_skills,
                "preferred_skills": preferred_skills,
                "skill_string": skill_string,
                "seniority": seniority,
                "role_category": role_category,
            }
        }

    def _extract_required_skills(self, text: str) -> List[str]:
        found = []
        for skill in ALL_SKILLS:
            pattern = r"\b" + re.escape(skill.lower()) + r"\b"
            if re.search(pattern, text):
                canonical = NORMALIZATIONS.get(skill.lower(), skill)
                if canonical not in found:
                    found.append(canonical)

        # Check normalizations too
        for alias, canonical in NORMALIZATIONS.items():
            pattern = r"\b" + re.escape(alias) + r"\b"
            if re.search(pattern, text) and canonical not in found:
                found.append(canonical)

        return found[:15]

    def _extract_preferred_skills(self, text: str, required: List[str]) -> List[str]:
        # Skills mentioned near "preferred", "nice to have", "bonus", "plus"
        preferred_section = ""
        for phrase in ["preferred", "nice to have", "bonus", "plus", "good to have"]:
            idx = text.find(phrase)
            if idx != -1:
                preferred_section += text[idx:idx+500]

        if not preferred_section:
            return []

        found = []
        for skill in ALL_SKILLS:
            pattern = r"\b" + re.escape(skill.lower()) + r"\b"
            if re.search(pattern, preferred_section):
                canonical = NORMALIZATIONS.get(skill.lower(), skill)
                if canonical not in required and canonical not in found:
                    found.append(canonical)
        return found[:8]

    def _build_skill_string(self, required: List[str], preferred: List[str], text: str) -> str:
        all_skills = required + preferred
        # Also add important words from description
        important_words = re.findall(r"\b[A-Z][a-zA-Z+#.]{2,}\b", text.upper()[:500])
        return " ".join(all_skills + important_words[:10])

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
