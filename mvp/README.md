# CommonGround MVP - Production Application

This is the production-ready version of CommonGround, built from the proof-of-concept demos.

## 🏗️ Architecture

```
mvp/
├── backend/           # FastAPI + Supabase
├── frontend/          # Next.js 14 + React
├── docs/              # Technical documentation
└── docker-compose.yml # Local development environment
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Docker Desktop
- Supabase account (free tier)

### Setup

1. **Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Add your Supabase credentials
uvicorn app.main:app --reload
```

2. **Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local  # Add your Supabase credentials
npm run dev
```

3. **Database**
```bash
# Run migrations
cd backend
alembic upgrade head
```

## ✨ Features

### Built and Tested
- **🔐 Authentication System:** Supabase integration with JWT, email verification, and secure sessions
- **⚖️ Case Management:** Two-parent collaboration workflow with invitation system
- **📋 Agreement Builder™:** 18-section custody agreement templates with PDF generation
- **💬 ARIA™ Sentiment Shield:** AI-powered message toxicity detection and conflict prevention
- **📅 TimeBridge™ Scheduling:** Automated parenting time scheduling with compliance tracking
- **📧 Email Notifications:** HTML email templates for invitations, approvals, and reminders
- **📊 Compliance Metrics:** On-time rates, trend analysis, and court-ready reports
- **🔒 Access Control:** Role-based permissions and participant validation
- **📝 Audit Logging:** Complete audit trail for all case operations

### API Endpoints
- `/api/v1/auth/*` - Authentication and user management
- `/api/v1/cases/*` - Case and child management
- `/api/v1/agreements/*` - Agreement builder and PDF generation
- `/api/v1/messages/*` - ARIA-powered messaging system
- `/api/v1/schedule/*` - TimeBridge scheduling and check-ins

## 📚 Documentation

- [CHANGELOG](./backend/CHANGELOG.md) - Version history and changes
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🛣️ Development Roadmap

### ✅ Phase 1: Foundation (Weeks 1-4) - COMPLETE
- [x] Project structure and architecture
- [x] Database schema (21 tables)
- [x] Authentication system with Supabase
- [x] User registration and JWT tokens
- [x] Case management system
- [x] Two-parent collaboration workflow
- [x] Child management (CRUD operations)

### ✅ Phase 2: Core Features (Weeks 5-10) - COMPLETE
- [x] Agreement Builder™ (18-section custody agreements)
- [x] ARIA™ Sentiment Shield messaging system
- [x] TimeBridge™ scheduling with compliance tracking
- [x] Email notification service
- [x] PDF generation for court-ready documents
- [x] Real-time toxicity analysis
- [x] Exchange check-in system

### 📋 Phase 3: Production (Weeks 11-12) - IN PROGRESS
- [ ] Frontend web application (Next.js)
- [ ] Calendar integration
- [ ] Payment integration (ClearFund™)
- [ ] Court export packages
- [ ] Production deployment
- [ ] Beta testing

**Backend MVP Status:** 95% Complete ✅

## 🔧 Tech Stack

**Backend:**
- FastAPI (Python)
- SQLAlchemy + Alembic
- Supabase (PostgreSQL)
- Anthropic Claude API

**Frontend:**
- Next.js 14 (React + TypeScript)
- Supabase Auth
- TailwindCSS + shadcn/ui
- React Query

**Infrastructure:**
- Supabase (Database + Auth + Storage)
- Vercel (Frontend hosting)
- Docker (Local development)

## 📝 Environment Variables

See `.env.example` files in backend/ and frontend/ directories.

## 🤝 Contributing

This is a solo project. See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for workflow.
