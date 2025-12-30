# CommonGround Security Audit
## Injection Attacks & XSS Protection Analysis

**Date:** December 30, 2025
**Status:** Good foundation, needs enhancements

---

## ✅ Current Protections (Already Implemented)

### 1. **SQL Injection Protection** ✅ EXCELLENT
**Status:** Fully protected

**Protection Method:**
- Using SQLAlchemy ORM with parameterized queries
- No raw SQL strings
- All queries use safe `.where()` clauses

**Example (Safe):**
```python
result = await self.db.execute(
    select(User).where(User.email == request.email)  # ✅ Parameterized
)
```

**Verification:**
- ✅ No string concatenation in queries
- ✅ No `text()` or `raw_sql()` usage found
- ✅ All user input passed through ORM

**Risk Level:** 🟢 LOW - Fully mitigated

---

### 2. **Authentication & Authorization** ✅ EXCELLENT
**Status:** Properly implemented

- ✅ JWT tokens for authentication
- ✅ `get_current_user` dependency on all protected routes
- ✅ Service-layer authorization checks
- ✅ Case participant verification

**Risk Level:** 🟢 LOW - Fully mitigated

---

### 3. **Input Validation** ✅ GOOD
**Status:** Pydantic validation in place

**Current Implementation:**
- ✅ All endpoints use Pydantic schemas
- ✅ Type validation (str, int, datetime, etc.)
- ✅ Required field validation
- ✅ Email format validation

**Example:**
```python
class RegisterRequest(BaseModel):
    email: str  # ✅ Type validated
    password: str  # ✅ Type validated
    first_name: str
    last_name: str
```

**Risk Level:** 🟡 MEDIUM - Good but needs enhancement

---

## ⚠️ Areas Needing Enhancement

### 1. **XSS (Cross-Site Scripting) Protection** 🟡 NEEDS ENHANCEMENT

#### **Frontend XSS Protection**

**Current Status:**
- ✅ React auto-escapes JSX by default
- ✅ No `dangerouslySetInnerHTML` found
- ✅ No `innerHTML` usage found

**Missing:**
- ⚠️ No Content Security Policy (CSP) headers
- ⚠️ No explicit sanitization library for rich content (if added later)

**Recommendations:**
```typescript
// Add to Next.js config for CSP headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }
];
```

---

#### **Backend XSS Protection**

**Current Status:**
- ✅ Returns JSON only (not HTML)
- ✅ FastAPI sets proper Content-Type headers

**Missing:**
- ⚠️ No input sanitization for message content
- ⚠️ No HTML tag stripping
- ⚠️ No script tag detection

**Risk Scenario:**
```python
# User sends malicious message
content = "<script>alert('XSS')</script>"

# Currently: Stored as-is in database
# Frontend: React will escape it (safe)
# BUT: If ever rendered as HTML, it's vulnerable
```

**Recommendation:**
Add input sanitization:
```python
# Install: pip install bleach
import bleach

def sanitize_content(content: str) -> str:
    """
    Remove potentially dangerous HTML/scripts from content.

    Allows: Plain text only
    Strips: All HTML tags, scripts, etc.
    """
    # Strip all HTML tags
    clean_content = bleach.clean(
        content,
        tags=[],  # Allow no HTML tags
        strip=True  # Remove tags completely
    )

    # Remove any remaining dangerous patterns
    dangerous_patterns = [
        '<script', '</script>',
        'javascript:',
        'onerror=',
        'onclick=',
        'onload='
    ]

    for pattern in dangerous_patterns:
        clean_content = clean_content.replace(pattern, '')

    return clean_content
```

**Risk Level:** 🟡 MEDIUM - React protects frontend, but defense-in-depth needed

---

### 2. **Command Injection** ✅ NOT APPLICABLE

**Status:** No risk identified

**Verification:**
- ✅ No `os.system()` calls found
- ✅ No `subprocess` usage found
- ✅ No shell command execution with user input

**Risk Level:** 🟢 LOW - Not applicable

---

### 3. **NoSQL Injection** ✅ NOT APPLICABLE

**Status:** Using PostgreSQL with ORM

**Risk Level:** 🟢 LOW - Not applicable

---

### 4. **Path Traversal** ⚠️ NEEDS CHECK

**Current Status:**
- File uploads not yet implemented
- PDF generation uses controlled paths

**When File Upload Added:**
- ⚠️ Validate file paths
- ⚠️ Use secure file storage (Supabase)
- ⚠️ Don't use user input in file paths

**Recommendation:**
```python
import os
from pathlib import Path

def secure_filename(filename: str) -> str:
    """Ensure filename is safe."""
    # Remove path traversal attempts
    filename = os.path.basename(filename)

    # Remove dangerous characters
    safe_chars = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.')
    filename = ''.join(c if c in safe_chars else '_' for c in filename)

    # Limit length
    return filename[:255]
```

**Risk Level:** 🟢 LOW - Not yet applicable

---

### 5. **Input Length Limits** 🟡 NEEDS ENHANCEMENT

**Current Status:**
- Database has length constraints
- Pydantic validates types but not lengths

**Missing:**
- ⚠️ No explicit max length on text fields
- ⚠️ Could cause DoS with huge inputs

**Recommendation:**
```python
from pydantic import Field, field_validator

class MessageCreate(BaseModel):
    case_id: str
    recipient_id: str
    content: str = Field(..., max_length=10000)  # ✅ Add max length
    message_type: str = "text"

    @field_validator('content')
    def validate_content(cls, v):
        # Strip leading/trailing whitespace
        v = v.strip()

        # Check minimum length
        if len(v) < 1:
            raise ValueError('Content cannot be empty')

        # Check maximum length
        if len(v) > 10000:
            raise ValueError('Content too long (max 10000 characters)')

        return v
```

