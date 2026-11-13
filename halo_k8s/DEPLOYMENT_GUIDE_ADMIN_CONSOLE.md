# Halo Admin Console — Kubernetes Production Deployment Guide

This guide details how to deploy the newly merged **Arca Halo Admin Console** into your existing **`halo_k8s/`** cluster (`haloform-prod` namespace) behind your Cloudflare Tunnel.

---

## 1. High-Level Architecture

In your existing setup, Cloudflare Tunnel forwards public traffic from `arcaai.com` directly into the internal K8s **Gateway** (`07-gateway.yaml`). 

By adding the Halo microservices to the Gateway's routing rules on port `9091`, **zero DNS or Cloudflare Tunnel changes are required**.

```
[ Public Users / Internet ]
              │
              ▼ (HTTPS / arcaai.com)
  [ Cloudflare Named Tunnel ] (10-cloudflared.yaml in K8s)
              │
              ▼
   [ Gateway Service: Port 9091 ] (07-gateway.yaml)
   ├── /               ──► admin-ui:80 (viditk03/haloform-admin-ui:latest)
   ├── /api/           ──► backend:8000 (Form Engine API)
   ├── /api/v1/rbac/   ──► rbac-service:8001
   ├── /api/v1/users/  ──► user-onboarding-service:8005
   ├── /api/v1/logs/   ──► logs-service:8004
   └── /auth/          ──► keycloak:8080 (OIDC Identity)
```

---

## 2. Docker Image Preparation & Push

The frontend UI is compiled inside `admin-ui`. The backend microservices run as lightweight containers.

### Step 2.1: Build & Push `admin-ui`
From the root of `form-creation`:
```bash
# 1. Build the unified admin-ui image
docker build -t viditk03/haloform-admin-ui:latest ./admin-ui

# 2. Push to Docker Hub
docker push viditk03/haloform-admin-ui:latest
```

### Step 2.2: Build & Push Microservices
From `/Users/apple/Desktop/AdminConsole-spark-steno`:
```bash
# RBAC Service (:8001)
docker build -t viditk03/halo-rbac-service:latest ./rbac-service
docker push viditk03/halo-rbac-service:latest

# User Onboarding Service (:8005)
docker build -t viditk03/halo-user-onboarding-service:latest ./user-onboarding-service
docker push viditk03/halo-user-onboarding-service:latest

# Logs Service (:8004)
docker build -t viditk03/halo-logs-service:latest ./logs-service
docker push viditk03/halo-logs-service:latest
```

---

## 3. Kubernetes Manifests

### Step 3.1: Add Microservices Manifest
Create `halo_k8s/11-admin-console-services.yaml` with the following contents:

```yaml
# ==============================================================================
# Halo Admin Console Microservices & Keycloak
# Namespace: haloform-prod
# ==============================================================================

apiVersion: v1
kind: Secret
metadata:
  name: halo-admin-secrets
  namespace: haloform-prod
type: Opaque
stringData:
  POSTGRES_DB: "halo_admin_db"
  POSTGRES_USER: "postgres"
  POSTGRES_PASSWORD: "Halo@123"
  DATABASE_URL: "postgresql+asyncpg://postgres:Halo@123@database:5432/halo_admin_db"
  JWT_SECRET_KEY: "your-super-secret-jwt-key-change-in-production"
  JWT_ALGORITHM: "HS256"
  KEYCLOAK_SERVER_URL: "http://keycloak:8080"
  KEYCLOAK_REALM: "arca-halo"
  KEYCLOAK_CLIENT_ID: "arca-halo"
  KEYCLOAK_CLIENT_SECRET: "ihdp5bhmgBsd1kWEYeyJxHeDrf7ln5ji"
---
# -------------------- 1. RBAC SERVICE (:8001) --------------------
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rbac-service
  namespace: haloform-prod
  labels:
    app: rbac-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: rbac-service
  template:
    metadata:
      labels:
        app: rbac-service
    spec:
      containers:
      - name: rbac-service
        image: viditk03/halo-rbac-service:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8001
        envFrom:
        - secretRef:
            name: halo-admin-secrets
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: rbac-service
  namespace: haloform-prod
spec:
  ports:
  - port: 8001
    targetPort: 8001
  selector:
    app: rbac-service
---
# ---------------- 2. USER ONBOARDING SERVICE (:8005) ----------------
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-onboarding-service
  namespace: haloform-prod
  labels:
    app: user-onboarding-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: user-onboarding-service
  template:
    metadata:
      labels:
        app: user-onboarding-service
    spec:
      containers:
      - name: user-onboarding-service
        image: viditk03/halo-user-onboarding-service:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8005
        envFrom:
        - secretRef:
            name: halo-admin-secrets
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: user-onboarding-service
  namespace: haloform-prod
spec:
  ports:
  - port: 8005
    targetPort: 8005
  selector:
    app: user-onboarding-service
---
# -------------------- 3. LOGS SERVICE (:8004) --------------------
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logs-service
  namespace: haloform-prod
  labels:
    app: logs-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: logs-service
  template:
    metadata:
      labels:
        app: logs-service
    spec:
      containers:
      - name: logs-service
        image: viditk03/halo-logs-service:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8004
        envFrom:
        - secretRef:
            name: halo-admin-secrets
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: logs-service
  namespace: haloform-prod
spec:
  ports:
  - port: 8004
    targetPort: 8004
  selector:
    app: logs-service
---
# -------------------- 4. KEYCLOAK OIDC (:8080) --------------------
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
  namespace: haloform-prod
  labels:
    app: keycloak
spec:
  replicas: 1
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      containers:
      - name: keycloak
        image: quay.io/keycloak/keycloak:24.0
        args: ["start-dev"]
        ports:
        - containerPort: 8080
        env:
        - name: KEYCLOAK_ADMIN
          value: "admin"
        - name: KEYCLOAK_ADMIN_PASSWORD
          value: "Password@123"
        - name: KC_HTTP_RELATIVE_PATH
          value: "/auth"
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak
  namespace: haloform-prod
spec:
  ports:
  - port: 8080
    targetPort: 8080
  selector:
    app: keycloak
```

