# HALO Platform - Local Kubernetes Deployment Workflow

## Overview

This document outlines the standard deployment workflow for the HALO Platform (HaloFormCraft & HaloHealthForms) to a **local Kubernetes cluster**. It strictly adheres to the standard Kubernetes Application Deployment Workflow (Namespace -> Image Build -> Yaml Apply -> Service/Ingress exposure).

---

## 1. Prerequisites

Before beginning the deployment, the DevOps engineer must ensure the following are available on the local deployment server:

- **Docker Engine** (for building local images)
- **Kubernetes Cluster** (e.g., Minikube, k3s, Docker Desktop, or local bare-metal cluster)
- **kubectl** configured to point to the local cluster (`kubectl cluster-info`)

---

## 2. Deployment Workflow

### Step 1: Create Namespace

We logically isolate the HALO resources into the `haloform-prod` namespace.

```bash
# Apply the namespace YAML
kubectl apply -f k8s/01-haloform-prod.yaml

# Alternatively, manually create:
# kubectl create namespace haloform-prod
```

### Step 2 & 3: Build, Push, & Update Docker Images

The Kubernetes deployment YAMLs in `halo_k8s` use `imagePullPolicy: Always` with the `viditk03/` image prefix.

Run these commands from the root directory (`/Users/apple/Desktop/form-creation`):

```bash
# 1. Build & Push Admin UI
docker build -t viditk03/haloform-admin-ui:latest --build-arg VITE_API_URL=/api ./admin-ui
docker push viditk03/haloform-admin-ui:latest
kubectl rollout restart deployment admin-ui -n haloform-prod

# 2. Build & Push Patient UI
docker build -t viditk03/haloform-patient-ui:latest --build-arg VITE_API_URL=/api ./patient-ui
docker push viditk03/haloform-patient-ui:latest
kubectl rollout restart deployment patient-ui -n haloform-prod

# 3. Build & Push Backend API
docker build -t viditk03/haloform-backend:latest ./backend
docker push viditk03/haloform-backend:latest
kubectl rollout restart deployment backend -n haloform-prod
```

### Step 4 & 5: Apply Kubernetes Configurations & Deployments

With images built, apply the configuration files sequentially. This provisions the ConfigMaps, Secrets, PostgreSQL Database (via StatefulSet/Deployment), the Backend API, both UIs, and the Nginx Gateway.

```bash
cd k8s

# 1. Apply configurations and secrets
kubectl apply -f 02-config-and-secrets.yaml

# 2. Deploy PostgreSQL Database
kubectl apply -f 03-database.yaml

# 3. Deploy Backend API
kubectl apply -f 04-backend.yaml

# 4. Deploy Patient UI
kubectl apply -f 05-patient-ui.yaml

# 5. Deploy Admin UI
kubectl apply -f 06-admin-ui.yaml

# 6. Deploy Nginx Gateway
kubectl apply -f 07-gateway.yaml
```

### Step 6: Verification

Verify that all pods have spun up correctly, are in a `Running` state, and that the services are attached properly.

```bash
kubectl get all -n haloform-prod -o wide
```

*Troubleshooting Tip:* If a pod is in `ErrImagePull` or `ImagePullBackOff`, it means the Kubernetes worker node cannot find the `latest` image we built in Step 2. Verify image build locations.

---

## 3. Architecture & Access Routing (Steps 7 & 8 & 10)

Instead of a traditional Ingress Controller, this local deployment utilizes a **Gateway Service (Nginx)** acting as a reverse proxy, exposed via a `NodePort`.

### Traffic Flow:

`Browser → NodePort (30080) → Gateway (Nginx Pod) → Internal Service (Backend/Admin/Patient) → Application Pod`

### Accessing the Platform

The Gateway is exposed on NodePort **30080**. You can access the platform locally using the IP address of your local Kubernetes node:

- **Patient Portal:** `http://<CLUSTER_NODE_IP>:30080/`
- **Admin Portal:** `http://<CLUSTER_NODE_IP>:30080/admin/`
- **Backend API:** `http://<CLUSTER_NODE_IP>:30080/api/`

*(If running locally via Docker Desktop/Minikube, you can likely substitute `<CLUSTER_NODE_IP>` with `localhost`)*

---

### 4. External Client Access (The Cloudflare Tunnel Way)

If your local server is behind a strict corporate firewall, does not have a public IP, or you simply want to provide a secure `https://` URL to an external client without configuring router port-forwarding, **Cloudflare Tunnels** are the highly recommended & free approach.

1. Ensure `cloudflared` is installed on the local server.
2. Run the following command to tunnel the NodePort traffic securely to the internet:

```bash
cloudflared tunnel --url http://localhost:30080
```

This will instantly generate a secure, public HTTPS link (e.g., `https://random-words.trycloudflare.com`) that routes directly to your NodePort. You can confidently share this link with external clients for secure remote access.

---

### 5. Troubleshooting & Complete Guide
For detailed debugging of CORS issues, Gateway architecture, background `nohup` tunnels, and database user seeding, see our full guide:
👉 **[Kubernetes & Cloudflare Tunnel Troubleshooting Guide](file:///Users/apple/Desktop/form-creation/Documentation/K8-deployment/K8s_Cloudflare_Troubleshooting_and_Access_Guide.md)**
