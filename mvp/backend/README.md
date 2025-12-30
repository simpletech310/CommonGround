# CommonGround Backend

**Framework:** FastAPI  
**Database:** PostgreSQL + SQLAlchemy 2.0  
**Authentication:** Supabase  
**AI Integration:** Anthropic Claude + OpenAI  
**Current Status:** ✅ MVP Complete - All Endpoints Operational

---

## 📋 Overview

This is the backend API for CommonGround, providing RESTful endpoints for authentication, case management, ARIA messaging, agreements, and scheduling.

**API Modules:**
- 🔐 **Auth** - User registration, login, token management
- 📁 **Cases** - Case CRUD, invitations, participants
- 💬 **Messages** - ARIA-powered messaging with sentiment analysis
- 📝 **Agreements** - Agreement builder with 18 sections
- 📅 **Schedule** - Calendar events, check-ins, compliance

---

## 🏗️ Project Structure

\`\`\`
backend/
├── app/
│   ├── main.py                   # FastAPI application entry
│   ├── core/                     # Config, database, security
│   │   ├── config.py            # Settings
│   │   ├── database.py          # DB connection
│   │   └── security.py          # JWT, password hashing
│   ├── models/                   # SQLAlchemy models (10 models)
│   │   ├── user.py
│   │   ├── case.py
│   │   ├── message.py
│   │   ├── agreement.py
│   │   └── schedule.py
│   ├── schemas/                  # Pydantic schemas
│   ├── api/v1/endpoints/         # REST endpoints
│   │   ├── auth.py              ✅ COMPLETE
│   │   ├── cases.py             ✅ COMPLETE
│   │   ├── messages.py          ✅ COMPLETE
│   │   ├── agreements.py        ✅ COMPLETE
│   │   └── schedule.py          ✅ COMPLETE
│   └── services/                 # Business logic
│       ├── auth.py
│       ├── case.py
│       ├── aria.py              # Sentiment analysis
│       ├── agreement.py
│       └── schedule.py
├── alembic/                      # Database migrations
└── tests/                        # Unit tests
\`\`\`

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- PostgreSQL 15+
- Supabase account (or local Supabase)
- Anthropic API key (for ARIA)
- OpenAI API key (optional, for ARIA)

### Installation

\`\`\`bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
\`\`\`

### Environment Variables

Create \`.env\` with:

\`\`\`bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/commonground

# Supabase
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret

# AI
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key  # Optional

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
\`\`\`

---

## 📡 API Endpoints

### Authentication (\`/api/v1/auth\`)
- \`POST /auth/register\` - Register new user
- \`POST /auth/login\` - Login user
- \`POST /auth/logout\` - Logout user
- \`GET /auth/me\` - Get current user
- \`POST /auth/refresh\` - Refresh access token

### Cases (\`/api/v1/cases\`)
- \`POST /cases/\` - Create new case
- \`GET /cases/\` - List user's cases
- \`GET /cases/{id}\` - Get case details
- \`POST /cases/{id}/accept\` - Accept invitation
- \`GET /cases/{id}/agreement\` - Get case agreement

### Messages (\`/api/v1/messages\`)
- \`POST /messages/\` - Send message
- \`GET /messages/case/{case_id}\` - Get messages
- \`POST /messages/analyze\` - ARIA analysis
  - Query params: \`case_id\`, \`content\`, \`use_ai\`, \`ai_provider\`

### Agreements (\`/api/v1/agreements\`)
- \`POST /agreements/\` - Create agreement
- \`GET /agreements/{id}\` - Get agreement
- \`GET /agreements/{id}/sections\` - Get all sections
- \`PUT /agreements/{id}/sections/{section_id}\` - Update section
- \`POST /agreements/{id}/approve\` - Approve agreement
- \`GET /agreements/{id}/pdf\` - Generate PDF

### Schedule (\`/api/v1/schedule\`)
- \`GET /schedule/cases/{case_id}/calendar\` - Get calendar view
- \`GET /schedule/cases/{case_id}/events\` - Get events
- \`POST /schedule/check-ins\` - Create check-in
- \`GET /schedule/events/{event_id}/check-ins\` - Get check-ins
- \`GET /schedule/cases/{case_id}/compliance\` - Get compliance metrics

---

## 🤖 ARIA Sentiment Analysis

**Three-Tier Analysis System:**

1. **Regex Tier** (Fast, free)
   - Pattern matching for common toxic phrases
   - No API calls required
   - Good for obvious cases

2. **Claude Tier** (Anthropic)
   - Nuanced sentiment analysis
   - Context-aware toxicity detection
   - Message rewrite suggestions

3. **OpenAI Tier** (Optional fallback)
   - Alternative to Claude
   - Same capabilities
   - Cost-effective option

**Analysis Response:**
\`\`\`json
{
  "toxicity_level": "green|yellow|orange|red",
  "toxicity_score": 0-100,
  "categories": ["hostility", "blame"],
  "triggers": ["you never", "always"],
  "explanation": "...",
  "suggestion": "Rewritten message...",
  "is_flagged": true/false
}
\`\`\`

---

## 🗄️ Database Models

**Core Models:**
- \`User\` - User accounts
- \`UserProfile\` - Extended user info
- \`Case\` - Custody cases
- \`CaseParticipant\` - Parent participation
- \`Child\` - Children information
- \`Agreement\` - Custody agreements
- \`AgreementSection\` - Agreement sections
- \`Message\` - Communications
- \`MessageFlag\` - ARIA interventions
- \`ScheduleEvent\` - Calendar events
- \`ExchangeCheckIn\` - Check-in records

See [CLAUDE.md](../CLAUDE.md) for complete schema documentation.

---

## 🧪 Development

### Run Tests

\`\`\`bash
pytest
pytest --cov=app tests/
\`\`\`

### Database Migrations

\`\`\`bash
# Create migration
alembic revision -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
\`\`\`

### Code Quality

\`\`\`bash
# Type checking
mypy app/

# Linting
flake8 app/

# Formatting
black app/
\`\`\`

---

## 🚀 Deployment

### Railway (Recommended)

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Environment Variables (Production)
- All \`.env\` variables above
- \`DATABASE_URL\` - Railway PostgreSQL
- Production API keys

---

## 📝 Next Steps (V1.1)

**Planned for Weeks 13-18:**

1. **Agreement Sections Endpoint**
   - \`POST /agreements/{id}/sections\` - Create new section
   - Dynamic section validation

2. **Payment Tracking** (ClearFund™)
   - \`POST /payments/\` - Record payment
   - \`POST /expenses/\` - Submit expense
   - \`POST /expenses/{id}/approve\` - Approve expense

3. **Court Exports**
   - \`POST /exports/court-package\` - Generate package
   - PDF generation service

4. **Legal Access**
   - \`POST /legal-access/invite\` - Invite professional
   - Time-limited access tokens

5. **Notifications**
   - SendGrid integration
   - Email templates
   - Notification preferences

See [V1.1_ROADMAP.md](../V1.1_ROADMAP.md) for complete details.

---

**Last Updated:** December 30, 2025  
**Version:** MVP Complete - All Endpoints Operational  
**API Documentation:** http://localhost:8000/docs (FastAPI auto-generated)
