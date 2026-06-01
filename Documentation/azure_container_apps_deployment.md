# Azure Container Apps (ACA) Deployment Guide

To successfully deploy this on Azure Container Apps (ACA) and ensure the frontends can communicate with the backend, we need to handle two main challenges:

1. **The API URL Chicken-and-Egg Problem**: Your React apps need the Backend URL at build time, but you won't know the Backend URL until it's deployed.
2. **The SQLite Database**: Container apps are stateless, meaning if the backend container restarts, your local SQLite database will be wiped out unless we mount a persistent volume.

Here is the step-by-step approach to solve both problems and deploy successfully:

## Phase 1: Set up the Infrastructure

- **Create an Azure Container Registry (ACR)**: This is where you will store your Docker images in the cloud.
- **Create an Azure Storage Account & File Share**: This will act as the cloud equivalent of your local `./backend_data` folder to keep your SQLite database safe.

## Phase 2: Deploy the Backend First (To get the URL)

We must deploy the backend first so Azure can generate the secure HTTPS URL for it.

**1. Build and Push the Backend Image:**
```bash
docker build -t <your-acr-name>.azurecr.io/backend:latest ./backend
docker push <your-acr-name>.azurecr.io/backend:latest
```

**2. Create the Backend Container App:**
- Deploy the image to ACA.
- Mount the Azure File Share to `/app/data` in the container.
- Set the ingress to **External** on port `8000`.

**3. Get the URL:** 
Azure will give you a URL like: `https://backend-app.nice-domain.eastus.azurecontainerapps.io`

## Phase 3: Build and Deploy the Frontends

Now that we have the exact Backend URL, we can inject it into the UIs during the build process.

**1. Build the Frontends with the new URL:**

```bash
# Build Admin UI
docker build \
  --build-arg VITE_API_URL=https://backend-app.nice-domain.eastus.azurecontainerapps.io/api \
  -t <your-acr-name>.azurecr.io/admin-ui:latest ./admin-ui
  
# Build Patient UI
docker build \
  --build-arg VITE_API_URL=https://backend-app.nice-domain.eastus.azurecontainerapps.io/api \
  -t <your-acr-name>.azurecr.io/patient-ui:latest ./patient-ui
```

**2. Push the Frontend Images:**
```bash
docker push <your-acr-name>.azurecr.io/admin-ui:latest
docker push <your-acr-name>.azurecr.io/patient-ui:latest
```

**3. Create the Frontend Container Apps:**
- Deploy both images to ACA.
- Set the ingress to **External** on port `80` for both.

---

## Alternative (Advanced) Approach: Runtime Environment Variables

If you don't want to rely on a 2-step deployment, we would need to change your frontend Dockerfiles and code to use a script (like `env.js`) that injects the backend URL dynamically when the NGINX server starts, rather than baking it in at build time.
