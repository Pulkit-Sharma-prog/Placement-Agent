"""
database/models.py — SQLAlchemy 2.x ORM models for Placements Agent System.

All tables use UUID primary keys (stored as String(36) for SQLite compatibility).
JSON/Array fields use Text columns with JSON serialization helpers.
"""

import json
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, relationship


def gen_uuid() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    pass


# ── JSON helpers (SQLite doesn't have native JSONB/ARRAY) ─────────────────────

def _json_get(raw: str | None, default):
    if raw is None:
        return default
    try:
        return json.loads(raw)
    except Exception:
        return default


def _json_set(value) -> str:
    return json.dumps(value)


# ── Users ──────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id            = Column(String(36), primary_key=True, default=gen_uuid)
    email         = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role          = Column(String(20), nullable=False)   # student | recruiter | admin
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student   = relationship("Student",   back_populates="user",   uselist=False, cascade="all, delete-orphan")
    recruiter = relationship("Recruiter", back_populates="user",   uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email} role={self.role}>"


# ── Students ───────────────────────────────────────────────────────────────────

class Student(Base):
    __tablename__ = "students"

    id              = Column(String(36), primary_key=True, default=gen_uuid)
    user_id         = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    full_name       = Column(String(255))
    roll_number     = Column(String(50))
    branch          = Column(String(50))
    graduation_year = Column(Integer)
    cgpa            = Column(Float)
    phone           = Column(String(20))
    linkedin_url    = Column(String(500))
    resume_path     = Column(String(500))
    profile_score   = Column(Integer, default=0)
    status          = Column(String(30), default="active")  # active | placed | opted_out
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user         = relationship("User", back_populates="student")
    profile      = relationship("StudentProfile", back_populates="student", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    matches      = relationship("Match", back_populates="student", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Student {self.full_name}>"


# ── Student Profiles ───────────────────────────────────────────────────────────

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id               = Column(String(36), primary_key=True, default=gen_uuid)
    student_id       = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, unique=True)
    canonical_skills_json     = Column(Text, default="[]")
    skill_radar_json          = Column(Text, default="{}")
    skill_gaps_json           = Column(Text, default="[]")
    skills_by_category_json   = Column(Text, default="{}")
    raw_parsed_data_json      = Column(Text, default="{}")
    profile_score    = Column(Integer, default=0)
    last_parsed_at   = Column(DateTime)
    created_at       = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="profile")

    @property
    def canonical_skills(self) -> list:
        return _json_get(self.canonical_skills_json, [])

    @canonical_skills.setter
    def canonical_skills(self, v):
        self.canonical_skills_json = _json_set(v)

    @property
    def skill_radar(self) -> dict:
        return _json_get(self.skill_radar_json, {})

    @skill_radar.setter
    def skill_radar(self, v):
        self.skill_radar_json = _json_set(v)

    @property
    def skill_gaps(self) -> list:
        return _json_get(self.skill_gaps_json, [])

    @skill_gaps.setter
    def skill_gaps(self, v):
        self.skill_gaps_json = _json_set(v)

    @property
    def skills_by_category(self) -> dict:
        return _json_get(self.skills_by_category_json, {})

    @skills_by_category.setter
    def skills_by_category(self, v):
        self.skills_by_category_json = _json_set(v)

    @property
    def raw_parsed_data(self) -> dict:
        return _json_get(self.raw_parsed_data_json, {})

    @raw_parsed_data.setter
    def raw_parsed_data(self, v):
        self.raw_parsed_data_json = _json_set(v)


# ── Recruiters ─────────────────────────────────────────────────────────────────

class Recruiter(Base):
    __tablename__ = "recruiters"

    id               = Column(String(36), primary_key=True, default=gen_uuid)
    user_id          = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    company_name     = Column(String(255), nullable=False)
    sector           = Column(String(100))
    contact_name     = Column(String(255))
    website          = Column(String(500))
    preferences_json = Column(Text, default="{}")
    engagement_score = Column(Integer, default=0)
    last_active      = Column(DateTime)
    created_at       = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recruiter")
    jobs = relationship("Job", back_populates="recruiter", cascade="all, delete-orphan")

    @property
    def preferences(self) -> dict:
        return _json_get(self.preferences_json, {})

    @preferences.setter
    def preferences(self, v):
        self.preferences_json = _json_set(v)

    def __repr__(self):
        return f"<Recruiter {self.company_name}>"


