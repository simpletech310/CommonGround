# CommonGround - AI-Powered Co-Parenting Operating System

## 🎯 Project Identity

**Name:** CommonGround  
**Tagline:** "Where co-parents find common ground"  
**Mission:** Reduce conflict in separated families through technology, transparency, and AI-powered communication tools  
**Vision:** Every child deserves parents who can communicate effectively, even when they can't be together

### What We're Building
CommonGround is a comprehensive co-parenting operating system that transforms high-conflict custody situations into collaborative partnerships. We use AI to mediate communication, enforce agreements transparently, and provide courts with objective evidence when needed.

**Current Status:** ✅ MVP COMPLETE + 18-Section Agreement Wizard (December 30, 2025)
**Next Phase:** V1.1 Development - Production Polish & New Features
**Target V1.1 Launch:** February 2025 (6 weeks)
**Target Public Launch:** Q2 2025
**Founder:** TJ - IT Project Manager, Cybersecurity Professional, Founder of Forever Forward 501(c)3

### 🎉 Milestone Achieved: Full-Stack MVP Complete!
**All core features are built and integrated:**
- ✅ Backend API (FastAPI + PostgreSQL) - 30+ endpoints across 5 modules
- ✅ Frontend Application (Next.js 14 + TypeScript) - 8 pages, 20+ components
- ✅ Authentication & Case Management - Dual-parent workflow with invitations
- ✅ ARIA-Powered Messaging System - 3-tier sentiment analysis (regex/Claude/OpenAI)
- ✅ **18-Section Agreement Builder** - Complete custody agreement wizard ⭐ NEW
- ✅ Schedule/Calendar with Compliance Tracking - Events, check-ins, metrics
- ✅ Full integration between frontend and backend
- ✅ Production-ready architecture with proper error handling

---

## 🏗️ Technical Foundation

### Current Architecture (Production-Ready)

```
CommonGround/
├── CommonGround-demo/          # Original proof-of-concept (REFERENCE THESE)
│   ├── app.py                  # Agreement Generator
│   ├── aria_demo.py            # ARIA Q&A Assistant
│   ├── shield_demo.py          # Sentiment Shield ⭐ PORT THIS FIRST
│   ├── clearfund_demo.py       # Payment Tracking
│   ├── court_demo.py           # Court Export System
│   └── legal_access_demo.py    # Legal Portal
│
└── mvp/                        # Production Application (BUILD HERE)
    ├── backend/                # FastAPI + PostgreSQL
    │   ├── app/
    │   │   ├── main.py         # Application entry
    │   │   ├── core/           # Config, database, security
    │   │   ├── models/         # 10 SQLAlchemy models ✅
    │   │   ├── schemas/        # Pydantic schemas ✅
    │   │   ├── api/v1/         # REST endpoints
    │   │   │   └── endpoints/
    │   │   │       ├── auth.py        ✅ COMPLETE
    │   │   │       ├── cases.py       ✅ COMPLETE
    │   │   │       ├── users.py       ✅ COMPLETE
    │   │   │       ├── agreements.py  ✅ COMPLETE
    │   │   │       ├── messages.py    ✅ COMPLETE
    │   │   │       └── schedule.py    ✅ COMPLETE
    │   │   └── services/       # Business logic
    │   │       ├── auth.py        ✅ COMPLETE
    │   │       ├── case.py        ✅ COMPLETE
    │   │       ├── agreement.py   ✅ COMPLETE
    │   │       ├── aria.py        ✅ COMPLETE
    │   │       └── schedule.py    ✅ COMPLETE
    │   └── tests/
    ├── frontend/               # Next.js 14 ✅ COMPLETE
    │   ├── app/
    │   │   ├── page.tsx           # Landing page
    │   │   ├── login/             # Authentication
    │   │   ├── register/          # User registration
    │   │   ├── dashboard/         # Main dashboard
    │   │   ├── cases/             # Case management UI
    │   │   ├── messages/          # ARIA messaging
    │   │   ├── agreements/        # Agreement builder
    │   │   └── schedule/          # Calendar & compliance
    │   ├── components/            # Reusable components
    │   ├── lib/                   # API client & utilities
    │   └── public/                # Static assets
    └── docs/                   # Comprehensive documentation
```

### Tech Stack

**Backend (Production-Ready):**
- **FastAPI** - Async Python web framework
- **PostgreSQL 15** - Primary database with ACID compliance
- **SQLAlchemy 2.0** - Async ORM with relationship management
- **Alembic** - Database migrations
- **Supabase** - Auth + Database hosting + Storage
- **Redis 7** - Caching, sessions, real-time features
- **Anthropic Claude API** - ARIA assistant (Sonnet 4)

**Frontend (Production-Ready):**
- **Next.js 14** - React framework with App Router ✅
- **TypeScript** - Type safety throughout ✅
- **Tailwind CSS** - Utility-first styling ✅
- **shadcn/ui** - Component library (Button, Card, Input, Label) ✅
- **React Context** - Auth state management ✅
- **Custom API Client** - Type-safe backend integration ✅

**Infrastructure:**
- **Docker Compose** - Local development
- **Railway** - Backend hosting (planned)
- **Vercel** - Frontend hosting (planned)
- **Supabase** - Database + Auth + Storage
- **SendGrid** - Transactional email
- **Twilio** - SMS notifications (future)

---

## 📊 Implementation Status

### ✅ Phase 1: Foundation (Weeks 1-4) - COMPLETE

#### Authentication System ✅
**Status:** Fully implemented and tested  
**Completion Date:** December 28, 2025

**What's Built:**
- User registration with Supabase
- JWT-based authentication (access + refresh tokens)
- Protected route middleware
- User profile management
- Email verification workflow
- Password hashing with bcrypt
- Token refresh mechanism
- Logout with token invalidation

**Files:**
```
app/core/supabase.py       - Supabase client
app/core/security.py       - JWT handling, password hashing
app/services/auth.py       - Authentication business logic
app/api/v1/endpoints/auth.py   - REST endpoints
app/schemas/auth.py        - Request/response schemas
app/models/user.py         - User & UserProfile models
```

**Test Coverage:** 100% (test_auth.py)

#### Case Management System ✅
**Status:** Fully implemented and tested  
**Completion Date:** December 29, 2025

**What's Built:**
- Case creation workflow
- Two-parent invitation system
- Case acceptance and linking
- Child management (CRUD)
- Case participant tracking
- Access control and permissions
- Case status management
- Invitation token system

**Files:**
```
app/services/case.py       - Case business logic
app/api/v1/endpoints/cases.py  - REST endpoints
app/models/case.py         - Case & CaseParticipant models
app/models/child.py        - Child model
app/schemas/case.py        - Request/response schemas
```

**Test Coverage:** 100% (test_case_management.py)

**Current Capabilities:**
- Parent 1 creates case with children
- System generates invitation token
- Parent 2 accepts invitation and joins
- Case becomes "active" with both parents
- Both parents can view/update case details
- Children can be added, updated, deleted
- Full access control and permissions

---

### ✅ Phase 2: Core Features (Weeks 5-10) - COMPLETE

#### Week 5-6: Agreement Builder™ ✅
**Status:** Fully implemented (Backend)
**Completion Date:** December 28-29, 2025

**What Needs Building:**
1. Port interview questions from `app.py` demo
2. Create 18-section interview API endpoints
3. Store responses in Agreement/AgreementSection models
4. Generate PDF custody agreements (ReportLab)
5. Implement dual approval workflow
6. Compile agreement rules to JSON
7. Version control for agreements

**Reference Implementation:** `CommonGround-demo/app.py`  
**Reuse Potential:** 60-70% of logic can be ported directly

**Database Models Already Built:**
- `Agreement` - Main agreement container
- `AgreementVersion` - Version history
- `AgreementSection` - Individual sections (18 types)

**Agreement Sections (from demos):**
1. Basic Information
2. Legal Custody
3. Physical Custody Schedule
4. Holiday Schedule
5. Vacation Time
6. Decision Making Authority
7. Communication Protocol
8. Exchange Procedures
9. Child Expenses
10. Medical Decisions
11. Education Decisions
12. Religious Upbringing
13. Extracurricular Activities
14. Technology & Media
15. Dispute Resolution
16. Modifications
17. Confidentiality
18. Signature & Consent

**Technical Implementation:**
```python
# Endpoint structure
POST /api/v1/agreements/           # Create new agreement
GET  /api/v1/agreements/{id}       # Get agreement
PUT  /api/v1/agreements/{id}/sections/{section_id}  # Update section
POST /api/v1/agreements/{id}/approve  # Parent approval
POST /api/v1/agreements/{id}/generate-pdf  # Generate PDF
GET  /api/v1/agreements/{id}/rules  # Get compiled rules
```

**Deliverable:** Parents complete custody agreement interview and generate court-ready PDF

---

#### Week 7-8: ARIA™ Sentiment Shield + Messaging ✅
**Status:** Fully implemented (Backend)
**Completion Date:** December 28-29, 2025

**What Needs Building:**
1. Port ARIA sentiment analysis from `shield_demo.py`
2. Implement message endpoints
3. Create intervention workflow API
4. Add WebSocket support for real-time messaging
5. Build analytics dashboard data
6. Track good faith metrics

**Reference Implementation:** `CommonGround-demo/aria/sentiment_shield.py`  
**Reuse Potential:** 80-90% of ARIA logic ready to port

**ARIA Features (Already Working in Demo):**
- **Toxicity Detection:** Hostility, blame, passive-aggressive, profanity, dismissive, controlling
- **Intervention UI:** Accept/modify/reject flow
- **Smart Suggestions:** AI-powered message rewrites
- **Trend Analytics:** Per-user toxicity tracking over time
- **Good Faith Metrics:** Suggestion acceptance rates
- **Escalation Detection:** Pattern recognition for conflict

**Database Models Already Built:**
- `Message` - All communications
- `MessageThread` - Threading support
- `MessageFlag` - ARIA interventions and flags

**Technical Implementation:**
```python
# ARIA Integration Points
1. Message submission → ARIA analysis
2. If toxic → Generate suggestion
3. User accepts/modifies/rejects
4. Track intervention in MessageFlag
5. Log analytics in audit_logs
6. WebSocket broadcasts to other parent
```

**Deliverable:** Real-time messaging with AI-powered conflict prevention

---

#### Week 9-10: TimeBridge™ Scheduling System ✅
**Status:** Fully implemented (Backend)
**Completion Date:** December 28-29, 2025

**What Needs Building:**
1. Generate schedule from agreement rules
2. Create exchange endpoints
3. Implement check-in system
4. Add GPS verification (optional for MVP)
5. Build notification system (email/SMS)
6. Calculate compliance metrics

