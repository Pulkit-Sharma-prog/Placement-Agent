"""
Agent 1: Resume Parsing Agent

Extracts structured data from PDF/DOCX resumes.
Uses the comprehensive skills_db.py to match 400+ skills and their aliases.
"""

import os
import re
import sys
from typing import Any, Dict, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agents.base_agent import BaseAgent
from agents.resume_parser.skills_db import ALIAS_TO_CANONICAL

SECTION_HEADERS = {
    "summary":         r"(?i)\b(summary|objective|profile|about me|career objective|professional summary|overview)\b",
    "education":       r"(?i)\b(education|academic|qualification|degree|academic background|scholastics)\b",
    "experience":      r"(?i)\b(experience|employment|work history|professional experience|work experience|internship|internships|industry experience|career)\b",
    "skills":          r"(?i)\b(skills?|technical skills?|competencies|technologies|tech stack|expertise|core competencies)\b",
    "projects":        r"(?i)\b(projects?|personal projects?|academic projects?|key projects?|major projects?)\b",
    "certifications":  r"(?i)\b(certifications?|certificates?|courses?|training|licenses?|online courses?)\b",
    "achievements":    r"(?i)\b(achievements?|awards?|honors?|accomplishments?|recognition|extra.?curricular|activities)\b",
    "workshops":       r"(?i)\b(workshops?|seminars?|conferences?|trainings?|bootcamps?|symposium)\b",
    "publications":    r"(?i)\b(publications?|research papers?|papers?|journals?|articles?|research work)\b",
    "patents":         r"(?i)\b(patents?|intellectual property|inventions?)\b",
    "languages":       r"(?i)\b(languages?|spoken languages?|linguistic|language proficiency)\b",
    "volunteer":       r"(?i)\b(volunteer|volunteering|social work|community service|nss|ncc)\b",
    "positions":       r"(?i)\b(positions? of responsibility|leadership|club|society|committee)\b",
}


