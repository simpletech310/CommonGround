# CommonGround: Master Design Specification

> **Status:** Draft  
> **Date:** January 4, 2026  
> **Author:** Antigravity (Frontend Design Expert)  
> **Vision:** A "Co-Parenting Operating System" that reduces conflict through structure.

---

# 1. GLOBAL APP STRATEGY
*The overarching identity that governs the entire platform.*

## Core Context
*   **What is this?** A high-fidelity "Operating System" for separated families. It is a calm, neutral infrastructure (Dashboard + Ledger + Guardian).
*   **Primary Goal:** To preserve child well-being by removing friction. It shifts the focus from "winning the argument" to "raising the child."
*   **Audience:** Divorced/Separated Parents (High stress, low trust) & Family Law Professionals (Need facts, not noise).

## Brand & Identity
*   **Personality:** The "Calm Mediator." Protective, Neutral, Structured, Unflappable.
*   **3 Key Feelings:** **Exhale** (Relief), **Safety** (Protected), **Clarity** (Understood).

## Aesthetic Direction
*   **Vibe:** **Organic / Natural / Minimalist.** "The Sanctuary of Truth."
*   **Palette:** Sage Green (`#4A6C58` - Growth), Slate Blue (`#475569` - Trust), Warm Sand/Off-White backgrounds.
*   **Theme:** **Light Mode (Daylight)** for clarity/transparency. Deep "Night Sky" dark mode for evening use.
*   **Inspiration:** Headspace (Calmness), Airbnb (Trust/Logistics), Notion (Structure).

## Imagery
*   **Style:** Candid Connection. Real, imperfect, human moments of parents and children.
*   **Perspective:** Eye-level with the child.

## Technical & Interaction
*   **Platform split:**
    *   **Parent Side:** **Mobile-First App (iOS/Android).** 95% of usage is on the go.
    *   **Court/Pro Portal:** **Desktop Web Scale.** Optimized for large screens, data density, and case management.
*   **Stack:** React (Next.js) + Tailwind CSS + Framer Motion.
*   **Interactions:** Fluid, weightless exits. Swipe-to-confirm for high-stakes actions.
*   **Differentiation:** Competitors look like legal tools (spreadsheets). CommonGround looks like a **wellness tool**.

---

# 2. PAGE-SPECIFIC SPECIFICATIONS

## 2.1 The Dashboard ("The Morning Brief")
*The first screen a parent sees. The anchor of sanity.*

### Core Context
*   **Goal:** Instant situational awareness. "Do I have the kids today? What do I need to do right now?"
*   **Audience:** The parent in a rush, checking their phone in the morning or before leaving work.

### Aesthetic Direction
*   **Vibe:** **Editorial / Clean.** Information density must be high but feel "airy." No clutter.
*   **Key Visual:** A prominent, beautiful greeting: "Good Morning, Marcus." followed by the **Current Status Widget**.

### Features & Functionality
*   **Must-Have Sections:**
    *   **Status Card:** "Kids are with: [You / Mom / Dad] until Tuesday at 6 PM." (Visual progress bar).
    *   **Action Stream:** Pending approvals (ClearFund), Unread Messages, Upcoming Exchanges.
    *   **The "Child Anchor":** A circular avatar row of the children at the top right.
*   **Interactions:**
    *   **Cards:** Tappable cards that expand into details (e.g., tapping "Pick up at 6" opens the map).
    *   **Pull-to-Refresh:** Smooth, elastic animation.

### Differentiation
*   **Unique Factor:** It **hides** the conflict. It doesn't show "3 Angry Messages from Ex." It shows "3 New Messages." It prioritizes logistics over drama.

---

## 2.2 Comms™ ("The Neutral Zone")
*The messaging interface, guarded by ARIA.*

### Core Context
*   **Goal:** Secure, immutable communication. To prevent emotional escalation *before* send.
*   **Audience:** Parents discussing logistics.

### Aesthetic Direction
*   **Vibe:** **Clean / Trustworthy.** Looks like iMessage or WhatsApp but "sturdier."
*   **Colors:**
    *   User bubbles: Brand Primary (Sage or Slate).
    *   Other Parent bubbles: Neutral Grey (De-emphasized to reduce emotional reaction).
    *   ARIA Interventions: Soft, glowing Amber (Warning) or Blue (Suggestion). Never aggressive Red.

