# 24-Hour Dietary Recall Field Integration & Architecture Guide

This document outlines the architecture, API integration, and implementation specifications for adding the **24-Hour Dietary Recall Field** into the HALO Form Platform. It bridges natural language patient intake with the **Anuvaad / Svasthyam Food Dataset** (`matchFoodItem` Cloud Function).

---

## 1. Overview & Objectives

The 24-Hour Dietary Recall field is a specialized dynamic form component designed for clinical and nutritional assessments. It allows patients to record dietary intake across standard meal slots using natural language (or item search), which is automatically matched against the **Anuvaad Food Index** via AI vector embeddings.

### Key Capabilities:

- **Admin UI (Form Builder):** Enables form creators to drag-and-drop the 24-Hour Dietary Recall field and configure active meal slots (*Breakfast, Lunch, Dinner, etc.*).
- **Patient UI (Intake Form):** Provides an intuitive multi-meal interface with real-time Svasthyam AI food matching (`matchFoodItem`).
- **Anuvaad Standardization:** Maps natural language (e.g., *"2 rotis and 1 bowl dal"*) into structured Anuvaad food items, quantities, portion units, and vector similarity scores.
- **Offline Resiliency:** Queues raw text and structured matches in IndexedDB when offline, syncing automatically upon reconnection.

---

## 2. System Architecture & Flow

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                          1. ADMIN UI (Form Builder)                       │
│  - Adds "24-Hour Dietary Recall" field to a form.                        │
│  - Configures meal slots (Breakfast, Lunch, Dinner, Evening Snacks).     │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ Form Configuration JSON
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         2. PATIENT UI (Form Renderer)                    │
│  - Patient inputs meal description per slot.                             │
│  - Invokes Svasthyam API (`matchFoodItem`).                              │
│  - Renders verified Anuvaad food item cards for patient confirmation.    │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ Structured Submission JSON
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      3. BACKEND & OFFLINE SYNC                            │
│  - Stores raw text + Anuvaad matched items in PostgreSQL.                │
│  - Offline queue via IndexedDB (`syncQueue.js`).                         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Svasthyam API Endpoint Specifications

The field integrates directly with the **Svasthyam Cloud Functions** (`asia-south1` region).

### Primary Endpoint: `matchFoodItem` (CALLABLE)

- **URL:** `https://asia-south1-svasthyam-d24c4.cloudfunctions.net/matchFoodItem`
- **Protocol:** HTTP POST (Callable envelope: wrapped in `data` object)
- **Description:** Extracts food items from a natural language sentence, embeds each using `gemini-embedding-001`, and returns closest matches from the Anuvaad diet index.

#### Request Format:

```json
{
  "data": {
    "description": "I had two idlis and a cup of coffee for breakfast"
  }
}
```

#### Response Format:

```json
{
  "result": {
    "matches": [
      {
        "foodItem": "Idli",
        "matchedItemId": "ANUVAAD_IDLI_01",
        "quantity": 2,
        "similarityScore": 0.94
      },
      {
        "foodItem": "Coffee",
        "matchedItemId": "ANUVAAD_COFFEE_02",
        "quantity": 1,
        "similarityScore": 0.91
      }
    ]
  }
}
```

---

## 4. Component Implementation Specifications

### A. Admin UI (`admin-ui/src/pages/FormBuilder.jsx`)

- **Field Type Identifier:** `dietary_recall_24h`
- **Config Properties:**
  - `mealSlots` (Array): Configurable list of active meal times (Default: `["Early Morning", "Breakfast", "Mid-Morning", "Lunch", "Evening Snack", "Dinner", "Bedtime"]`).
  - `allowCustomItems` (Boolean): Allows patients to manually add items if AI match is missing.

### B. Patient UI Component (`patient-ui/src/components/DietaryRecallField.jsx`)

- **Interactive UI Structure:**
  - **Meal Slot Accordion/Tabs:** Groups inputs by meal timing.
  - **Natural Input Box:** Text field for typing meal items.
  - **"Match Anuvaad Items" Button:** Triggers API call.
  - **Item Review Table:** Displays matched food item, quantity modifier, portion unit, and remove/confirm controls.

### C. API Service Layer (`patient-ui/src/services/svasthyamApi.js`)

```javascript
export const matchFoodItem = async (description) => {
  try {
    const response = await fetch(
      "https://asia-south1-svasthyam-d24c4.cloudfunctions.net/matchFoodItem",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { description } }),
      }
    );
    const data = await response.json();
    return data.result?.matches || [];
  } catch (error) {
    console.error("Failed to match food items:", error);
    return [];
  }
};
```

---

## 5. Data Schemas

### 1. Form Definition Schema (Stored in PostgreSQL `forms.schema`)

```json
{
  "id": "dietary_recall_field_1",
  "type": "dietary_recall_24h",
  "label": "24-Hour Dietary Recall Assessment",
  "required": true,
  "config": {
    "mealSlots": ["Breakfast", "Lunch", "Evening Snack", "Dinner"],
    "allowCustomItems": true
  }
}
```

### 2. Patient Form Submission Payload (Stored in `submissions.data`)

```json
{
  "dietary_recall_field_1": {
    "meals": [
      {
        "meal_type": "Breakfast",
        "raw_description": "2 rotis and 1 bowl yellow dal",
        "matched_items": [
          {
            "matchedItemId": "ANUVAAD_ROTI_01",
            "foodItem": "Whole Wheat Roti",
            "quantity": 2,
            "portion_unit": "pieces",
            "similarityScore": 0.95
          },
          {
            "matchedItemId": "ANUVAAD_DAL_02",
            "foodItem": "Yellow Dal (Moong/Arhar)",
            "quantity": 1,
            "portion_unit": "bowl",
            "similarityScore": 0.92
          }
        ]
      }
    ]
  }
}
```

---

## 6. Pre-Launch Verification Checklist

1. **Vertex AI Index Vector Space Refresh:** Ensure `updateEmbeddingForDietChartConfig` and `exportDietItemEmbeddingsToGCS` endpoints are triggered by backend/data team so vector scores correspond accurately to `gemini-embedding-001`.
2. **Offline Fallback Testing:** Verify that when patients complete dietary logs offline, raw descriptions and offline selections are safely stored in IndexedDB (`syncQueue.js`) and submitted seamlessly upon network restoration.