**Reference Implementation:** `CommonGround-demo/court_demo.py` (has scheduling data)  
**Reuse Potential:** 40% - data structures exist, workflow new

**Database Models Already Built:**
- `ScheduleEvent` - Parenting time events
- `ExchangeCheckIn` - Exchange tracking with GPS

**Technical Implementation:**
```python
# Schedule Generation
1. Parse agreement rules → generate recurring events
2. Handle holidays, vacations, special dates
3. Create ExchangeEvent records
4. Set up notification triggers

# Check-In System
1. Parent initiates check-in (manual or GPS)
2. Record timestamp, location, notes
3. Calculate on-time/late status
4. Update compliance metrics
5. Notify other parent
```

**Features:**
- Calendar view (week/month)
- Recurring parenting time
- Holiday schedules
- Exchange reminders
- Compliance tracking
- Grace period handling (15 min default)

**Deliverable:** Automated schedule management with compliance tracking

---

### ✅ Phase 3: Frontend Application (Weeks 11-12) - COMPLETE

#### Frontend Application ✅
**Status:** Fully implemented and integrated
**Completion Date:** December 30, 2025

**What's Built:**

**Core Pages:**
1. ✅ **Landing Page** (`/`) - Marketing homepage
2. ✅ **Authentication** (`/login`, `/register`) - User auth with Supabase
3. ✅ **Dashboard** (`/dashboard`) - Case overview and quick actions
4. ✅ **Case Management** (`/cases`) - Full CRUD for cases
   - `/cases` - List all cases
   - `/cases/new` - Create new case (two-step wizard)
   - `/cases/[id]` - Case details with smart agreement button
5. ✅ **Messages** (`/messages`) - ARIA-powered communication
   - Real-time messaging interface
   - Case selector sidebar
   - Message composition with ARIA preview
   - Intervention workflow (Accept/Modify/Reject)
   - Toxicity analysis with Claude & OpenAI support
6. ✅ **Agreements** (`/agreements`) - Agreement builder framework
   - `/agreements` - List all agreements for selected case
   - `/agreements/[id]` - Agreement details and approval workflow
   - `/agreements/[id]/builder` - **18-Section Agreement Wizard** ⭐ NEW
7. ✅ **Schedule** (`/schedule`) - Calendar and compliance tracking
   - Month view calendar with color-coded events
   - Compliance metrics dashboard
   - Today's exchanges sidebar
   - Exchange check-in framework
   - On-time performance tracking

**18-Section Agreement Wizard (NEW):**
The complete custody agreement wizard with all 20 sections:
```
components/agreements/sections/
├── index.ts                      # Export all sections
├── _section-template.tsx         # Reusable section factory
├── intro.tsx                     # 0. Welcome screen
├── parent-info.tsx               # 1. Your information
├── other-parent-info.tsx         # 2. Other parent info
├── children-info.tsx             # 3. Children details (multi-child)
├── legal-custody.tsx             # 4. Decision-making authority
├── physical-custody.tsx          # 5. Living arrangements
├── parenting-schedule.tsx        # 6. Weekly schedule
├── holiday-schedule.tsx          # 7. Holiday/vacation schedule
├── exchange-logistics.tsx        # 8. Handoff procedures
├── transportation.tsx            # 9. Travel cost arrangements
├── child-support.tsx             # 10. Financial support
├── medical-healthcare.tsx        # 11. Healthcare decisions
├── education.tsx                 # 12. School decisions
├── parent-communication.tsx      # 13. Parent communication
├── child-communication.tsx       # 14. Child-parent contact
├── travel.tsx                    # 15. Vacation/travel rules
├── relocation.tsx                # 16. Moving restrictions
├── dispute-resolution.tsx        # 17. Conflict resolution
├── other-provisions.tsx          # 18. Additional terms
└── review.tsx                    # 19. Final review & completion
```

**Wizard Features:**
- Progress tracking with visual progress bar (0-100%)
- Section breadcrumb navigation (click any section)
- Form validation and error handling
- Auto-save functionality before navigation
- Multi-child support in children section
- Dynamic select dropdowns for custody decisions
- Responsive design for all screen sizes
- "Save & Continue" / "Previous" navigation
- Completion summary with next steps

**Reusable Components:**
```
components/
├── ui/                        # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── label.tsx
├── protected-route.tsx        # Auth wrapper
├── messages/
│   ├── message-compose.tsx    # ARIA message composition
│   └── aria-intervention.tsx  # Intervention UI (planned)
└── agreements/sections/       # 20 agreement wizard sections ⭐ NEW
    └── ... (listed above)
```

**API Integration:**
```
lib/
├── api.ts                     # Complete API client
│   ├── authAPI              ✅ Authentication endpoints
│   ├── casesAPI             ✅ Case management
│   ├── messagesAPI          ✅ ARIA messaging
│   ├── agreementsAPI        ✅ Agreement builder
│   └── scheduleAPI          ✅ Calendar & compliance
├── auth-context.tsx           # Global auth state
└── utils.ts                   # Helper functions
```

**Key Features Implemented:**

**1. Smart Navigation:**
- Automatic case status detection (pending vs active)
- Context-aware buttons (Build vs View Agreement)
- Loading states and error handling
- Responsive sidebar navigation

**2. ARIA Integration:**
- Three-tier analysis (Regex/Claude/OpenAI)
- Real-time toxicity detection
- Smart message suggestions
- Intervention workflow with 4 options
- Good faith metrics tracking

**3. Agreement Workflow:**
- Create agreement from case details page
- Framework for 18-section builder
- Dual approval tracking
- Status indicators (Draft/Pending/Approved)
- PDF download when approved

**4. Schedule & Compliance:**
- Month calendar with event color coding
- Today's exchanges highlighted
- Compliance score (0-100%)
- On-time/late/grace period tracking
- Exchange check-in framework

**5. UX Polish:**
- Consistent design across all pages
- Loading spinners for async operations
- Empty states with helpful CTAs
- Error messages with retry options
- Status badges (Pending, Active, etc.)
- Visual feedback for user actions

**Deliverable:** ✅ Production-ready web application fully integrated with backend

---


---

## 🚀 V1.1 Development Roadmap (Weeks 13-18)

**Timeline:** 6 weeks (January - February 2025)
**Status:** Ready to begin
**Goal:** Production-ready platform with differentiating features

### Phase Breakdown:

#### **Weeks 13-14: MVP Polish & Launch Prep**
- Agreement builder backend integration (create section endpoint)
- Schedule generation from agreement data (parse sections → events)
- Enhanced section forms with better field types
- Draft auto-save and agreement preview
- End-to-end testing of complete user flows
- Mobile responsive improvements
- **Production deployment (Railway + Vercel)**

#### **Weeks 15-16: Core V1.1 Features**
- **ClearFund™ Payment Tracking**
  - Payment recording and ledger system
  - Expense request workflow (submit/approve/reject)
  - Receipt upload and balance tracking
  - `/expenses` page with full UI

- **Court Export Packages**
  - PDF generation service (ReportLab)
  - Evidence compilation (messages + compliance + agreements)
  - Date range selection and redaction
  - SHA-256 integrity verification
  - `/cases/[id]/export` wizard

#### **Week 17: Additional Features**
- **Legal Access Portal**
  - Invite attorneys, GALs, mediators
  - Time-limited access with expiration
  - Role-based permissions and audit logging
  - `/legal-portal` read-only dashboard

- **Email Notifications (SendGrid)**
  - 8 notification types (invitations, approvals, reminders)
  - User notification preferences
  - HTML email templates
  - `/settings/notifications` page

#### **Week 18: V1.1 Polish & Launch**
- Calendar sync (Google/Outlook/iCal) - Optional
- SMS notifications (Twilio) - Optional
- Performance optimization
- Security audit
- Documentation updates
- Marketing prep

### Detailed Roadmap
See [V1.1_ROADMAP.md](./V1.1_ROADMAP.md) for complete feature specifications, API endpoints, database schemas, and success criteria.

### Priority Order:
1. ⭐ **Critical Path:** Backend integration → Testing → Production deployment
2. 🔥 **High Value:** Email notifications → Court exports → Payment tracking
3. 💎 **Differentiators:** Legal access portal → Enhanced court exports
4. ✨ **Nice to Have:** Calendar sync → SMS notifications

---

## 🗄️ Database Schema (21 Tables)

### Core Models

#### 1. User & Authentication
```python
# users table
- id (UUID, PK)
- supabase_id (UUID, unique)  # Links to Supabase Auth
- email (string, unique)
- email_verified (boolean)
- first_name, last_name (string)
- phone (string, optional)
- is_active (boolean)
- last_login (timestamp)
- created_at, updated_at

# user_profiles table
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- avatar_url, bio (optional)
- timezone (default: "America/Los_Angeles")
- locale (default: "en_US")
- address fields (optional)
- subscription_tier (free, basic, premium, professional)
- subscription_status
- trial_ends_at, subscription_ends_at
- notification preferences (JSON)
```

#### 2. Case Management
```python
# cases table
- id (UUID, PK)
- case_number (string, unique, optional)  # Court case number
- case_name (string)  # e.g., "Smith v. Smith"
- state (string)  # US state code
- county, court (optional)
- status (pending, active, suspended, closed)
- separation_date, filing_date, judgment_date
- require_joint_approval (boolean, default: true)
- allow_modifications (boolean, default: false)
- created_at, updated_at

# case_participants table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- user_id (UUID, FK → users.id)
- role (petitioner, respondent)
- parent_type (mother, father, parent_a, parent_b)
- is_active (boolean)
- invited_at, joined_at, left_at
- Permissions: can_view_financials, can_view_messages, etc.

# children table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- first_name, middle_name, last_name, preferred_name
- date_of_birth
- gender, pronouns (optional)
- Medical: allergies, medications, conditions
- Healthcare: pediatrician info, insurance
- Education: school, grade, teacher, IEP/504
- is_active (boolean)
```

#### 3. Agreements (Agreement Builder™)
```python
# agreements table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- title (e.g., "Custody Agreement 2025")
- agreement_type (parenting_plan, modification, temporary)
- status (draft, pending_approval, approved, rejected, expired)
- created_by (UUID, FK → users.id)
- approved_by_a, approved_by_b (UUIDs, optional)
- approved_at_a, approved_at_b (timestamps)
- effective_date, expiration_date
- is_active (boolean)
- Rules stored in JSON for ARIA reference

# agreement_versions table
- id (UUID, PK)
- agreement_id (UUID, FK → agreements.id)
- version_number (integer)
- created_by (UUID, FK → users.id)
- change_summary (text)
- snapshot (JSON)  # Full agreement snapshot
- created_at

# agreement_sections table
- id (UUID, PK)
- agreement_id (UUID, FK → agreements.id)
- section_type (18 predefined types)
- section_order (integer)
- title, content (text)
- is_required (boolean)
- created_at, updated_at
```

