# Kubernetes & Cloudflare Tunnel: Deployment, Access, & Troubleshooting Guide

This document records the exact steps, architectural patterns, and debugging solutions used to deploy the **HALO (Health Assessment & Lifestyle Operating Tool)** platform on a local Kubernetes cluster and expose it securely via Cloudflare Tunnels.

---

## 1. Architecture Overview: The Nginx Gateway Pattern

In our Kubernetes cluster (`haloform-prod` namespace), we use an **Nginx Gateway (`07-gateway.yaml`)** to expose both web applications and the FastAPI backend over single NodePorts:

- **Patient UI Platform (NodePort `30080`):**
  - Requests to `/` → Proxied to the `patient-ui` service on port `80`.
  - Requests to `/api/` → Proxied to the `backend` service on port `8000/api/`.
- **Admin UI Platform (NodePort `30081`):**
  - Requests to `/` → Proxied to the `admin-ui` service on port `80`.
  - Requests to `/api/` → Proxied to the `backend` service on port `8000/api/`.

### Why this is critical:
Because both the frontend UI and the `/api` endpoints are served from the **exact same origin/port** by the Gateway, **no separate Cloudflare tunnel is needed for the backend**, and **CORS issues are completely eliminated** when configured correctly.

---

## 2. Step 1: Correct Docker Build Commands (`VITE_API_URL=/api`)

When compiling the React frontend applications into Docker images, Vite bakes the `VITE_API_URL` environment variable into the JavaScript bundle at build time.

### ⚠️ IMPORTANT:
Never pass a full `http://...` or `https://...` URL or leave `--build-arg VITE_API_URL` empty when building for Kubernetes.
- **If omitted:** Vite defaults to `http://localhost:8000/api`, causing the client's browser to try connecting to port 8000 on their personal laptop.
- **If set to a separate API tunnel:** It triggers CORS preflight failures and breaks Content Security Policy (`connect-src 'self'`).

### ✅ Complete Build, Push, & Kubernetes Restart Commands:
Run these commands from the root directory (`/Users/apple/Desktop/form-creation`):

```bash
# 1. Admin UI (with /api)
docker build -t viditk03/haloform-admin-ui:latest --build-arg VITE_API_URL=/api ./admin-ui
docker push viditk03/haloform-admin-ui:latest
kubectl rollout restart deployment admin-ui -n haloform-prod

# 2. Patient UI (with /api)
docker build -t viditk03/haloform-patient-ui:latest --build-arg VITE_API_URL=/api ./patient-ui
docker push viditk03/haloform-patient-ui:latest
kubectl rollout restart deployment patient-ui -n haloform-prod

# 3. Backend API
docker build -t viditk03/haloform-backend:latest ./backend
docker push viditk03/haloform-backend:latest
kubectl rollout restart deployment backend -n haloform-prod
```

When `VITE_API_URL=/api`, your frontend makes requests to `/api/...` on its own domain (e.g., `https://your-tunnel.trycloudflare.com/api/...`), and the Kubernetes Gateway proxies it directly to `http://backend:8000/api/...`.

---

## 3. Step 2: Cloudflare Tunnel Setup (Public HTTPS Access)

To share the applications publicly without port-forwarding or static IPs, we use **free Cloudflare Tunnels** pointing to the Kubernetes NodePorts.

### A. Exposing Admin UI (NodePort `30081`)
Run the tunnel in `nohup` mode so it persists in the background:
```bash
nohup cloudflared tunnel --url http://localhost:30081 > admin-tunnel.log 2>&1 &
```
Grab the generated public URL:
```bash
grep -o 'https://[^"]*\.trycloudflare\.com' admin-tunnel.log
```

### B. Exposing Patient UI (NodePort `30080`)
Run a second tunnel pointing to port `30080`:
```bash
nohup cloudflared tunnel --url http://localhost:30080 > patient-tunnel.log 2>&1 &
```
Grab the generated public URL:
```bash
grep -o 'https://[^"]*\.trycloudflare\.com' patient-tunnel.log
```

---

## 4. Step 3: Database User Seeding (Fixing Foreign Key Violations)

When spinning up a fresh PostgreSQL database (`formsdb`) in Kubernetes, the `users` table starts empty.
If an admin tries to create a project (`created_by=1`), PostgreSQL throws:
```text
sqlalchemy.exc.IntegrityError: (psycopg2.errors.ForeignKeyViolation) insert or update on table "projects" violates foreign key constraint "projects_created_by_fkey"
DETAIL: Key (created_by)=(1) is not present in table "users".
```

