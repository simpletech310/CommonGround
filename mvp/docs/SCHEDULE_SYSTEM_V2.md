# CommonGround Schedule System V2.0
## Privacy-First "My Time" Scheduling Architecture

**Created:** December 31, 2024
**Status:** Design & Planning Phase
**Privacy Rule:** The system NEVER reveals what the other parent is doing

---

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [Database Architecture](#database-architecture)
3. [Privacy Filtering](#privacy-filtering)
4. [API Endpoints](#api-endpoints)
5. [ARIA Integration](#aria-integration)
6. [Frontend Components](#frontend-components)
7. [Migration Strategy](#migration-strategy)
8. [Implementation Phases](#implementation-phases)

---

## Core Concepts

### 1. My Time Collections
**Purpose:** Private organizational containers for a parent's schedule

**Examples:**
- "Time with Dad" (parenting time)
- "Work & Commute" (unavailable periods)
- "School Year" (educational commitments)
- "Personal Errands" (private activities)
- "Vacation Planning" (trip planning)

**Privacy:**
- Owner sees: Real collection name ("Time with Dad")
- Other parent sees: Generic label ("Dad's Time" or "Mom's Time")
- Never reveals the purpose or category

**Contains:**
- Time Blocks (availability constraints)
- Events (real activities)

---

### 2. Time Blocks
**Purpose:** Availability rules or busy windows (NOT events)

**Examples:**
- Mon–Fri 7:30am–2:30pm (recurring) - Work hours
- Wed–Fri 3:30pm–6:30pm (recurring) - Classes
- Dec 20–Jan 3 (one-off) - Vacation block

**Privacy:**
- Owner sees: Full details including title and notes
- Other parent sees: Only "unavailable" on calendar under "Mom's Time"/"Dad's Time"
- ARIA uses for conflict detection but NEVER reveals why

**NOT Displayed To Other Parent:**
- Block title (e.g., "Work", "School", "Therapy")
- Notes or reason
- Specific category

**Used For:**
- Organizing personal schedule
- Conflict detection (ARIA warnings)
- Scheduling suggestions
- Preventing scheduling conflicts

---

### 3. Events
**Purpose:** Real scheduled activities with details and attendance tracking

**Categories (each with custom form):**
- **Medical:** provider, copay, reason, paperwork
- **School:** teacher, location, meeting type, agenda
- **Recreation:** RSVP, drop-off notes, activity type
- **Legal:** attorney, court location, case number
- **Travel:** destination, transport, accommodations
- **Other:** custom fields

**Two-Layer Privacy:**

**Layer 1 - Private Details (owner only):**
- Full event details
- Category-specific data
- Private notes
- Internal documentation

**Layer 2 - Co-Parent View (other parent sees):**
- Event time window
- Invited role (Required/Optional/Not invited)
- Attendance tracking fields
- Neutral location (opt-in only, case-specific setting)
- No category details unless explicitly shared

**Attendance Tracking (per parent):**
- **Invited Role:** Required / Optional / Not invited
- **RSVP Status:** Going / Not going / Maybe / No response
- **Show Status:** Showed up / No-show / Late / Left early / Unknown
- **Evidence:** Check-in timestamp, notes, attachments (photos, receipts)

---

## Database Architecture

### New Models

#### 1. MyTimeCollection

```python
class MyTimeCollection(Base, UUIDMixin, TimestampMixin):
    """
    Private organizational container for a parent's schedule.
    Supports privacy-first calendar management.
    """

    __tablename__ = "my_time_collections"

    # Ownership
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id"), index=True)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)

    # Collection details (private to owner)
    name: Mapped[str] = mapped_column(String(100))  # "Time with Dad", "Work Schedule"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(String(7), default="#3B82F6")  # Hex color for calendar
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Icon identifier

    # Settings
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)  # Default collection
    display_order: Mapped[int] = mapped_column(Integer, default=0)  # Sort order

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="my_time_collections")
    owner: Mapped["User"] = relationship("User")
    time_blocks: Mapped[list["TimeBlock"]] = relationship(
        "TimeBlock", back_populates="collection", cascade="all, delete-orphan"
    )
    events: Mapped[list["ScheduleEvent"]] = relationship(
        "ScheduleEvent", back_populates="collection"
    )
```

**Indexes:**
- `(case_id, owner_id)` - Find all collections for a parent in a case
- `(owner_id, is_active)` - Active collections for a user

---

#### 2. TimeBlock

```python
class TimeBlock(Base, UUIDMixin, TimestampMixin):
    """
    Availability constraint or busy window.
    Used for conflict detection and scheduling suggestions.
    NOT an event - just marks time as unavailable.
    """

    __tablename__ = "time_blocks"

    # Collection link
    collection_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("my_time_collections.id"), index=True
    )

    # Time window (private to owner)
    title: Mapped[str] = mapped_column(String(200))  # "Work Hours", "Class Time"
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timing
    start_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    all_day: Mapped[bool] = mapped_column(Boolean, default=False)

    # Recurrence
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_rule: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # iCal RRULE
    recurrence_end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Private notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Conflict settings
    allow_conflicts: Mapped[bool] = mapped_column(Boolean, default=False)  # Soft block
    priority: Mapped[int] = mapped_column(Integer, default=1)  # 1=low, 5=critical

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    collection: Mapped["MyTimeCollection"] = relationship(
        "MyTimeCollection", back_populates="time_blocks"
    )
```

**Indexes:**
- `(collection_id, start_time, end_time)` - Time range queries
- `(start_time, end_time, is_active)` - Active blocks in date range

**Privacy Note:**
- All fields are PRIVATE to the owner
- Other parent sees only "busy" indicator on calendar
- No title, description, or notes exposed

---

#### 3. ScheduleEvent (Updated)

```python
class ScheduleEvent(Base, UUIDMixin, TimestampMixin):
    """
    Real scheduled activity with details and attendance tracking.
    Supports category-specific forms and privacy filtering.
    """

    __tablename__ = "schedule_events"

    # Case and collection
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id"), index=True)
    collection_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("my_time_collections.id"), nullable=True, index=True
    )

    # Event creator
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)

    # Category (determines form fields)
    category: Mapped[str] = mapped_column(
        String(50), default="other"
    )  # medical, school, recreation, legal, travel, other

    # Timing
    start_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    all_day: Mapped[bool] = mapped_column(Boolean, default=False)
    timezone: Mapped[str] = mapped_column(String(50), default="America/Los_Angeles")

    # Children involved
    child_ids: Mapped[list] = mapped_column(JSON, default=list)  # List of child IDs

    # Basic details
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Location (privacy-controlled)
    location: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    location_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location_shared: Mapped[bool] = mapped_column(Boolean, default=False)  # Share with co-parent

    # Category-specific data (JSON)
    category_data: Mapped[dict] = mapped_column(JSON, default=dict)
    """
    Examples:
    Medical: {
        "provider_name": "Dr. Smith",
        "provider_phone": "555-1234",
        "reason": "Annual checkup",
        "copay_amount": 25.00,
        "insurance_claim": "filed",
        "paperwork_url": "..."
    }
    School: {
        "teacher_name": "Ms. Johnson",
        "meeting_type": "parent_teacher_conference",
        "agenda": "Q2 progress report",
        "school_name": "Lincoln Elementary"
    }
    Recreation: {
        "activity_type": "soccer_game",
        "team_name": "Blue Tigers",
        "rsvp_required": true,
        "rsvp_deadline": "2024-01-15",
        "drop_off_notes": "Use south entrance"
    }
    Legal: {
        "attorney_name": "John Doe",
        "court_location": "County Courthouse",
        "case_number": "FL-2024-12345",
        "hearing_type": "status_conference"
    }
    Travel: {
        "destination": "San Diego",
        "transport_method": "car",
        "accommodation": "Hilton Bayfront",
        "return_date": "2024-02-10"
    }
    """

    # Privacy settings
    visibility: Mapped[str] = mapped_column(
        String(20), default="co_parent"
    )  # private, co_parent, case_team
    share_category_details: Mapped[bool] = mapped_column(Boolean, default=False)

    # Status
    status: Mapped[str] = mapped_column(
        String(20), default="scheduled"
    )  # scheduled, completed, cancelled, rescheduled

    # Cancellation
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    cancelled_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Modification tracking
    is_modification: Mapped[bool] = mapped_column(Boolean, default=False)
    modification_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    modification_requested_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Court/agreement linkage
    agreement_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    is_court_ordered: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="schedule_events")
    collection: Mapped[Optional["MyTimeCollection"]] = relationship(
        "MyTimeCollection", back_populates="events"
    )
    creator: Mapped["User"] = relationship("User")
    attendance_records: Mapped[list["EventAttendance"]] = relationship(
        "EventAttendance", back_populates="event", cascade="all, delete-orphan"
    )
```

**Indexes:**
- `(case_id, start_time, end_time)` - Case events in date range
- `(collection_id, start_time)` - Collection events chronologically
- `(category, case_id)` - Events by category
- `(created_by, start_time)` - User's events

---

#### 4. EventAttendance (New)

```python
class EventAttendance(Base, UUIDMixin, TimestampMixin):
    """
    Court-grade attendance tracking for events.
    Records invitation, RSVP, and actual attendance per parent.
    """

    __tablename__ = "event_attendance"

    # Event and parent
    event_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("schedule_events.id"), index=True
    )
    parent_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), index=True)

    # Invitation
    invited_role: Mapped[str] = mapped_column(
        String(20), default="optional"
    )  # required, optional, not_invited
    invited_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    invited_by: Mapped[str] = mapped_column(String(36))  # User ID who sent invitation

    # RSVP
    rsvp_status: Mapped[str] = mapped_column(
        String(20), default="no_response"
    )  # going, not_going, maybe, no_response
    rsvp_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    rsvp_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Actual attendance
    show_status: Mapped[str] = mapped_column(
        String(20), default="unknown"
    )  # showed_up, no_show, late, left_early, unknown

    # Check-in/out evidence
    check_in_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    check_in_method: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # gps, manual, verified_by_other
    check_in_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    check_in_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    check_out_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timeliness (for required attendance)
    minutes_late: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_on_time: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Evidence and notes
    attendance_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    attachments: Mapped[dict] = mapped_column(JSON, default=dict)
    """
    Attachments: {
        "photos": ["url1", "url2"],
        "receipts": ["url3"],
        "documents": ["url4"]
    }
    """

    # Verification
    verified_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)  # User ID
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    event: Mapped["ScheduleEvent"] = relationship(
        "ScheduleEvent", back_populates="attendance_records"
    )
    parent: Mapped["User"] = relationship("User")
```

**Indexes:**
- `(event_id, parent_id)` - Unique attendance per parent per event
- `(parent_id, show_status)` - Parent's attendance history
- `(event_id, invited_role)` - Required attendees for event

**Unique Constraint:**
- `(event_id, parent_id)` - One attendance record per parent per event

---

## Privacy Filtering

### Filtering Rules

#### 1. My Time Collections
```python
def filter_collection_for_viewing(collection: MyTimeCollection, viewer_id: str) -> dict:
    """
    Filter collection based on who is viewing.
    Owner sees full details, others see generic label.
    """
    if collection.owner_id == viewer_id:
        # Owner sees real name
        return {
            "id": collection.id,
            "name": collection.name,
            "description": collection.description,
            "color": collection.color,
            "icon": collection.icon,
            "is_owner": True
        }
    else:
        # Other parent sees generic label
        owner = get_user(collection.owner_id)
        parent_role = get_parent_role(collection.case_id, collection.owner_id)  # "Mom" or "Dad"

        return {
            "id": collection.id,
            "name": f"{parent_role}'s Time",  # "Mom's Time" or "Dad's Time"
            "description": None,  # Hidden
            "color": "#94A3B8",  # Neutral gray
            "icon": "clock",  # Generic icon
            "is_owner": False
        }
```

#### 2. Time Blocks
```python
def filter_time_block_for_viewing(block: TimeBlock, viewer_id: str) -> dict | None:
    """
    Time blocks are NEVER shown to other parents.
    They only appear as "busy" periods on calendar.
    """
    collection = get_collection(block.collection_id)

    if collection.owner_id == viewer_id:
        # Owner sees full details
        return {
            "id": block.id,
            "title": block.title,
            "description": block.description,
            "start_time": block.start_time,
            "end_time": block.end_time,
            "all_day": block.all_day,
            "is_recurring": block.is_recurring,
            "recurrence_rule": block.recurrence_rule,
            "notes": block.notes,
            "priority": block.priority,
            "type": "time_block"
        }
    else:
        # Other parent sees NOTHING
        # Block only used for conflict detection by ARIA
        return None
```

**Calendar Display for Other Parent:**
```python
def get_calendar_view(case_id: str, viewer_id: str, start_date: date, end_date: date):
    """
    Calendar view shows:
    - Own collections with full details
    - Other parent's time as neutral "busy" blocks
    """
    # Get viewer's collections and content
    my_collections = get_my_collections(case_id, viewer_id)
    my_time_blocks = get_my_time_blocks(my_collections)
    my_events = get_my_events(my_collections)

    # Get other parent's time blocks (for busy display only)
    other_parent_id = get_other_parent_id(case_id, viewer_id)
    other_parent_blocks = get_time_blocks_for_parent(case_id, other_parent_id, start_date, end_date)

    # Create neutral busy periods
    busy_periods = []
    for block in other_parent_blocks:
        parent_role = get_parent_role(case_id, other_parent_id)
        busy_periods.append({
            "start_time": block.start_time,
            "end_time": block.end_time,
            "label": f"{parent_role}'s Time",  # "Mom's Time" or "Dad's Time"
            "color": "#94A3B8",  # Neutral gray
            "type": "busy",  # Not a real event
            "details_hidden": True
        })

    return {
        "my_collections": my_collections,
        "my_time_blocks": my_time_blocks,
        "my_events": filter_events_for_coparent(my_events, viewer_id),
        "other_parent_busy": busy_periods,
        "other_parent_events": get_shared_events(case_id, other_parent_id, viewer_id)
    }
```

#### 3. Events
```python
def filter_event_for_coparent(event: ScheduleEvent, viewer_id: str) -> dict:
    """
    Filter event details based on visibility settings.
    """
    if event.created_by == viewer_id:
        # Creator sees full details
        return event_to_dict(event, full_details=True)

    # Check if event is shared with co-parent
    if event.visibility == "private":
        return None  # Not visible to co-parent

    # Get attendance record for viewer
    attendance = get_attendance_record(event.id, viewer_id)

    # Build co-parent-safe view
    coparent_view = {
        "id": event.id,
        "start_time": event.start_time,
        "end_time": event.end_time,
        "all_day": event.all_day,
        "child_ids": event.child_ids,
        "category": event.category if event.share_category_details else "event",
        "created_by_label": get_parent_role(event.case_id, event.created_by) + "'s Event",

        # Attendance info
        "my_attendance": {
            "invited_role": attendance.invited_role,
            "rsvp_status": attendance.rsvp_status,
            "show_status": attendance.show_status
        },

        # Limited details
        "title": event.title if event.visibility == "co_parent" else "Event",
        "location": event.location if event.location_shared else None,

        # NO category details unless explicitly shared
        "category_data": event.category_data if event.share_category_details else {}
    }

    return coparent_view
```

---

## ARIA Integration

### Conflict Detection

When creating/updating an event, ARIA checks for conflicts with:
1. Other parent's time blocks
2. Existing events for children
3. Court-ordered schedule

**ARIA Warning (Neutral):**
```python
async def check_scheduling_conflicts(
    event: ScheduleEvent,
    case_id: str,
    requester_id: str
) -> dict:
    """
    Check for scheduling conflicts and generate ARIA warning.
    NEVER reveals WHY there's a conflict.
    """
    conflicts = []

    # Check other parent's time blocks
    other_parent_id = get_other_parent_id(case_id, requester_id)
    other_blocks = get_time_blocks_in_range(
        other_parent_id,
        event.start_time,
        event.end_time
    )

    if other_blocks:
        # Conflict detected - warn neutrally
        conflicts.append({
            "type": "time_conflict",
            "severity": "medium",
            "message": "This time may create a scheduling conflict for the other parent.",
            "suggestion": "Consider proposing an alternate time window or confirming availability first.",
            "can_proceed": True  # Not blocking, just warning
        })
        # DO NOT include: what the time block is, where other parent is, why they're busy

    # Check children's existing events
    child_conflicts = get_child_events_in_range(
        event.child_ids,
        event.start_time,
        event.end_time
    )

    for child_event in child_conflicts:
        conflicts.append({
            "type": "child_busy",
            "severity": "high",
            "message": f"Child has another event during this time: {child_event.title}",
            "suggestion": "Choose a different time or reschedule the conflicting event.",
            "can_proceed": False  # Blocking - child can't be two places
        })

    return {
        "has_conflicts": len(conflicts) > 0,
        "conflicts": conflicts,
        "can_proceed": all(c["can_proceed"] for c in conflicts)
    }
```

**Example ARIA Warnings:**

✅ **Allowed (Neutral):**
- "This time may create a scheduling conflict for the other parent."
- "Consider proposing an alternate time window."
- "The child has another event at this time."

❌ **NOT Allowed (Reveals Private Info):**
- "Mom is at work during this time."
- "Dad has a class on Wednesdays."
- "The other parent is unavailable because of therapy."
- "This conflicts with their personal errands."

---

## API Endpoints

### Collections

```python
# Create collection
POST /api/v1/schedule/collections
Body: {
    "case_id": "uuid",
    "name": "Time with Dad",
    "description": "Weekly parenting time",
    "color": "#3B82F6",
    "icon": "user"
}
Response: CollectionResponse

# List my collections
GET /api/v1/schedule/collections?case_id=uuid
Response: List[CollectionResponse]

# Get collection details
GET /api/v1/schedule/collections/{id}
Response: CollectionResponse (privacy filtered)

# Update collection
PUT /api/v1/schedule/collections/{id}
Body: {
    "name": "Updated Name",
    "color": "#10B981"
}
Response: CollectionResponse

# Delete collection
DELETE /api/v1/schedule/collections/{id}
Response: 204 No Content
```

---

### Time Blocks

```python
# Create time block
POST /api/v1/schedule/collections/{collection_id}/time-blocks
Body: {
    "title": "Work Hours",
    "start_time": "2024-01-08T08:00:00Z",
    "end_time": "2024-01-08T17:00:00Z",
    "is_recurring": true,
    "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    "notes": "Regular work schedule",
    "priority": 3
}
Response: TimeBlockResponse

# List time blocks in collection
GET /api/v1/schedule/collections/{collection_id}/time-blocks
Response: List[TimeBlockResponse]

# Update time block
PUT /api/v1/schedule/time-blocks/{id}
Body: {
    "title": "Updated Hours",
    "priority": 4
}
Response: TimeBlockResponse

# Delete time block
DELETE /api/v1/schedule/time-blocks/{id}
Response: 204 No Content
```

---

### Events

```python
# Create event
POST /api/v1/schedule/collections/{collection_id}/events
Body: {
    "category": "medical",
    "title": "Dentist Appointment",
    "start_time": "2024-01-15T14:00:00Z",
    "end_time": "2024-01-15T15:00:00Z",
    "child_ids": ["child-uuid"],
    "location": "123 Main St",
    "location_shared": true,
    "visibility": "co_parent",
    "share_category_details": false,
    "category_data": {
        "provider_name": "Dr. Smith",
        "provider_phone": "555-1234",
        "reason": "6-month checkup",
        "copay_amount": 25.00
    },
    "attendance_invites": [
        {
            "parent_id": "other-parent-uuid",
            "invited_role": "optional"
        }
    ]
}
Response: EventResponse

# List events (privacy filtered)
GET /api/v1/schedule/events?case_id=uuid&start_date=2024-01-01&end_date=2024-01-31
Response: List[EventResponse]

# Get event details (privacy filtered)
GET /api/v1/schedule/events/{id}
Response: EventResponse

# Update event
PUT /api/v1/schedule/events/{id}
Body: { ... }
Response: EventResponse

# Delete event
DELETE /api/v1/schedule/events/{id}
Response: 204 No Content
```

---

### Attendance

```python
# Update RSVP
PUT /api/v1/schedule/events/{event_id}/attendance/rsvp
Body: {
    "rsvp_status": "going",
    "rsvp_note": "Looking forward to it!"
}
Response: AttendanceResponse

# Check in to event
PUT /api/v1/schedule/events/{event_id}/attendance/check-in
Body: {
    "check_in_method": "gps",
    "location_lat": 37.7749,
    "location_lng": -122.4194,
    "notes": "Arrived 5 minutes early"
}
Response: AttendanceResponse

# Check out from event
PUT /api/v1/schedule/events/{event_id}/attendance/check-out
Body: {
    "notes": "Left on time"
}
Response: AttendanceResponse

# Update attendance status (manual)
PUT /api/v1/schedule/events/{event_id}/attendance/status
Body: {
    "show_status": "showed_up",
    "notes": "Participated fully",
    "attachments": {
        "photos": ["url1"]
    }
}
Response: AttendanceResponse

# Get attendance records for event
GET /api/v1/schedule/events/{event_id}/attendance
Response: List[AttendanceResponse]

# Get my attendance history
GET /api/v1/schedule/attendance/me?start_date=2024-01-01&end_date=2024-12-31
Response: AttendanceHistoryResponse
```

---

### Calendar View

```python
# Get calendar view (privacy filtered)
GET /api/v1/schedule/calendar?case_id=uuid&start_date=2024-01-01&end_date=2024-01-31&view=month
Response: {
    "my_collections": [CollectionResponse],
    "my_time_blocks": [TimeBlockResponse],
    "my_events": [EventResponse],
    "other_parent_busy": [BusyPeriod],  # Neutral busy blocks
    "shared_events": [EventResponse]  # Events I'm invited to
}

# Check for conflicts before creating event (ARIA)
POST /api/v1/schedule/check-conflicts
Body: {
    "case_id": "uuid",
    "start_time": "2024-01-15T14:00:00Z",
    "end_time": "2024-01-15T15:00:00Z",
    "child_ids": ["child-uuid"]
}
Response: {
    "has_conflicts": true,
    "conflicts": [
        {
            "type": "time_conflict",
            "severity": "medium",
            "message": "This time may create a scheduling conflict for the other parent.",
            "suggestion": "Consider proposing an alternate time window.",
            "can_proceed": true
        }
    ],
    "can_proceed": true
}
```

---

## Frontend Components

### 1. Schedule Dashboard
**Location:** `/app/schedule/page.tsx`

**Features:**
- Calendar view (month/week/day)
- My Time Collections sidebar
- Quick add buttons (Time Block, Event)
- Privacy-filtered display of other parent's time
- ARIA conflict warnings

**Components:**
```
app/schedule/
├── page.tsx                    # Main dashboard
├── calendar-view.tsx           # Calendar component
├── collection-sidebar.tsx      # My Time Collections list
├── quick-add-menu.tsx          # Add Time Block / Event
└── conflict-warning.tsx        # ARIA conflict display
```

---

### 2. My Time Collections Manager
**Location:** `/app/schedule/collections/page.tsx`

**Features:**
- Create/edit/delete collections
- Color picker
- Icon selector
- Reorder collections (drag-drop)
- Set default collection

**Components:**
```
app/schedule/collections/
├── page.tsx                    # Collections list
├── collection-form.tsx         # Create/edit form
├── collection-card.tsx         # Collection display card
└── color-picker.tsx            # Color selection
```

---

### 3. Time Block Manager
**Location:** `/app/schedule/time-blocks/page.tsx`

**Features:**
- Add recurring/one-off time blocks
- Visual recurrence builder
- Priority setting
- Bulk create (e.g., "every weekday 9-5")
- Preview calendar impact

**Components:**
```
app/schedule/time-blocks/
├── page.tsx                    # Time blocks list
├── time-block-form.tsx         # Create/edit form
├── recurrence-builder.tsx      # Visual RRULE builder
└── calendar-preview.tsx        # Show impact on calendar
```

---

### 4. Event Creator
**Location:** `/app/schedule/events/new/page.tsx`

**Features:**
- Category selection
- Dynamic form based on category
- Attendance invitations
- Privacy settings (share location, category details)
- ARIA conflict check before creation

**Components:**
```
app/schedule/events/
├── new/
│   └── page.tsx                # Event creation
├── [id]/
│   └── page.tsx                # Event details
├── event-form.tsx              # Base event form
├── category-forms/
│   ├── medical-form.tsx        # Medical category fields
│   ├── school-form.tsx         # School category fields
│   ├── recreation-form.tsx     # Recreation fields
│   ├── legal-form.tsx          # Legal fields
│   └── travel-form.tsx         # Travel fields
└── attendance-section.tsx      # Invite parents
```

**Example Category Forms:**

**Medical Event:**
```tsx
<MedicalEventForm>
  <Input name="provider_name" label="Healthcare Provider" />
  <Input name="provider_phone" label="Provider Phone" />
  <Input name="reason" label="Reason for Visit" />
  <Input name="copay_amount" label="Copay Amount" type="number" />
  <Select name="insurance_claim" label="Insurance Claim Status">
    <option>Not filed</option>
    <option>Filed</option>
    <option>Approved</option>
    <option>Denied</option>
  </Select>
  <FileUpload name="paperwork" label="Medical Documents" />
</MedicalEventForm>
```

**School Event:**
```tsx
<SchoolEventForm>
  <Input name="teacher_name" label="Teacher Name" />
  <Input name="school_name" label="School" />
  <Select name="meeting_type" label="Meeting Type">
    <option>Parent-Teacher Conference</option>
    <option>IEP Meeting</option>
    <option>504 Review</option>
    <option>Disciplinary Meeting</option>
    <option>Other</option>
  </Select>
  <Textarea name="agenda" label="Meeting Agenda" />
</SchoolEventForm>
```

---

### 5. Attendance Tracker
**Location:** `/app/schedule/events/[id]/attendance/page.tsx`

**Features:**
- RSVP interface
- Check-in/check-out buttons
- GPS verification (optional)
- Photo/document upload
- Attendance history

**Components:**
```
app/schedule/events/[id]/attendance/
├── page.tsx                    # Attendance tracking
├── rsvp-card.tsx               # RSVP interface
├── check-in-button.tsx         # GPS check-in
├── evidence-upload.tsx         # Upload photos/receipts
└── attendance-history.tsx      # Show history
```

---

### 6. Calendar View (Privacy-Filtered)
**Location:** `components/schedule/calendar.tsx`

**Features:**
- Month/week/day views
- Color-coded collections
- Own items: full details
- Other parent's items: neutral "busy" blocks
- Shared events: co-parent-safe view
- Click event for details
- Hover for quick preview

**Privacy Display:**
```tsx
// Own event
<EventCard>
  <EventTitle>Dentist - Sarah</EventTitle>
  <EventTime>2:00 PM - 3:00 PM</EventTime>
  <EventLocation>123 Main St</EventLocation>
  <EventCategory>Medical</EventCategory>
</EventCard>

// Other parent's time block (shown as neutral busy)
<BusyBlock>
  <BlockLabel>Mom's Time</BlockLabel>
  <BlockTime>2:00 PM - 3:00 PM</BlockTime>
  <NoDetails>Details private</NoDetails>
</BusyBlock>

// Shared event (co-parent view)
<SharedEventCard>
  <EventTitle>School Meeting</EventTitle>
  <EventTime>4:00 PM - 5:00 PM</EventTime>
  <MyInvite>You're invited (Optional)</MyInvite>
  <RSVPButton>RSVP</RSVPButton>
</SharedEventCard>
```

---

## Migration Strategy

### Phase 1: Database Migration

**Step 1:** Create new tables
```bash
# Create Alembic migration
alembic revision --autogenerate -m "Add My Time Collections, Time Blocks, and Event Attendance"

# Review migration
# Ensure:
# - MyTimeCollection table created
# - TimeBlock table created
# - EventAttendance table created
# - ScheduleEvent updated with new fields

# Apply migration
alembic upgrade head
```

**Step 2:** Migrate existing ScheduleEvent data
```python
# Migration script
def migrate_existing_events():
    """
    Migrate existing schedule events to new structure.
    Create default collections for each parent.
    """
    cases = get_all_cases()

    for case in cases:
        participants = get_case_participants(case.id)

        for participant in participants:
            # Create default "My Time" collection for each parent
            collection = MyTimeCollection(
                case_id=case.id,
                owner_id=participant.user_id,
                name="My Time",
                description="Default collection",
                color="#3B82F6",
                is_default=True
            )
            db.add(collection)
            db.commit()

            # Link existing events to default collection
            events = get_user_events(case.id, participant.user_id)
            for event in events:
                event.collection_id = collection.id
                event.created_by = participant.user_id
                event.category = "other"  # Default category
                event.visibility = "co_parent"

            db.commit()
```

---

### Phase 2: Backend Implementation

**Priority Order:**
1. Create database models ✅
2. Create service layer (business logic)
3. Create API endpoints
4. Add privacy filtering
5. Integrate ARIA conflict detection
6. Add attendance tracking
7. Write tests

**Estimated Time:** 3-4 weeks

---

### Phase 3: Frontend Implementation

**Priority Order:**
1. Calendar view component
2. My Time Collections manager
3. Time Block manager
4. Event creator (basic)
5. Category-specific forms
6. Attendance tracker
7. Privacy-filtered displays

**Estimated Time:** 3-4 weeks

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
**Goal:** Database + basic API

- [ ] Create database models
- [ ] Run migration
- [ ] Migrate existing data
- [ ] Create service layer
- [ ] Basic CRUD endpoints for Collections
- [ ] Basic CRUD endpoints for Time Blocks
- [ ] Update ScheduleEvent endpoints

**Deliverable:** Backend API ready for frontend integration

---

### Phase 2: Privacy & ARIA (Week 3)
**Goal:** Privacy filtering + conflict detection

- [ ] Implement privacy filtering logic
- [ ] Create calendar view endpoint with filtering
- [ ] Integrate ARIA conflict detection
- [ ] Add conflict check endpoint
- [ ] Test privacy rules

**Deliverable:** Privacy-compliant calendar API

---

### Phase 3: Events & Attendance (Week 4-5)
**Goal:** Event categories + attendance tracking

- [ ] Create EventAttendance model and endpoints
- [ ] Implement category-specific forms
- [ ] Add RSVP functionality
- [ ] Add check-in/check-out
- [ ] Evidence upload (photos, documents)
- [ ] Attendance history API

**Deliverable:** Full event and attendance system

---

### Phase 4: Frontend - Calendar (Week 6-7)
**Goal:** Calendar UI with privacy

- [ ] Calendar component (month/week/day views)
- [ ] Privacy-filtered display
- [ ] My Time Collections sidebar
- [ ] Time Block display
- [ ] Event cards (own vs shared)
- [ ] Neutral busy blocks for other parent

**Deliverable:** Working calendar view

---

### Phase 5: Frontend - Management (Week 8-9)
**Goal:** Create/edit UI

- [ ] My Time Collections manager
- [ ] Time Block form with recurrence builder
- [ ] Event creator with category forms
- [ ] Attendance tracker
- [ ] ARIA conflict warnings
- [ ] Privacy settings UI

**Deliverable:** Full schedule management interface

---

### Phase 6: Polish & Testing (Week 10)
**Goal:** Production-ready

- [ ] End-to-end testing
- [ ] Privacy audit
- [ ] ARIA testing
- [ ] Mobile responsive
- [ ] Performance optimization
- [ ] Documentation

**Deliverable:** Production-ready Schedule System V2.0

---

## Success Criteria

### Privacy ✅
- [ ] Other parent NEVER sees collection names
- [ ] Other parent NEVER sees time block details
- [ ] ARIA warns about conflicts without revealing why
- [ ] Events show only co-parent-safe information
- [ ] Location sharing is opt-in per event

### Functionality ✅
- [ ] Parents can create collections and organize their time
- [ ] Time blocks support one-off and recurring patterns
- [ ] Events support category-specific forms
- [ ] Attendance tracking works for all events
- [ ] Calendar displays privacy-filtered view correctly

### Court-Grade Evidence ✅
- [ ] Attendance records include timestamps
- [ ] RSVP status tracked accurately
- [ ] Show/no-show recorded objectively
- [ ] Evidence (photos, documents) can be attached
- [ ] Reports can be generated for court

### User Experience ✅
- [ ] Intuitive calendar interface
- [ ] Easy to create recurring time blocks
- [ ] Quick event creation with smart defaults
- [ ] Clear ARIA conflict warnings
- [ ] Mobile-friendly design

---

## Notes

**Privacy is paramount:**
- This system is designed to prevent "calendar spying"
- No parent should feel their schedule is being monitored
- ARIA provides neutral warnings without revealing private details

**Court documentation:**
- Attendance tracking provides objective evidence
- No interpretation or judgment
- Timestamps and evidence support court reports

**Flexibility:**
- Parents control what they share
- Collections can be as detailed or simple as needed
- Event categories can be extended

**ARIA neutrality:**
- Conflict detection without explanation
- Suggestions without revealing private info
- Maintains trust and safety

---

**End of Specification**

This design prioritizes privacy, court-readiness, and user autonomy while providing powerful scheduling tools for co-parents.
