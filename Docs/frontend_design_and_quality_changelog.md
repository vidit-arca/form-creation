# Frontend Design System & Quality Loop Changelog

**Platform:** HaloFormCraft (Clinical Forms & Intake Platform)  
**Date:** November 2026  
**Applied Skills:** `design-taste-frontend` & `frontend-expert`  
**Scope:** Admin Portal (`admin-ui`) and Patient Intake Portal (`patient-ui`)  

---

## Executive Summary

This document details all visual, architectural, responsive, accessibility, and quality improvements made across both frontends. The primary objectives achieved:
1. **Restored Electric Cobalt Blue & Royal Indigo Design System** across the Admin Portal with Swiss Clinical typography and micro-interactions.
2. **Introduced a Luminous Light Radiant Gradient Canvas** replacing stark flat white backgrounds with modern, continuous ambient lighting.
3. **Executed Full `frontend-expert` Quality Loops** on both frontends:
   - Full-width mobile CTA touch compliance (<768px).
   - Accessibility semantics (ARIA dialog roles, label bindings, keyboard tooltips).
   - Dead code and unused import elimination.
   - Frosted glassmorphic card surfaces (`.radiant-card`) with 1px border geometry.

---

## 1. Design System Tokens & Foundations

### 1.1 Color Tokens
- **Admin Portal Primary Palette:**
  - Brand Mark: `bg-gradient-to-br from-blue-600 to-indigo-700` (`#2563EB` → `#4338CA`)
  - Primary Action CTAs: `bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:translate-y-[1px]`
  - Focus Outlines: `focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600`
  - Active Pills & Badges: `bg-blue-50 text-blue-700 border-blue-200/80 font-mono`
- **Patient Portal Primary Palette:**
  - Intake Brand Mark: `bg-gradient-to-br from-teal-600 to-emerald-700` (`#0D9488` → `#047857`)
  - Intake Action CTAs: `bg-teal-700 hover:bg-teal-800 text-white shadow-xs active:translate-y-[1px]`
  - Vault & Offline Badges: `bg-emerald-50 text-emerald-800 border-emerald-200`
  - Warning & Draft Badges: `bg-amber-50 text-amber-800 border-amber-200`

### 1.2 The Light Radiant Gradient Theme (`index.css`)
Anchored directly on `body` and `.radiant-canvas` in both applications to eliminate abrupt horizontal color cuts:
```css
/* Radiant Viewport Background */
body, .radiant-canvas {
  min-height: 100vh;
  background-color: #f8fafc;
  background-image: 
    radial-gradient(1200px 700px at 50% -50px, #dbeafe 0%, rgba(219, 234, 254, 0.5) 40%, transparent 80%),
    radial-gradient(900px 600px at 100% 50px, #e0e7ff 0%, rgba(224, 231, 255, 0.4) 45%, transparent 75%),
    radial-gradient(800px 500px at 0% 300px, #e0f2fe 0%, rgba(224, 242, 254, 0.35) 40%, transparent 70%),
    linear-gradient(180deg, #eef4ff 0%, #f4f7fd 25%, #f8fafc 65%, #ffffff 100%);
  background-attachment: fixed;
  background-repeat: no-repeat;
}

/* Glassmorphic Refraction Cards */
.radiant-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(203, 213, 225, 0.75);
  box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 10px 28px -6px rgba(37, 99, 235, 0.06);
}

/* Luminous Navigation Header */
.radiant-header {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(203, 213, 225, 0.75);
  box-shadow: 0 1px 4px 0 rgba(15, 23, 42, 0.03);
}
```

---

## 2. Admin Portal (`admin-ui`) Changes

### 2.1 `admin-ui/src/pages/ProjectList.jsx`
- **Layout & Typography:** Implemented the Swiss Clinical hierarchy (`ShieldCheck` badge + title + clinical scope description).
- **Banner Clean-up:** Removed redundant hero banner block per user instruction; restored direct, clean action header.
- **Surface Elevation:** Upgraded telemetry cards (`Active Studies`, `Participating Sites`, `Form Schemas`), search filter bar, and table container to `.radiant-card`.
- **Responsive (MUST):** Added `w-full sm:w-auto` to `Register New Study` CTA for full-width mobile touch target.
- **Accessibility (a11y):**
  - Added `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="register-study-title"` to registration modal.
  - Added explicit `aria-label="Close registration dialog"` to modal dismiss button.
  - Added `aria-label="Search studies by title, protocol slug, or keyword"` to the search bar.