### A. Instant Fix (Live Database Execution)
You can insert the default `admin` (ID=1) and `patient` (ID=2) users directly into the running database pod without rebuilding anything:
```bash
kubectl exec -it postgres-0 -n haloform-prod -- psql -U haloform -d formsdb -c "
INSERT INTO users (id, username, role) 
VALUES (1, 'admin', 'ADMIN'), (2, 'patient', 'PATIENT') 
ON CONFLICT (id) DO NOTHING;
"
```

### B. Permanent Fix (Automated in Codebase)
The FastAPI application startup sequence (`backend/main.py`) has been enhanced to automatically check and seed default users whenever the backend boots:
```python
models.Base.metadata.create_all(bind=engine)

# Automatically seed default users if database is fresh/empty
with Session(engine) as db:
    if not db.query(models.User).filter_by(id=1).first():
        db.add(models.User(id=1, username="admin", role="ADMIN", password_hash="hashed_admin_pwd"))
    if not db.query(models.User).filter_by(id=2).first():
        db.add(models.User(id=2, username="patient", role="PATIENT", password_hash="hashed_patient_pwd"))
    db.commit()
```

---

## 5. Troubleshooting Guide & Quick Reference

### Issue 1: "Could not connect to the backend. Please check your network and try again."
- **Symptom:** Red failed network requests in browser Developer Tools (F12).
- **Cause A (Old Cached JS Bundle):** Browser cached the old JavaScript file.
  - *Fix:* Perform a **Hard Refresh** (`Ctrl+Shift+R` or `Cmd+Shift+R`).
- **Cause B (Wrong API URL Baked In):** Request URL in Network tab shows `http://localhost:8000/api/...` or a separate tunnel URL.
  - *Fix:* Rebuild Docker image with `--build-arg VITE_API_URL=/api`, push, and run:
    ```bash
    kubectl rollout restart deployment admin-ui -n haloform-prod
    ```
- **Cause C (Backend Pod Down / 502 Bad Gateway):** Request goes to `/api/...` on correct tunnel but returns `502`.
  - *Fix:* Check pod status and restart backend:
    ```bash
    kubectl get pods -n haloform-prod
    kubectl rollout restart deployment backend -n haloform-prod
    ```

### Issue 2: CORS Policy Error in Console (`No 'Access-Control-Allow-Origin' header`)
- **Symptom:** Browser blocks `fetch` due to CORS.
- **Cause:** The frontend was configured to call an external API URL (like a second Cloudflare tunnel pointing to `localhost:8000`, which fails because port 8000 isn't open on the host).
- **Fix:** Stop the second tunnel. Recompile frontend with `VITE_API_URL=/api` so all requests go through the single Nginx Gateway tunnel.

---

## 6. Complete Deployment Rollout Checklist

```bash
# 1. Apply Kubernetes manifests
kubectl apply -f halo_k8s/01-namespace.yaml
kubectl apply -f halo_k8s/02-config-and-secrets.yaml
kubectl apply -f halo_k8s/03-database.yaml
kubectl apply -f halo_k8s/04-backend.yaml
kubectl apply -f halo_k8s/05-patient-ui.yaml
kubectl apply -f halo_k8s/06-admin-ui.yaml
kubectl apply -f halo_k8s/07-gateway.yaml

# 2. Verify pods are running
kubectl get pods -n haloform-prod

# 3. Ensure default users are seeded in DB
kubectl exec -it postgres-0 -n haloform-prod -- psql -U haloform -d formsdb -c "INSERT INTO users (id, username, role) VALUES (1, 'admin', 'ADMIN'), (2, 'patient', 'PATIENT') ON CONFLICT (id) DO NOTHING;"

# 4. Start Admin & Patient Cloudflare tunnels
nohup cloudflared tunnel --url http://localhost:30081 > admin-tunnel.log 2>&1 &
nohup cloudflared tunnel --url http://localhost:30080 > patient-tunnel.log 2>&1 &

# 5. Retrieve your public URLs
echo "Admin UI Tunnel URL:"
grep -o 'https://[^"]*\.trycloudflare\.com' admin-tunnel.log

echo "Patient UI Tunnel URL:"
grep -o 'https://[^"]*\.trycloudflare\.com' patient-tunnel.log
```
