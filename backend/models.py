from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # 'ADMIN' or 'PATIENT'

# ── NEW: Tier 1 — Project (The Root) ──
class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)                     # "Longevity Pilot 2026"
    slug = Column(String, unique=True, index=True)        # "LON_2026"
    description = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    hospitals = relationship("Hospital", back_populates="project")
    forms = relationship("Form", back_populates="project")

# ── NEW: Tier 2 — Hospital/Center (The Participant) ──
class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)                     # "Baptist Hospital Bangalore"
    site_code = Column(String, unique=True, index=True)   # "BPA"
    project_id = Column(Integer, ForeignKey("projects.id"))
    address = Column(String, nullable=True)
    contact_info = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="hospitals")
    submissions = relationship("Submission", back_populates="hospital")

# ── EXISTING: Form — unchanged except for optional project_id FK ──
class Form(Base):
    __tablename__ = "forms"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    created_by = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)  # NEW, optional

    versions = relationship("FormVersion", back_populates="form")
    project = relationship("Project", back_populates="forms")               # NEW

# ── EXISTING: FormVersion — completely untouched ──
class FormVersion(Base):
    __tablename__ = "form_versions"
    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"))
    version_number = Column(Integer)
    status = Column(String) # 'DRAFT', 'PUBLISHED', 'ARCHIVED'
    schema = Column(JSON, default=[])
    ui_schema = Column(JSON, default={})
    logic_schema = Column(JSON, default=[])
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    form = relationship("Form", back_populates="versions")
    submissions = relationship("Submission", back_populates="version")

# ── EXISTING: Submission — unchanged except for optional metadata columns ──
class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    form_version_id = Column(Integer, ForeignKey("form_versions.id"))
    patient_id = Column(Integer, ForeignKey("users.id"))
    data = Column(JSON)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)   # NEW, optional
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)  # NEW, optional
    center_id = Column(String, nullable=True)                                # NEW, free-text
    submitted_by = Column(String, nullable=True)                             # NEW, data collector ID

    version = relationship("FormVersion", back_populates="submissions")
    hospital = relationship("Hospital", back_populates="submissions")        # NEW
