# HaloFormCraft — Dynamic Form Platform

A multi-centre clinical data collection platform with an Admin UI (form builder) and Patient UI (form intake).

---

## Project Structure

```
form-creation/
├── backend/          # FastAPI backend (Python)
├── admin-ui/         # Admin panel (React + Vite)
├── patient-ui/       # Patient intake UI (React + Vite)
├── gateway/          # Nginx reverse proxy config
└── docker-compose.yml
```

---

## Option 1 — Run Locally (Development)

> Best for active development. Changes reflect instantly via hot reload.
> Uses the local **SQLite** database (`backend/forms.db`) — no PostgreSQL needed.

> ⚠️ If port 8000 is already in use by another project, stop that process first or change the port below.

Open **3 separate terminals**:

### Terminal 1 — Backend

```bash
cd /Users/apple/Desktop/form-creation/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API runs at: http://localhost:8000/api

### Terminal 2 — Admin UI

```bash
cd /Users/apple/Desktop/form-creation/admin-ui
npm run dev
```

Admin UI runs at: http://localhost:5173

### Terminal 3 — Patient UI

```bash
cd /Users/apple/Desktop/form-creation/patient-ui
npm run dev
```

Patient UI runs at: http://localhost:5174

---

## Option 2 — Docker Compose (Single Command)

> Best for testing the production build locally.

```bash
cd /Users/apple/Desktop/form-creation
docker-compose up --build
```

| Service     | URL                    |
|-------------|------------------------|
| Gateway     | http://localhost:9090  |
| Admin UI    | http://localhost:9090/admin/ |
| Patient UI  | http://localhost:9090/ |
| Backend API | http://localhost:9090/api/  |

To stop:
```bash
docker-compose down
```

---

## Option 3 — Expose to Client via Cloudflare Tunnel

> Share a public URL with your client without deploying to Azure.

**Step 1 — Install cloudflared (once):**
```bash
brew install cloudflared
```

**Step 2 — Start Docker Compose:**
```bash
cd /Users/apple/Desktop/form-creation
docker-compose up --build
```

**Step 3 — Expose via Cloudflare (new terminal):**
```bash
cloudflared tunnel --url http://localhost:9090
```

You'll get a public URL like `https://xyz.trycloudflare.com`. Share with your client:

| Who          | URL                                      |
|--------------|------------------------------------------|
| Patient      | https://xyz.trycloudflare.com/           |
| Admin        | https://xyz.trycloudflare.com/admin/     |
| API          | https://xyz.trycloudflare.com/api/       |

---

## Option 4 — Deploy to Azure

### Build & Push Images

```bash
# Backend
docker build --platform linux/amd64 -t tejomayaagents.azurecr.io/backend:v<N> ./backend
docker push tejomayaagents.azurecr.io/backend:v<N>

# Admin UI
docker build --platform linux/amd64 \
  --build-arg VITE_API_URL=https://backend.politesmoke-14d8ddb2.eastus.azurecontainerapps.io/api \
  -t tejomayaagents.azurecr.io/admin-ui:v<N> ./admin-ui
docker push tejomayaagents.azurecr.io/admin-ui:v<N>

# Patient UI
docker build --platform linux/amd64 \
  --build-arg VITE_API_URL=https://backend.politesmoke-14d8ddb2.eastus.azurecontainerapps.io/api \
  -t tejomayaagents.azurecr.io/patient-ui:v<N> ./patient-ui
docker push tejomayaagents.azurecr.io/patient-ui:v<N>
```

### Deploy Container Apps

```bash
# Backend (with PostgreSQL)
az containerapp update --name backend --resource-group Tejomaya \
  --image tejomayaagents.azurecr.io/backend:v<N> \
  --set-env-vars DATABASE_URL="postgresql://Adminuser:<PASSWORD>@tejomaya-db.postgres.database.azure.com/formsdb?sslmode=require"

# Admin UI
az containerapp update --name admin-ui --resource-group Tejomaya \
  --image tejomayaagents.azurecr.io/admin-ui:v<N>

# Patient UI
az containerapp update --name patient-ui --resource-group Tejomaya \
  --image tejomayaagents.azurecr.io/patient-ui:v<N>
```

---

## Live Azure URLs

| Service     | URL |
|-------------|-----|
| Admin UI    | https://admin-ui--0000008.politesmoke-14d8ddb2.eastus.azurecontainerapps.io |
| Backend API | https://backend.politesmoke-14d8ddb2.eastus.azurecontainerapps.io/api |

---

## Notes

- Local dev uses **SQLite** (`backend/forms.db`) — data is separate from Azure PostgreSQL
- Always use the **stable backend URL** (without `--0000X` revision suffix) in build args to avoid rebuilding after every backend deploy
- The `scoreThresholds` fix script is at `fix_thresholds.py` — run with `python3 fix_thresholds.py` if threshold badges stop showing on patient UI
