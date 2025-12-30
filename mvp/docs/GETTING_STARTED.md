# CommonGround MVP - Getting Started Guide

Welcome! This guide will help you get your CommonGround MVP up and running.

## 📋 What I've Built For You

I've created a **production-ready foundation** that transforms your proof-of-concept demos into a real web application:

### ✅ Complete Backend Architecture
- **FastAPI** application with async/await
- **PostgreSQL** database with comprehensive schema (10 models)
- **Supabase** integration ready (Auth + Database + Storage)
- **Docker** development environment
- **Alembic** migration setup (ready to initialize)
- **API structure** with versioning (v1)
- **CORS** and security middleware
- **Health check** endpoints

### ✅ Database Models (Production-Ready)
1. **User & UserProfile** - Authentication and user data
2. **Case & CaseParticipant** - The central co-parenting container
3. **Child** - Children in custody arrangements
4. **Agreement, AgreementVersion, AgreementSection** - Custody agreements with version control
5. **Message, MessageThread, MessageFlag** - Communication with ARIA integration
6. **ScheduleEvent, ExchangeCheckIn** - Parenting time tracking
7. **Payment, ExpenseRequest, PaymentLedger** - ClearFund financial system
8. **LegalAccess, CourtExport** - Professional access and court documents
9. **AuditLog, EventLog** - Compliance and chain of custody

### ✅ API Endpoints (Scaffolded)
- `/auth` - Registration, login, logout, token refresh
- `/users` - User profile management
- `/cases` - Case CRUD operations
- `/agreements` - Agreement management
- `/messages` - Messaging with ARIA

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd mvp/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Set Up Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add:
# - SECRET_KEY (generate with: openssl rand -hex 32)
# - ANTHROPIC_API_KEY (your existing key)
# - DATABASE_URL (see below)
```

### Step 3: Start Database with Docker

```bash
cd ..  # Back to mvp directory
docker-compose up -d postgres redis
```

Wait 10 seconds for PostgreSQL to initialize, then:

```bash
# Verify it's running
docker-compose ps
```

### Step 4: Initialize Database

```bash
cd backend
alembic init alembic  # Initialize Alembic
# Then run:
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

OR for quick dev testing:

```bash
# Start the app (it will auto-create tables in dev mode)
python -m app.main
```

### Step 5: Test API

```bash
# In another terminal
curl http://localhost:8000/

# Expected response:
{
  "app": "CommonGround",
  "version": "v1",
  "environment": "development",
  "status": "running"
}
```

Visit **http://localhost:8000/docs** for interactive API documentation!

---

## 🗺️ Your 12-Week Solo Roadmap

### **Weeks 1-2: Complete Authentication** ✋ YOU ARE HERE

**Goal:** Users can register, login, and manage their profiles.

**Tasks:**
1. ✅ Database schema (DONE)
2. ✅ API structure (DONE)
3. ⏳ Implement Supabase auth integration
4. ⏳ Complete `/auth/register` endpoint
5. ⏳ Complete `/auth/login` endpoint
6. ⏳ Add JWT middleware for protected routes
7. ⏳ Complete user profile endpoints
8. ⏳ Add email verification

**Resources:**
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

**Time Estimate:** 10-15 hours

---

### **Weeks 3-4: Case Management**

**Goal:** Parents can create cases and invite the other parent.

**Tasks:**
1. Complete case creation endpoint
2. Implement invitation system (email)
3. Build case approval workflow
4. Add child management (CRUD)
5. Create case dashboard data

**Deliverable:** Two parents can create and link their case.

**Time Estimate:** 15-20 hours

---

### **Weeks 5-6: Agreement Builder (MVP Version)**

**Goal:** Port your demo interview to a web API.

**Tasks:**
1. Create agreement interview endpoints (18 sections)
2. Store responses in `Agreement` and `AgreementSection` models
3. Generate PDF using ReportLab
4. Implement dual approval workflow
5. Compile rules to JSON

**Reuse:** Leverage your existing `CommonGround-demo/app.py` logic!

**Time Estimate:** 20-25 hours

---

### **Weeks 7-8: Messaging + ARIA Integration**

**Goal:** Real-time messaging with sentiment analysis.

**Tasks:**
1. Implement message endpoints
2. Port ARIA sentiment analysis from your demos
3. Create intervention UI flow (API returns flag data)
4. Add WebSocket for real-time delivery
5. Implement read receipts

