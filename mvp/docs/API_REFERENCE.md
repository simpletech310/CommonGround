# CommonGround API Reference

**Base URL:** `http://localhost:8000/api/v1`
**Version:** 1.0
**Last Updated:** December 30, 2025

---

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer {access_token}
```

---

## Authentication Endpoints

### Register User
Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Minimum 8 characters |
| first_name | string | Yes | User's first name |
| last_name | string | Yes | User's last name |
| phone | string | No | Phone number with country code |

**Response:** `201 Created`
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "string",
    "email_verified": false,
    "first_name": "string",
    "last_name": "string"
  }
}
```

**Errors:**
- `400` - Email already registered
- `500` - Registration failed

---

### Login
Authenticate and receive tokens.

**Endpoint:** `POST /auth/login`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email |
| password | string | Yes | User's password |

**Response:** `200 OK` - Same as register

**Errors:**
- `401` - Invalid credentials or email not confirmed
- `403` - User account inactive

---

### Get Current User
Retrieve current user information.

**Endpoint:** `GET /auth/me`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "string",
  "email_verified": boolean,
  "first_name": "string",
  "last_name": "string"
}
```

**Errors:**
- `401` - Invalid or expired token
- `403` - User inactive

---

### Refresh Token
Get new access and refresh tokens.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

**Response:** `200 OK` - Same as login

**Errors:**
- `401` - Invalid or expired refresh token

---

### Logout
Logout user and invalidate tokens.

**Endpoint:** `POST /auth/logout`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## Case Management Endpoints

### Create Case
Create a new co-parenting case.

**Endpoint:** `POST /cases/`

**Authentication:** Required

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| case_name | string | Yes | Name of the case |
| other_parent_email | string | Yes | Email of other parent |
| state | string | Yes | US state code (e.g., "CA") |
| county | string | No | County name |
| children | array | No | Array of child objects |

**Child Object:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| first_name | string | Yes | Child's first name |
| last_name | string | Yes | Child's last name |
| middle_name | string | No | Child's middle name |
| date_of_birth | string | Yes | ISO date (YYYY-MM-DD) |
| gender | string | No | Child's gender |

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "case_name": "string",
  "case_number": null,
  "state": "string",
  "status": "pending",
  "created_at": "datetime",
  "invitation_token": "string",
  "message": "Case created successfully. Invitation sent to other parent."
}
```

**Errors:**
- `401` - Not authenticated
- `500` - Case creation failed

---

### Accept Case Invitation
Join a case as the second parent.

**Endpoint:** `POST /cases/{case_id}/accept`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| case_id | uuid | ID of the case |

**Request Body:**
```json
{
  "invitation_token": "string"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "case_name": "string",
  "status": "active",
  "message": "Successfully joined the case!"
}
```

**Errors:**
- `400` - Already a participant or no pending invitation
- `404` - Case not found
- `401` - Not authenticated

---

### List Cases
Get all cases for the current user.

**Endpoint:** `GET /cases/`

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "case_name": "string",
    "case_number": "string|null",
    "state": "string",
    "status": "string",
    "created_at": "datetime",
    "participants": [
      {
        "id": "uuid",
        "role": "string",
        "parent_type": "string",
        "user_id": "uuid"
      }
    ]
  }
]
```

---

### Get Case Details
Retrieve detailed information about a specific case.

**Endpoint:** `GET /cases/{case_id}`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| case_id | uuid | ID of the case |

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "case_name": "string",
  "case_number": "string|null",
  "state": "string",
  "status": "string",
  "created_at": "datetime",
  "participants": [
    {
      "id": "uuid",
      "role": "string",
      "parent_type": "string",
      "user_id": "uuid",
      "is_active": boolean
    }
  ]
}
```

**Errors:**
- `403` - No access to this case
- `404` - Case not found

---

### Update Case
Update case information.

**Endpoint:** `PUT /cases/{case_id}`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| case_id | uuid | ID of the case |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| case_name | string | No | Updated case name |
| county | string | No | Updated county |
| court | string | No | Court name |

**Response:** `200 OK` - Same as Get Case Details

**Errors:**
- `403` - No permission to update
- `404` - Case not found

---

### Add Child to Case
Add a child to an existing case.

**Endpoint:** `POST /cases/{case_id}/children`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| case_id | uuid | ID of the case |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| first_name | string | Yes | Child's first name |
| last_name | string | Yes | Child's last name |
| middle_name | string | No | Child's middle name |
| date_of_birth | string | Yes | ISO date (YYYY-MM-DD) |
| gender | string | No | Child's gender |
| pronouns | string | No | Preferred pronouns |

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "first_name": "string",
  "last_name": "string",
  "date_of_birth": "date",
  "case_id": "uuid",
  "message": "Child added successfully"
}
```

**Errors:**
- `403` - No access to case
- `404` - Case not found

---

### Update Child
Update child information.

**Endpoint:** `PUT /cases/children/{child_id}`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| child_id | uuid | ID of the child |

**Request Body:** Any child fields to update

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "first_name": "string",
  "last_name": "string",
  "date_of_birth": "date",
  "message": "Child updated successfully"
}
```

**Errors:**
- `403` - No access to case
- `404` - Child not found

---

### Delete Child
Remove a child from a case.

**Endpoint:** `DELETE /cases/children/{child_id}`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| child_id | uuid | ID of the child |