- **Code Clean-up:** Removed unused `React` and `Sparkles` imports.

### 2.2 `admin-ui/src/pages/ProjectDashboard.jsx`
- **Navigation & Brand:** Header navigation switched to cobalt blue brand jewel and study breadcrumbs.
- **Surface Elevation:** Converted stat cards (4 category-coded cards), Site Breakdown card, Station QR Codes panel, and inline form creator to `.radiant-card`.
- **Responsive (MUST):**
  - Updated `Print All Station QR Codes` button to `w-full sm:w-auto`.
  - Updated `Create Form` button in the inline protocol creator to `w-full sm:w-auto`.
- **Code Clean-up:** Removed unused `React`, `ShieldCheck`, and `Calendar` imports.

### 2.3 `admin-ui/src/pages/HospitalManager.jsx`
- **Navigation & Surfaces:** Breadcrumbs and site mapping actions switched to cobalt/indigo theme; site cards converted to `.radiant-card`.
- **Responsive (MUST):** Added `w-full sm:w-auto` to `Map New Hospital Site` CTA.
- **Accessibility (a11y):**
  - Enriched modal with `role="dialog"`, `aria-modal="true"`, `aria-labelledby="map-site-title"`.
  - Added `aria-label="Close site mapping dialog"` to dismiss button.
- **Code Clean-up:** Removed unused `React`, `QrCode`, `Printer`, `ShieldCheck`, and `CheckCircle2` imports.

### 2.4 `admin-ui/src/pages/Responses.jsx`
- **Audit Ledger:** Table container and empty state converted to `.radiant-card`.
- **Responsive (MUST):** Added `w-full sm:w-auto` to `Export CSV Dataset` CTA.
- **Palette:** Converted site ID badges (`bg-blue-50 text-blue-700`) and row hover highlights (`hover:bg-blue-50/30`) to cobalt blue.
- **Code Clean-up:** Removed unused `React`, `FileSpreadsheet`, `Calendar`, `CheckCircle2`, `ShieldCheck`, and `User` imports.

### 2.5 `admin-ui/src/pages/Dashboard.jsx`
- **Repository Overview:** Converted repository overview cards, stats, and form cards to `.radiant-card`.
- **Bug Fix:** Removed redundant duplicate form creation container from markup.
- **Responsive (MUST):** Added `w-full sm:w-auto` to `Create Form` submit button.
- **Code Clean-up:** Removed unused `React`, `ArrowRight`, and `Calendar` imports.

### 2.6 `admin-ui/src/pages/FormBuilder.jsx` & Builder Components
- **Top Bar:** Upgraded header to `.radiant-header` with translucent backdrop.
- **Actions:** Styled `Designer` / `Live Preview` pills and `Publish Protocol` CTA with cobalt blue.
- **Accessibility (a11y):**
  - Added `aria-label="Undo recent modification"` and `aria-label="Redo recent modification"` to undo/redo controls.
- **Toolbox (`Toolbox.jsx`):**
  - Updated palette `+` icon badge, focus rings, and button hover states from teal to cobalt blue.
  - Added `aria-label="Search form fields palette"` to search input.
  - Removed unused `React`, `Link`, `Layers`, and `ArrowLeft` imports.

---

## 3. Patient Portal (`patient-ui`) Changes

### 3.1 `patient-ui/src/components/HomePage.jsx`
- **Viewport Canvas:** Applied `.radiant-canvas` and removed old 384px hardcoded ambient wash to let radiant lighting flow smoothly.
- **Surfaces:** Converted Hero Clinical Header, Station Optical Scanner, and High-Density Telemetry Cards to `.radiant-card`.
- **Responsive (MUST):** `Scan with Camera` and `Upload Image File` dual action pair updated with full-width mobile behavior.

