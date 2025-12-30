# CommonGround Module Status & Demo Guide

## Demo-to-Platform Mapping

This document maps the working demos to the full CommonGround platform vision.

---

## What's Built (Demos Available)

### 1. CommonGround Agreements™
**Demo:** `python app.py`
**Status:** ✅ Functional Demo

| Feature | Demo Status | Notes |
|---------|-------------|-------|
| 18-section interview | ✅ Complete | Full question flow |
| Agreement generation | ✅ Complete | PDF-ready output |
| Dual approval workflow | ✅ Complete | Both parents must approve |
| Version control | ✅ Complete | History tracked |
| Rule compilation | ⚠️ Partial | Integrated with other demos |

---

### 2. ARIA™ Agreement Assistant
**Demo:** `python aria_demo.py`
**Status:** ✅ Functional Demo

| Feature | Demo Status | Notes |
|---------|-------------|-------|
| Agreement Q&A | ✅ Complete | Grounded responses |
| Financial calculations | ✅ Complete | Splits, reimbursements |
| Date awareness | ✅ Complete | Whose week, notice periods |
| Search capability | ✅ Complete | Find relevant sections |

---

### 3. ARIA™ Sentiment Shield
**Demo:** `python shield_demo.py`
**Status:** ✅ Functional Demo

| Feature | Demo Status | Notes |
|---------|-------------|-------|
| Toxicity detection | ✅ Complete | Multi-category analysis |
| Intervention UI | ✅ Complete | Accept/modify/reject flow |
| Suggestion generation | ✅ Complete | AI-powered rewrites |
| Trend analytics | ✅ Complete | Per-user tracking |
| Good faith metrics | ✅ Complete | Acceptance rates |

**Toxicity Categories Detected:**
- Hostility
- Blame language
- Passive-aggressive
- All caps
- Profanity
- Dismissive
- Controlling

---

### 4. ClearFund™
**Demo:** `python clearfund_demo.py`
**Status:** ✅ Functional Demo

| Feature | Demo Status | Notes |
|---------|-------------|-------|
| Expense requests | ✅ Complete | Full lifecycle |
| Agreement-aware splits | ✅ Complete | 50/50, 60/40, etc. |
| Approval workflow | ✅ Complete | Approve/reject/partial |
| Payment tracking | ✅ Complete | Simulated Stripe |
| Receipt upload | ✅ Complete | Attachment support |
| Audit trail | ✅ Complete | Full history |
| Analytics | ✅ Complete | Per-category, per-user |

**Request Categories:**
- Medical
- Education
- Sports
- Device
- Camp
- Clothing
- Transportation
- Other

---

### 5. CaseExport™ (Court Export)
**Demo:** `python court_demo.py`
**Status:** ✅ Functional Demo

| Feature | Demo Status | Notes |
|---------|-------------|-------|
| Investigation packages | ✅ Complete | Claim-specific |
| Court packages | ✅ Complete | Comprehensive |
| Compliance summary | ✅ Complete | Side-by-side comparison |
| Redacted intervention log | ✅ Complete | Privacy-preserving |
| Parent impact summary | ✅ Complete | 90-day rolling |
| Chain of custody | ✅ Complete | Hash verification |

**Package Types:**
- Investigation Package (targeted)
- Court Package (comprehensive)

**Sections Generated:**
1. Agreement Overview
2. Compliance Summary
3. Parenting Time Report
4. Financial Compliance
5. Communication Compliance
6. Intervention Log (Redacted)
7. Parent Impact Summary
8. Chain of Custody & Integrity

---

### 6. MediatorMode™ (Legal Access)
**Demo:** `python legal_access_demo.py`
**Status:** ✅ Functional Demo

| Feature | Demo Status | Notes |
|---------|-------------|-------|
| Role-based access | ✅ Complete | GAL, Attorney, Clerk, etc. |
| Verification flow | ✅ Complete | ID, credentials, MFA |
| Access grant workflow | ✅ Complete | Parent-initiated |
| Legal dashboard | ✅ Complete | Compliance snapshot |
| Court packet generation | ✅ Complete | One-click export |
| Access logging | ✅ Complete | Full audit trail |
| Integrity verification | ✅ Complete | Hash validation |

**Roles Supported:**
| Role | Duration | Access Level |
|------|----------|--------------|
| Guardian ad Litem | 120 days | Full read, notes, export |
| Attorney (Petitioner) | 90 days | Read, export |
| Attorney (Respondent) | 90 days | Read, export |
| Mediator | 60 days | Read, patterns, summary |
| Court Clerk | 30 days | Verification, packets |
| Judge | 30 days | Clean facts only |

---

## What's Designed (Not Yet Demo'd)

### TimeBridge™ (Scheduling)
**Status:** 📋 Designed, data generated for demos

| Feature | Design Status | Demo Integration |
|---------|---------------|------------------|
| Calendar view | Designed | Handoff data in court_demo |
| Check-in system | Designed | Events in court_demo |
| GPS verification | Designed | Not implemented |
| Notifications | Designed | Not implemented |

*Note: Handoff events are generated and used in court export demos, but no standalone scheduling demo exists yet.*

---

### Child Wallet™
**Status:** 📋 Designed

