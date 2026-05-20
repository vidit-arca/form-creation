# Multi-Center Data Management Strategy

## 1. Overview
As HaloFormCraft moves into production and field testing across multiple hospital sites, a structured hierarchy is required to ensure data integrity, facilitate multi-site management, and prevent data "contamination" (mixing data from different centers).

This strategy outlines the transition to a **Multi-Tenant, Project-Centric Hierarchy**. A single project may involve multiple hospitals, centers, camps, or field locations participating in the same data collection workflow.

---

## 2. The Organizational Hierarchy
To scale from 3 centers to 30+, the application will follow a three-tier model where the **Project** is the central anchor:

### **Tier 1: Project (The Root)**
*   **Definition:** A specific clinical study or nationwide/statewide operational workflow.
*   **Example:** "Longevity Pilot 2024", "Maternal Health Screening".
*   **Logic:** A single Project can have multiple Hospitals mapped to it.

### **Tier 2: Hospital/Center (The Participant)**
*   **Definition:** The physical facility, institution, or field location participating in the study.
*   **Example:** Baptist Hospital, M.S. Ramaiah, SMISMSR.
*   **ID Strategy:** Each hospital is assigned a **Short Code** (e.g., `BPA`, `MSR`).
*   **Logic:** Hospitals use assigned forms within their project scope.

### **Tier 3: Form (The Tool)**
*   **Definition:** The actual digital data collection instrument.
*   **Logic:** Forms are created and attached to the Project (or specifically to a Hospital context). Reusable across hospitals within the project.

---

## 3. Technical Implementation: The "Sorting Hat" Logic
To manage this in a single database, we use **Metadata Tagging**.

### **A. Site Codes vs. Names**
*   **Strategy:** Always use unique, short, alphanumeric codes (Slugs) for database keys.
*   **Rationale:** Hospital names are for display (UI); Site Codes are for logic (DB). Names can have typos or change; codes are immutable.

### **B. Submission Flow (Data Tagging)**
When a data collector opens a form at a center, the system automatically captures the origin:
1.  **URL Parameter:** `https://haloform.com/fill/form_id?project=LON_2024&site=BPA&center=camp_A`
2.  **Metadata Injection:** The UI reads the parameters and silently attaches them to the submission JSON.

### **C. Patient UI Contextualization (Dashboard Filtering)**
To ensure patients only see relevant forms, the Patient Dashboard becomes "Context-Aware":
1.  **Dynamic Filtering:** If a patient visits `patient.haloform.com?project=LON_2024&site=BPA`, the dashboard will only fetch and display forms belonging to that project and hospital.
2.  **Context Locking:** The app saves the context in `localStorage`. If the patient refreshes the page or returns later, the app remains "locked" to that portal.
3.  **Site-Specific Branding:** The UI can dynamically load the project's or hospital's logo, contact information, and welcome message based on the active context.

### **D. Database Storage Structure**
Final submissions will be stored with a unified metadata block for better segregation and tracking:
```json
{
  "metadata": {
    "project_id": "proj_001",
    "hospital_id": "BPA",
    "center_id": "camp_A",
    "submitted_by": "user_123",
    "submitted_at": "2026-05-13T10:00:00Z"
  },
  "data": {
    "patient_age": 22,
    "bmi": 19.4
  }
}
```

### **E. QR Generation & Deployment Workflow**
The Admin Panel serves as the central hub for generating physical access points for the field sites:
1.  **Portal QRs:** A single QR code for a hospital under a project (e.g., `?project=LON_2024&site=BPA`) that directs patients to a filtered dashboard.
2.  **Form-Specific QRs:** Deep-link QRs (e.g., `/fill/form_id?project=LON_2024&site=BPA`) that take the patient directly to a specific instrument while still preserving the site-tagging metadata.
3.  **Automated Poster Generation:** The Admin UI will provide a "Print Site Poster" feature, generating a standardized PDF with the branding, instructions, and the encoded QR code for immediate physical deployment.

---

## 4. Key Benefits

### **Scalability & Management**
Better scalability for multi-hospital deployments and easier management of nationwide/statewide programs. A new hospital can be simplified onboarded into an existing project.

### **Centralized Reporting & Data Segregation**
Centralized project-level reporting and analytics. Better segregation and tracking of data by Project, Hospital, Center/Camp, and User.

### **Reusable Forms**
Forms can be created once at the Project level and reused across all participating hospitals.

### **Data Isolation & Security**
By tagging every row with `project_id` and `hospital_id`, we can easily implement **Row-Level Security**. A researcher from Ramaiah will only be able to query rows where `hospital_id == 'MSR'`.

---

## 5. Future Roadmap: PostgreSQL Integration
While SQLite works for local testing, the **PostgreSQL** migration will formalize these relationships using Foreign Keys:
*   `hospitals.project_id` $\rightarrow$ `projects.id`
*   `forms.project_id` $\rightarrow$ `projects.id`
*   `submissions.hospital_id` $\rightarrow$ `hospitals.id`
*   `submissions.project_id` $\rightarrow$ `projects.id`

This ensures that data cannot be orphaned and maintains the "Traceability Chain" required for clinical validation.

---

## 6. End-to-End Workflow: From Admin to Database

### **Step 1: Project Creation**
BPA Admin creates a **Project** (e.g., a new nationwide program).
*   **Input:** "Longevity Pilot 2026"
*   **DB Result:** Row created in `projects` table.

### **Step 2: Hospital Mapping**
Hospitals/Centers are mapped to the Project.
*   **Input:** Add "Baptist Hospital Bangalore" (Code: `BPA`) to the Project.
*   **DB Result:** Row created in `hospitals` table, linked to the `project_id`.

### **Step 3: Form Assignment**
Forms are created and attached to the Project (or Hospital context). Hospitals use assigned forms within their project scope.
*   **DB Result:** `forms` table row is created with `project_id`.

### **Step 4: QR Generation (Automatic)**
Upon clicking **"Publish"** in the Form Builder:
1.  The system constructs a **Context-Aware URL**:
    `https://patient.haloform.com/fill/5?project=LON_2026&site=BPA`
2.  The Admin UI renders this as a downloadable **QR Code** and a printable **Site Poster**.

### **Step 5: Patient Submission**
1.  Patient scans the QR code.
2.  The Patient App extracts `project=LON_2026` and `site=BPA` from the URL.
3.  Upon submission, the app attaches these IDs, along with `center_id` and `submitted_by`, to the metadata.
4.  **Backend Result:** A new row in `submissions` is created with all clinical data perfectly tagged for sorting by project, hospital, center, and user.

---

## 7. System Flow Diagram

<img src="Screenshot 2026-05-13 at 11.40.17 AM.png" width="600" />
