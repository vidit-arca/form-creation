from fastapi import FastAPI, Depends, HTTPException, status, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas
from database import engine, get_db
from audit_client import emit_audit_event_background
import csv
import io
import datetime

models.Base.metadata.create_all(bind=engine)

# Automatically seed default users if database is fresh/empty
with Session(engine) as db:
    if not db.query(models.User).filter_by(id=1).first():
        db.add(models.User(id=1, username="admin", role="ADMIN", password_hash="hashed_admin_pwd"))
    if not db.query(models.User).filter_by(id=2).first():
        db.add(models.User(id=2, username="patient", role="PATIENT", password_hash="hashed_patient_pwd"))
    db.commit()

app = FastAPI(title="Dynamic Form API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_admin():
    return models.User(id=1, username="admin", role="ADMIN")

def get_current_patient():
    return models.User(id=2, username="patient", role="PATIENT")

# ════════════════════════════════════════════════════════════════════════════════
# EXISTING FORM ENDPOINTS — COMPLETELY UNCHANGED
# ════════════════════════════════════════════════════════════════════════════════

@app.post("/api/admin/forms", response_model=schemas.Form)
def create_form(form: schemas.FormCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    db_form = models.Form(**form.model_dump(), created_by=admin.id)
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    
    db_version = models.FormVersion(
        form_id=db_form.id,
        version_number=1,
        status="DRAFT",
        schema=[],
        ui_schema={},
        logic_schema=[]
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_form)

    emit_audit_event_background(
        action="FORM_CREATED",
        category="FORM_CRAFT",
        service_origin="backend",
        actor_id=str(admin.id),
        actor_name=admin.username,
        actor_role="Admin",
        entity_type="form",
        entity_id=str(db_form.id),
        entity_name=db_form.title,
        after_state={"title": db_form.title, "description": db_form.description, "version": 1},
    )
    return db_form

@app.get("/api/admin/forms", response_model=List[schemas.Form])
def get_admin_forms(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return db.query(models.Form).all()

@app.get("/api/admin/forms/{form_id}", response_model=schemas.Form)
def get_admin_form(form_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    f = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Form not found")
    return f

@app.put("/api/admin/forms/{form_id}/versions/{version_id}", response_model=schemas.FormVersion)
def update_draft(form_id: int, version_id: int, version_update: schemas.FormVersionCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    db_version = db.query(models.FormVersion).filter(models.FormVersion.id == version_id, models.FormVersion.form_id == form_id).first()
    if not db_version:
        raise HTTPException(status_code=404, detail="Version not found")
    if db_version.status != "DRAFT":
        raise HTTPException(status_code=400, detail="Only DRAFT versions can be edited")
    
    old_schema = db_version.schema
    db_version.schema = version_update.schema_data
    db_version.ui_schema = version_update.ui_schema
    db_version.logic_schema = version_update.logic_schema
    db.commit()
    db.refresh(db_version)

    emit_audit_event_background(
        action="FORM_SCHEMA_UPDATED",
        category="FORM_CRAFT",
        service_origin="backend",
        actor_id=str(admin.id),
        actor_name=admin.username,
        actor_role="Admin",
        entity_type="form",
        entity_id=str(form_id),
        entity_name=f"Form #{form_id} Draft v{db_version.version_number}",
        before_state={"fields_count": len(old_schema or []), "schema": old_schema},
        after_state={"fields_count": len(version_update.schema_data or []), "schema": version_update.schema_data},
    )
    return db_version

@app.post("/api/admin/forms/{form_id}/publish")
def publish_form(form_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    db_version = db.query(models.FormVersion).filter(models.FormVersion.form_id == form_id, models.FormVersion.status == "DRAFT").first()
    if not db_version:
        raise HTTPException(status_code=404, detail="No DRAFT version found to publish")
    
    published = db.query(models.FormVersion).filter(models.FormVersion.form_id == form_id, models.FormVersion.status == "PUBLISHED").first()
    if published:
        published.status = "ARCHIVED"
        
    db_version.status = "PUBLISHED"
    db_version.published_at = datetime.datetime.now(datetime.timezone.utc)
    
    new_draft = models.FormVersion(
        form_id=form_id,
        version_number=db_version.version_number + 1,
        status="DRAFT",
        schema=db_version.schema,
        ui_schema=db_version.ui_schema,
        logic_schema=db_version.logic_schema
    )
    db.add(new_draft)
    db.commit()

    emit_audit_event_background(
        action="FORM_PUBLISHED",
        category="FORM_CRAFT",
        service_origin="backend",
        actor_id=str(admin.id),
        actor_name=admin.username,
        actor_role="Admin",
        entity_type="form",
        entity_id=str(form_id),
        entity_name=f"Form #{form_id} v{db_version.version_number}",
        before_state={"status": "DRAFT", "version": db_version.version_number},
        after_state={"status": "PUBLISHED", "version": db_version.version_number, "published_at": str(db_version.published_at)},
    )
    return {"message": "Form published successfully"}

@app.get("/api/admin/forms/{form_id}/submissions")
def get_form_submissions(form_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    subs = db.query(models.Submission).join(models.FormVersion).filter(models.FormVersion.form_id == form_id).all()
    result = []
    for s in subs:
        result.append({
            "id": s.id,
            "patient_id": s.patient_id,
            "data": s.data,
            "submitted_at": s.submitted_at,
            "project_id": s.project_id,
            "hospital_id": s.hospital_id,
            "center_id": s.center_id,
            "submitted_by": s.submitted_by
        })
    return result

@app.get("/api/admin/forms/{form_id}/export")
def export_submissions(form_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    form = db.query(models.Form).filter(models.Form.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    submissions = db.query(models.Submission).join(models.FormVersion).filter(models.FormVersion.form_id == form_id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = set()
    for sub in submissions:
        headers.update(sub.data.keys())
    
    # Include metadata columns in export
    meta_cols = ["Submission ID", "Patient ID", "Submitted At", "Project ID", "Hospital ID", "Center ID", "Submitted By"]
    headers = meta_cols + sorted(list(headers))
    writer.writerow(headers)
    
    for sub in submissions:
        row = [
            sub.id, sub.patient_id, sub.submitted_at.isoformat(),
            sub.project_id, sub.hospital_id, sub.center_id, sub.submitted_by
        ]
        for key in headers[len(meta_cols):]:
            row.append(sub.data.get(key, ""))
        writer.writerow(row)
        
    return Response(
        content=output.getvalue(), 
        media_type="text/csv", 
        headers={"Content-Disposition": f"attachment; filename=form_{form_id}_export.csv"}
    )

@app.post("/api/admin/submissions/bulk-import")
def bulk_import_submissions(
    ledger: List[dict],
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """
    Emergency Disaster Recovery: Ingest offline submissions ledger (JSON)
    collected from field devices via USB or offline export.
    Deduplicates via client_submission_id.
    """
    imported = 0
    skipped = 0
    errors = []

    for idx, item in enumerate(ledger):
        client_sub_id = item.get("client_submission_id") or item.get("id")
        form_id = item.get("formId") or item.get("form_id")
        payload = item.get("payload") or item.get("data") or {}
        metadata = item.get("metadata") or {}

        if not form_id:
            errors.append(f"Row {idx+1}: Missing formId")
            continue

        # Check idempotency
        if client_sub_id:
            existing = db.query(models.Submission).filter(
                models.Submission.client_submission_id == str(client_sub_id)
            ).first()
            if existing:
                skipped += 1
                continue

        # Resolve published version
        pub_v = db.query(models.FormVersion).filter(
            models.FormVersion.form_id == int(form_id),
            models.FormVersion.status == "PUBLISHED"
        ).first()
        if not pub_v:
            errors.append(f"Row {idx+1}: Form {form_id} has no published version")
            continue

        db_sub = models.Submission(
            client_submission_id=str(client_sub_id) if client_sub_id else None,
            form_version_id=pub_v.id,
            patient_id=admin.id,
            data=payload,
            project_id=metadata.get("projectId") or pub_v.form.project_id,
            hospital_id=metadata.get("hospitalId"),
            center_id=metadata.get("centerId"),
            submitted_by=metadata.get("submittedBy") or "OFFLINE_IMPORT"
        )
        db.add(db_sub)
        imported += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database commit failed: {str(e)}")

    return {
        "status": "success",
        "imported": imported,
        "skipped": skipped,
        "errors": errors
    }

# ════════════════════════════════════════════════════════════════════════════════
# EXISTING PATIENT ENDPOINTS — UPDATED WITH OPTIONAL CONTEXT FILTERING
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/patient/forms")
def get_published_forms(
    project: Optional[str] = Query(None, description="Filter by project slug"),
    site: Optional[str] = Query(None, description="Filter by hospital site code"),
    db: Session = Depends(get_db),
    patient=Depends(get_current_patient)
):
    query = db.query(models.Form).join(models.FormVersion).filter(
        models.FormVersion.status == "PUBLISHED"
    )
    
    # Apply optional project filter
    if project:
        query = query.join(models.Project, models.Form.project_id == models.Project.id).filter(
            models.Project.slug == project
        )
    
    # Apply optional site filter — show forms belonging to the project that this hospital is in
    if site:
        hospital = db.query(models.Hospital).filter(models.Hospital.site_code == site).first()
        if hospital:
            query = query.filter(models.Form.project_id == hospital.project_id)
        else:
            return []  # Unknown site code → no forms
    
    forms = query.all()
    result = []
    for f in forms:
        pub_v = next((v for v in f.versions if v.status == "PUBLISHED"), None)
        if pub_v:
            result.append({
                "id": f.id,
                "title": f.title,
                "description": f.description,
                "version_id": pub_v.id,
                "project_id": f.project_id
            })
    return result

@app.get("/api/patient/forms/{form_id}")
def get_patient_form(form_id: int, db: Session = Depends(get_db), patient=Depends(get_current_patient)):
    pub_v = db.query(models.FormVersion).filter(models.FormVersion.form_id == form_id, models.FormVersion.status == "PUBLISHED").first()
    if not pub_v:
        raise HTTPException(status_code=404, detail="Published form not found")
    return {
        "form_id": form_id,
        "version_id": pub_v.id,
        "title": pub_v.form.title,
        "description": pub_v.form.description,
        "schema_data": pub_v.schema,
        "ui_schema": pub_v.ui_schema,
        "logic_schema": pub_v.logic_schema
    }

@app.post("/api/patient/forms/{form_id}/submissions", response_model=schemas.Submission)
def submit_form(
    form_id: int,
    submission: schemas.SubmissionCreate,
    project: Optional[str] = Query(None, description="Project slug for metadata tagging"),
    site: Optional[str] = Query(None, description="Hospital site code for metadata tagging"),
    center: Optional[str] = Query(None, description="Center/camp identifier"),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
    db: Session = Depends(get_db),
    patient=Depends(get_current_patient)
):
    idempotency_key = x_idempotency_key or submission.client_submission_id

    # 1. Deduplication check: if submission with this UUID already exists, return it immediately (HTTP 200)
    if idempotency_key:
        existing_sub = db.query(models.Submission).filter(
            models.Submission.client_submission_id == idempotency_key
        ).first()
        if existing_sub:
            return existing_sub

    pub_v = db.query(models.FormVersion).filter(models.FormVersion.form_id == form_id, models.FormVersion.status == "PUBLISHED").first()
    if not pub_v:
        raise HTTPException(status_code=404, detail="Published form not found")
    
    # Resolve optional metadata
    resolved_project_id = None
    resolved_hospital_id = None

    if project:
        db_project = db.query(models.Project).filter(models.Project.slug == project).first()
        if db_project:
            resolved_project_id = db_project.id
    
    # Fallback: use the form's own project_id if not provided via query
    if resolved_project_id is None and pub_v.form.project_id:
        resolved_project_id = pub_v.form.project_id

    if site:
        db_hospital = db.query(models.Hospital).filter(models.Hospital.site_code == site).first()
        if db_hospital:
            resolved_hospital_id = db_hospital.id

    db_sub = models.Submission(
        client_submission_id=idempotency_key,
        form_version_id=pub_v.id,
        patient_id=patient.id,
        data=submission.data,
        project_id=resolved_project_id,
        hospital_id=resolved_hospital_id,
        center_id=center,
        submitted_by=patient.username
    )
    db.add(db_sub)
    try:
        db.commit()
        db.refresh(db_sub)
        
        emit_audit_event_background(
            action="SUBMISSION_RECEIVED",
            category="CLINICAL_INTAKE",
            service_origin="backend",
            actor_id=str(patient.id),
            actor_name=patient.username,
            actor_role="Patient",
            entity_type="submission",
            entity_id=str(db_sub.id),
            entity_name=f"Form #{form_id} Submission",
            site_code=site,
            station_id=center,
            after_state={"form_id": form_id, "submission_id": db_sub.id, "client_uuid": idempotency_key},
        )
    except Exception as e:
        db.rollback()
        # Concurrency safety: if another thread committed the same idempotency_key in parallel
        if idempotency_key:
            existing_sub = db.query(models.Submission).filter(
                models.Submission.client_submission_id == idempotency_key
            ).first()
            if existing_sub:
                return existing_sub
        raise HTTPException(status_code=500, detail=f"Database error during submission: {str(e)}")

    return db_sub

@app.get("/api/patient/submissions", response_model=List[schemas.Submission])
def get_patient_submissions(db: Session = Depends(get_db), patient=Depends(get_current_patient)):
    return db.query(models.Submission).filter(models.Submission.patient_id == patient.id).all()

# ════════════════════════════════════════════════════════════════════════════════
# NEW: PROJECT CRUD ENDPOINTS
# ════════════════════════════════════════════════════════════════════════════════

@app.post("/api/admin/projects", response_model=schemas.Project)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    # Check for duplicate slug
    existing = db.query(models.Project).filter(models.Project.slug == project.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Project with slug '{project.slug}' already exists")
    
    db_project = models.Project(**project.model_dump(), created_by=admin.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/api/admin/projects", response_model=List[schemas.Project])
def get_projects(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    return db.query(models.Project).filter(models.Project.is_active == True).all()

@app.get("/api/admin/projects/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.put("/api/admin/projects/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@app.delete("/api/admin/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Soft delete
    db_project.is_active = False
    db.commit()
    return {"message": f"Project '{db_project.name}' deactivated"}

# ════════════════════════════════════════════════════════════════════════════════
# NEW: HOSPITAL CRUD ENDPOINTS (scoped under projects)
# ════════════════════════════════════════════════════════════════════════════════

@app.post("/api/admin/projects/{project_id}/hospitals", response_model=schemas.Hospital)
def create_hospital(
    project_id: int,
    hospital: schemas.HospitalCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    # Verify project exists
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check for duplicate site_code globally
    existing = db.query(models.Hospital).filter(models.Hospital.site_code == hospital.site_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Hospital with site code '{hospital.site_code}' already exists")
    
    db_hospital = models.Hospital(**hospital.model_dump(), project_id=project_id)
    db.add(db_hospital)
    db.commit()
    db.refresh(db_hospital)
    return db_hospital

@app.get("/api/admin/projects/{project_id}/hospitals", response_model=List[schemas.Hospital])
def get_project_hospitals(
    project_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return db.query(models.Hospital).filter(
        models.Hospital.project_id == project_id,
        models.Hospital.is_active == True
    ).all()

@app.get("/api/admin/hospitals/{hospital_id}", response_model=schemas.Hospital)
def get_hospital(hospital_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital

@app.put("/api/admin/hospitals/{hospital_id}", response_model=schemas.Hospital)
def update_hospital(
    hospital_id: int,
    hospital_update: schemas.HospitalUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    db_hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    update_data = hospital_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_hospital, key, value)
    
    db.commit()
    db.refresh(db_hospital)
    return db_hospital

@app.delete("/api/admin/projects/{project_id}/hospitals/{hospital_id}")
def delete_hospital(
    project_id: int,
    hospital_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    db_hospital = db.query(models.Hospital).filter(
        models.Hospital.id == hospital_id,
        models.Hospital.project_id == project_id
    ).first()
    if not db_hospital:
        raise HTTPException(status_code=404, detail="Hospital not found in this project")
    
    # Soft delete
    db_hospital.is_active = False
    db.commit()
    return {"message": f"Hospital '{db_hospital.name}' removed from project"}

# ════════════════════════════════════════════════════════════════════════════════
# NEW: PROJECT-SCOPED FORM CREATION (parallel route — existing /api/admin/forms stays)
# ════════════════════════════════════════════════════════════════════════════════

@app.post("/api/admin/projects/{project_id}/forms", response_model=schemas.Form)
def create_project_form(
    project_id: int,
    form: schemas.FormCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Create a form scoped to a specific project. Same form lifecycle as /api/admin/forms."""
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_form = models.Form(**form.model_dump(), created_by=admin.id, project_id=project_id)
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    
    # Same versioning logic as the original create_form
    db_version = models.FormVersion(
        form_id=db_form.id,
        version_number=1,
        status="DRAFT",
        schema=[],
        ui_schema={},
        logic_schema=[]
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_form)

    emit_audit_event_background(
        action="FORM_CREATED",
        category="FORM_CRAFT",
        service_origin="backend",
        actor_id=str(admin.id),
        actor_name=admin.username,
        actor_role="Admin",
        entity_type="form",
        entity_id=str(db_form.id),
        entity_name=db_form.title,
        after_state={"title": db_form.title, "description": db_form.description, "version": 1},
    )
    return db_form

@app.get("/api/admin/projects/{project_id}/forms", response_model=List[schemas.Form])
def get_project_forms(
    project_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """List all forms belonging to a specific project."""
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return db.query(models.Form).filter(models.Form.project_id == project_id).all()

# ════════════════════════════════════════════════════════════════════════════════
# NEW: PROJECT-LEVEL REPORTING
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/admin/projects/{project_id}/stats")
def get_project_stats(
    project_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    """Get aggregate statistics for a project — form count, hospital count, submission count."""
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    form_count = db.query(models.Form).filter(models.Form.project_id == project_id).count()
    hospital_count = db.query(models.Hospital).filter(
        models.Hospital.project_id == project_id,
        models.Hospital.is_active == True
    ).count()
    submission_count = db.query(models.Submission).filter(
        models.Submission.project_id == project_id
    ).count()
    
    # Per-hospital breakdown
    hospital_stats = []
    hospitals = db.query(models.Hospital).filter(
        models.Hospital.project_id == project_id,
        models.Hospital.is_active == True
    ).all()
    for h in hospitals:
        h_subs = db.query(models.Submission).filter(models.Submission.hospital_id == h.id).count()
        hospital_stats.append({
            "hospital_id": h.id,
            "name": h.name,
            "site_code": h.site_code,
            "submission_count": h_subs
        })
    
    return {
        "project_id": project_id,
        "project_name": db_project.name,
        "form_count": form_count,
        "hospital_count": hospital_count,
        "total_submissions": submission_count,
        "hospitals": hospital_stats
    }