| Feature | Design Status | Notes |
|---------|---------------|-------|
| Spending ledger | Designed | FIFO accounting planned |
| Stripe integration | Designed | Same as ClearFund |
| Compliance tracking | Designed | Not obligation tracking |

---

### ChildCore™
**Status:** 📋 Designed

| Feature | Design Status | Notes |
|---------|---------------|-------|
| Child profile | Designed | Basic structure |
| Medical info | Designed | Separate access controls |
| Education info | Designed | School, teacher, grade |
| One-way notes | Designed | Acknowledgment system |

---

### ChildVault™
**Status:** 📋 Designed

| Feature | Design Status | Notes |
|---------|---------------|-------|
| Item inventory | Designed | Who bought, where it is |
| Photo documentation | Designed | Optional |
| Location tracking | Designed | Mom's / Dad's / Other |

---

### CircleAccess™
**Status:** 📋 Designed

| Feature | Design Status | Notes |
|---------|---------------|-------|
| Approved contacts | Designed | Grandparents, etc. |
| Permission levels | Designed | Granular controls |
| Time restrictions | Designed | Day/time windows |

---

### TogetherTime™
**Status:** 📋 Designed

| Feature | Design Status | Notes |
|---------|---------------|-------|
| Watch-together | Designed | WebRTC sync |
| Camera reactions | Designed | Front-facing view |
| Session logging | Designed | Positive engagement |

---

### PlayBridge™
**Status:** 📋 Designed

| Feature | Design Status | Notes |
|---------|---------------|-------|
| Co-op games | Designed | Non-competitive |
| Simple mechanics | Designed | Ages 4-14 |
| Engagement logging | Designed | Bonding metrics |

---

## Demo Flow Recommendations

### For Courts (10 minutes)
1. `shield_demo.py` (2 min) - Show ARIA intervention
2. `court_demo.py` (5 min) - Court package generation
3. `legal_access_demo.py` (3 min) - Professional portal

### For Parents (5 minutes)
1. `shield_demo.py` (2 min) - Safe communication
2. `clearfund_demo.py` (2 min) - Expense handling
3. `aria_demo.py` (1 min) - Agreement questions

### For Attorneys (7 minutes)
1. `legal_access_demo.py` (3 min) - Access and verification
2. `court_demo.py` (3 min) - Evidence packages
3. `shield_demo.py` (1 min) - Good faith metrics

### Full Technical Demo (20 minutes)
1. `app.py` (5 min) - Agreement creation
2. `shield_demo.py` (3 min) - Communication
3. `clearfund_demo.py` (4 min) - Finances
4. `court_demo.py` (4 min) - Court export
5. `legal_access_demo.py` (4 min) - Legal access

---

## Sample Data Summary

All demos use the **Williams Family** case:

| Attribute | Value |
|-----------|-------|
| Petitioner | Marcus Williams |
| Respondent | Jennifer Williams |
| Children | Eric (6), Maya (4) |
| Custody Type | 50/50 Joint |
| Exchange Day | Friday 6:00 PM |
| Exchange Location | Vista Sheriff's Station |
| Grace Period | 15 minutes |

### Generated Metrics (90 days)

| Metric | Marcus | Jennifer |
|--------|--------|----------|
| Exchange compliance | 96% | 77% |
| On-time rate | 96% | 65% |
| ARIA interventions | 12 | 18 |
| Suggestions accepted | 75% | 28% |
| Toxicity levels | Mostly LOW | Mix (2 SEVERE) |
| ClearFund response | Same day | 3.2 days avg |
| Outstanding balance | $0 | $212.50 |

---

## File Structure

```
custody-demo/
├── app.py                    # Agreement Generator
├── aria_demo.py              # ARIA Q&A Assistant
├── shield_demo.py            # Sentiment Shield
├── clearfund_demo.py         # ClearFund Expenses
├── court_demo.py             # Court Export
├── legal_access_demo.py      # Legal Access Portal
│
├── aria/
│   ├── agent.py              # ARIA chatbot logic
│   ├── tools.py              # Search, calculator, dates
│   ├── sample_agreements.py  # Williams & Johnson agreements
│   ├── sentiment_shield.py   # Toxicity detection
│   ├── message_store.py      # Message tracking + analytics
│   ├── clearfund.py          # ClearFund models
│   ├── clearfund_store.py    # ClearFund database
│   ├── court_export.py       # Report generators
│   └── legal_access.py       # Professional access models
│
├── docs/
│   ├── CommonGround-Solution-Document.md
│   ├── CommonGround-Executive-Summary.md
│   └── Module-Status-Guide.md (this file)
│
├── agents/                   # Agreement interview agents
├── database/                 # SQLAlchemy models
└── schemas/                  # Pydantic models
```

---

## Running the Demos

```bash
# Install dependencies
pip install -r requirements.txt

# Run any demo
python app.py               # Agreement Generator
python aria_demo.py         # ARIA Assistant
python shield_demo.py       # Sentiment Shield
python clearfund_demo.py    # ClearFund
python court_demo.py        # Court Export
python legal_access_demo.py # Legal Access (recommended: choose option 1 for guided demo)
```

---

*Last Updated: December 2025*