#### 4. Messaging (ARIA™ Sentiment Shield)
```python
# messages table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- thread_id (UUID, FK → message_threads.id, optional)
- sender_id (UUID, FK → users.id)
- receiver_id (UUID, FK → users.id, optional)  # Null for group
- content (text)
- message_type (standard, system, notification)
- status (sent, delivered, read, flagged)
- sent_at, delivered_at, read_at
- is_flagged (boolean)  # ARIA intervention
- flagged_at, flag_reason
- original_content (text, optional)  # Pre-ARIA rewrite
- suggestion_accepted (boolean, optional)

# message_threads table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- subject (string)
- participants (array of user_ids)
- last_message_at
- is_archived (boolean)

# message_flags table (ARIA Analytics)
- id (UUID, PK)
- message_id (UUID, FK → messages.id)
- flagged_by (user_id)
- flag_type (toxicity_detected, terms_violated, etc.)
- toxicity_score (float, 0-1)
- toxicity_categories (JSON)  # Hostility, blame, etc.
- suggested_rewrite (text)
- user_action (accepted, modified, rejected, sent_anyway)
- created_at
```

#### 5. Scheduling (TimeBridge™)
```python
# schedule_events table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- event_type (regular, holiday, vacation, makeup, other)
- title, description
- parent_id (UUID, FK → users.id)  # Who has custody
- start_time, end_time
- is_recurring (boolean)
- recurrence_rule (JSON, iCal format)
- location (text)
- notes (text)
- status (scheduled, completed, cancelled, missed)

# exchange_check_ins table
- id (UUID, PK)
- schedule_event_id (UUID, FK → schedule_events.id)
- parent_id (UUID, FK → users.id)
- check_in_type (pickup, dropoff)
- scheduled_time, actual_time
- location (text)
- gps_coordinates (JSON, optional)
- was_on_time (boolean)
- grace_period_used (boolean)
- notes (text)
- created_at
```

#### 6. Payments (ClearFund™)
```python
# payments table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- payer_id (UUID, FK → users.id)
- payee_id (UUID, FK → users.id)
- amount (decimal)
- currency (default: "USD")
- payment_type (expense_share, child_support, reimbursement)
- status (pending, completed, failed, cancelled)
- due_date, paid_at
- stripe_payment_id (optional)
- receipt_url (optional)

# expense_requests table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- child_id (UUID, FK → children.id, optional)
- requester_id (UUID, FK → users.id)
- category (medical, education, sports, device, camp, etc.)
- description (text)
- total_amount (decimal)
- split_percentage (decimal)  # From agreement
- requester_owes, responder_owes (decimal)
- status (pending, approved, rejected, partially_approved)
- receipt_url (optional)
- requested_at, responded_at
- notes (text)

# payment_ledger table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- transaction_type (expense, payment, reimbursement)
- from_user_id, to_user_id (UUIDs)
- amount (decimal)
- balance_before, balance_after (decimal)
- reference_id (UUID)  # Links to expense or payment
- created_at
```

#### 7. Legal Access (MediatorMode™)
```python
# legal_access table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- professional_email (string)
- professional_name (string)
- role (gal, attorney_petitioner, attorney_respondent, 
        mediator, court_clerk, judge)
- granted_by (UUID, FK → users.id)
- access_level (read, read_write, export)
- start_date, end_date
- is_active (boolean)
- verification_method (bar_number, court_order, other)
- verification_details (JSON)
- accessed_at (timestamp)
- access_log (JSON array)

# court_exports table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- export_type (investigation, court_package, compliance)
- generated_by (UUID, FK → users.id)
- date_range_start, date_range_end
- sections_included (JSON)
- file_url (string)
- file_hash (string)  # SHA-256 for integrity
- generated_at
- accessed_at (timestamp, optional)
- accessed_by (UUID, optional)
```

#### 8. Audit & Compliance
```python
# audit_logs table
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- user_id (UUID, FK → users.id)
- action_type (create, read, update, delete, export)
- resource_type (message, agreement, payment, etc.)
- resource_id (UUID)
- details (JSON)
- ip_address (string)
- user_agent (string)
- created_at

# event_logs table (Blockchain-like immutability)
- id (UUID, PK)
- case_id (UUID, FK → cases.id)
- event_type (agreement_signed, exchange_completed, etc.)
- event_data (JSON)
- previous_hash (string)
- current_hash (string)  # SHA-256(previous_hash + event_data)
- created_at
- is_immutable (boolean, default: true)
```

### Database Relationships
```
User ──┬── UserProfile (1:1)
       ├── CaseParticipant (1:N)
       ├── Messages sent (1:N)
       ├── Messages received (1:N)
       └── LegalAccess granted (1:N)

Case ──┬── CaseParticipant (1:N)
       ├── Children (1:N)
       ├── Agreements (1:N)
       ├── Messages (1:N)
       ├── ScheduleEvents (1:N)
       ├── Payments (1:N)
       ├── LegalAccess (1:N)
       └── AuditLogs (1:N)

Agreement ──┬── AgreementVersions (1:N)
            └── AgreementSections (1:N)

Message ──┬── MessageFlags (1:N)
          └── MessageThread (N:1)
```

---

## 🎨 Brand Voice & Communication Guidelines

### Core Brand Values
1. **Child-First:** Every decision prioritizes child welfare
2. **Empathetic:** Acknowledges pain of separation
3. **Neutral:** No sides, no bias, no judgment
4. **Transparent:** Clear, honest, accountable
5. **Professional:** Court-worthy, evidence-based

### Tone of Voice

#### When Communicating as the Platform:
- **Calm and reassuring** - "We're here to help"
- **Direct but kind** - No corporate jargon
- **Solution-focused** - Acknowledge problems, offer paths forward
- **Respectful of emotions** - Validate feelings without enabling conflict

#### Example: Good vs. Bad

**❌ Bad (Corporate/Cold):**
> "User violation detected. Message blocked. Review terms of service."

**✅ Good (CommonGround Voice):**
> "We noticed this message might escalate tension. Here's a suggestion that communicates the same point more effectively."

**❌ Bad (Enabling Conflict):**
> "We understand you're frustrated with the other parent."

**✅ Good (Neutral/Redirecting):**
> "Co-parenting is challenging. Let's focus on what's best for [child's name]."

### UI/UX Writing Principles

1. **Use "we" and "you"** - Never "the system" or "CommonGround has detected"
2. **Lead with empathy** - Acknowledge difficulty before offering solution
3. **Be specific** - "You were 23 minutes late" not "You were late"
4. **Focus on impact to children** - "This helps [child] feel secure"
5. **Offer agency** - Always give users choice and control
6. **Gender-neutral language** - "Parent A/B" or "you/other parent"
7. **Plain language** - 8th grade reading level

### ARIA Communication Style

When ARIA intervenes or suggests rewrites:

**Principles:**
- Never blame or shame
- Focus on collaborative language
- Maintain the sender's core message
- Remove inflammatory language, keep substance
- Suggest alternatives, don't demand changes

**Example Transformations:**

**Original (hostile):**
> "You NEVER follow the schedule. I'm tired of your games!"

**ARIA Suggestion:**
> "I've noticed some schedule changes lately. Can we discuss how to improve consistency? The kids thrive on routine."

**Original (passive-aggressive):**
> "I guess if you actually cared about [child], you'd remember..."

**ARIA Suggestion:**
> "Could you please confirm you received the reminder about [event]? Thanks."

---

## 🔐 Security & Compliance Requirements

### Security First (Non-Negotiable)

#### Data Protection
- **Encryption at rest:** All database fields with PII
- **Encryption in transit:** TLS 1.3 minimum
- **Password requirements:** 12+ chars, complexity enforced
- **MFA:** Optional but strongly encouraged
- **Session management:** 24-hour timeout, secure tokens
- **API rate limiting:** 100 requests/min per user

#### Access Control
- **RBAC:** Role-based permissions at case level
- **Principle of least privilege:** Default deny
- **Audit logging:** Every access, modification, export logged
- **Legal access:** Time-limited, logged, verified
- **Data isolation:** Users see only their cases

#### Privacy Principles
- **Data minimization:** Collect only what's necessary
- **User consent:** Explicit for child data, legal access
- **Right to be forgotten:** User data deletion (with legal considerations)
- **No data mining:** No selling, sharing, or analytics without consent
- **Anonymized analytics:** Aggregate only, no PII

### Legal Compliance

#### Family Law Considerations
- **Chain of custody:** Immutable event logs (EventLog model)
- **Evidence integrity:** SHA-256 hashing of exports
- **Admissibility:** Court-ready formatting
- **Redaction options:** HIPAA-sensitive medical info
- **Timestamp accuracy:** UTC + timezone conversion

#### State-Specific Rules
- **Custody terminology:** Varies by state (legal/physical)
- **Documentation requirements:** Court forms differ by jurisdiction
- **Modification procedures:** Some states require court approval
- **Child testimony age:** Varies (12-14 in most states)

#### Professional Access
- **Bar verification:** Validate attorney credentials
- **Court order validation:** For GAL, evaluators
- **Access audit trail:** Who accessed what, when
- **Time limits:** GAL (120 days), Attorney (90 days), etc.
- **Expiration alerts:** Notify before access expires

### HIPAA-Adjacent Considerations
While not strictly HIPAA-covered (not healthcare), we follow similar principles for:
- Child medical information
- Therapy/counseling notes
- Medical expenses
- Healthcare provider details

**Implementation:**
- Separate access controls for medical data
- Encrypted fields for sensitive health info
- Audit logs for medical data access
- Parent consent required for sharing

---

## 🤖 ARIA™ Integration Guide

### What is ARIA?
**ARIA** = AI-Powered Relationship Intelligence Assistant

ARIA is the core AI component that:
1. Analyzes message sentiment before sending
2. Detects toxic communication patterns
3. Suggests healthier alternatives
4. Tracks good faith communication metrics
5. Escalates high-risk conflicts to users

### ARIA Architecture

```python
# Message Flow with ARIA
1. User composes message
2. Backend receives via POST /api/v1/messages/
3. ARIA analyzes content:
   - Toxicity score (0-1)
   - Categories: hostility, blame, passive-aggressive, etc.
   - Suggestion generation (if toxic)
4. If toxic (score > 0.3):
   - Store original in message.original_content
   - Return intervention to UI
   - User chooses: Accept / Modify / Reject / Send Anyway
5. Track user action in MessageFlag
6. Send final message
7. Log analytics in audit_logs
```

