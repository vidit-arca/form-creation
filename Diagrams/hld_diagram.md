# HaloFormCraft High-Level Design (HLD)

This diagram outlines the high-level architecture of the HaloFormCraft system, highlighting the separation of concerns between the Admin and Patient portals, as well as the offline-first data flow of the Patient PWA.

```mermaid
graph TD
    classDef admin fill:#e2e8f0,stroke:#64748b,stroke-width:2px,color:#0f172a;
    classDef patient fill:#ccfbf1,stroke:#0f766e,stroke-width:2px,color:#042f2e;
    classDef offline fill:#fef3c7,stroke:#b45309,stroke-width:2px,color:#78350f,stroke-dasharray: 5 5;
    classDef backend fill:#e0e7ff,stroke:#4338ca,stroke-width:2px,color:#1e1b4b;
    classDef db fill:#f3e8ff,stroke:#7e22ce,stroke-width:2px,color:#3b0764;

    subgraph ClientEnvironments["Client Environments"]
        AdminUI["Admin UI (React SPA)"]:::admin
        
        subgraph PatientUI["Patient UI (React PWA)"]
            PatientApp["Patient Portal App"]:::patient
            
            subgraph OfflineStorage["Offline Storage (localforage)"]
                Drafts[("Saved Drafts")]:::offline
                FormsCache[("Cached Forms")]:::offline
                SyncQ[("Sync Queue")]:::offline
            end
            
            SW["Service Worker (Workbox)"]:::offline
        end
    end

    subgraph ServerEnvironment["Server Environment"]
        API["Backend API (REST)"]:::backend
        DB[("Primary Database")]:::db
    end

    AdminUI <-->|"Manage Forms and View Submissions"| API

    PatientApp <-->|"Fetch Forms and Sync Data"| API
    
    PatientApp -->|"Save in-progress"| Drafts
    PatientApp <-->|"Read available forms"| FormsCache
    PatientApp -->|"Submit while offline"| SyncQ
    SW <-->|"Cache app assets for offline load"| PatientApp

    SyncQ -->|"Auto-sync when Online (useNetworkStatus)"| API

    API <-->|"Read and Write"| DB
```

### Key Components

> [!NOTE]
> **Admin UI (Standard SPA)**: A traditional React single-page application used by hospital staff on stable connections to create forms, manage templates, and review submitted patient data.

> [!TIP]
> **Patient UI (PWA)**: A Progressive Web App designed for reliability. It uses a Service Worker to cache the application shell and assets, allowing the app to load without an internet connection.

> [!IMPORTANT]
> **Offline Storage Strategy**: 
> - **Forms Cache**: Downloaded forms are stored locally so they can be rendered offline.
> - **Saved Drafts**: Patients can save partially completed forms locally.
> - **Sync Queue**: Completed forms submitted while offline are stored here until the `'online'` event is triggered, at which point `syncQueue.js` automatically pushes them to the backend API.
