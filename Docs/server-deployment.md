1. Deploying the Backend (Crucial: Needs Storage)
This is the most important one because it requires a Persistent Volume (PVC) so your SQLite database isn't deleted when the server restarts.

Workload Type: Deployment (Stateless app with rolling updates)
Name: halo-backend
Namespace: default
Image: viditk03/halo-backend:latest
Replicas: 1 (Important: Must be 1 so the SQLite file doesn't get locked by multiple servers)
Container Port: 8000
Command / Args: (Leave completely blank, the Dockerfile handles this)
Environment Variables:
Add a new variable -> Name: DATABASE_URL | Value: sqlite:////app/data/forms.db
Resources: The defaults shown (100m/128Mi) are perfect.
Persistent Storage -> Enable PVC: YES (Check this box!)
Volume Mounts: Add a mount. Set the Mount Path inside the container to: /app/data
(If it asks for size, 5Gi or 10Gi is plenty).
2. Deploying the Patient UI
This is a standard, lightweight web server.

Workload Type: Deployment
Name: halo-patient-ui
Namespace: default
Image: viditk03/halo-patient-ui:latest
Replicas: 2 (You can safely run multiple copies of the frontend!)
Container Port: 80 (NGINX runs on port 80)
Command / Args: (Leave completely blank)
Environment Variables: (Leave blank. The API URL was baked into the code when you ran docker build!)
Persistent Storage -> Enable PVC: NO (Leave unchecked, it's just static files).
3. Deploying the Admin UI
Exactly the same process as the Patient UI.

Workload Type: Deployment
Name: halo-admin-ui
Namespace: default
Image: viditk03/halo-admin-ui:latest
Replicas: 1 or 2
Container Port: 80
Persistent Storage -> Enable PVC: NO

---

### 4. Create Services (Internal Networking)
Before the outside world can reach your pods, Kubernetes needs to know how to route traffic to them internally. In many dashboards, a "Service" is automatically created when you define a Container Port, but if not, go to the **"Services"** tab and create three `ClusterIP` services:

* **Backend Service:**
  * Name: `halo-backend-svc`
  * Target Workload: `halo-backend`
  * Port Mapping: Listen on `8000` ➡️ Target Port `8000`
* **Patient UI Service:**
  * Name: `halo-patient-ui-svc`
  * Target Workload: `halo-patient-ui`
  * Port Mapping: Listen on `80` ➡️ Target Port `80`
* **Admin UI Service:**
  * Name: `halo-admin-ui-svc`
  * Target Workload: `halo-admin-ui`
  * Port Mapping: Listen on `80` ➡️ Target Port `80`

---

### 5. Create the Ingress (External Public Access)
The "Ingress" acts as the front door to your cluster. It looks at the URL the user typed in (e.g., `admin.your-hospital.com`) and routes them to the correct Service.

Go to your dashboard's **"Ingresses"** or **"Load Balancing"** section and create a new Ingress:

* **Name:** `halo-ingress`
* **Routing Rules:**
  1. **API Rule:** 
     * Request Host: `api.your-office.com`
     * Path: `/` (Prefix) ➡️ Target Service: `halo-backend-svc` (Port: `8000`)
  2. **Patient Rule:**
     * Request Host: `patient.your-office.com`
     * Path: `/` (Prefix) ➡️ Target Service: `halo-patient-ui-svc` (Port: `80`)
  3. **Admin Rule:**
     * Request Host: `admin.your-office.com`
     * Path: `/` (Prefix) ➡️ Target Service: `halo-admin-ui-svc` (Port: `80`)

* **SSL / Certificates (CRITICAL):** 
  * Under the "Certificates" or "TLS" tab on the Ingress, you MUST select a valid SSL certificate for your domains. If you don't serve the Patient UI over `https://`, the browser will block the offline Service Worker and the app won't work in the field!