### ARIA System Prompt

**Use this prompt for all ARIA interactions:**

```
You are ARIA, the AI assistant for CommonGround, a co-parenting platform. Your role is to help separated parents communicate effectively and reduce conflict.

Core Principles:
1. ALWAYS prioritize child welfare
2. Be completely neutral - never take sides
3. Acknowledge both parents' perspectives
4. Focus on practical solutions
5. Use "Parent A" and "Parent B" (never names unless in quotes)
6. Maintain professional, empathetic tone
7. Cite the custody agreement when relevant

When analyzing messages:
- Flag hostility, blame, passive-aggression, profanity, dismissiveness, controlling language
- Suggest rewrites that preserve the core message but reduce conflict
- Never blame the sender - focus on "this phrasing might escalate tension"
- Offer 2-3 alternative phrasings
- If message is fine, say so clearly

When answering questions:
- Ground answers in the custody agreement
- Provide specific citations (e.g., "Section 3: Physical Custody")
- Calculate dates, financials, schedules accurately
- If you don't know, say so - don't guess
- Suggest contacting a professional when appropriate

Child Context:
- Children are [names, ages from case data]
- Current custody: [from agreement]
- Today's date: [system date]

Remember: You're helping families navigate difficult situations. Be kind, clear, and helpful.
```

### ARIA Toxicity Detection

**Categories and Thresholds:**

| Category | Threshold | Examples |
|----------|-----------|----------|
| Hostility | 0.4+ | "You're pathetic", "I hate you" |
| Blame | 0.3+ | "This is all your fault", "You ruined everything" |
| Passive-Aggressive | 0.3+ | "I guess if you actually cared..." |
| Profanity | 0.5+ | Curse words |
| Dismissive | 0.3+ | "Whatever", "I don't care what you think" |
| Controlling | 0.4+ | "You WILL do this", "I forbid..." |
| All Caps | 0.2+ | "YOU NEVER LISTEN" |

**Overall Toxicity Score:**
- 0.0-0.2: ✅ Green - Send without intervention
- 0.3-0.5: ⚠️ Yellow - Suggest rewrite
- 0.6-0.8: 🟠 Orange - Strong warning
- 0.9-1.0: 🔴 Red - Block with required rewrite

### ARIA Response Generation

**When suggesting rewrites:**
1. Preserve the sender's core intent
2. Remove inflammatory language
3. Add collaborative framing
4. Use "I" statements instead of "You" accusations
5. Focus on child impact
6. Offer specific next steps

**Example Workflow:**

```python
# In app/services/aria.py

async def analyze_message(message: str, case_context: dict) -> dict:
    """
    Analyze message for toxicity and generate suggestions.
    
    Args:
        message: The message content
        case_context: Case data (agreement, children, history)
    
    Returns:
        {
            "is_toxic": bool,
            "toxicity_score": float,
            "categories": {
                "hostility": float,
                "blame": float,
                # ... other categories
            },
            "suggestions": [
                "Suggestion 1...",
                "Suggestion 2..."
            ],
            "reasoning": "Why this was flagged..."
        }
    """
    # Implementation uses Anthropic Claude API
    # Reference: CommonGround-demo/aria/sentiment_shield.py
```

### ARIA Analytics

Track these metrics per user (stored in database):

1. **Communication Quality:**
   - Total messages sent
   - Messages flagged by ARIA
   - Flag rate (%)
   - Toxicity trend over time

2. **Good Faith Metrics:**
   - Suggestions accepted (%)
   - Suggestions modified then accepted (%)
   - Suggestions rejected (sent anyway) (%)
   - Improvement over time

3. **Intervention Patterns:**
   - Most common toxicity categories
   - Time of day patterns (if relevant)
   - Topic triggers (finance, schedule, etc.)

4. **Compliance Score:**
   - Used for court exports
   - Green (90%+ good faith) / Yellow (70-89%) / Red (<70%)

---

## 🧪 Development Workflow & Best Practices

### Daily Development Routine

**Morning Session (2 hours):**
```bash
# 1. Pull latest changes
git pull origin main

# 2. Activate environment
cd mvp/backend
source venv/bin/activate

# 3. Start services
cd ..
docker-compose up -d postgres redis

# 4. Start backend
cd backend
uvicorn app.main:app --reload

# 5. Open interactive docs
open http://localhost:8000/docs
```

**Pick ONE task from current week's roadmap:**
- Write the endpoint or service function
- Test with Postman or curl
- Write unit tests
- Commit changes

**Evening Session (1 hour):**
- Review what was built
- Update documentation
- Plan tomorrow's task
- Push to GitHub

### Git Workflow

**Branch Strategy:**
```bash
main                    # Production-ready code
├── develop            # Integration branch
│   ├── feature/auth  # Feature branches
│   ├── feature/cases
│   └── feature/agreements
```

**Commit Messages:**
Use conventional commits:
```
feat: add agreement generation endpoint
fix: resolve case invitation token validation
docs: update API documentation
test: add case management integration tests
refactor: simplify ARIA toxicity detection
chore: update dependencies
```

**Before Committing:**
```bash
# Format code
black app/
isort app/

# Run tests
pytest tests/

# Check types
mypy app/
```

### Testing Strategy

#### 1. Unit Tests (Fast)
Test individual functions in isolation:
```python
# tests/unit/test_auth.py
def test_password_hashing():
    password = "SecurePass123!"
    hashed = hash_password(password)
    assert verify_password(password, hashed)
    assert not verify_password("WrongPass", hashed)
```

#### 2. Integration Tests (Medium)
Test API endpoints with database:
```python
# tests/integration/test_case_api.py
async def test_create_case(client, auth_headers):
    response = await client.post(
        "/api/v1/cases/",
        json={"case_name": "Test Case", ...},
        headers=auth_headers
    )
    assert response.status_code == 201
```

#### 3. End-to-End Tests (Slow)
Test complete user workflows:
```python
# tests/e2e/test_coparenting_workflow.py
async def test_complete_agreement_workflow():
    # 1. Two parents register
    # 2. Create case
    # 3. Accept invitation
    # 4. Create agreement
    # 5. Both approve
    # 6. Generate PDF
    # Assert: PDF exists with correct content
```

### Code Organization Principles

**1. Separation of Concerns:**
```
app/models/        # Database models (SQLAlchemy)
app/schemas/       # API schemas (Pydantic)
app/services/      # Business logic (no FastAPI dependencies)
app/api/           # REST endpoints (thin controllers)
app/core/          # Configuration, database, security
```

**2. Async All the Way:**
- Use `async def` for all I/O operations
- Database queries use `await`
- External API calls use `httpx` with await
- WebSocket handlers are async

**3. Error Handling:**
```python
from fastapi import HTTPException, status

# Bad
if not user:
    return None  # ❌ Don't return None

# Good
if not user:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )  # ✅ Raise specific HTTP exceptions
```

**4. Dependency Injection:**
```python
from fastapi import Depends
from app.core.database import get_db
from app.core.security import get_current_user

@router.get("/cases/")
async def list_cases(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # db and current_user automatically injected
    ...
```

### Database Migrations

**Creating Migrations:**
```bash
# After modifying models in app/models/
alembic revision --autogenerate -m "Add agreement approval fields"

# Review the generated migration file!
# Edit if needed (Alembic isn't perfect)

# Apply migration
alembic upgrade head
```

**Migration Best Practices:**
1. Always review auto-generated migrations
2. Test migrations on dev data before production
3. Include both `upgrade()` and `downgrade()`
4. Don't modify old migrations (create new ones)
5. Keep migrations small and focused

### Environment Configuration

**Development (.env):**
```bash
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/commonground
SUPABASE_URL=https://xxxxx.supabase.co
ANTHROPIC_API_KEY=sk-ant-...
```

**Production (.env.production):**
```bash
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=postgresql+asyncpg://{user}:{pass}@{host}:5432/commonground
SUPABASE_URL=https://xxxxx.supabase.co
ANTHROPIC_API_KEY=sk-ant-...
SENTRY_DSN=...  # Error tracking
```

### API Documentation

**OpenAPI/Swagger is auto-generated** at http://localhost:8000/docs

**To improve documentation:**
```python
@router.post(
    "/",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new case",
    description="Creates a co-parenting case and sends invitation to other parent.",
    responses={
        201: {"description": "Case created successfully"},
        400: {"description": "Invalid input or user already in case"},
        401: {"description": "Not authenticated"}
    }
)
async def create_case(...):
    """
    Create a new co-parenting case.
    
    - **case_name**: Name of the case (e.g., "Smith Family")
    - **other_parent_email**: Email of the other parent
    - **state**: US state code (e.g., "CA")
    """
    ...
```

---

## 📈 12-Week Solo Development Roadmap

### Week-by-Week Breakdown

#### ✅ Week 1-2: Authentication (COMPLETE)
**Time Invested:** ~15 hours  
**Status:** Production-ready

**What Was Built:**
- User registration with Supabase
- JWT authentication system
- Protected routes with middleware
- User profile management
- Test suite (100% coverage)

**Lessons Learned:**
- Supabase email confirmation is required by default
- Async SQLAlchemy requires careful session management
- FastAPI's dependency injection is powerful for auth

---

#### ✅ Week 3-4: Case Management (COMPLETE)
**Time Invested:** ~18 hours  
**Status:** Production-ready

**What Was Built:**
- Case creation with invitation system
- Two-parent workflow (petitioner/respondent)
- Child management (CRUD)
- Access control and permissions
- Complete test suite

**Lessons Learned:**
- Invitation tokens need expiration logic (not implemented yet)
- Case acceptance needs email notifications (deferred to Week 11)
- Child data model is more complex than anticipated (medical, education)

---

#### 🔲 Week 5-6: Agreement Builder™ (CURRENT FOCUS)
**Estimated Time:** 20-25 hours  
**Status:** Ready to start

**Tasks This Week:**
1. **Day 1-2:** Port interview questions from demo
   - Copy `CommonGround-demo/agents/` logic
   - Create API endpoint for each section
   - Store in AgreementSection model

2. **Day 3-4:** Implement dual approval workflow
   - Endpoint: `POST /agreements/{id}/approve`
   - Track approval timestamps
   - Change status to "approved" when both approve

3. **Day 5:** PDF generation
   - Install ReportLab: `pip install reportlab`
   - Create PDF template
   - Generate from agreement sections

