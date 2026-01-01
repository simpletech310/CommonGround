# Court Access Mode (MediatorMode™) - Implementation Plan

**Version:** 1.0
**Date:** December 31, 2025
**Status:** Planning Phase

---

## Design Philosophy

> "The system must improve the court's workflow without changing how courts already work."

Courts want:
- Clean intake
- Clean records
- Clean exports

Courts do NOT want:
- New processes
- New liability
- Interpretation work
- Extra clicks
- "Smart" systems that second-guess them

---

## Core Principles (Non-Negotiable)

### 1. Courts Authorize, They Don't "Use"
The court is a governing authority with limited, controlled touchpoints. The app feels like a trusted filing cabinet, not another dashboard to babysit.

### 2. Zero Court Liability
The system does NOT:
- Make custody decisions
- Interpret law
- Recommend outcomes
- "Score" parents morally

It records facts, enforces settings, and exports evidence.

### 3. Zero Workflow Disruption
Everything maps to existing court work:
- Intake → Agreement
- Calendar → Custody schedule
- Messages → Communication logs
- Reports → Filings

### 4. Court Controls the Rules
Parents cannot override:
- Court-set access
- Court-locked features
- Court-mandated settings

This is what makes it court-recommendable.

---

## Role Definitions

| Role | Access Level | Key Capabilities | Time Limit |
|------|-------------|------------------|------------|
| **Court Clerk** | Admin | Upload agreements, toggle settings, create events, generate reports | Unlimited (while assigned) |
| **GAL** | Investigation | Full case history, investigation reports, compliance data | 120 days default |
| **Attorney** | Read-Only | View records, export approved documents | 90 days default |
| **Mediator** | Limited | Session scheduling, communication access | Per-session |
| **Judge** | Summary | Reports only, no system interaction | As needed |

---

## Feature Implementation Plan

### Phase 1: Foundation (This Sprint)

#### 1.1 Database Models

```
court_access/
├── CourtProfessional      # Verified court staff/professionals
├── CourtAccessGrant       # Time-limited case access
├── CourtAccessLog         # Immutable audit trail
├── CourtSetting           # Court-controlled case settings
├── CourtEvent             # Court-created calendar events
├── CourtMessage           # One-way court communications
└── InvestigationReport    # Generated report records
```

#### 1.2 Court-Controlled Case Settings

Settings that courts can toggle (parents cannot override):

| Setting | Type | Description |
|---------|------|-------------|
| `gps_checkins_required` | bool | Require GPS for exchanges |
| `aria_enforcement_locked` | bool | Parents cannot bypass ARIA |
| `in_app_communication_only` | bool | Restrict to platform only |
| `agreement_edits_locked` | bool | Prevent agreement modifications |
| `investigation_mode` | bool | Enable enhanced logging |
| `child_safety_tracking` | bool | Enable location sharing for safety |
| `supervised_exchange` | bool | Require third-party at exchanges |

When enabled, parents see: **"This setting is court-controlled."**

#### 1.3 Agreement Ingestion

**Input Options:**
1. PDF upload (parse with AI extraction)
2. Structured form entry
3. CommonGround-generated agreement

**Extracted Data:**
- Custody schedules (regular + holidays)
- Decision-making authority matrix
- Communication rules
- Geographic restrictions
- Financial obligations
- Special provisions

**Output:**
- Structured Agreement Record
- Auto-generated schedule events
- Compliance rules engine

---

### Phase 2: Court Portal UI

#### 2.1 Court Clerk Dashboard

```
/court-portal/
├── /cases                    # Case list (assigned only)
├── /cases/[id]              # Case overview
├── /cases/[id]/settings     # Court-controlled settings
├── /cases/[id]/events       # Court events management
├── /cases/[id]/messages     # Court communications
├── /cases/[id]/reports      # Generate reports
└── /cases/[id]/agreement    # View/upload agreement
```

#### 2.2 GAL/Attorney Portal