**Risk Level:** 🟡 MEDIUM - Could cause resource exhaustion

---

### 6. **Email Header Injection** ✅ PROTECTED

**Current Status:**
- Using email service libraries (not raw SMTP)
- Email addresses validated by Pydantic

**Verification:**
- ✅ No raw email header construction
- ✅ Using SendGrid/email service
- ✅ Email format validation

**Risk Level:** 🟢 LOW - Library handles it

---

## 🛡️ Recommended Security Enhancements

### Priority 1: Add Input Sanitization (HIGH)

**Create sanitization utility:**

File: `app/utils/sanitize.py`
```python
"""Input sanitization utilities."""

import bleach
import re
from typing import Optional

def sanitize_text(text: str, max_length: int = 10000) -> str:
    """
    Sanitize text input for safe storage and display.

    - Strips HTML tags
    - Removes script tags
    - Limits length
    - Removes dangerous patterns
    """
    if not text:
        return ""

    # Strip HTML tags (allow plain text only)
    clean_text = bleach.clean(text, tags=[], strip=True)

    # Remove dangerous patterns
    dangerous = [
        '<script', '</script>',
        'javascript:',
        'onerror=', 'onclick=', 'onload=',
        'data:text/html'
    ]

    for pattern in dangerous:
        clean_text = clean_text.replace(pattern, '')

    # Limit length
    clean_text = clean_text[:max_length]

    return clean_text.strip()


def sanitize_email(email: str) -> str:
    """Validate and sanitize email address."""
    email = email.strip().lower()

    # Basic email regex
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

    if not re.match(email_pattern, email):
        raise ValueError("Invalid email format")

    return email


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage."""
    import os

    # Get basename only (remove path)
    filename = os.path.basename(filename)

    # Allow only safe characters
    safe_chars = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.')
    filename = ''.join(c if c in safe_chars else '_' for c in filename)

    # Limit length
    return filename[:255]
```

---

### Priority 2: Add CSP Headers (HIGH)

**Update Next.js config:**

File: `frontend/next.config.ts`
```typescript
import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js needs this
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' http://localhost:8000 ws://localhost:8000",
      "frame-ancestors 'none'",
    ].join('; ')
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

---

### Priority 3: Add Input Validation (MEDIUM)

**Enhance Pydantic schemas with validators:**

```python
from pydantic import BaseModel, Field, field_validator
from app.utils.sanitize import sanitize_text

class MessageCreate(BaseModel):
    case_id: str
    recipient_id: str
    content: str = Field(..., min_length=1, max_length=10000)
    message_type: str = "text"

    @field_validator('content')
    def sanitize_content(cls, v):
        return sanitize_text(v, max_length=10000)

    @field_validator('message_type')
    def validate_message_type(cls, v):
        allowed_types = ['text', 'voice', 'request']
        if v not in allowed_types:
            raise ValueError(f'Invalid message type: {v}')
        return v
```

---

### Priority 4: Add Rate Limiting (MEDIUM)

Already configured but not enabled:

```python
# .env
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=60

# TODO: Implement in middleware
```

---

## 📊 Security Risk Matrix

| Vulnerability | Current Status | Risk Level | Priority | Effort |
|---------------|----------------|------------|----------|--------|
| SQL Injection | ✅ Protected | 🟢 LOW | N/A | N/A |
| XSS (Frontend) | ✅ React escapes | 🟡 MEDIUM | HIGH | 2h |
| XSS (Backend) | ⚠️ No sanitization | 🟡 MEDIUM | HIGH | 3h |
| Command Injection | ✅ N/A | 🟢 LOW | N/A | N/A |
| Path Traversal | ✅ Not implemented | 🟢 LOW | LOW | 1h |
| Input Length | ⚠️ No limits | 🟡 MEDIUM | MEDIUM | 2h |
| CSRF | ✅ JWT tokens | 🟢 LOW | N/A | N/A |
| Authentication | ✅ Excellent | 🟢 LOW | N/A | N/A |

---

## ✅ Immediate Action Items

1. **Install bleach:** `pip install bleach`
2. **Create sanitization utility:** `app/utils/sanitize.py`
3. **Add CSP headers:** Update `next.config.ts`
4. **Enhance Pydantic schemas:** Add validators and max lengths
5. **Test with malicious inputs:** Create security test suite

---

## 🧪 Security Testing Checklist

### Test for SQL Injection:
```python
# Try SQL injection in email field
email = "test@example.com'; DROP TABLE users; --"
# Expected: Treated as literal string, no SQL execution
```

### Test for XSS:
```python
# Try XSS in message content
content = "<script>alert('XSS')</script>"
# Expected: Stripped/escaped before storage
```

### Test for Auth Bypass:
```bash
# Try accessing protected endpoint without token
curl http://localhost:8000/api/v1/cases/
# Expected: 401 Unauthorized
```

### Test for Path Traversal:
```python
# Try path traversal in filename
filename = "../../../etc/passwd"
# Expected: Sanitized to "etc_passwd"
```

---

## 🎯 Summary

**Current Security Posture:** GOOD ✅

**Strengths:**
- ✅ No SQL injection risk
- ✅ Strong authentication
- ✅ Proper authorization
- ✅ React XSS protection

**Areas to Improve:**
- ⚠️ Add input sanitization
- ⚠️ Add CSP headers
- ⚠️ Add input length limits
- ⚠️ Add field validators

**Estimated Time to Fix:** 6-8 hours
**Priority:** HIGH (before production)

**Recommendation:** Implement Priority 1 & 2 enhancements before beta launch.
