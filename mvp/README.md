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

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🛣️ Development Roadmap

### ✅ Phase 1: Foundation (Weeks 1-2)
- [x] Project structure
- [ ] Database schema
- [ ] Authentication
- [ ] Basic API endpoints

### 📋 Phase 2: Core Features (Weeks 3-8)
- [ ] Agreement Builder
- [ ] Messaging with ARIA
- [ ] User Dashboard
- [ ] Scheduling

### 🚀 Phase 3: Production (Weeks 9-12)
- [ ] Payment integration
- [ ] Court export
- [ ] Testing
- [ ] Deployment

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