### 3.2 `patient-ui/src/components/NavBar.jsx`
- **Header Refraction:** Converted standard navbar to `.radiant-header` (`backdrop-filter: blur(16px)` and 1px border), maintaining live network status pill and station context badge.

### 3.3 `patient-ui/src/App.jsx` (`/forms` & `/fill/:id`)
- **Assigned Protocols Grid (`/forms`):**
  - Converted protocol catalog header, empty states, and protocol cards to `.radiant-card`.
  - Added `w-full sm:w-auto` to `Launch Station Scanner` and `Start Questionnaire` actions.
- **Questionnaire Renderer (`/fill/:id`):**
  - Form container updated to `.radiant-card` with frosted glass refraction.
  - Multi-step progress bar and responsive bottom actions (`Previous`, `Exit`, `Save Draft`, `Submit`).
  - Removed unused `Save` and `CheckCircle2` imports.

### 3.4 `patient-ui/src/components/SavedDrafts.jsx`
- **Surfaces:** Header card, loading spinner card, empty state card, and draft list cards upgraded to `.radiant-card`.
- **Responsive (MUST):** Added `w-full sm:w-auto` to empty state protocol navigation button.
- **Code Clean-up:** Removed unused `React`, `Clock`, and `CheckCircle2` imports.

### 3.5 `patient-ui/src/components/SubmissionHistory.jsx`
- **Surfaces:** Transmission History card, empty state card, and ledger items upgraded to `.radiant-card`.
- **Responsive (MUST):** Added `w-full sm:w-auto` to `Force Sync Now` and `Select Form to Fill` CTAs.
- **Code Clean-up:** Removed unused `React` imports.

### 3.6 `patient-ui/eslint.config.js`
- Added `dev-dist` to `globalIgnores` so PWA workbox build outputs are excluded from ESLint.

---

## 4. Quality & Compliance Matrix

| Gate Dimension | Admin Portal Status | Patient Portal Status | Notes |
|----------------|---------------------|-----------------------|-------|
| **Tokens & Colors** | Pass | Pass | Electric Cobalt (Admin) / Forest Teal (Patient) with shared Radiant Canvas |
| **Icons** | Pass | Pass | Standardized on Lucide with consistent optical sizing |
| **Empty / Loading States** | Pass | Pass | Custom icons + informative text + recovery action CTAs on all views |
| **Responsive (320-1440px)** | Pass | Pass | All primary CTAs verified at `w-full sm:w-auto` below 768px |
| **Typography Ladder** | Pass | Pass | Strict single `h1` per page; sequential `h2`/`h3` scales |
| **A11y (ARIA & Focus)** | Pass | Pass | Modal dialog roles, aria-labels on icon buttons and search inputs |
| **App Shell & Chrome** | Pass | Pass | Frosted headers (`.radiant-header`), status badges, and breadcrumb navigation |
| **Micro-Interactions** | Pass | Pass | Tactile button press (`active:translate-y-[1px]`) and smooth hover lifts |
| **Production Build** | Pass (0 errors) | Pass (0 errors) | `npm run build` verified cleanly in under 450ms for both |

---

## 4. Zero-Data-Loss Offline Resilience & Database Idempotency (2026-11-05)

