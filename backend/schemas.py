from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# ── FormVersion Schemas (UNCHANGED) ──

class FormVersionBase(BaseModel):
    schema_data: List[Dict[str, Any]] = Field(default=[], validation_alias='schema')
    ui_schema: Dict[str, Any] = {}
    logic_schema: List[Dict[str, Any]] = []

class FormVersionCreate(FormVersionBase):
    model_config = ConfigDict(populate_by_name=True)

class FormVersion(FormVersionBase):
    id: int
    form_id: int
    version_number: int
    status: str
    published_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# ── Form Schemas (UNCHANGED except optional project_id in response) ──

class FormBase(BaseModel):
    title: str
    description: Optional[str] = None

class FormCreate(FormBase):
    pass

class Form(FormBase):
    id: int
    created_by: int
    is_active: bool
    created_at: datetime
    project_id: Optional[int] = None  # NEW — nullable, backward-compatible
    versions: List[FormVersion] = []

    model_config = ConfigDict(from_attributes=True)

# ── Submission Schemas (UNCHANGED except optional metadata in response) ──

class SubmissionCreate(BaseModel):
    data: Dict[str, Any]

class Submission(BaseModel):
    id: int
    form_version_id: int
    patient_id: int
    data: Dict[str, Any]
    submitted_at: datetime
    project_id: Optional[int] = None      # NEW — nullable
    hospital_id: Optional[int] = None     # NEW — nullable
    center_id: Optional[str] = None       # NEW — nullable
    submitted_by: Optional[str] = None    # NEW — nullable

    model_config = ConfigDict(from_attributes=True)

# ── NEW: Project Schemas ──

class ProjectBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class HospitalSummary(BaseModel):
    id: int
    name: str
    site_code: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class Project(ProjectBase):
    id: int
    is_active: bool
    created_at: datetime
    hospitals: List[HospitalSummary] = []

    model_config = ConfigDict(from_attributes=True)

# ── NEW: Hospital Schemas ──

class HospitalBase(BaseModel):
    name: str
    site_code: str
    address: Optional[str] = None
    contact_info: Optional[Dict[str, Any]] = None

class HospitalCreate(HospitalBase):
    pass

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    contact_info: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class Hospital(HospitalBase):
    id: int
    project_id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