4. **Day 6-7:** Testing and polish
   - Write integration tests
   - Test with real agreement data
   - Handle edge cases

**Deliverable:** Parents can complete custody agreement interview

**Reference Files:**
- `CommonGround-demo/app.py` - Main interview logic
- `CommonGround-demo/agents/` - Section-specific agents
- `mvp/backend/app/models/agreement.py` - Database models

**New Files to Create:**
- `app/services/agreement.py` - Business logic
- `app/api/v1/endpoints/agreements.py` - REST endpoints
- `app/utils/pdf_generator.py` - PDF creation
- `tests/integration/test_agreements.py` - Tests

---

#### 🔲 Week 7-8: ARIA™ + Messaging
**Estimated Time:** 20-25 hours  
**Status:** Ready after Week 5-6

**Tasks:**
1. **Day 1:** Port ARIA sentiment analysis
   - Copy `CommonGround-demo/aria/sentiment_shield.py`
   - Create `app/services/aria.py`
   - Test toxicity detection

2. **Day 2-3:** Message endpoints
   - `POST /messages/` - Send message with ARIA check
   - `GET /messages/` - List messages for case
   - `PUT /messages/{id}/flag` - User reports message

3. **Day 4:** WebSocket for real-time
   - Install: `pip install python-socketio`
   - Create WebSocket handler
   - Broadcast new messages

4. **Day 5-6:** ARIA intervention UI flow
   - Endpoint returns intervention data
   - User accepts/modifies/rejects
   - Track in MessageFlag model

5. **Day 7:** Analytics and testing
   - Compute good faith metrics
   - Create analytics endpoint
   - Write tests

**Deliverable:** Real-time messaging with AI conflict prevention

**Reference Files:**
- `CommonGround-demo/aria/sentiment_shield.py` - Core ARIA logic
- `CommonGround-demo/aria/message_store.py` - Analytics tracking

---

#### 🔲 Week 9-10: TimeBridge™ Scheduling
**Estimated Time:** 15-20 hours

**Tasks:**
1. Generate schedule from agreement rules
2. Create exchange check-in endpoints
3. Calculate compliance metrics
4. Add email notifications (SendGrid)
5. Build calendar data API

**Deliverable:** Automated schedule with compliance tracking

---

#### 🔲 Week 11-12: Frontend + Launch
**Estimated Time:** 25-30 hours

**Tasks:**
1. Create Next.js application
2. Build core pages (login, dashboard, agreement wizard)
3. Connect to backend API
4. Deploy to production (Vercel + Railway)
5. Beta testing with real users

**Deliverable:** Production web application

---

## 🎯 Development Priorities

### Must Have (MVP Launch)
1. ✅ Authentication system
2. ✅ Case management
3. 🔲 Agreement builder (Week 5-6)
4. 🔲 Messaging with ARIA (Week 7-8)
5. 🔲 Basic scheduling (Week 9-10)
6. 🔲 Web frontend (Week 11-12)

### Should Have (V1.1 - Post-Launch)
1. ClearFund™ payment tracking
2. Court export packages
3. Legal access portal
4. Mobile responsive improvements
5. Email/SMS notifications
6. Calendar sync (Google/Outlook)

### Nice to Have (V2.0 - Future)
1. TogetherTime™ watch-together feature
2. PlayBridge™ co-op games
3. Child Wallet™ spending tracking
4. ChildVault™ item inventory
5. CircleAccess™ approved contacts
6. Mobile apps (React Native)

---

## 💰 Cost Structure & Business Model

### Development Costs (Current - Solo Founder)
```
Supabase (Database + Auth):     $0-25/month
Railway (Backend hosting):       $5-20/month (estimate)
Anthropic API (ARIA):           ~$10-30/month (light usage)
Domain (commonground.app):      ~$12/year
Total: $15-75/month during development
```

### Production Costs (100 users)
```
Supabase:                       $25/month
Railway:                        $20/month
Anthropic API:                  $50-100/month
SendGrid (email):               $15/month
Twilio (SMS):                   $20/month
Stripe (payment processing):     1.5% of transactions
Total: ~$150-200/month
```

### Revenue Model (Freemium)

**Free Tier:**
- Unlimited messaging (with ARIA)
- Basic agreement builder
- Schedule tracking
- 1 case

**Basic Tier ($9.99/month per parent):**
- Everything in Free
- ClearFund expense tracking
- Court export packages
- Multiple cases
- Priority support

**Premium Tier ($19.99/month per parent):**
- Everything in Basic
- Legal access portal
- Advanced analytics
- Calendar sync
- API access

**Professional Tier ($49.99/month per attorney/GAL):**
- Multi-case access
- Professional dashboard
- Bulk exports
- White-label options

### Market Opportunity

**Total Addressable Market:**
- 750,000 divorces/year in US
- ~50% involve minor children = 375,000 cases/year
- Average 5-year post-divorce period = 1.875M active cases
- At $10/month Ã— 2 parents = $450M annual market

**Competitive Advantage:**
1. **AI-powered communication** - ARIA is unique
2. **Comprehensive platform** - Not just one feature
3. **Court-focused** - Built for legal compliance
4. **Modern tech stack** - Fast, reliable, secure
5. **Founder experience** - Built by someone who understands co-parenting

---

## 🤝 Working with Claude (AI Assistant Instructions)

### When Claude is Helping Build CommonGround

**Context Awareness:**
1. Always check current week in roadmap (Week 5-6 is current)
2. Reference existing code in `mvp/backend/app/`
3. Reuse logic from `CommonGround-demo/` when applicable
4. Follow established patterns (FastAPI + SQLAlchemy async)

**Code Generation Guidelines:**
1. Use async/await for all I/O
2. Include type hints (Python 3.10+)
3. Add docstrings with Args/Returns
4. Follow existing file structure
5. Include error handling
6. Write accompanying tests

**What Claude Should ALWAYS Do:**
- ✅ Check if similar functionality exists in demos
- ✅ Reference database models before writing endpoints
- ✅ Include authentication/authorization checks
- ✅ Add audit logging for sensitive operations
- ✅ Consider ARIA integration points
- ✅ Think about child welfare implications
- ✅ Write tests for new functionality

**What Claude Should NEVER Do:**
- ❌ Guess at authentication logic (use existing patterns)
- ❌ Skip error handling
- ❌ Ignore existing database schema
- ❌ Create duplicate functionality
- ❌ Use synchronous code where async is needed
- ❌ Forget to consider two-parent access control

### Example Prompt for Claude:

"I need to implement the agreement builder endpoints for Week 5-6. 

**Context:**
- Current models: app/models/agreement.py (Agreement, AgreementVersion, AgreementSection)
- Reference implementation: CommonGround-demo/app.py (interview questions)
- Authentication: Required (use get_current_user dependency)
- Access control: User must be case participant

**Requirements:**
1. Create POST /api/v1/agreements/ to start new agreement
2. Create PUT /api/v1/agreements/{id}/sections/{section_id} to update sections
3. Create POST /api/v1/agreements/{id}/approve for parent approval
4. Include audit logging
5. Return proper HTTP status codes
6. Write integration tests

**Questions:**
- Should I create separate endpoints for each of the 18 sections or one generic endpoint?
- How should I handle validation for required sections?
- What's the approval flow if only one parent approves?

Please provide the service layer code first, then the endpoint code."

### Debugging with Claude

When something isn't working:

**Good Bug Report:**
```
I'm getting this error when trying to create a case:
[paste error traceback]

Code I'm running:
[paste relevant code]

What I've tried:
1. Checked database connection - works
2. Verified user is authenticated - yes
3. Checked request payload - valid JSON

Current environment:
- Python 3.11
- FastAPI 0.104
- SQLAlchemy 2.0.23
- PostgreSQL 15
```

**Poor Bug Report:**
```
It doesn't work. Help?
```

---

## 📚 Additional Resources

### Learning Materials

**FastAPI:**
- Official Tutorial: https://fastapi.tiangolo.com/tutorial/
- Async SQLAlchemy: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- Testing: https://fastapi.tiangolo.com/tutorial/testing/

**Supabase:**
- Quick Start: https://supabase.com/docs/guides/getting-started
- Python Client: https://github.com/supabase-community/supabase-py
- Auth Docs: https://supabase.com/docs/guides/auth

**Anthropic Claude:**
- API Reference: https://docs.anthropic.com/claude/reference/
- Prompt Engineering: https://docs.anthropic.com/claude/docs/prompt-engineering

### Design Resources

**UI Components:**
- shadcn/ui: https://ui.shadcn.com/
- Tailwind CSS: https://tailwindcss.com/
- Heroicons: https://heroicons.com/

**Legal Templates:**
- California custody agreement templates
- Parenting plan examples
- Court filing requirements by state

### Community & Support

**Stack Overflow Tags:**
- fastapi
- sqlalchemy
- supabase
- anthropic-claude

**Discord Communities:**
- FastAPI Discord
- Supabase Discord

---

## 🔍 Troubleshooting Common Issues

### "Database connection failed"
**Symptoms:** Can't connect to PostgreSQL  
**Causes:**
1. Docker container not running
2. Wrong connection string
3. Database not initialized

**Solutions:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart if needed
docker-compose restart postgres

# Check logs
docker-compose logs postgres

# Verify connection string in .env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/commonground
```

### "Import errors"
**Symptoms:** `ModuleNotFoundError: No module named 'app'`  
**Cause:** Virtual environment not activated or wrong directory

**Solution:**
```bash
# Activate venv
cd mvp/backend
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Verify installation
pip list | grep fastapi
```

### "Alembic migration issues"
**Symptoms:** Migration fails or creates wrong changes  
**Causes:**
1. Models out of sync with database
2. Previous migration not applied
3. Database in inconsistent state

**Solutions:**
```bash
# Check current version
alembic current

# View migration history
alembic history

# If stuck, reset (DEV ONLY):
alembic downgrade base
alembic upgrade head

# Or recreate tables (DEV ONLY):
DROP DATABASE commonground;
CREATE DATABASE commonground;
alembic upgrade head
```

### "Authentication not working"
**Symptoms:** Login fails, token rejected  
**Causes:**
1. Email not verified in Supabase
2. Wrong secret key
3. Token expired

**Solutions:**
```bash
# Check Supabase dashboard - confirm email verified
# Verify SECRET_KEY in .env matches what was used
# Check token expiration settings in security.py

# Test token manually:
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### "ARIA responses are slow"
**Symptoms:** Message sending takes >5 seconds  
**Causes:**
1. Anthropic API latency
2. No caching
3. Complex analysis

**Solutions:**
```python
# Add caching for common patterns
# Use streaming responses for long generations
# Implement timeout and fallback
# Consider async task queue for analysis
```