---

### Step 3.2: Update Gateway Routing (`halo_k8s/07-gateway.yaml`)
In `halo_k8s/07-gateway.yaml`, edit the `server { listen 9091; ... }` block to add the 4 microservices routes:

```nginx
        # Admin Platform
        server {
            listen 9091;

            # Food API proxy
            location /api/food/ {
                proxy_pass http://food-api:8000/;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            }

            # Halo Form Backend API
            location /api/ {
                proxy_pass http://backend:8000/api/;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }

            # ─── HALO MICROSERVICES ROUTING ───
            location /api/v1/rbac/ {
                proxy_pass http://rbac-service:8001/;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }
            location /api/v1/users/ {
                proxy_pass http://user-onboarding-service:8005/;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }
            location /api/v1/logs/ {
                proxy_pass http://logs-service:8004/;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }
            location /auth/ {
                proxy_pass http://keycloak:8080/;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }

            # Frontend Catch-All
            location / {
                proxy_pass http://admin-ui:80/;
                proxy_set_header Host $host;
            }
        }
```

---

## 4. Deploying to the Kubernetes Cluster

Run the following commands on your cluster management machine (where `kubectl` is configured):

```bash
# 1. Deploy the Halo microservices & Keycloak
kubectl apply -f halo_k8s/11-admin-console-services.yaml

# 2. Update the Gateway ConfigMap
kubectl apply -f halo_k8s/07-gateway.yaml

# 3. Reload Gateway so Nginx takes the new proxy rules
kubectl rollout restart deployment/gateway -n haloform-prod

# 4. Reload admin-ui to fetch the updated image from Docker Hub
kubectl rollout restart deployment/admin-ui -n haloform-prod
```

### Verify Deployment Status
```bash
kubectl get pods -n haloform-prod
```
Ensure all pods show `Running` status:
- `admin-ui` (2/2)
- `gateway` (1/1)
- `cloudflared` (2/2)
- `rbac-service` (1/1)
- `user-onboarding-service` (1/1)
- `logs-service` (1/1)
- `keycloak` (1/1)

---

## 5. End-to-End Verification

1. **Access Portal:** Open `https://<your-subdomain>.arcaai.com/admin/login`
2. **Login:** Sign in with `vidit@arcaai.com` / `vidit6688` (or use a role preset).
3. **Switch Views:** Use the top Swiss header to toggle between:
   - **Clinical Studies:** Form Craft & Study Registry (`/`)
   - **Admin Console:** Halo Platform Administration (`/console`)
4. **Test Submodules:**
   - **User Onboarding:** Click *"+ Onboard Clinician"*, verify Keycloak auto-provisioning and credential copy banner.
   - **RBAC Matrix:** Verify IISc 5-tier role hierarchy and module permissions.
   - **System Logs:** Verify live stream streaming from `logs-service:8004`.

