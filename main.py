"""
main.py — Quick CLI test runner for the resume parsing pipeline.

Usage:
    python main.py
    python main.py sample_resumes/test_resume.pdf
    python main.py sample_resumes/Dr. Pankaj Jain Resume 1.pdf
    python main.py sample_resumes/resumee.pdf
"""

import json
import sys

from agents.resume_parser.file_reader import read_resume
from agents.resume_parser.extractor import extract_all, _split_sections
from agents.resume_parser.normalizer import normalize_profile

file_path = sys.argv[1] if len(sys.argv) > 1 else "sample_resumes/test_resume.pdf"

columns = read_resume(file_path)

print("=== LEFT COLUMN ===")
print(columns["left"])
print("\n=== RIGHT COLUMN (first 600 chars) ===")
print(columns["right"][:600])

print("\n=== SECTION DETECTION DEBUG ===")
sections = _split_sections(columns["right"])
for k, v in sections.items():
    print(f"\n-- {k.upper()} --")
    print(v[:300] if v else "(empty)")

print("\n=== RAW EXTRACTED ===")
raw = extract_all(columns)
print(json.dumps(raw, indent=2))

print("\n=== NORMALIZED ===")
normalized = normalize_profile(raw)
print(json.dumps(normalized, indent=2))