**Response:** `200 OK`
```json
{
  "message": "Child deleted successfully"
}
```

**Errors:**
- `403` - No access to case
- `404` - Child not found

---

## Agreement Management Endpoints

### Create Agreement
Create a new custody agreement for a case.

**Endpoint:** `POST /cases/{case_id}/agreement`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| case_id | uuid | ID of the case |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | Agreement title (default: "Parenting Agreement") |

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "case_id": "uuid",
  "title": "Parenting Agreement",
  "version": 1,
  "status": "draft",
  "sections_count": 18,
  "message": "Agreement created with 18 section templates"
}
```

**Errors:**
- `400` - Case already has an active agreement
- `403` - No access to case
- `404` - Case not found

---

### Get Case Agreement
Retrieve the active agreement for a case with all sections.

**Endpoint:** `GET /cases/{case_id}/agreement`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| case_id | uuid | ID of the case |

**Response:** `200 OK`
```json
{
  "agreement": {
    "id": "uuid",
    "case_id": "uuid",
    "title": "Parenting Agreement",
    "version": 1,
    "status": "draft",
    "petitioner_approved": false,
    "respondent_approved": false,
    "effective_date": null,
    "pdf_url": null,
    "created_at": "datetime",
    "updated_at": "datetime"
  },
  "sections": [
    {
      "id": "uuid",
      "agreement_id": "uuid",
      "section_number": "1",
      "section_title": "Basic Information",
      "section_type": "basic_info",
      "content": "Template content...",
      "structured_data": {},
      "display_order": 1,
      "is_required": true,
      "is_completed": false
    }
  ],
  "completion_percentage": 0.0
}
```

**Errors:**
- `403` - No access to case
- `404` - Case or agreement not found

---

### Get Agreement by ID
Retrieve a specific agreement by its ID.

**Endpoint:** `GET /agreements/{agreement_id}`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| agreement_id | uuid | ID of the agreement |

**Response:** `200 OK` - Same as Get Case Agreement

**Errors:**
- `403` - No access to this agreement's case
- `404` - Agreement not found

---

### Update Agreement Section
Update the content of a specific agreement section.

**Endpoint:** `PUT /agreements/sections/{section_id}`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| section_id | uuid | ID of the section |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| section_number | string | Yes | Section number (e.g., "1") |
| section_title | string | Yes | Section title |
| content | string | Yes | Updated content |
| structured_data | object | No | Structured data (JSON) |

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "agreement_id": "uuid",
  "section_number": "4",
  "section_title": "Parenting Time Schedule",
  "section_type": "schedule",
  "content": "Updated content...",
  "structured_data": {
    "weekday_schedule": {
      "monday": "Parent A",
      "tuesday": "Parent A"
    }
  },
  "display_order": 4,
  "is_required": true,
  "is_completed": true
}
```

**Errors:**
- `400` - Can only update sections in draft agreements
- `403` - No access to this agreement
- `404` - Section not found

---

### Submit Agreement for Approval
Submit a completed agreement for dual parent approval.

**Endpoint:** `POST /agreements/{agreement_id}/submit`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| agreement_id | uuid | ID of the agreement |

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "pending_approval",
  "pdf_url": "/agreements/{agreement_id}/document.pdf",
  "message": "Agreement submitted for approval. Both parents must approve."
}
```

**Errors:**
- `400` - Agreement not in draft status or required sections incomplete
- `403` - No access to this agreement
- `404` - Agreement not found

---

### Approve Agreement
Approve an agreement as a parent. Both parents must approve for agreement to become active.

**Endpoint:** `POST /agreements/{agreement_id}/approve`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| agreement_id | uuid | ID of the agreement |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| notes | string | No | Optional approval notes |

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "active",
  "petitioner_approved": true,
  "respondent_approved": true,
  "effective_date": "datetime",
  "message": "Agreement approved!"
}
```

**Note:** Message will be "Approval recorded. Waiting for other parent." if only one parent has approved.

**Errors:**
- `400` - Agreement not submitted for approval or already approved by this parent
- `403` - Not a participant in this case
- `404` - Agreement not found

---

### Download Agreement PDF
Download the agreement as a PDF file.

**Endpoint:** `GET /agreements/{agreement_id}/pdf`

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| agreement_id | uuid | ID of the agreement |

**Response:** `200 OK`
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="agreement_{agreement_id}.pdf"

**Errors:**
- `403` - No access to this agreement
- `404` - Agreement not found
- `500` - PDF generation failed

---

## Health Check Endpoints

### Root
Basic API status check.

**Endpoint:** `GET /`

**Response:** `200 OK`
```json
{
  "app": "CommonGround",
  "version": "v1",
  "environment": "development",
  "status": "running"
}
```

---

### Health Check
Detailed health status.

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "healthy"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "detail": "Error message description"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Authenticated but no permission |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Server-side error |
| 501 | Not Implemented - Endpoint not yet implemented |

---

## Rate Limiting

Currently not implemented. Future implementation will include:
- 100 requests per minute per user
- Rate limit headers in responses

---

## Pagination

Currently not implemented. Future list endpoints will support:
- `?page=1` - Page number
- `?page_size=20` - Items per page
- Response includes pagination metadata

---

## Interactive Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

Both provide interactive API testing capabilities.

---

**Document Version:** 1.0
**Last Updated:** December 30, 2025
