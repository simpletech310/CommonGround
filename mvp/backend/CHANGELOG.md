# Changelog

All notable changes to CommonGround MVP will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Email notification service with templates (2025-12-30)
  - Case invitation emails
  - Agreement approval notifications
  - Message notifications
  - Exchange reminders
  - Monthly compliance reports

## [0.4.0] - 2025-12-30

### Added
- **TimeBridge™ Scheduling System**
  - Schedule event creation and management
  - Exchange check-in system with timeliness tracking
  - GPS location support (ready for future use)
  - Compliance metrics and trend analysis
  - Calendar data API for frontend
  - Grace period handling (default 15 minutes)
  - Court-ready compliance reports
- Schedule schemas with comprehensive validation
- Schedule service with compliance calculations
- Schedule REST endpoints (`/schedule/*`)
- Comprehensive scheduling test suite

### Changed
- Updated API router to include schedule endpoints
- Enhanced case models with schedule relationships

## [0.3.0] - 2025-12-30

### Added
- **ARIA™ Sentiment Shield Messaging System**
  - Real-time message toxicity analysis
  - Pattern-based detection (7 categories)
  - Smart message rewrites preserving intent
  - Intervention workflow (accept/modify/reject/cancel)
  - Good faith communication metrics
  - Trend analysis (improving/stable/worsening)
  - Message flagging and tracking
  - Content hashing for integrity
- ARIA service with toxicity scoring algorithm
- Message service with full ARIA integration
- Message REST endpoints (`/messages/*`)
- Analytics endpoints for compliance tracking
- Comprehensive messaging test suite

### Security
- SHA-256 content hashing for message integrity
- Original message preservation for audit trail

## [0.2.0] - 2025-12-29

### Added
- **Agreement Builder™ System**
  - 18-section custody agreement templates
  - Section-by-section completion tracking
  - Dual parent approval workflow
  - PDF generation with ReportLab
  - Version control support
  - Completion percentage calculation
- Agreement service with PDF generation
- Agreement REST endpoints (`/agreements/*`)
- Agreement schemas with all 18 section templates
- Comprehensive agreement test suite

### Changed
- Enhanced case endpoints to include agreement creation

## [0.1.0] - 2025-12-29

### Added
- **Complete Case Management System**
  - Case creation and invitation workflow
  - Two-parent collaboration (petitioner/respondent)
  - Invitation token system
  - Case acceptance and linking
  - Child management (CRUD operations)
  - Access control and permissions
  - Case status management
- Case service with full business logic
- Case REST endpoints (`/cases/*`)
- Child endpoints for case participants
- Case schemas and validation
- Comprehensive case management tests

### Security
- Access control verification for all case operations
- Participant validation
- Audit logging for case operations

## [0.0.1] - 2025-12-28

### Added
- **Authentication System**
  - User registration with Supabase
  - JWT-based authentication (access + refresh tokens)
  - Protected route middleware
  - User profile management
  - Email verification workflow
  - Password hashing with bcrypt
  - Token refresh mechanism
  - Logout with token invalidation
- User and UserProfile models
- Auth service with Supabase integration
- Auth REST endpoints (`/auth/*`)
- Security utilities (JWT, password hashing)
- Comprehensive auth tests

### Security
- Bcrypt password hashing
- JWT token management
- Secure session handling
- Supabase authentication integration

### Infrastructure
- FastAPI application setup
- PostgreSQL database with async SQLAlchemy
- Alembic migrations
- Docker Compose for local development
- Environment configuration
- Health check endpoint
- CORS middleware
- Error handling middleware

---

## Version History Summary

- **v0.4.0**: TimeBridge Scheduling System
- **v0.3.0**: ARIA Messaging with Sentiment Analysis
- **v0.2.0**: Agreement Builder with PDF Generation
- **v0.1.0**: Case Management System
- **v0.0.1**: Authentication & Infrastructure

**Backend MVP Status**: 95% Complete
- ✅ Authentication
- ✅ Case Management
- ✅ Agreement Builder
- ✅ ARIA Messaging
- ✅ TimeBridge Scheduling
- 🔲 Frontend (Next phase)