### Features & Functionality
*   **Must-Have Sections:**
    *   **The Composer:** Where ARIA lives. Highlighting toxic phrases in real-time.
    *   **The Thread:** Chronological history.
    *   **"Topic Mode":** Ability to filter chat by "Medical," "School," "Schedule" (Tag-based).
*   **Interactions:**
    *   **ARIA Pulse:** The send button changes state/color if toxicity is detected.
    *   **"Read" Receipts:** Precise timestamps, visible but unobtrusive.

### Differentiation
*   **Unique Factor:** **ARIA acts as a third participant.** The interface isn't just 1-on-1; there is a "Guardian" present in the UI (a small orb or indicator) that monitors tone.

---

## 2.3 TimeBridge™ (The Shared Calendar)
*The source of truth for "When do I see my kids?"*

### Core Context
*   **Goal:** A crystal-clear, friction-free view of the custody schedule.
*   **Audience:** Parents planning their lives; Kids wanting to know "Where do I sleep tonight?"
*   **Distinction:** This is the **Macro View** (Planning).

### Aesthetic Direction
*   **Vibe:** **Functional / Structured.** "Google Calendar meets Airbnb."
*   **Visuals:**
    *   **Color-coded Blocks:** "My Time" (Sage), "Their Time" (Neutral/Blue), "School/Activity" (Yellow).
    *   **Split View:** Month view for planning, Agenda view which is more detailed for the immediate future.

### Features & Functionality
*   **Must-Have Sections:**
    *   **The "Custody Ribbon":** A visual strip showing the pattern (e.g., 2-2-3 rotation).
    *   **Event Types:** Start/End timestamps clearly marked.
    *   **Sync:** One-way sync to Google/Apple Calendar.

---

## 2.3b Silent Handoff™ (The Exchange Mode)
*The "Uber-style" operational mode for specific drop-off events.*

### Core Context
*   **What is it?** A specific mode that activates within TimeBridge when an exchange event is imminent.
*   **Goal:** To execute the physical handoff without requiring verbal communication or conflict.
*   **Distinction:** This is the **Micro View** (Execution).

### Features & Functionality
*   **"Active Exchange" Mode:**
    *   When 60 mins from exchange: The app surface changes.
    *   **Uber-Style Tracker:** Map at top.
    *   **Stages:** "En Route" -> "Arrived" -> "Handover Complete".
*   **Interactions:**
    *   **Geolocation:** "Check In" button glows and unlocks ONLY when user is physically at the geofenced zone.
    *   **Silent Notifications:** The other parent sees "Mark has arrived" without Mark sending a text.

---

## 2.4 ClearFund™ (The Financial Ledger)
*Separating money from emotion.*

### Core Context
*   **Goal:** Transparency and payment execution.
*   **Audience:** The parent requesting reimbursement; The parent paying confirmed expenses.

### Aesthetic Direction
*   **Vibe:** **Fintech / Premium.** Should feel like Stripe or Mint. Secure, precise, mathematical.
*   **Typography:** Monospace fonts for numbers (Variant of Inter or Roboto Mono).

### Features & Functionality
*   **Must-Have Sections:**
    *   **"Owed" Balance:** Big, neutral number. Net balance (e.g., "Review Pending: $50.00").
    *   **Expense Feed:** List of transactions with receipt thumbnails.
    *   **"Add Expense" Wizard:** Camera-first flow for snapping receipts immediately.
*   **Interactions:**
    *   **Receipt Zoom:** Smooth lightbox expansion.
    *   **Approve/Contest:** Swipe actions. Swipe Right to Approve (Pay), Swipe Left to Contest (Opens dispute flow).

### Differentiation
*   **Unique Factor:** **Purpose-Locking.** Visually distinguishing "Child Support" (Base) vs "Variable Expenses" (Ad-hoc). The UI clearly separates "Mandatory" from "Requested."

---

## 2.5 Agreements™ (The Constitution)
*The static rules that govern the dynamic family.*

### Core Context
*   **Goal:** Reference and Modification. "What did we agree to regarding Christmas?"
*   **Audience:** Parents checking rules; Professionals auditing the case.

