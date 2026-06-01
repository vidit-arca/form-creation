# Azure Container Apps Deployment Guide

This guide details the process of deploying the `form-creation` application to Azure Container Apps (ACA). 

> [!NOTE]
> The application consists of a Python backend, an Admin UI (React/Vite), and a Patient UI (React/Vite). Because Vite bakes environment variables into static assets at build time, we must follow a specific deployment order to ensure the UIs can communicate with the backend.

## Prerequisites
- **Azure CLI** installed and authenticated (`az login`)
- **Docker** installed and running locally
- An active **Azure Subscription**

---

## 1. Infrastructure Setup

First, we need to create the foundational Azure resources.

```bash
# Define your variables
RESOURCE_GROUP="form-creation-rg"
LOCATION="eastus"
ACR_NAME="formcreationacr$RANDOM" # Must be globally unique and lowercase
ENV_NAME="form-creation-env"
STORAGE_ACCOUNT="formstorage$RANDOM"
SHARE_NAME="backend-data"

# Create Resource Group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Container Registry (ACR)
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Create Azure Container Apps Environment
az containerapp env create --name $ENV_NAME --resource-group $RESOURCE_GROUP --location $LOCATION

# Create Storage Account for SQLite database persistence
az storage account create --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --location $LOCATION --sku Standard_LRS
az storage share create --name $SHARE_NAME --account-name $STORAGE_ACCOUNT

# Link Storage to the Container Apps Environment
STORAGE_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP --account-name $STORAGE_ACCOUNT --query "[0].value" -o tsv)
az containerapp env storage set --access-mode ReadWrite --azure-file-account-name $STORAGE_ACCOUNT --azure-file-account-key $STORAGE_KEY --azure-file-share-name $SHARE_NAME --storage-name my-azure-files --name $ENV_NAME --resource-group $RESOURCE_GROUP
```

---

## 2. Deploy the Backend

We deploy the backend first to generate the public URL that the frontends require.

> [!IMPORTANT]  
> Container apps are stateless. Mounting the Azure File share is critical to prevent your `forms.db` SQLite database from being erased whenever the container restarts.

```bash
# Log in to your ACR
az acr login --name $ACR_NAME

# Build and Push Backend Image
docker build -t $ACR_NAME.azurecr.io/backend:latest ./backend
docker push $ACR_NAME.azurecr.io/backend:latest

# Create Backend Container App
az containerapp create \
  --name backend \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $ACR_NAME.azurecr.io/backend:latest \
  --target-port 8000 \
  --ingress external \
  --registry-server $ACR_NAME.azurecr.io \
  --env-vars DATABASE_URL="sqlite:////app/data/forms.db" \
  --system-assigned

# Get the generated Backend URL
BACKEND_URL=$(az containerapp show --name backend --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv)
echo "Backend is running at: https://$BACKEND_URL"
```

---

## 3. Build & Deploy the UIs

Now that we have the Backend URL, we pass it into the Docker build process for both UIs so Vite can bake the URL into the production assets.

### Admin UI

```bash
# Build with the backend URL injected
docker build \
  --build-arg VITE_API_URL=https://$BACKEND_URL/api \
  -t $ACR_NAME.azurecr.io/admin-ui:latest ./admin-ui

# Push to ACR
docker push $ACR_NAME.azurecr.io/admin-ui:latest

# Deploy Admin UI Container App
az containerapp create \
  --name admin-ui \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $ACR_NAME.azurecr.io/admin-ui:latest \
  --target-port 80 \
  --ingress external \
  --registry-server $ACR_NAME.azurecr.io
```

### Patient UI

```bash
# Build with the backend URL injected
docker build \
  --build-arg VITE_API_URL=https://$BACKEND_URL/api \
  -t $ACR_NAME.azurecr.io/patient-ui:latest ./patient-ui

# Push to ACR
docker push $ACR_NAME.azurecr.io/patient-ui:latest

# Deploy Patient UI Container App
az containerapp create \
  --name patient-ui \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $ACR_NAME.azurecr.io/patient-ui:latest \
  --target-port 80 \
  --ingress external \
  --registry-server $ACR_NAME.azurecr.io
```

---

## 4. Verification

To verify the deployment:
1. Run `az containerapp show --name admin-ui --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn` to get the Admin URL.
2. Run `az containerapp show --name patient-ui --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn` to get the Patient URL.
3. Open these URLs in your browser. They should load over HTTPS, and any form actions should successfully route to the containerized backend.