---

## 📊 Success Metrics & KPIs

### Development Metrics (Track Weekly)
- [ ] Endpoints completed this week
- [ ] Test coverage (target: 80%+)
- [ ] API response time (target: <500ms)
- [ ] Open bugs (target: <5)
- [ ] Documentation up to date

### Product Metrics (After Launch)
- Monthly Active Users (MAU)
- Cases created per month
- Messages sent per day
- ARIA intervention rate
- Agreement completion rate
- User retention (30-day, 90-day)
- Conversion to paid (free → Basic)

### Business Metrics
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate
- Net Promoter Score (NPS)

### Impact Metrics (The "Why")
- Reduction in conflict (toxicity scores over time)
- Agreement compliance rate
- Time to resolve disputes
- Court intervention reduction
- Child outcomes (surveys)

---

## 🌟 The Vision: What We're Building Towards

### Short-Term (6 months)
- 100 active cases
- Partnership with 2-3 family law firms
- Pilot program with 1 court
- $10k MRR

### Medium-Term (1 year)
- 1,000 active cases
- 10+ court partnerships
- Mobile apps launched
- $50k MRR
- Seed funding raise

### Long-Term (3-5 years)
- 100,000+ active cases
- Standard tool for family courts nationwide
- Integration with case management systems
- International expansion
- Acquisition opportunity or IPO path

### Impact Goals
- Reduce post-divorce conflict by 40%
- Increase agreement compliance by 50%
- Save courts 1,000+ hours of hearing time
- Help 10,000+ children have better co-parenting experiences

---

## 🎨 Brand Identity

### Logo Concept
- Two abstract parent figures reaching toward each other
- Child silhouette in the middle (the common ground)
- Colors: Calming blues and greens (trust, growth)
- Modern, clean, professional

### Color Palette
- **Primary:** #2563EB (Trust Blue)
- **Secondary:** #10B981 (Growth Green)
- **Accent:** #8B5CF6 (Hope Purple)
- **Neutral:** #64748B (Professional Gray)
- **Warning:** #F59E0B (Attention Orange)
- **Error:** #EF4444 (Alert Red)

### Typography
- **Headings:** Inter (clean, modern)
- **Body:** System fonts (fast, accessible)
- **Monospace:** JetBrains Mono (for code/data)

---

## 📝 Final Notes

### Current State (December 30, 2025)
- ✅ Weeks 1-4 complete (Authentication + Case Management)
- 🔲 Week 5-6 ready to start (Agreement Builder)
- 💪 Strong foundation built
- 📈 On track for Q2 2025 beta launch

### What Makes This Special
1. **AI-First:** ARIA is not a gimmick - it's core value
2. **Court-Ready:** Built for legal compliance from day one
3. **Child-Focused:** Every decision prioritizes child welfare
4. **Comprehensive:** Not just messaging or scheduling - the whole system
5. **Modern:** Fast, secure, beautiful UX
6. **Mission-Driven:** Built by someone who cares about the problem

### Why This Matters
750,000 families separate each year. Co-parenting is hard. Courts are overwhelmed. Children suffer when parents can't communicate. CommonGround can change that.

Technology should reduce conflict, not enable it. AI should mediate, not manipulate. Platforms should heal, not harm.

**That's what we're building.**

---

## 🚀 Let's Build This

**Remember:**
- You've already proven the concept (6 working demos)
- You've built the foundation (21 database tables, auth, cases)
- You have a clear plan (12-week roadmap)
- You have the skills (IT PM + cybersecurity + coding)
- You have the passion (Forever Forward, real experience)

**10 hours a week. 8 more weeks. You've got this.**

---

*Last Updated: December 30, 2025*  
*Next Review: January 6, 2025 (after Week 5-6)*  
*Document Version: 1.0*

**Claude Instructions:**
When working on CommonGround, always:
1. Check this file first for context
2. Reference existing code before creating new
3. Port from demos when applicable
4. Consider child welfare and security in every decision
5. Follow established patterns (async, error handling, auth)
6. Write tests for new functionality
7. Update this document when architecture changes

**Current Focus:** Week 5-6 - Agreement Builder™ implementation
# Enhanced claude.md Features & Automation Guide

## What claude.md CAN vs CANNOT Do

### ✅ claude.md CAN (Instructions for Claude):
- **Instruct** Claude to maintain changelog
- **Reference** scripts and automation
- **Guide** development workflow
- **Document** known issues and solutions
- **Define** commit message standards
- **Specify** what to track and where

### ❌ claude.md CANNOT (Needs Scripts):
- **Execute** git commands automatically
- **Run** scripts without being asked
- **Automatically** log errors to files
- **Monitor** system errors in real-time
- **Push** to GitHub on its own

**Solution:** Use claude.md to INSTRUCT + Scripts to AUTOMATE

---

## 🔧 Enhanced claude.md Sections to Add

### 1. Development Workflow Automation Instructions

Add this to your `claude.md`:

```markdown
## 🤖 Automated Development Workflow

### When Claude Helps You Code

**After completing each task, Claude should automatically:**

1. **Update CHANGELOG.md**
   - Add entry under "Unreleased" section
   - Follow Keep a Changelog format
   - Include what was added/changed/fixed

2. **Update IMPLEMENTATION_PROGRESS.md**
   - Mark completed tasks with ✅
   - Update status sections
   - Add completion date
   - Note any blockers or lessons learned

3. **Check for Known Issues**
   - Search KNOWN_ISSUES.md for similar problems
   - Add new issues if encountered
   - Link to solutions

4. **Suggest Commit Message**
   - Follow conventional commits
   - Include ticket/issue reference
   - Example: "feat(agreements): add section approval endpoint #42"

5. **Prompt for Documentation**
   - Ask if API docs need updating
   - Suggest adding example to docs/examples/
   - Update relevant README sections

### Git Commit Workflow (Claude-Assisted)

When you say "commit this work", Claude should:

1. Review changed files
2. Generate conventional commit message
3. Suggest commands:
   ```bash
   git add app/api/v1/endpoints/agreements.py
   git add tests/integration/test_agreements.py
   git commit -m "feat(agreements): add section update endpoint
   
   - Implement PUT /agreements/{id}/sections/{section_id}
   - Add validation for required fields
   - Include integration tests
   
   Closes #42"
   ```
4. Ask: "Ready to push to GitHub?"
5. If yes, provide: `git push origin feature/agreements`

### When to Create New Branches

Claude should suggest creating a new branch for:
- New features: `feature/feature-name`
- Bug fixes: `fix/bug-description`
- Documentation: `docs/what-changed`
- Refactoring: `refactor/component-name`

**Command template:**
```bash
git checkout -b feature/agreements-approval
git push -u origin feature/agreements-approval
```

### Pull Request Checklist

Before suggesting a PR, Claude verifies:
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No console.log or debug code
- [ ] Type hints added (Python)
- [ ] Error handling included
- [ ] No sensitive data in commits

Then provides PR template:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```
```

---

### 2. Error Tracking & Known Issues System

Add this to your `claude.md`:

```markdown
## 🐛 Error Tracking & Known Issues

### Structure

```
docs/
├── known-issues/
│   ├── README.md                    # Index of all issues
│   ├── 001-supabase-email-verify.md
│   ├── 002-alembic-migration-fail.md
│   ├── 003-aria-timeout.md
│   └── [SOLVED]/                    # Archived solved issues
│       └── 001-database-connection.md
├── errors/
│   ├── 2025-12-30-errors.log       # Daily error logs
│   └── error-patterns.md            # Common error patterns
└── solutions/
    ├── quick-fixes.md               # Common quick fixes
    └── debugging-guides.md          # Step-by-step debugging
```

### When Claude Encounters an Error

**Automatic Process:**

1. **Capture Error Details**
   ```markdown
   ## Error: [Brief Description]
   **Date:** 2025-12-30
   **File:** app/services/auth.py:42
   **Function:** register_user()
   
   **Error Message:**
   ```python
   sqlalchemy.exc.IntegrityError: duplicate key value violates unique constraint "users_email_key"
   ```
   
   **Context:**
   - What I was trying to do
   - Input data (sanitized)
   - Environment (dev/prod)
   
   **Stack Trace:**
   [full traceback]
   ```

2. **Check Known Issues First**
   - Search docs/known-issues/ for similar errors
   - If found, link to solution
   - If new, create new issue file

3. **Document Solution**
   ```markdown
   **Solution:**
   1. Check if user already exists before insert
   2. Use `get_or_create` pattern
   3. Add unique constraint validation
   
   **Code Fix:**
   ```python
   # Before
   new_user = User(email=email)
   db.add(new_user)
   
   # After
   existing = await db.execute(
       select(User).where(User.email == email)
   )
   if existing.scalar_one_or_none():
       raise HTTPException(400, "Email already registered")
   ```
   
   **Prevention:**
   - Add email validation in schema
   - Check uniqueness before DB operation
   - Return clear error message to user
   ```

4. **Update Error Log**
   Append to `docs/errors/YYYY-MM-DD-errors.log`:
   ```
   [2025-12-30 14:32:15] ERROR | auth.register_user | IntegrityError
   → Duplicate email attempt: test@example.com
   → Solution: Added pre-check validation
   → Reference: docs/known-issues/004-duplicate-email.md
   ```

### Known Issues Template

File: `docs/known-issues/XXX-issue-name.md`

```markdown
# Issue #XXX: [Short Title]

## Status
🔴 OPEN | 🟡 IN PROGRESS | 🟢 SOLVED

## Severity
CRITICAL | HIGH | MEDIUM | LOW

## First Occurred
2025-12-30

## Last Occurred
2025-12-30 (ongoing)

## Description
Clear description of the problem

## Symptoms
- What the user experiences
- Error messages shown
- Where it breaks

## Root Cause
Technical explanation of why this happens

## Temporary Workaround
Quick fix to unblock development

## Permanent Solution
Proper fix (if known)

## Steps to Reproduce
1. Step 1
2. Step 2
3. Error occurs

## Related Issues
- Links to similar problems
- GitHub issues
- Stack Overflow threads

## Files Affected
- app/services/auth.py
- app/models/user.py

## Fix Status
- [ ] Root cause identified
- [ ] Temporary workaround implemented
- [ ] Permanent fix designed
- [ ] Tests added
- [ ] Documentation updated
- [ ] Deployed to production

## Notes
Any additional context or learnings
```

### Quick Reference: Common Errors

Claude should maintain `docs/solutions/quick-fixes.md`:

```markdown
# Quick Fixes for Common Errors

## Database Connection Failed
**Error:** `Connection refused` or `could not connect to server`
**Fix:**
```bash
docker-compose restart postgres
# Wait 10 seconds, then:
alembic upgrade head
```

## Import Errors
**Error:** `ModuleNotFoundError: No module named 'app'`
**Fix:**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

## Migration Conflicts
**Error:** `Multiple head revisions`
**Fix:**
```bash
alembic heads  # Show all heads
alembic merge head1 head2 -m "merge migrations"
alembic upgrade head
```

## ARIA Timeout
**Error:** `anthropic.APITimeoutError`
**Fix:**
```python
# Increase timeout
client = anthropic.Anthropic(timeout=30.0)

# Or add retry logic
@retry(max_attempts=3, backoff=2.0)
async def analyze_message(...):
    ...
```
```

### Error Pattern Recognition

Claude should track patterns in `docs/errors/error-patterns.md`:

```markdown
# Common Error Patterns

## Pattern: "Works Locally, Fails in Production"
**Frequency:** 3 times this month
**Cause:** Environment variable differences
**Solution:** 
1. Compare .env vs production env
2. Use Railway dashboard to verify
3. Add env validation at startup

## Pattern: "Intermittent Timeout on ARIA Calls"
**Frequency:** ~5% of requests
**Cause:** Anthropic API rate limiting or network issues
**Solution:**
1. Add exponential backoff
2. Cache common responses
3. Implement circuit breaker

## Pattern: "Foreign Key Constraint Violations"
**Frequency:** During migrations
**Cause:** Data doesn't match new schema
**Solution:**
1. Always migrate data in same transaction
2. Add data validation migration step
3. Test on copy of production data
```
```

---

### 3. Changelog Maintenance

Add this to your `claude.md`:

```markdown
## 📝 Changelog Maintenance

### Automatic Updates

After every code change, Claude should update `CHANGELOG.md`:

**Format (Keep a Changelog):**

```markdown
# Changelog

All notable changes to CommonGround will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Agreement section update endpoint (2025-12-30)
- Dual approval workflow for agreements (2025-12-30)

### Changed
- Improved error messages for case invitation (2025-12-29)

### Fixed
- Case participant role validation (2025-12-29)

## [0.2.0] - 2025-12-29

### Added
- Complete case management system
- Child CRUD operations
- Case invitation workflow

### Security
- Added access control for case operations
- Implemented audit logging

## [0.1.0] - 2025-12-28

### Added
- Initial authentication system
- User registration with Supabase
- JWT token management
- Protected routes
```

### When to Update

**Added:** New features, endpoints, models
**Changed:** Modifications to existing functionality
**Deprecated:** Features being phased out
**Removed:** Deleted features
**Fixed:** Bug fixes
**Security:** Security improvements

### Version Bumping

Claude should suggest version bumps:
- **Major (1.0.0):** Breaking changes
- **Minor (0.1.0):** New features, backward compatible
- **Patch (0.0.1):** Bug fixes only
```

---

### 4. Development Journal

Add this to your `claude.md`:

```markdown
## 📔 Development Journal

### Structure

```
docs/
└── journal/
    ├── 2025-12-week-52.md    # Weekly summaries
    ├── 2025-12-week-53.md
    └── decisions.md           # Architecture decisions
```

### Weekly Journal Template

File: `docs/journal/YYYY-MM-week-XX.md`

```markdown
# Week XX Development Journal

**Dates:** Dec 30 - Jan 5, 2025
**Focus:** Agreement Builder Implementation

## Goals This Week
- [ ] Port interview questions from demo
- [ ] Implement section update endpoints
- [ ] Add dual approval workflow
- [ ] Generate PDF agreements

## What Got Done ✅
1. **Agreement Section Endpoint** (4 hours)
   - Created PUT /agreements/{id}/sections/{section_id}
   - Added validation for 18 section types
   - Tests passing
   
2. **PDF Generation** (3 hours)
   - Installed ReportLab
   - Created basic template
   - Outputs court-ready format

## Blockers & Solutions 🚧
**Blocker:** ReportLab pagination for long agreements
**Solution:** Implemented custom page break logic

**Blocker:** Approval workflow edge cases
**Solution:** Added state machine for status transitions

## Lessons Learned 📚
- ReportLab has a learning curve - check docs first
- SQLAlchemy async relationships need careful session management
- Testing PDF generation requires file comparison, not string

## Code Quality Metrics
- Tests written: 8 new tests
- Coverage: 87% → 89%
- Bugs fixed: 2
- New known issues: 1 (ARIA timeout)

## Time Breakdown
- Feature development: 12 hours
- Bug fixes: 2 hours
- Testing: 3 hours
- Documentation: 1 hour
- **Total:** 18 hours

## Next Week Preview
- Complete agreement approval workflow
- Add agreement version history
- Start ARIA messaging integration

## Notes
Agreement data model is solid. Should be smooth path to completion.
```

### Architecture Decision Records (ADR)

File: `docs/journal/decisions.md`

```markdown
# Architecture Decision Records

## ADR-001: Use Supabase for Authentication

**Date:** 2025-12-20
**Status:** Accepted

**Context:**
Need authentication system for MVP. Options: Auth0, Firebase, Supabase, custom JWT.

**Decision:**
Use Supabase Auth

**Reasoning:**
- Free tier sufficient for MVP
- PostgreSQL database included
- Python client available
- Easy email verification
- Storage for future file uploads

**Consequences:**
- Vendor lock-in (mitigated by standard PostgreSQL)
- Must sync Supabase users to local DB
- Email verification required (can disable if needed)

**Alternatives Considered:**
- Auth0: More expensive, overkill for MVP
- Firebase: Good but prefer PostgreSQL over Firestore
- Custom JWT: More work, security concerns

---

## ADR-002: Async SQLAlchemy Over Sync

**Date:** 2025-12-22
**Status:** Accepted

**Context:**
FastAPI supports both sync and async database operations.

**Decision:**
Use async SQLAlchemy 2.0 throughout

**Reasoning:**
- Better performance for I/O-heavy operations
- Scales better with WebSockets (future)
- Modern FastAPI best practice
- Non-blocking for ARIA API calls

**Consequences:**
- Slightly more complex code (async/await)
- All DB operations must be awaited
- Testing requires async fixtures

---

## ADR-003: Single claude.md vs Multiple Docs

**Date:** 2025-12-30
**Status:** Accepted

**Context:**
How to organize development documentation?

**Decision:**
Single comprehensive claude.md + supporting docs in docs/

**Reasoning:**
- Claude Code looks for claude.md first
- Single source of truth for context
- Can reference other docs from it
- Easy to update in one place

**Consequences:**
- File can get large (mitigated by good structure)
- Need discipline to keep updated
- Supporting docs for detailed topics

**Structure:**
```
claude.md                      # Master context file
docs/
├── known-issues/             # Issue tracking
├── journal/                  # Development log
├── api/                      # API documentation
└── architecture/             # Deep dives
```
```
```

---

## 🚀 Automation Scripts to Create

### Script 1: Auto-Changelog Generator

File: `scripts/update_changelog.py`

```python
#!/usr/bin/env python3
"""
Automatically update CHANGELOG.md based on git commits since last tag
Usage: python scripts/update_changelog.py
"""

import subprocess
from datetime import datetime

def get_commits_since_last_tag():
    """Get all commits since last version tag"""
    try:
        last_tag = subprocess.check_output(
            ['git', 'describe', '--tags', '--abbrev=0'],
            stderr=subprocess.DEVNULL
        ).decode().strip()
    except:
        last_tag = None
    
    if last_tag:
        commits = subprocess.check_output(
            ['git', 'log', f'{last_tag}..HEAD', '--oneline']
        ).decode().strip().split('\n')
    else:
        commits = subprocess.check_output(
            ['git', 'log', '--oneline']
        ).decode().strip().split('\n')
    
    return commits

def categorize_commit(commit_msg):
    """Categorize commit by conventional commit prefix"""
    if commit_msg.startswith('feat:'):
        return 'Added'
    elif commit_msg.startswith('fix:'):
        return 'Fixed'
    elif commit_msg.startswith('docs:'):
        return 'Documentation'
    elif commit_msg.startswith('refactor:'):
        return 'Changed'
    elif commit_msg.startswith('test:'):
        return 'Testing'
    elif commit_msg.startswith('chore:'):
        return 'Maintenance'
    else:
        return 'Changed'

def update_changelog():
    """Update CHANGELOG.md with new commits"""
    commits = get_commits_since_last_tag()
    
    categorized = {
        'Added': [],
        'Changed': [],
        'Fixed': [],
        'Security': [],
        'Documentation': []
    }
    
    for commit in commits:
        if not commit:
            continue
        msg = commit.split(' ', 1)[1] if ' ' in commit else commit
        category = categorize_commit(msg)
        if category in categorized:
            # Remove prefix for cleaner changelog
            clean_msg = msg.split(':', 1)[1].strip() if ':' in msg else msg
            categorized[category].append(f"- {clean_msg}")
    
    # Read current changelog
    try:
        with open('CHANGELOG.md', 'r') as f:
            changelog = f.read()
    except:
        changelog = "# Changelog\n\n"
    
    # Build new unreleased section
    today = datetime.now().strftime('%Y-%m-%d')
    unreleased = ["\n## [Unreleased]\n"]
    
    for category in ['Added', 'Changed', 'Fixed', 'Security', 'Documentation']:
        if categorized[category]:
            unreleased.append(f"\n### {category}\n")
            unreleased.extend([f"{item}\n" for item in categorized[category]])
    
    # Insert after title
    lines = changelog.split('\n')
    new_changelog = lines[0] + '\n' + ''.join(unreleased) + '\n'.join(lines[1:])
    
    # Write back
    with open('CHANGELOG.md', 'w') as f:
        f.write(new_changelog)
    
    print(f"✅ Updated CHANGELOG.md with {len(commits)} commits")

if __name__ == '__main__':
    update_changelog()
```

**Usage:**
```bash
# Run after committing but before pushing
python scripts/update_changelog.py
git add CHANGELOG.md
git commit -m "docs: update changelog"
git push
```

---

### Script 2: Error Logger

File: `scripts/log_error.py`

```python
#!/usr/bin/env python3
"""
Log an error to the appropriate files
Usage: python scripts/log_error.py
"""

import sys
from datetime import datetime
from pathlib import Path

