# User Guide Module — Halo Admin App

## Overview

A lightweight, fully embedded user guide system that helps admins understand how to use the platform without ever leaving the app. No third-party tools. Built entirely in React.

The module has **3 layers** that work together:

---

## Layer 1 — Onboarding Tour (First-time users)

### What it is
An interactive step-by-step walkthrough that appears **automatically on first login**. It highlights specific UI elements one at a time with a spotlight overlay and a tooltip card explaining what each element does.

### How it works
- On first visit, a welcome modal appears: *"Welcome to Halo! Want a quick 2-minute tour?"*
- User clicks **"Start Tour"** → a dark overlay covers the screen, a glowing highlight ring appears around the first element, and a tooltip card floats next to it.
- User clicks **"Next →"** to move to the next step.
- Progress indicator at the bottom: `Step 2 of 8`.
- They can **Skip** at any time. Tour state is saved in `localStorage` so it never re-appears.

### Tour Steps (suggested)
| Step | Element Highlighted | Tooltip Text |
|---|---|---|
| 1 | Project List page | "Projects are the top-level containers. Each project groups forms and hospitals together." |
| 2 | "+ New Project" button | "Click here to create a new research project or study." |
| 3 | Project card | "Click a project to open its dashboard, where you manage all its forms and sites." |
| 4 | Form Builder sidebar (Toolbox) | "Drag fields from this panel to build your form. Use the search bar or press '/' to find a field." |
| 5 | Settings Panel | "Click any field on the canvas to configure it — labels, options, scoring, validation, and conditional logic." |
| 6 | Conditional Logic section | "Use this to show or hide fields based on a patient's previous answers." |
| 7 | Publish button | "When your form is ready, publish it to make it live for patients." |
| 8 | Hospital Manager | "Add hospitals/sites to a project so form submissions get tagged with their source location." |

### Visual Design
- **Overlay**: Semi-transparent dark backdrop (`rgba(0,0,0,0.65)`) with a cutout spotlight around the highlighted element using `box-shadow`.
- **Tooltip card**: White card with a purple gradient header, arrow pointing at the element. Contains title, description, step counter, and Prev/Next/Skip buttons.
- **Highlight ring**: Animated pulsing purple ring around the target element.

---

## Layer 2 — Help Center Panel (Always accessible)

### What it is
A **floating "?" button** fixed to the bottom-right corner of every page. Clicking it opens a slide-in panel from the right with categorized help articles.

### How it looks
- **Trigger**: A purple circular button with a `?` icon, always visible bottom-right.
- **Panel**: Slides in from the right (360px wide). Has a search bar at the top, then categories with expandable accordion sections below.

### Content Categories
```
📁 Getting Started
  ├─ What is a Project?
  ├─ Creating your first form
  └─ Publishing a form

📁 Form Builder
  ├─ Available field types
  ├─ How to use Conditional Logic
  ├─ How to set up Scoring
  ├─ How to use Custom Formulas
  └─ What is the "Other" text box feature?

📁 Medical Calculators
  ├─ Building the HSI (Smoking Index)
  ├─ Building the PHQ-9
  └─ Setting up Score Thresholds & Badges

📁 Projects & Hospitals
  ├─ Creating a Project
  ├─ Adding Hospitals/Sites
  └─ Linking forms to a project

📁 Patient & Responses
  ├─ How patients access forms
  ├─ Viewing and exporting responses
  └─ Understanding submission data
```

### Bonus: Restart Tour button
At the bottom of the Help panel: **"Take the App Tour again →"** which re-launches the onboarding tour.

---

## Layer 3 — Contextual Tooltips (In-place hints)

### What it is
Small `ℹ` icons next to confusing fields/settings in the Form Builder's Settings Panel. Hovering over them shows a small tooltip bubble explaining that specific setting.

### Where they appear
| Location | Tooltip Text |
|---|---|
| "Variable Name" field | "Used in formulas and data exports. Auto-generated from the label but can be customised." |
| "Enable Scoring" toggle | "Assign numeric scores to each option. Used with the Calculated Score field." |
| "Custom Formula" box | "Write math using [variable_name] syntax. Supports + - * / and ternary operators (? :)." |
| "Cohort ID" field settings | "Links this field to Age and Gender fields to validate the correct cohort prefix." |
| Logic Action dropdown | "Show = field is hidden by default and appears when condition is met. Hide = opposite." |

---

## Open Questions

> [!IMPORTANT]
> **Q1: Where should the Help Center articles live?**
> - **Option A (Static):** Articles are hardcoded in the React component as JSX. Simple, no backend needed.
> - **Option B (Dynamic):** Articles stored in the database or a JSON file so non-technical admins can update them without code changes.
>
> **Recommendation:** Start with Option A (static JSX) for speed, can migrate to dynamic later.

> [!IMPORTANT]
> **Q2: Should the tour auto-play on first login?**
> - Yes → Use `localStorage.getItem('halo_tour_completed')` to check if tour was seen before.
> - No → Always manual via the Help Center "?" button.

> [!NOTE]
> **Q3: Should contextual tooltips appear everywhere or only in the Form Builder?**
> They are most useful in the Form Builder settings panel. We can limit scope to there for v1.

---

## Proposed Changes

### New Files
#### [NEW] `admin-ui/src/components/guide/TourOverlay.jsx`
The interactive spotlight tour component. Manages step state, highlight positioning, and overlay rendering.

#### [NEW] `admin-ui/src/components/guide/HelpPanel.jsx`
The slide-in Help Center panel with search and accordion article categories.

#### [NEW] `admin-ui/src/components/guide/HelpButton.jsx`
The floating `?` trigger button. Rendered globally.

#### [NEW] `admin-ui/src/components/guide/Tooltip.jsx`
Reusable `ℹ` icon + hover tooltip bubble for in-place hints.

#### [NEW] `admin-ui/src/constants/tourSteps.js`
Array of step configs: `{ targetId, title, description, placement }` — one per tour step.

#### [NEW] `admin-ui/src/constants/helpArticles.js`
Nested array of help article categories and their content.

---

### Modified Files
#### [MODIFY] `admin-ui/src/App.jsx`
Add `<HelpButton />` and `<TourOverlay />` globally so they appear on every page.

#### [MODIFY] `admin-ui/src/components/builder/SettingsPanel.jsx`
Sprinkle `<Tooltip>` components next to confusing settings (Variable Name, Enable Scoring, Formula, etc.)

---

## Verification Plan

### Manual Verification
1. First visit → tour welcome modal appears automatically.
2. Tour highlights each element correctly, overlay follows navigation.
3. "Skip" closes the tour and it doesn't re-appear on refresh.
4. "?" button is visible on all pages and opens the Help panel.
5. Help panel search filters articles correctly.
6. "Restart Tour" from Help panel re-launches the tour.
7. Hovering `ℹ` icons in the Form Builder shows the correct tooltip text.