```
/legal-portal/
├── /cases                    # Assigned cases
├── /cases/[id]              # Case dashboard (read-only)
├── /cases/[id]/timeline     # Full case timeline
├── /cases/[id]/compliance   # Compliance metrics
├── /cases/[id]/reports      # Generate investigation reports
└── /aria                    # ARIA case assistant
```

---

### Phase 3: Investigation Reports

#### Report Types

| Report | Contents | Use Case |
|--------|----------|----------|
| **Communication Summary** | Message volume, ARIA interventions, tone trends | Pattern analysis |
| **Compliance Report** | Exchange attendance, on-time %, missed events | Hearing prep |
| **Financial Summary** | Payments, expenses, outstanding balances | Support disputes |
| **Timeline Export** | Chronological event log | Investigation |
| **Full Court Package** | All of the above + agreement | Major hearings |

#### Report Features
- Date-range scoped
- Role-limited content
- SHA-256 hash verified
- Watermarked with generator identity
- PDF + structured data export
- Verification URL for authenticity

---

### Phase 4: ARIA Court Assistant

#### What ARIA Can Answer (Facts Only)

```
"What is the current custody schedule?"
"When was the last exchange?"
"Have there been missed pickups in the last 90 days?"
"How many court events had no-shows?"
"What settings are currently court-locked?"
"Summarize communication patterns for [date range]"
"What is the outstanding balance in ClearFund?"
```

#### What ARIA Cannot Do (Liability Protection)

```
❌ Recommend custody changes
❌ Label or characterize parents
❌ Infer intent or motive
❌ Suggest sanctions or outcomes
❌ Predict future behavior
❌ Make moral judgments
```

ARIA responds: *"I can only report facts from the case record. Recommendations require professional judgment."*

---

## Technical Architecture

### API Structure

```
/api/v1/court/
├── /access/
│   ├── POST   /request          # Request court access
│   ├── GET    /grants           # List active grants
│   ├── POST   /grants/{id}/approve
│   ├── POST   /grants/{id}/revoke
│   └── GET    /grants/{id}/audit
│
├── /settings/
│   ├── GET    /case/{id}        # Get court settings
│   ├── PUT    /case/{id}        # Update settings (clerk only)
│   └── GET    /case/{id}/history
│
├── /events/
│   ├── POST   /                 # Create court event
│   ├── GET    /case/{id}        # List court events
│   ├── PUT    /{id}             # Update event
│   └── DELETE /{id}             # Cancel event
│
├── /messages/
│   ├── POST   /                 # Send court message
│   ├── GET    /case/{id}        # List court messages
│   └── GET    /{id}/read-status
│
├── /reports/
│   ├── POST   /generate         # Generate report
│   ├── GET    /case/{id}        # List generated reports
│   ├── GET    /{id}/download
│   └── GET    /verify/{hash}    # Verify report integrity
│
└── /aria/
    ├── POST   /query            # Ask ARIA about case
    └── GET    /suggestions      # Get available queries
```

### Authentication Flow (Simulated MFA for MVP)

```
1. Court professional receives access link
2. Verifies identity (email + simulated 2FA code)
3. Reviews and accepts access terms
4. Receives time-limited JWT with role claims
5. All actions logged to CourtAccessLog
```

**MVP Simulation:**
- Skip real MFA, use email verification + static code
- Log all access as if MFA was real
- Build proper MFA hooks for production

---

## Database Schema

### New Tables