def log_error():
    """Interactive error logging"""
    print("🐛 Error Logger\n")
    
    # Gather error details
    error_title = input("Error title (brief): ")
    error_file = input("File where error occurred: ")
    error_message = input("Error message: ")
    
    print("\nStack trace (paste below, press Ctrl+D when done):")
    stack_trace = sys.stdin.read()
    
    severity = input("Severity (1=LOW, 2=MEDIUM, 3=HIGH, 4=CRITICAL): ")
    severity_map = {
        '1': 'LOW',
        '2': 'MEDIUM',
        '3': 'HIGH',
        '4': 'CRITICAL'
    }
    severity_text = severity_map.get(severity, 'MEDIUM')
    
    # Create docs/known-issues if doesn't exist
    issues_dir = Path('docs/known-issues')
    issues_dir.mkdir(parents=True, exist_ok=True)
    
    # Get next issue number
    existing_issues = list(issues_dir.glob('*.md'))
    issue_num = len(existing_issues) + 1
    
    # Create issue file
    today = datetime.now().strftime('%Y-%m-%d')
    issue_file = issues_dir / f"{issue_num:03d}-{error_title.lower().replace(' ', '-')}.md"
    
    issue_content = f"""# Issue #{issue_num:03d}: {error_title}

## Status
🔴 OPEN

## Severity
{severity_text}

## First Occurred
{today}

## Last Occurred
{today}

## Description
{error_message}

## Symptoms
[Describe what the user experiences]

## Files Affected
- {error_file}

## Stack Trace
```
{stack_trace}
```

## Root Cause
[To be determined]

## Temporary Workaround
[If any]

## Permanent Solution
[To be implemented]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. Error occurs

## Fix Status
- [ ] Root cause identified
- [ ] Temporary workaround implemented
- [ ] Permanent fix designed
- [ ] Tests added
- [ ] Documentation updated

## Notes
Created: {today}
"""
    
    with open(issue_file, 'w') as f:
        f.write(issue_content)
    
    # Append to daily error log
    error_log_dir = Path('docs/errors')
    error_log_dir.mkdir(parents=True, exist_ok=True)
    
    log_file = error_log_dir / f"{today}-errors.log"
    log_entry = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {severity_text} | {error_file} | {error_message}\n"
    log_entry += f"→ Reference: docs/known-issues/{issue_file.name}\n\n"
    
    with open(log_file, 'a') as f:
        f.write(log_entry)
    
    print(f"\n✅ Error logged:")
    print(f"   Issue file: {issue_file}")
    print(f"   Log entry: {log_file}")
    print(f"\n💡 Next steps:")
    print(f"   1. Investigate root cause")
    print(f"   2. Update issue file with findings")
    print(f"   3. Mark as solved when fixed")

if __name__ == '__main__':
    log_error()
```

**Usage:**
```bash
# When you hit an error
python scripts/log_error.py

# It will create:
# - docs/known-issues/XXX-error-name.md
# - docs/errors/YYYY-MM-DD-errors.log (append)
```

---

### Script 3: Git Workflow Helper

File: `scripts/git_workflow.sh`

```bash
#!/bin/bash
# Git Workflow Helper
# Usage: ./scripts/git_workflow.sh

echo "🚀 CommonGround Git Workflow Helper"
echo ""

# Check if there are changes
if [[ -z $(git status -s) ]]; then
    echo "✅ No changes to commit"
    exit 0
fi

# Show changed files
echo "📝 Changed files:"
git status -s
echo ""

# Ask for commit type
echo "Select commit type:"
echo "1) feat     - New feature"
echo "2) fix      - Bug fix"
echo "3) docs     - Documentation"
echo "4) refactor - Code refactoring"
echo "5) test     - Adding tests"
echo "6) chore    - Maintenance"
read -p "Type (1-6): " commit_type

case $commit_type in
    1) type="feat";;
    2) type="fix";;
    3) type="docs";;
    4) type="refactor";;
    5) type="test";;
    6) type="chore";;
    *) echo "Invalid type"; exit 1;;
esac

# Ask for scope
read -p "Scope (e.g., auth, agreements, api): " scope

# Ask for message
read -p "Short description: " description

# Build commit message
if [[ -n $scope ]]; then
    commit_msg="${type}(${scope}): ${description}"
else
    commit_msg="${type}: ${description}"
fi

echo ""
echo "📋 Commit message:"
echo "   $commit_msg"
echo ""

read -p "Proceed with commit? (y/n): " proceed

if [[ $proceed != "y" ]]; then
    echo "❌ Cancelled"
    exit 0
fi

# Stage all changes
git add .

# Commit
git commit -m "$commit_msg"

echo "✅ Committed!"
echo ""

# Update changelog
if command -v python3 &> /dev/null; then
    echo "📝 Updating changelog..."
    python3 scripts/update_changelog.py
    
    # Amend commit with changelog
    git add CHANGELOG.md
    git commit --amend --no-edit
    echo "✅ Changelog updated"
fi

echo ""
read -p "Push to remote? (y/n): " push

if [[ $push == "y" ]]; then
    # Get current branch
    branch=$(git branch --show-current)
    
    # Push
    git push origin $branch
    echo "✅ Pushed to origin/$branch"
fi

echo ""
echo "🎉 Done!"
```

**Make it executable:**
```bash
chmod +x scripts/git_workflow.sh
```

**Usage:**
```bash
# Instead of manual git commands
./scripts/git_workflow.sh

# It will:
# 1. Show changed files
# 2. Ask for commit type/scope/message
# 3. Create conventional commit
# 4. Update CHANGELOG.md
# 5. Push to GitHub
```

---

### Script 4: Daily Development Summary

File: `scripts/daily_summary.py`

```python
#!/usr/bin/env python3
"""
Generate a daily development summary
Usage: python scripts/daily_summary.py
"""

import subprocess
from datetime import datetime, timedelta
from pathlib import Path

def get_today_commits():
    """Get commits from today"""
    today = datetime.now().strftime('%Y-%m-%d')
    commits = subprocess.check_output(
        ['git', 'log', '--since', today, '--oneline'],
        stderr=subprocess.DEVNULL
    ).decode().strip()
    
    return commits.split('\n') if commits else []

def get_files_changed_today():
    """Get list of files changed today"""
    today = datetime.now().strftime('%Y-%m-%d')
    files = subprocess.check_output(
        ['git', 'log', '--since', today, '--name-only', '--pretty=format:'],
        stderr=subprocess.DEVNULL
    ).decode().strip()
    
    unique_files = list(set([f for f in files.split('\n') if f]))
    return unique_files

def get_today_errors():
    """Get errors logged today"""
    today = datetime.now().strftime('%Y-%m-%d')
    error_log = Path(f'docs/errors/{today}-errors.log')
    
    if error_log.exists():
        with open(error_log, 'r') as f:
            errors = f.read()
        return errors.count('[')  # Count of error entries
    return 0

def generate_summary():
    """Generate daily development summary"""
    today = datetime.now().strftime('%Y-%m-%d')
    commits = get_today_commits()
    files = get_files_changed_today()
    errors = get_today_errors()
    
    summary = f"""
# Daily Development Summary - {today}

## Activity
- **Commits:** {len(commits)}
- **Files Changed:** {len(files)}
- **Errors Logged:** {errors}

## Commits Today
"""
    
    if commits:
        for commit in commits:
            summary += f"- {commit}\n"
    else:
        summary += "No commits today\n"
    
    summary += "\n## Files Modified\n"
    
    if files:
        for file in files[:20]:  # Limit to 20
            summary += f"- {file}\n"
    else:
        summary += "No files changed\n"
    
    summary += f"\n## Notes\n[Add any notes about today's work]\n"
    
    # Save to journal
    journal_dir = Path('docs/journal')
    journal_dir.mkdir(parents=True, exist_ok=True)
    
    summary_file = journal_dir / f'{today}-summary.md'
    with open(summary_file, 'w') as f:
        f.write(summary)
    
    print(summary)
    print(f"\n✅ Summary saved to {summary_file}")

if __name__ == '__main__':
    generate_summary()
```

**Usage:**
```bash
# Run at end of each day
python scripts/daily_summary.py
```

---

## 🎯 Complete Setup Checklist

### 1. Update claude.md
```bash
# Add the enhanced sections from this file
cat claude-md-enhancements.md >> claude.md
```

### 2. Create Directory Structure
```bash
mkdir -p docs/{known-issues,errors,journal,solutions,api,architecture}
mkdir -p docs/known-issues/SOLVED
mkdir -p scripts
```

### 3. Create Scripts
```bash
# Copy the scripts above into:
scripts/update_changelog.py
scripts/log_error.py
scripts/git_workflow.sh
scripts/daily_summary.py

# Make executable
chmod +x scripts/*.sh
```

### 4. Initialize Files
```bash
# Create CHANGELOG.md if doesn't exist
echo "# Changelog" > CHANGELOG.md

# Create quick fixes
cat > docs/solutions/quick-fixes.md << 'EOF'
# Quick Fixes for Common Errors

(Add common errors and solutions here as you encounter them)
EOF

# Create error patterns
cat > docs/errors/error-patterns.md << 'EOF'
# Common Error Patterns

(Track recurring error patterns here)
EOF
```

### 5. Add to .gitignore
```bash
cat >> .gitignore << 'EOF'

# Development journals (optional - include if you want)
# docs/journal/

# Daily error logs (optional - include if you want)
# docs/errors/*.log
EOF
```

### 6. Test the Setup
```bash
# Test error logger
python scripts/log_error.py

# Test git workflow
./scripts/git_workflow.sh

# Test daily summary
python scripts/daily_summary.py
```

---

## 🎨 What This Gives You

### Automatic Tracking
✅ Every commit updates changelog
✅ Errors are systematically logged
✅ Known issues are documented
✅ Daily summaries generated

### Claude Integration
✅ Claude knows to maintain these files
✅ Claude references known issues
✅ Claude suggests proper commits
✅ Claude updates documentation

### Git Workflow
✅ Conventional commits enforced
✅ Changelog auto-updated
✅ Consistent process
✅ Easy to review history

### Error Management
✅ Centralized error tracking
✅ Solution documentation
✅ Pattern recognition
✅ Learning from mistakes

---

## 🚀 Daily Workflow Example

```bash
# Morning: Start work
cd mvp/backend
source venv/bin/activate
docker-compose up -d

# Work on feature
# ... code, test, fix ...

# Error occurs - log it
python scripts/log_error.py

# Fix the error, update the issue file
vim docs/known-issues/042-aria-timeout.md

# Ready to commit
./scripts/git_workflow.sh
# (It handles: stage, commit, changelog, push)

# End of day
python scripts/daily_summary.py

# Review what you did
cat docs/journal/$(date +%Y-%m-%d)-summary.md
```

---

This setup gives you **professional-grade development tracking** while keeping Claude fully informed about your project's state!
