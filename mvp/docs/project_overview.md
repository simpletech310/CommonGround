# CommonGround - Project Overview
**Status**: MVP / Active Development
**Version**: 1.0.0 (Alpha)

## Executive Summary
**CommonGround** is an AI-powered "Co-Parenting Operating System" designed to reduce conflict, streamline communication, and provide court-ready documentation for separated parents. Unlike traditional apps that merely store data, CommonGround acts as a neutral third party—a "Sanctuary of Truth"—that mediates interactions, filters hostility, and organizes shared responsibilities.

The platform is built on a **Family File** architecture, where both parents contribute to a single, immutable record of truth for each child, case, and expense.

---

## Core Philosophy: "The Sanctuary of Truth"
1.  **Conflict Reduction**: AI (ARIA) intercepts and rewrites hostile messages before they are sent.
2.  **Child-Centric**: "Child Profiles" are the central entities; parents are contributors to the child's well-being.
3.  **Court-Readiness**: Every action, message, and transaction is logged in a format admissible in family court.
4.  **Privacy & Safety**: Granular permissions allow for "silent handoffs" and blocking of abusive behavior while maintaining legal compliance.

---

## Key Features

### 1. ARIA (AI-Powered Relationship Intelligence Assistant)
*   **Role**: AI Mediator & Communication Guardrails.
*   **Capabilities**:
    *   **Sentiment Analysis**: Scores messages for toxicity (Hostility, Blame, Profanity).
    *   **Intervention**: Blocks severe threats (Safety Protocol) and suggests "BIFF" (Brief, Informative, Friendly, Firm) rewrites for heated messages.
    *   **Context Awareness**: Understands legal constraints and existing custody orders.

### 2. Family Files & Cases
*   **Structure**: The core container for a co-parenting relationship. Users can belong to multiple Family Files (e.g., blended families).
*   **Dual-Approval**: Critical data (like Child Profiles) requires approval from *both* parents to become "Active," preventing unilateral changes.
*   **Invitation System**: Secure, token-based invitation flow to onboard the co-parent.

### 3. Child Profiles ("Cubbie")
*   **Concept**: A digital "backpack" for each child containing their entire life admin.
*   **Data Points**:
    *   **Medical**: Doctors, medications, allergies, insurance.
    *   **Education**: Schools, teachers, IEP/504 plans.
    *   **Preferences**: Sizes (clothing/shoe), comfort items, routines.
    *   **Emergency Contacts**: Trusted adults.
*   **Court Restrictions**: Admin-level controls to hide sensitive fields (e.g., address) from a restricted parent if mandated by a restraining order.

### 4. ClearFund (Expense Tracking)
*   **Function**: Transparent tracking of shared child-related expenses.
*   **Flow**:
    1.  Upload receipt (OCR extraction).
    2.  Categorize (Medical, Education, Extracurricular).
    3.  Split calculation based on custody order (e.g., 50/50, 70/30).
    4.  Settlement tracking.

### 5. TimeBridge (Schedule & Custody) *[In Progress]*
*   **Features**:
    *   Visual calendar for custody schedules (2-2-3, Week On/Off).
    *   "Silent Handoff" protocol using QR codes/Geolocation to verify exchanges without verbal interaction.
    *   Exchange compliance reporting.

### 6. Court Portal & legal Documentation
*   **Output**: Generates PDF reports of communication logs, expense history, and calendar compliance.
*   **Format**: clean, timestamped, impartial records designed for judges and attorneys.

---

## Technology Stack

### Frontend (The "Professional Futurist" Stack)
*   **Framework**: **Next.js 16.1** (App Router)
*   **Language**: **TypeScript** (Strict Mode)
*   **UI Library**: **React 19.2**
*   **Styling**: **Tailwind CSS v4** (Utility-first)
*   **Icons**: Lucide React
*   **State**: React Context (AuthContext)
*   **Deployment**: Vercel

### Backend (Type-Safe Python)
*   **Framework**: **FastAPI** (High-performance async API)
*   **Language**: Python 3.11
*   **ORM**: **SQLAlchemy 2.0** (Async)
*   **Migrations**: Alembic
*   **AI Models**:
    *   **Anthropic (Claude 3.5 Sonnet)**: Primary reasoning engine for ARIA and delicate rewrites.
    *   **OpenAI (GPT-4o)**: Fallback and high-speed processing.
*   **PDF/Docs**: ReportLab, PyPDF, Python-Docx.
*   **Deployment**: Render (Dockerized)

### Database & Storage
*   **Database**: **PostgreSQL** (via Supabase / Render)
*   **Storage**: Blob storage for receipts and profile photos.
*   **Caching**: Redis (planned/optional for rates).

---

## Data Architecture Highlights
*   **`User`**: The parent account.
*   **`FamilyFile`**: The shared workspace.
*   **`Case`**: The legal container linking two parents and their children.
*   **`Child`**: The subject of the case. Contains `approved_by_a` and `approved_by_b` fields for consensus.
*   **`Message`**: Communication records, including `is_flagged` and `toxicity_score`.
*   **`Expense` (ClearFund)**: Financial records with split ratios.

---

## Security & Compliance
1.  **Safety First**: Logic to auto-block physical threats.
2.  **Immutable Logs**: Once sent, messages cannot be deleted, ensuring an accurate legal record.
3.  **Role-Based Access**: Strict visibility rules ensuring users only see cases they are participants in.