class ResumeParsingAgent(BaseAgent):
    name = "ResumeParsingAgent"

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        student_id = input_data.get("student_id")
        file_path = input_data["file_path"]
        file_type = input_data.get("file_type", "").lower()

        self.log(f"Parsing resume for student {student_id}: {file_path}")

        if file_type in ("pdf", "") or file_path.endswith(".pdf"):
            raw_text = self._extract_pdf(file_path)
        else:
            raw_text = self._extract_docx(file_path)

        parsed = self._parse_text(raw_text)
        parsed["student_id"] = student_id

        confidence = {
            "name":   0.9 if parsed.get("name") else 0.1,
            "email":  1.0 if parsed.get("email") else 0.0,
            "skills": min(1.0, len(parsed.get("skills", [])) / 10),
        }

        self.log(f"Parsed: name={parsed.get('name')}, skills={len(parsed.get('skills', []))} found")

        return {
            "student_id": student_id,
            "raw_text": raw_text[:3000],
            "parsed": parsed,
            "confidence_scores": confidence,
            "parse_warnings": self._get_warnings(parsed),
        }

    # ─── Text extraction ───────────────────────────────────────────────────

    def _extract_pdf(self, path: str) -> str:
        try:
            from pdfminer.high_level import extract_text
            text = extract_text(path)
            if text and len(text.strip()) > 100:
                return text
        except Exception as e:
            self.log(f"pdfminer failed: {e}", "WARNING")

        try:
            import pytesseract
            from pdf2image import convert_from_path
            pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
            pages = convert_from_path(path, dpi=300)
            return "\n".join(pytesseract.image_to_string(p) for p in pages)
        except Exception as e:
            self.log(f"OCR fallback failed: {e}", "WARNING")
            return ""

    def _extract_docx(self, path: str) -> str:
        try:
            import docx
            doc = docx.Document(path)
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception as e:
            self.log(f"DOCX extraction failed: {e}", "WARNING")
            return ""

    # ─── Main parser ───────────────────────────────────────────────────────

    def _parse_text(self, text: str) -> dict:
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        return {
            "name":           self._extract_name(text, lines),
            "email":          self._extract_email(text),
            "phone":          self._extract_phone(text),
            "linkedin":       self._extract_linkedin(text),
            "github":         self._extract_github(text),
            "portfolio":      self._extract_portfolio(text),
            "summary":        self._extract_summary(text, lines),
            "education":      self._extract_section_education(text, lines),
            "experience":     self._extract_section_experience(text, lines),
            "skills":         self._extract_skills(text),
            "certifications": self._extract_section_certifications(text, lines),
            "projects":       self._extract_section_projects(text, lines),
            "achievements":   self._extract_section_list(text, lines, "achievements"),
            "workshops":      self._extract_section_list(text, lines, "workshops"),
            "publications":   self._extract_section_list(text, lines, "publications"),
            "patents":        self._extract_section_list(text, lines, "patents"),
            "positions":      self._extract_section_list(text, lines, "positions"),
            "volunteer":      self._extract_section_list(text, lines, "volunteer"),
            "languages":      self._extract_spoken_languages(text, lines),
        }

    # ─── Field extractors ──────────────────────────────────────────────────

    def _extract_name(self, text: str, lines: List[str]) -> str:
        try:
            import spacy
            nlp = spacy.load("en_core_web_sm")
            doc = nlp(text[:500])
            for ent in doc.ents:
                if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
                    return ent.text.strip()
        except Exception:
            pass
        for line in lines[:5]:
            if re.match(r"^[A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){1,3}$", line):
                return line
        return lines[0] if lines else "Unknown"

    def _extract_email(self, text: str) -> str:
        m = re.search(r"[\w.+\-]+@[\w.\-]+\.\w{2,}", text)
        return m.group(0) if m else ""

    def _extract_phone(self, text: str) -> str:
        m = re.search(r"(\+?[\d][\d\s\-().]{8,14}[\d])", text)
        return m.group(0).strip() if m else ""

    def _extract_linkedin(self, text: str) -> str:
        m = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-]+", text, re.IGNORECASE)
        return m.group(0) if m else ""

    def _extract_github(self, text: str) -> str:
        m = re.search(r"(?:https?://)?(?:www\.)?github\.com/[\w\-]+", text, re.IGNORECASE)
        return m.group(0) if m else ""

    def _extract_portfolio(self, text: str) -> str:
        """Extract personal website / portfolio URL (not github/linkedin)."""
        m = re.search(
            r"https?://(?!(?:www\.)?(linkedin|github|twitter|facebook|instagram)\.com)[\w\-./]+\.[a-z]{2,}(?:/[\w\-./]*)?",
            text, re.IGNORECASE,
        )
        return m.group(0) if m else ""

    def _extract_summary(self, text: str, lines: List[str]) -> str:
        section = self._get_section_text(text, "summary")
        if section:
            # Take up to 500 chars, cleaned
            return re.sub(r"\s+", " ", section.strip())[:500]
        return ""

    def _extract_skills(self, text: str) -> List[str]:
        """
        Match resume text against every alias in skills_db.ALIAS_TO_CANONICAL.
        Returns deduplicated list of canonical skill names.
        """
        found_canonical = set()
        text_lower = text.lower()

        for alias, canonical in ALIAS_TO_CANONICAL.items():
            # Escape special regex chars in the alias
            escaped = re.escape(alias)
            # Word-boundary pattern — handles multi-word aliases gracefully
            pattern = r"(?<![a-zA-Z0-9])" + escaped + r"(?![a-zA-Z0-9])"
            if re.search(pattern, text_lower):
                found_canonical.add(canonical)

        return sorted(found_canonical)

    def _extract_section_education(self, text: str, lines: List[str]) -> List[dict]:
        section = self._get_section_text(text, "education")
        if not section:
            return []
        entries = []
        degree_patterns = [r"B\.?Tech|B\.?E\.|Bachelor|B\.?Sc|M\.?Tech|M\.?E\.|Master|MBA|Ph\.?D|Diploma|B\.?Com|B\.?A\.?"]
        cgpa_pattern = r"(?:CGPA|GPA|Score|Percentage|%)[:\s]*(\d+\.?\d*)"
        year_pattern  = r"\b(20\d{2})\b"

        chunks = re.split(r"\n{2,}", section)
        for chunk in chunks[:6]:
            chunk = chunk.strip()
            if any(re.search(p, chunk, re.IGNORECASE) for p in degree_patterns) and len(chunk) > 10:
                cgpa_m = re.search(cgpa_pattern, chunk, re.IGNORECASE)
                years   = re.findall(year_pattern, chunk)
                lines_c = [l.strip() for l in chunk.split("\n") if l.strip()]
                entries.append({
                    "institution": lines_c[0][:120] if lines_c else "",
                    "degree":      self._find_degree(chunk),
                    "field":       self._find_field_of_study(chunk),
                    "year_start":  int(years[0]) if len(years) >= 2 else None,
                    "year_end":    int(years[-1]) if years else None,
                    "cgpa":        float(cgpa_m.group(1)) if cgpa_m else None,
                })
        return entries

    def _find_degree(self, text: str) -> str:
        for d in ["Ph.D", "M.Tech", "M.E.", "MBA", "M.Sc", "B.Tech", "B.E.", "B.Sc",
                  "Bachelor", "Master", "Diploma", "B.Com", "B.A."]:
            if re.search(re.escape(d), text, re.IGNORECASE):
                return d
        return "Degree"

    def _find_field_of_study(self, text: str) -> str:
        fields = [
            "Computer Science", "Information Technology", "Electronics", "Electrical",
            "Mechanical", "Civil", "Chemical", "Biotechnology", "Mathematics",
            "Physics", "Commerce", "Business Administration",
        ]
        for f in fields:
            if f.lower() in text.lower():
                return f
        return ""

    def _extract_section_experience(self, text: str, lines: List[str]) -> List[dict]:
        section = self._get_section_text(text, "experience")
        if not section:
            return []

        # Strategy 1: split by blank lines (works for well-formatted PDFs)
        chunks = [c.strip() for c in re.split(r"\n{2,}", section) if c.strip() and len(c.strip()) > 15]

        # Strategy 2: if too few chunks, split by detecting "entry headers"
        # An entry header is a line that contains a year (20xx) but is NOT a bullet point
        if len(chunks) <= 1:
            chunks = self._split_experience_by_headers(section)

        entries = []
        date_range_re  = re.compile(
            r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4})"
            r"\s*[-–—to]+\s*"
            r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4}|Present|Current|Till\s*date|Ongoing)",
            re.IGNORECASE,
        )
        duration_re = re.compile(r"(\d+)\s*(month|year)", re.IGNORECASE)

        for chunk in chunks[:8]:
            chunk_lines = [l.strip() for l in chunk.split("\n") if l.strip()]
            if not chunk_lines:
                continue

            date_m     = date_range_re.search(chunk)
            duration_m = duration_re.search(chunk)

            # Heuristic: first line without a date-range is the company/role header
            header_lines = []
            bullet_start = 0
            for idx, line in enumerate(chunk_lines):
                if re.search(r"^[-•*▪→✓]", line) or idx >= 3:
                    bullet_start = idx
                    break
                header_lines.append(line)
            else:
                bullet_start = len(chunk_lines)

            company = header_lines[0][:120] if header_lines else ""
            role    = ""

            # Handle pipe-separated one-liners: "Google | SWE Intern | Jun 2023 – Aug 2023"
            if "|" in company:
                parts   = [p.strip() for p in company.split("|")]
                company = parts[0][:120]
                # Second part is role if it doesn't look like a date
                role    = parts[1][:120] if len(parts) > 1 and not re.search(r"\b20\d{2}\b", parts[1]) else ""
            elif len(header_lines) >= 2:
                role = header_lines[1][:120]

            # Strip trailing date range from company/role fields
            company = re.sub(date_range_re, "", company).strip(" ,|·–—")
            role    = re.sub(date_range_re, "", role).strip(" ,|·–—")

            bullets = []
            for line in chunk_lines[bullet_start:]:
                cleaned = re.sub(r"^[-•*▪→✓]\s*", "", line).strip()
                if cleaned and len(cleaned) > 10:
                    bullets.append(cleaned)

            entries.append({
                "company":         company,
                "role":            role,
                "start_date":      date_m.group(1) if date_m else None,
                "end_date":        date_m.group(2) if date_m else None,
                "duration_months": (
                    int(duration_m.group(1)) * (12 if "year" in duration_m.group(2).lower() else 1)
                    if duration_m else None
                ),
                "description":     chunk[:500],
                "bullets":         bullets[:8],
                "tech_used":       self._extract_skills_from_text(chunk),
            })

        return entries

    def _split_experience_by_headers(self, section: str) -> List[str]:
        """
        Fallback: split experience section by detecting job-entry "header" lines.
        A header is any non-bullet line that contains a 4-digit year (20xx).
        """
        lines = section.split("\n")
        chunks: List[str] = []
        current: List[str] = []

        year_re   = re.compile(r"\b20\d{2}\b")
        bullet_re = re.compile(r"^[-•*▪→✓]")

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            # Line has a year and is not a bullet point → start of a new entry
            if year_re.search(stripped) and not bullet_re.match(stripped) and len(stripped) < 200:
                if current:
                    chunks.append("\n".join(current))
                current = [stripped]
            else:
                current.append(stripped)

        if current:
            chunks.append("\n".join(current))

        # If still nothing useful, return the whole section as one chunk
        return [c for c in chunks if len(c.strip()) > 15] or [section.strip()]

    def _extract_section_projects(self, text: str, lines: List[str]) -> List[dict]:
        section = self._get_section_text(text, "projects")
        if not section:
            return []

        chunks = [c.strip() for c in re.split(r"\n{2,}", section) if c.strip() and len(c.strip()) > 15]

        # Fallback: split by lines that look like project TITLES.
        # A title is: short (< 80 chars), not a bullet, not a URL, and is the
        # FIRST non-empty line after a blank line (or the very first line).
        if len(chunks) <= 1 and len(section.strip()) > 30:
            raw_lines = section.split("\n")
            chunks = []
            current: List[str] = []
            prev_blank = True  # treat start-of-section as after a blank

            # Verbs that typically start description/bullet lines, NOT project titles
            desc_verb_re = re.compile(
                r"^(?:built|developed|created|designed|implemented|used|deployed|achieved|"
                r"improved|optimized|integrated|worked|contributed|led|managed|researched|"
                r"analyzed|trained|performed|reduced|increased|collaborated|wrote|tested|"
                r"maintained|automated|migrated|refactored|built|launched|delivered)\b",
                re.IGNORECASE,
            )

            for line in raw_lines:
                stripped = line.strip()
                is_blank   = not stripped
                is_bullet  = bool(re.match(r"^[-•*▪→✓]", stripped))
                is_url     = bool(re.match(r"https?://", stripped))
                is_desc    = bool(desc_verb_re.match(stripped))
                # Title Case check: most words are capitalised (or ALL CAPS) and no comma
                words = stripped.split()
                cap_words = sum(1 for w in words if w and (w[0].isupper() or not w[0].isalpha()))
                is_title_case = len(words) > 0 and (cap_words / len(words)) >= 0.6
                has_comma = "," in stripped

                looks_like_title = (
                    stripped
                    and not is_bullet
                    and not is_url
                    and not is_desc
                    and not has_comma
                    and len(stripped) < 80
                    and stripped[0].isupper()
                    and is_title_case
                )

                # Start a new chunk when: after blank (prev_blank) AND looks like title,
                # OR when it really looks like a title (capitalised, non-sentence) even
                # without a blank — but only if current chunk already has content.
                if looks_like_title and (prev_blank or (current and len(current) >= 2)):
                    if current:
                        chunks.append("\n".join(current))
                    current = [stripped]
                elif stripped:
                    current.append(stripped)

                prev_blank = is_blank

            if current:
                chunks.append("\n".join(current))
            chunks = [c for c in chunks if len(c.strip()) > 10] or [section.strip()]

        entries = []
        for chunk in chunks[:8]:
            chunk_lines = [l.strip() for l in chunk.split("\n") if l.strip()]
            if not chunk_lines:
                continue

            github_m = re.search(r"(?:https?://)?(?:www\.)?github\.com/[\w\-/]+", chunk, re.IGNORECASE)
            link_m   = re.search(r"https?://[\w\-./]+\.[a-z]{2,}(?:/[\w\-./]*)?", chunk, re.IGNORECASE)

            bullets = []
            for line in chunk_lines[1:]:
                cleaned = re.sub(r"^[-•*▪→✓]\s*", "", line).strip()
                if cleaned and len(cleaned) > 10 and not re.match(r"https?://", cleaned):
                    bullets.append(cleaned)

            entries.append({
                "name":        chunk_lines[0][:120],
                "description": chunk[:500],
                "bullets":     bullets[:6],
                "tech_stack":  self._extract_skills_from_text(chunk),
                "github_link": github_m.group(0) if github_m else None,
                "live_link":   link_m.group(0) if (link_m and not github_m) else None,
            })
        return entries

    def _extract_section_certifications(self, text: str, lines: List[str]) -> List[dict]:
        section = self._get_section_text(text, "certifications")
        if not section:
            return []
        entries = []
        year_pattern = r"\b(20\d{2})\b"
        issuers = ["Coursera", "Udemy", "edX", "Google", "AWS", "Microsoft", "Meta", "IBM",
                   "Oracle", "Cisco", "CompTIA", "LinkedIn Learning", "NPTEL", "HackerRank",
                   "FreeCodeCamp", "DataCamp", "Pluralsight", "Udacity"]

        for line in section.split("\n"):
            line = re.sub(r"^[-•*\d.]\s*", "", line).strip()
            if len(line) < 5:
                continue
            year_m  = re.search(year_pattern, line)
            issuer  = next((i for i in issuers if i.lower() in line.lower()), None)
            entries.append({
                "title":  line[:200],
                "issuer": issuer or "",
                "year":   int(year_m.group(1)) if year_m else None,
            })
        return entries[:10]

    def _extract_section_list(self, text: str, lines: List[str], section_key: str) -> List[str]:
        section = self._get_section_text(text, section_key)
        if not section:
            return []
        items = []
        for line in section.split("\n"):
            line = re.sub(r"^[-•*\d.]\s*", "", line).strip()
            if len(line) > 5:
                items.append(line)
        return items[:10]

    def _extract_spoken_languages(self, text: str, lines: List[str]) -> List[str]:
        """Extract human/spoken languages (English, Hindi, etc.)."""
        section = self._get_section_text(text, "languages")
        known = [
            "English", "Hindi", "French", "German", "Spanish", "Mandarin", "Chinese",
            "Japanese", "Korean", "Arabic", "Portuguese", "Italian", "Russian",
            "Bengali", "Telugu", "Tamil", "Marathi", "Gujarati", "Kannada",
            "Malayalam", "Punjabi", "Urdu",
        ]
        found = []
        source = section if section else text[:1000]
        for lang in known:
            if re.search(r"\b" + lang + r"\b", source, re.IGNORECASE):
                found.append(lang)
        return found

    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Quick skill extraction from a small text chunk (for project/experience tech)."""
        found = set()
        text_lower = text.lower()
        for alias, canonical in ALIAS_TO_CANONICAL.items():
            escaped = re.escape(alias)
            pattern = r"(?<![a-zA-Z0-9])" + escaped + r"(?![a-zA-Z0-9])"
            if re.search(pattern, text_lower):
                found.add(canonical)
        return sorted(found)[:10]

    # ─── Section splitter ──────────────────────────────────────────────────

    def _get_section_text(self, text: str, section_key: str) -> str:
        """
        Return the block of text belonging to a named section.

        A match is only treated as a SECTION HEADER if the line containing it
        is short (≤ 60 chars) — this prevents bullet-point content lines like
        'Workshop on Machine Learning - IIT Delhi' from being mistaken for the
        'WORKSHOPS' header.
        """
        if section_key not in SECTION_HEADERS:
            return ""

        # Split into lines and track their character offsets
        lines: List[tuple] = []  # (line_start_offset, line_end_offset, line_text)
        offset = 0
        for line in text.split("\n"):
            lines.append((offset, offset + len(line), line))
            offset += len(line) + 1  # +1 for the \n

        # For each section key, find which lines qualify as section headers
        all_headers = []  # (line_start, line_end, key)
        for key, pat in SECTION_HEADERS.items():
            for (ls, le, line_text) in lines:
                stripped = line_text.strip()
                # Only short lines qualify as section headers
                if len(stripped) > 60:
                    continue
                if re.search(pat, stripped):
                    all_headers.append((ls, le, key))
                    break  # only first occurrence per key per scan — prevents duplicate anchors
            # Actually find ALL occurrences for proper boundary detection

        # Find FIRST qualifying line per key — each section key appears at most once.
        # Rules for a line to count as a section header:
        #   1. Short line (≤ 60 chars)
        #   2. The section keyword appears at the START of the stripped line (re.match),
        #      not buried in the middle — prevents "Workshop on Large Language Models"
        #      from matching the 'languages' key because "language" appears mid-line.
        all_headers = []
        seen_keys: set = set()
        for (ls, le, line_text) in lines:
            stripped = line_text.strip()
            if not stripped or len(stripped) > 60:
                continue
            for key, pat in SECTION_HEADERS.items():
                if key not in seen_keys and re.match(pat, stripped):
                    all_headers.append((ls, le, key))
                    seen_keys.add(key)
                    break  # one key per line

        all_headers.sort()

        for i, (start, end, key) in enumerate(all_headers):
            if key == section_key:
                next_start = all_headers[i + 1][0] if i + 1 < len(all_headers) else len(text)
                return text[end:next_start]
        return ""

    # ─── Warnings ──────────────────────────────────────────────────────────

    def _get_warnings(self, parsed: dict) -> List[str]:
        warnings = []
        if not parsed.get("name"):
            warnings.append("Could not extract name")
        if not parsed.get("email"):
            warnings.append("No email found")
        if not parsed.get("skills"):
            warnings.append("No skills detected")
        if not parsed.get("education"):
            warnings.append("Education section not found")
        return warnings