```sql
-- Court professionals (verified staff)
CREATE TABLE court_professionals (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- clerk, gal, attorney, mediator, judge
    organization VARCHAR(200),
    credentials JSONB,          -- bar_number, court_id, etc.
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by UUID,           -- admin who verified
    mfa_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Access grants (case-specific, time-limited)
CREATE TABLE court_access_grants (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    professional_id UUID REFERENCES court_professionals(id),
    role VARCHAR(50) NOT NULL,
    access_scope JSONB NOT NULL,  -- ["schedule", "messages", "financials"]

    -- Time bounds
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    data_start_date DATE,         -- How far back they can see
    data_end_date DATE,

    -- Authorization
    authorization_type VARCHAR(50),  -- court_order, parental_consent, appointment
    authorization_reference VARCHAR(100),
    authorized_by JSONB,          -- Who approved

    -- Status
    status VARCHAR(20) DEFAULT 'pending',  -- pending, active, expired, revoked
    revoked_at TIMESTAMP,
    revoked_by UUID,
    revocation_reason TEXT,

    -- Access tracking
    last_accessed_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Immutable access log
CREATE TABLE court_access_logs (
    id UUID PRIMARY KEY,
    grant_id UUID REFERENCES court_access_grants(id),
    professional_id UUID REFERENCES court_professionals(id),
    case_id UUID REFERENCES cases(id),

    action VARCHAR(50) NOT NULL,   -- login, view, export, query
    resource_type VARCHAR(50),     -- schedule, messages, report
    resource_id UUID,

    details JSONB,                 -- Action-specific data
    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Court-controlled case settings
CREATE TABLE court_case_settings (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id) UNIQUE,

    -- Toggleable settings
    gps_checkins_required BOOLEAN DEFAULT FALSE,
    aria_enforcement_locked BOOLEAN DEFAULT FALSE,
    in_app_communication_only BOOLEAN DEFAULT FALSE,
    agreement_edits_locked BOOLEAN DEFAULT FALSE,
    investigation_mode BOOLEAN DEFAULT FALSE,
    child_safety_tracking BOOLEAN DEFAULT FALSE,
    supervised_exchange BOOLEAN DEFAULT FALSE,

    -- Setting metadata
    settings_locked_by UUID,       -- Court professional who set
    settings_locked_at TIMESTAMP,
    settings_history JSONB,        -- Change log

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Court events (hearings, deadlines, etc.)
CREATE TABLE court_events (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    created_by UUID REFERENCES court_professionals(id),

    event_type VARCHAR(50) NOT NULL,  -- hearing, mediation, deadline, review
    title VARCHAR(200) NOT NULL,
    description TEXT,

    event_date DATE NOT NULL,
    event_time TIME,
    end_time TIME,
    location VARCHAR(500),
    virtual_link VARCHAR(500),

    -- Attendance
    petitioner_required BOOLEAN DEFAULT TRUE,
    respondent_required BOOLEAN DEFAULT TRUE,
    petitioner_attended BOOLEAN,
    respondent_attended BOOLEAN,
    attendance_notes TEXT,

    -- Status
    status VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, completed, cancelled
    is_mandatory BOOLEAN DEFAULT TRUE,

    -- Notes (internal vs shared)
    internal_notes TEXT,           -- Court-only
    shared_notes TEXT,             -- Visible to parents

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Court messages (one-way or controlled)
CREATE TABLE court_messages (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    sent_by UUID REFERENCES court_professionals(id),

    message_type VARCHAR(50) NOT NULL,  -- notice, reminder, order, general
    subject VARCHAR(200),
    content TEXT NOT NULL,

    -- Recipients
    to_petitioner BOOLEAN DEFAULT TRUE,
    to_respondent BOOLEAN DEFAULT TRUE,

    -- Read tracking
    petitioner_read_at TIMESTAMP,
    respondent_read_at TIMESTAMP,

    -- Reply control
    replies_allowed BOOLEAN DEFAULT FALSE,

    -- Attachments
    attachments JSONB,

    sent_at TIMESTAMP DEFAULT NOW()
);

-- Investigation reports
CREATE TABLE investigation_reports (
    id UUID PRIMARY KEY,
    case_id UUID REFERENCES cases(id),
    generated_by UUID REFERENCES court_professionals(id),

    report_type VARCHAR(50) NOT NULL,
    report_title VARCHAR(200),

    -- Scope
    date_range_start DATE,
    date_range_end DATE,
    sections_included JSONB,

    -- File
    file_url VARCHAR(500),
    file_size_bytes INTEGER,
    page_count INTEGER,

    -- Integrity
    content_hash VARCHAR(64),      -- SHA-256
    watermark_text VARCHAR(200),
    verification_url VARCHAR(500),

    -- Stats
    evidence_counts JSONB,         -- {"messages": 156, "exchanges": 24}

    -- Access
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP,

    generated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Order

### Sprint 1: Core Foundation
1. ✅ Review existing `LegalAccess` model
2. Create new court-specific models
3. Create Pydantic schemas
4. Implement court access grant service
5. Implement court settings service
6. Basic API endpoints (access, settings)

### Sprint 2: Court Features
1. Court events service + endpoints
2. Court messages service + endpoints
3. Access logging middleware
4. Court ARIA query service
5. Basic report generation

### Sprint 3: Court Portal
1. Court portal authentication flow
2. Clerk dashboard UI
3. GAL/Attorney portal UI
4. Report generation UI
5. ARIA query interface

### Sprint 4: Polish
1. Report templates (PDF generation)
2. Verification system
3. Export functionality
4. Integration testing
5. Security audit

---

## Files to Create

### Backend

```
app/
├── models/
│   └── court.py                    # New court-specific models
│
├── schemas/
│   └── court.py                    # Pydantic schemas
│
├── services/
│   ├── court_access.py             # Access grant management
│   ├── court_settings.py           # Case settings management
│   ├── court_events.py             # Court event management
│   ├── court_messages.py           # Court communications
│   ├── court_reports.py            # Report generation
│   └── court_aria.py               # ARIA for court staff
│
├── api/v1/endpoints/
│   └── court.py                    # All court endpoints
│
└── middleware/
    └── court_access_logging.py     # Auto-log all court actions