### Aesthetic Direction
*   **Vibe:** **Editorial / Legal but Human.** Think "New York Times" article layout. Serif headings (Merriweather or Playfair) for dignity; Sans-serif body for readability.
*   **Paper Metaphor:** Subtle drop shadows or borders that imply a "signed document."

### Features & Functionality
*   **Must-Have Sections:**
    *   **Searchable Index:** Instant search for "Holiday," "Travel," "Medical."
    *   **"The Living Doc":** The agreement text with clear version stamps ("Active since Jan 1, 2025").
    *   **Modification Flow:** "Propose Change" button that launches a redline/diff view.
*   **Interactions:**
    *   **Highlighting:** Users can tap a paragraph to "Cite" it in a message (Deep linking the agreement to Comms).

### Differentiation
*   **Unique Factor:** **Click-to-Cite.** Making the legal text usable in daily disputes. "Per Section 4.2..." becomes a clear UI action, not an angry text.

---

## 2.6 ChildCore™ (The Child's Profile)
*The heart of the system.*

### Core Context
*   **Goal:** Shared knowledge. "What size shoe does he wear now? What is the doctor's number?"
*   **Audience:** Both parents, grandparents, babysitters (via CircleAccess).

### Aesthetic Direction
*   **Vibe:** **Warm / Scrapbook-ish.** This is the one place where "Warmth" overrides "Structure."
*   **Imagery:** Large cover photo of the child.

### Features & Functionality
*   **Must-Have Sections:**
    *   **Vitals:** Clothing sizes, Blood type, SSN (Hidden/Biometric lock).
    *   **Network:** List of teachers, doctors, coaches with click-to-call.
    *   **Vault:** Digital cubby for artwork or report cards.
*   **Interactions:**
    *   **One-Tap Copy:** For insurance numbers or addresses.
    *   **"Update" Broadcast:** When one parent updates shoe size, the other gets a gentle "FYI" notification.

### Differentiation
*   **Unique Factor:** **The "Shared Brain."** Competitors ignore this "soft data." CommonGround makes it central, reinforcing that "We are a team raising this child" even if we are divorced.

---

---

## 2.8 The Court Portal (Professional Desktop Web)
*The high-density command center for Judges, Attorneys, and GALs.*

### Core Context
*   **Goal:** Rapid assessment of facts. "Is this high conflict? Who is non-compliant?"
*   **Audience:** Professionals sitting at a desk with a monitor.
*   **Scale:** **Desktop Web Dimensions.**

### Aesthetic Direction
*   **Vibe:** **Data-Dense / "Bloomberg Terminal" for Family Law.**
*   **Layout:** 3-Column Dashboard.
    *   **Left:** Key Stats (On-time %, Payment compliance).
    *   **Center:** Chronological "Reality Ledger" (The merged stream of all events).
    *   **Right:** Case Metadata & Export tools.

### Features & Functionality
*   **The "ImpactView" Component:** A heat map of conflict events (ARIA flags, missed exchanges) over time.
*   **Interactions:**
    *   **Drill-down:** Clicking a "Missed Payment" stat filters the central stream to show those specific logs.
    *   **Bulk Export:** "Generate PDF for Hearing" button prominent.

---

## 2.9 Landing & Onboarding (The First Impression)
*Converting visitors into protected parents.*

### Core Context
*   **Goal:** Conversion and Trust-building. "This understands my pain."
*   **Audience:** Anxious parents looking for a solution.

### Aesthetic Direction
*   **Vibe:** **Sanctuary.**
*   **Hero Section:** No stock photos of shaking hands. Use abstract, calming motion (flowing water or stable geometric shapes assembling).
*   **Copy:** "Co-parenting without the conflict." "Preserve your peace."

### Features & Functionality
*   **Onboarding Flow:**
    *   Step 1: **Identify Role** (Parent or Pro?)
    *   Step 2: **The "Exhale" Setup:** Instead of a boring form, a guided conversation. "Tell us about your children." using ARIA-like conversational UI.
*   **Interactions:**
    *   **Progressive Disclosure:** Don't overwhelm. Ask one thing at a time. The UI should breathe.

### Differentiation
*   **Unique Factor:** **Emotional Resonance.** It doesn't sell "features" (Calendar, Chat). It sells **Outcomes** (Peace, Protection, Court-Readiness).