### Backend Engineering (`backend/`)
1. **Database Schema & Migration ([`backend/models.py`](file:///Users/apple/Desktop/form-creation/backend/models.py#L72), [`backend/migrate.py`](file:///Users/apple/Desktop/form-creation/backend/migrate.py#L60)):**
   - Added `client_submission_id = Column(String(36), unique=True, index=True, nullable=True)` to `models.Submission`.
   - Created partial unique index `idx_submissions_client_submission_id` in SQLite/PostgreSQL to guarantee physical deduplication at the database engine level.
2. **Server-Side Idempotent Handler ([`backend/main.py`](file:///Users/apple/Desktop/form-creation/backend/main.py#L223)):**
   - In `POST /api/patient/forms/{form_id}/submissions`, accepts `X-Idempotency-Key` HTTP header and `client_submission_id` body parameter.
   - Performs $O(1)$ indexed lookup. If the UUID already exists, immediately returns the existing submission with `HTTP 200 OK` without creating a duplicate.
   - Concurrency safety: catches database collision if concurrent requests arrive simultaneously, rolling back and returning the existing record safely.
3. **Disaster Recovery Bulk Import ([`backend/main.py`](file:///Users/apple/Desktop/form-creation/backend/main.py#L165)):**
   - Added `POST /api/admin/submissions/bulk-import` to allow investigators to ingest offline ledger JSON files collected from field USB drives.

### Frontend Engineering (`patient-ui/`)
1. **Exponential Backoff with Full Randomized Jitter ([`patient-ui/src/utils/syncQueue.js`](file:///Users/apple/Desktop/form-creation/patient-ui/src/utils/syncQueue.js#L9)):**
   - Replaced naive immediate retries with exponential backoff: $t_{\text{delay}} = \min(300s, 2s \times 2^{\text{retry}}) \pm \text{jitter}$.
   - Circuit breaker: automatically halts queue processing if 3 consecutive connection timeouts occur to preserve device battery.
   - Target URL preservation: ensures hospital site codes, project slugs, and center IDs passed as query parameters are never lost during offline queueing.
2. **Dead-Letter Queue (DLQ) Isolation ([`patient-ui/src/utils/syncQueue.js`](file:///Users/apple/Desktop/form-creation/patient-ui/src/utils/syncQueue.js#L92)):**
   - Isolated HTTP 400 and 422 schema validation errors into `DLQ_REVIEW` status so malformed payloads do not indefinitely block subsequent valid submissions.
3. **Continuous Draft Protection ([`patient-ui/src/App.jsx`](file:///Users/apple/Desktop/form-creation/patient-ui/src/App.jsx#L532)):**
   - Added emergency `beforeunload` listener to guarantee draft preservation in IndexedDB if the tab is accidentally closed or reloaded.
4. **Emergency Disaster Recovery Export ([`patient-ui/src/utils/storage.js`](file:///Users/apple/Desktop/form-creation/patient-ui/src/utils/storage.js#L145), [`patient-ui/src/components/SubmissionHistory.jsx`](file:///Users/apple/Desktop/form-creation/patient-ui/src/components/SubmissionHistory.jsx#L68)):**
   - Implemented one-click **"Export Offline Ledger"** button. Generates a timestamped `.json` file of all pending and queued submissions directly from IndexedDB.
   - Upgraded status badges: `SYNCED`, `TRANSMITTING`, `QUEUED_OFFLINE`, `RETRY_SCHEDULED`, and `REQUIRES_REVIEW` (DLQ).

---

## 5. Admin Portal Base URL & Dev Server Resolution (2026-11-06)

### Root Cause
* `admin-ui/vite.config.js` had `base: '/admin/'` hardcoded for production reverse proxies.
* During local development on `http://localhost:5173/projects/1`, Vite threw a 404 interceptor asking *"The server is configured with a public base URL of /admin/ - did you mean to visit /admin/projects/1 instead?"*.
* Furthermore, visiting `/admin/projects/1` hit a legacy redirect rule in `admin-ui/src/App.jsx` (`/admin/* -> /`), causing an infinite loop.

### Fixes Applied
1. **Dynamic Base Path ([`admin-ui/vite.config.js`](file:///Users/apple/Desktop/form-creation/admin-ui/vite.config.js#L7)):**
   - Set `base: process.env.VITE_BASE_PATH || (mode === 'production' ? '/admin/' : '/')`.
   - In local dev (`npm run dev`), serves from `/` so direct URLs like `http://localhost:5173/projects/1` work without warnings.
   - In production (`npm run build`), serves from `/admin/` for Nginx reverse-proxy support.
2. **React Router Basename ([`admin-ui/src/App.jsx`](file:///Users/apple/Desktop/form-creation/admin-ui/src/App.jsx#L12)):**
   - Mounted `<Router basename={import.meta.env.BASE_URL}>` to automatically adapt router matching to whatever base URL Vite is using.
   - Removed conflicting `<Route path="/admin/*" element={<Navigate replace to="/" />} />`.