```

### Frontend

```
app/
├── court-portal/
│   ├── page.tsx                    # Court portal landing
│   ├── login/page.tsx              # Court login (with MFA)
│   ├── cases/page.tsx              # Case list
│   ├── cases/[id]/page.tsx         # Case dashboard
│   ├── cases/[id]/settings/page.tsx
│   ├── cases/[id]/events/page.tsx
│   ├── cases/[id]/messages/page.tsx
│   ├── cases/[id]/reports/page.tsx
│   └── aria/page.tsx               # ARIA assistant
│
└── components/court/
    ├── CourtSettingsPanel.tsx
    ├── CourtEventForm.tsx
    ├── CourtMessageCompose.tsx
    ├── ReportGenerator.tsx
    └── ARIACourtChat.tsx
```

---

## Success Criteria

### For Courts
- [ ] Can upload existing custody agreement
- [ ] Can toggle case settings (GPS, ARIA lock, etc.)
- [ ] Can create court events visible to both parents
- [ ] Can send one-way messages to parents
- [ ] Can generate court-ready reports
- [ ] Can ask ARIA factual questions about cases
- [ ] All actions logged immutably

### For Parents
- [ ] See court-set settings clearly labeled
- [ ] Cannot override court-controlled settings
- [ ] Receive court messages in-app
- [ ] See court events on calendar
- [ ] Know when court is investigating

### For Integrity
- [ ] All reports SHA-256 verified
- [ ] All access logged with IP/timestamp
- [ ] Time-limited access enforced
- [ ] Role-based access enforced
- [ ] Watermarks on all exports

---

## Notes

### MVP Simplifications
- MFA simulated (email + static code)
- PDF parsing stubbed (manual entry fallback)
- Single court organization assumed
- Reports generated synchronously

### Production Requirements
- Real MFA (TOTP/SMS)
- OCR/AI agreement parsing
- Multi-court organization support
- Async report generation
- E-filing integration

---

*"CommonGround reduces conflict, enforces court orders digitally, and produces neutral, court-ready records without adding burden to court staff."*
