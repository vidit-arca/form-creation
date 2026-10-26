# Low-Level Design (LLD) Documentation: HaloFormCraft

## 1. System Architecture Overview
The platform is designed as a decoupled full-stack application utilizing a **Client-Server Architecture**. It consists of an administrative orchestrator for form configuration and a client-facing portal for data collection, supported by a high-performance asynchronous API layer.

---

## 2. Frontend Component Architecture (React.js)

### 2.1 Dynamic Form Rendering Engine
The core of the frontend is a recursive, schema-driven rendering engine that transforms JSON abstractions into interactive User Interfaces.
- **Iterative UI Generation:** Processes a flat schema array to generate a multi-step component tree.
- **State Management:** Utilizes a centralized form state controller to manage field values, validation states, and dirty-checking.
- **Virtual Paging Layer:** Implements logic to partition the schema into logical sections based on structural delimiters (Page Breaks), maintaining local navigation state.

### 2.2 Logic & Workflow Engine
A reactive engine that evaluates rules in real-time based on the current aggregate form state.
- **Conditional Visibility Logic:** Evaluates predicate logic (operators: `==`, `!=`, `>`, `<`, `contains`) to dynamically mount or unmount components/sections.
- **Exclusive Termination (Slicing) Logic:** A high-priority condition evaluator that can dynamically truncate the form's structural array when "Stop Criteria" are met, effectively preventing further interaction and forcing a transition to the final action state.
- **Dynamic Calculation Engine:** A derivation layer that performs mathematical operations on specific field inputs to compute secondary values (e.g., Score Calculation, BMI, Age from DOB).

### 2.3 Specialized Input Subsystems
- **Searchable Combobox System:** A specialized selection component that provides real-time filtering and fuzzy matching for high-cardinality option sets.
- **Hardware Integration Layer:** Interfaces with browser APIs for Geospatial coordinate capture (GPS), high-resolution image acquisition, and real-time optical scanning (QR).
- **Ink Signature Module:** A vector-based capture system for digitizing user signatures with variable stroke sensitivity.

---

## 3. Backend Architecture (FastAPI)

### 3.1 RESTful API Infrastructure
The backend is built on a high-performance ASGI (Asynchronous Server Gateway Interface) framework.
- **Asynchronous IO:** Optimized for concurrent request handling, specifically beneficial for multi-device sync.
- **Dependency Injection Layer:** Manages resource lifecycles, including database session management and security context extraction.

### 3.2 Form Versioning & Lifecycle Management
Implements an immutable versioning pattern for form schemas.
- **Lifecycle States:** `DRAFT` (Mutable), `PUBLISHED` (Immutable, Active), `ARCHIVED` (Immutable, Historic).
- **Concurrency Control:** Ensures that submissions are strictly linked to the specific version of the schema they were collected against, maintaining data integrity during schema updates.

---

## 4. Data Design & Persistence

### 4.1 Relational Schema Design
- **Entity: Users:** Manages identity and Role-Based Access Control (RBAC) levels (System Admin vs. Data Provider).
- **Entity: Forms:** Stores high-level metadata and owner associations.
- **Entity: Form Versions:** The primary configuration storage. Uses **Semi-Structured Data Storage (JSONB)** to hold the dynamic UI schemas, validation rules, and branching logic.
- **Entity: Submissions:** Stores the result payloads. Utilizes a flexible data blob to store user responses, indexed by submission timestamp and user ID.

### 4.2 Data Integrity & Validation
- **Server-Side Verification:** Re-evaluates submission payloads against the specific schema version to ensure compliance before persistence.
- **Cross-Field Validation:** Implements backend triggers for complex cohort-based validation rules, ensuring inputs across multiple fields (e.g., Age, Gender, ID) satisfy pre-defined clinical matrices.

---

## 5. Security & Cross-Cutting Concerns

### 5.1 Authentication & Authorization
- **RBAC Strategy:** Implements granular permissions based on user roles. Admins have CRUD access to schemas and read-access to all submissions; Patients are restricted to a "Write-Only" or "Personal History" view.
- **CORS & Middleware:** Configured for secure cross-origin communication between the distinct UI domains and the centralized API.

### 5.2 Offline Synchronization Logic
Designed for high-reliability data collection in low-connectivity environments.
- **Local Persistence Layer:** Utilizes browser-based client storage to queue submissions.
- **Idempotent Sync Protocol:** Uses unique transaction identifiers to ensure that retry attempts from offline clients do not result in duplicate record insertion at the database layer.