# ── Jobs ───────────────────────────────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id                   = Column(String(36), primary_key=True, default=gen_uuid)
    recruiter_id         = Column(String(36), ForeignKey("recruiters.id", ondelete="CASCADE"))
    title                = Column(String(255), nullable=False)
    description          = Column(Text)
    location             = Column(String(255))
    ctc_min              = Column(Integer)
    ctc_max              = Column(Integer)
    required_skills_json = Column(Text, default="[]")
    preferred_skills_json= Column(Text, default="[]")
    skill_string         = Column(Text)
    min_cgpa             = Column(Float)
    eligible_branches_json = Column(Text, default="[]")
    graduation_year      = Column(Integer)
    status               = Column(String(20), default="active")  # active | closed | draft
    application_deadline = Column(DateTime)
    created_at           = Column(DateTime, default=datetime.utcnow)
    updated_at           = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recruiter    = relationship("Recruiter", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    matches      = relationship("Match", back_populates="job", cascade="all, delete-orphan")

    @property
    def required_skills(self) -> list:
        return _json_get(self.required_skills_json, [])

    @required_skills.setter
    def required_skills(self, v):
        self.required_skills_json = _json_set(v)

    @property
    def preferred_skills(self) -> list:
        return _json_get(self.preferred_skills_json, [])

    @preferred_skills.setter
    def preferred_skills(self, v):
        self.preferred_skills_json = _json_set(v)

    @property
    def eligible_branches(self) -> list:
        return _json_get(self.eligible_branches_json, [])

    @eligible_branches.setter
    def eligible_branches(self, v):
        self.eligible_branches_json = _json_set(v)

    def __repr__(self):
        return f"<Job {self.title}>"


# ── Matches ────────────────────────────────────────────────────────────────────

class Match(Base):
    __tablename__ = "matches"

    id              = Column(String(36), primary_key=True, default=gen_uuid)
    student_id      = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"))
    job_id          = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"))
    score           = Column(Float)       # 0.00 – 100.00
    eligible        = Column(Boolean, default=True)
    skill_overlap_json   = Column(Text, default="[]")
    missing_skills_json  = Column(Text, default="[]")
    computed_at     = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="matches")
    job     = relationship("Job", back_populates="matches")

    @property
    def skill_overlap(self) -> list:
        return _json_get(self.skill_overlap_json, [])

    @skill_overlap.setter
    def skill_overlap(self, v):
        self.skill_overlap_json = _json_set(v)

    @property
    def missing_skills(self) -> list:
        return _json_get(self.missing_skills_json, [])

    @missing_skills.setter
    def missing_skills(self, v):
        self.missing_skills_json = _json_set(v)


# ── Applications ───────────────────────────────────────────────────────────────

class Application(Base):
    __tablename__ = "applications"

    id           = Column(String(36), primary_key=True, default=gen_uuid)
    student_id   = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"))
    job_id       = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"))
    status       = Column(String(30), default="applied")
    applied_at   = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ctc_offered  = Column(Integer)
    notes        = Column(Text)

    student = relationship("Student", back_populates="applications")
    job     = relationship("Job", back_populates="applications")
    events  = relationship("ApplicationEvent", back_populates="application", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Application student={self.student_id} job={self.job_id} status={self.status}>"


# ── Application Events ─────────────────────────────────────────────────────────

class ApplicationEvent(Base):
    __tablename__ = "application_events"

    id             = Column(String(36), primary_key=True, default=gen_uuid)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"))
    from_status    = Column(String(30))
    to_status      = Column(String(30))
    metadata_json  = Column(Text, default="{}")
    created_at     = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="events")

    @property
    def event_metadata(self) -> dict:
        return _json_get(self.metadata_json, {})

    @event_metadata.setter
    def event_metadata(self, v):
        self.metadata_json = _json_set(v)


# ── Notifications ──────────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id              = Column(String(36), primary_key=True, default=gen_uuid)
    user_id         = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    type            = Column(String(50))   # match_alert | digest | shortlist | reminder
    title           = Column(String(255))
    body            = Column(Text)
    is_read         = Column(Boolean, default=False)
    sent_via        = Column(String(20))   # email | in_app
    delivery_status = Column(String(20), default="pending")  # pending | sent | failed
    created_at      = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


# ── Analytics Snapshots ────────────────────────────────────────────────────────

class AnalyticsSnapshot(Base):
    __tablename__ = "analytics_snapshots"

    id            = Column(String(36), primary_key=True, default=gen_uuid)
    snapshot_date = Column(String(10), nullable=False)   # YYYY-MM-DD
    data_json     = Column(Text, nullable=False, default="{}")
    created_at    = Column(DateTime, default=datetime.utcnow)

    @property
    def data(self) -> dict:
        return _json_get(self.data_json, {})

    @data.setter
    def data(self, v):
        self.data_json = _json_set(v)