**Reuse:** Your `shield_demo.py` has all the ARIA logic!

**Time Estimate:** 20-25 hours

---

### **Weeks 9-10: Scheduling (Basic)**

**Goal:** Calendar view and exchange tracking.

**Tasks:**
1. Generate schedule from agreement rules
2. Create exchange endpoints
3. Implement check-in system (GPS optional for MVP)
4. Add notifications (email/SMS via Twilio)
5. Build compliance tracking

**Time Estimate:** 15-20 hours

---

### **Weeks 11-12: Frontend + Polish**

**Goal:** Basic web UI that connects everything.

**Tasks:**
1. Create Next.js app (use shadcn/ui for components)
2. Build login/register pages
3. Create case dashboard
4. Add messaging interface
5. Agreement builder UI (simple forms)
6. Deploy to Vercel (frontend) + Railway (backend)

**Time Estimate:** 25-30 hours

**Total:** ~100-150 hours = 12-15 weeks at 10 hours/week

---

## 📦 What's NOT Built Yet (Your Work)

These are the files/features you need to implement:

### 1. **Authentication Service** (Priority 1)
File: `mvp/backend/app/services/auth.py`

```python
# You need to create this
class AuthService:
    async def register_user(self, email, password, ...):
        # Create Supabase user
        # Sync to local database
        # Send verification email
        pass

    async def login_user(self, email, password):
        # Authenticate with Supabase
        # Return JWT tokens
        pass
```

### 2. **Supabase Client** (Priority 1)
File: `mvp/backend/app/core/supabase.py`

```python
from supabase import create_client
from app.core.config import settings

supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY
)
```

### 3. **ARIA Service** (Priority 2)
File: `mvp/backend/app/services/aria.py`

**Good news:** You can copy 90% from `CommonGround-demo/aria/sentiment_shield.py`!

### 4. **Frontend Application** (Priority 3)
Directory: `mvp/frontend/` (not created yet)

Create with:
```bash
cd mvp
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npx shadcn-ui@latest init
```

---

## 🎯 Immediate Next Steps (This Week)

### Option A: Continue Backend (Recommended)
1. **Set up Supabase account** (free tier)
   - Go to supabase.com
   - Create new project
   - Copy URL and API keys to `.env`

2. **Implement authentication**
   - Create `app/services/auth.py`
   - Complete `/auth/register` endpoint
   - Complete `/auth/login` endpoint
   - Test with Postman or `curl`

3. **Add JWT middleware**
   - Create `app/core/security.py`
   - Add `get_current_user` dependency
   - Protect user endpoints

### Option B: Start Frontend First
1. **Create Next.js app**
2. **Build login/register pages**
3. **Mock API calls** (fake data for now)
4. **Connect to backend** once auth is working

My recommendation: **Do Backend auth first** (it's foundational for everything else).

---

## 🛠️ Development Workflow

### Daily Development

```bash
# Terminal 1: Backend
cd mvp/backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2: Database
cd mvp
docker-compose up postgres redis

# Terminal 3: Frontend (later)
cd mvp/frontend
npm run dev
```

### Making Database Changes

```bash
# After modifying models in app/models/
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Testing API

```bash
# Interactive docs
open http://localhost:8000/docs

# Or use curl
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","first_name":"Test","last_name":"User"}'
```

---

## 📚 Learning Resources

### FastAPI (Backend)
- [Official Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Async SQLAlchemy](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

### Supabase (Auth + Database)
- [Quick Start](https://supabase.com/docs/guides/getting-started)
- [Python Client](https://github.com/supabase-community/supabase-py)

### Next.js (Frontend)
- [Learn Next.js](https://nextjs.org/learn)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

## ❓ Common Issues

### "Can't connect to database"
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart if needed
docker-compose restart postgres
```

### "ModuleNotFoundError"
```bash
# Make sure venv is activated
source venv/bin/activate
pip install -r requirements.txt
```

### "Port 8000 already in use"
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9
```

---

## 🎉 You've Got This!

You now have:
- ✅ Production-ready database schema
- ✅ API structure with FastAPI
- ✅ Docker development environment
- ✅ Clear 12-week roadmap
- ✅ Scaffolded endpoints ready to implement

**Next:** Pick a task from "Weeks 1-2" and start coding. You'll build on a solid foundation.

Questions? Issues? Check the docs or revisit your original demos for reference implementations.

**Happy Building! 🚀**
