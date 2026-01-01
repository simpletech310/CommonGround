"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCourtAuth } from "../../../layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CourtEvent {
  id: string;
  case_id: string;
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  virtual_link?: string;
  is_mandatory: boolean;
  status: string;
  internal_notes?: string;
  shared_notes?: string;
  petitioner_attended?: boolean;
  respondent_attended?: boolean;
  created_at: string;
}

const EVENT_TYPES = [
  { id: "hearing", label: "Court Hearing", icon: "⚖️" },
  { id: "mediation", label: "Mediation", icon: "🤝" },
  { id: "conference", label: "Conference", icon: "📞" },
  { id: "deadline", label: "Deadline", icon: "📅" },
  { id: "review", label: "Review Date", icon: "📋" },
  { id: "other", label: "Other", icon: "📌" },
];

export default function EventsPage() {
  const params = useParams();
  const router = useRouter();
  const { professional, token, isLoading } = useCourtAuth();
  const [events, setEvents] = useState<CourtEvent[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [eventType, setEventType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);

  const caseId = params.id as string;

  useEffect(() => {
    if (!isLoading && !professional) {
      router.push("/court-portal/login");
    }
  }, [professional, isLoading, router]);

  useEffect(() => {
    if (professional && caseId) {
      loadEvents();
    }
  }, [professional, caseId]);

  const loadEvents = async () => {
    try {
      setIsLoadingEvents(true);
      setError(null);
      const response = await fetch(`${API_BASE}/court/events/case/${caseId}?include_past=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        setError("Failed to load events");
      }
    } catch (err) {
      setError("Failed to load events");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  if (isLoading || !professional) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!eventType || !title || !eventDate) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/court/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          case_id: caseId,
          event_type: eventType,
          title,
          description: description || undefined,
          event_date: eventDate,
          start_time: startTime || undefined,
          location: location || undefined,
          is_mandatory: isMandatory,
          shared_notes: notes || undefined,
          petitioner_required: true,
          respondent_required: true,
        }),
      });

      if (response.ok) {
        const newEvent = await response.json();
        setEvents([newEvent, ...events]);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to create event");
      }
    } catch (err) {
      setError("Failed to create event");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setEventType("");
    setTitle("");
    setDescription("");
    setEventDate("");
    setStartTime("");
    setLocation("");
    setNotes("");
    setIsMandatory(true);
  };

  const getEventIcon = (type: string) => {
    return EVENT_TYPES.find((t) => t.id === type)?.icon || "📌";
  };

  const getAttendanceBadge = (attended: boolean | undefined) => {
    if (attended === true) {
      return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Attended</span>;
    } else if (attended === false) {
      return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Missed</span>;
    }
    return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Pending</span>;
  };

  const upcomingEvents = events
    .filter((e) => new Date(e.event_date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  const pastEvents = events
    .filter((e) => new Date(e.event_date) < new Date(new Date().toDateString()))
    .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/court-portal/cases/${params.id}`}
              className="text-slate-500 hover:text-slate-700"
            >
              ← Back to Case
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Court Events</h1>
          <p className="text-slate-600">
            Hearings, deadlines, and court-scheduled events
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          Schedule Event
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoadingEvents && (
        <div className="text-center py-8 text-slate-500">
          Loading events...
        </div>
      )}

      {/* Create Event Form */}
      {showCreateForm && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Schedule New Event</CardTitle>
            <CardDescription>
              Create a court event that both parents will be notified about
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Type */}
            <div className="space-y-2">
              <Label>Event Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setEventType(type.id)}
                    className={`p-2 border rounded-lg text-sm flex items-center space-x-2 ${
                      eventType === type.id
                        ? "border-blue-500 bg-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Description */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Status Hearing"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the event"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location (optional)</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Family Court Room 4B"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes"
                />
              </div>
            </div>

            {/* Mandatory checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-mandatory"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is-mandatory">This is a mandatory court event</Label>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button variant="outline" onClick={resetForm} disabled={isCreating}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!eventType || !title || !eventDate || isCreating}
              >
                {isCreating ? "Creating..." : "Create Event"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>
            Events scheduled for the future
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <span className="text-4xl">📅</span>
              <p className="mt-4">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className={`border rounded-lg p-4 hover:bg-slate-50 transition ${event.is_mandatory ? 'border-l-4 border-l-red-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getEventIcon(event.event_type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{event.title}</h3>
                          {event.is_mandatory && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Mandatory</span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-slate-500">{event.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span className="text-slate-600">
                            {new Date(event.event_date).toLocaleDateString()}
                            {event.start_time && ` at ${event.start_time.substring(0, 5)}`}
                          </span>
                          {event.location && (
                            <span className="text-slate-500">
                              📍 {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-xs text-slate-500">Attendance</div>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-xs text-slate-500">Petitioner:</span>
                          {getAttendanceBadge(event.petitioner_attended)}
                        </div>
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-xs text-slate-500">Respondent:</span>
                          {getAttendanceBadge(event.respondent_attended)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {event.shared_notes && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                      <span className="font-medium">Note:</span> {event.shared_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Events */}
      <Card>
        <CardHeader>
          <CardTitle>Past Events</CardTitle>
          <CardDescription>
            Historical record of court events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <span className="text-4xl">📋</span>
              <p className="mt-4">No past events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastEvents.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 bg-slate-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl opacity-50">{getEventIcon(event.event_type)}</span>
                      <div>
                        <h3 className="font-medium text-slate-700">{event.title}</h3>
                        <div className="text-sm text-slate-500">
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {getAttendanceBadge(event.petitioner_attended)}
                      {getAttendanceBadge(event.respondent_attended)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <span className="text-xl">ℹ️</span>
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-700">About Court Events</p>
              <p className="mt-1">
                Events scheduled here automatically notify both parents. RSVP status is tracked
                and included in compliance reports. Parents can confirm, decline, or request
                rescheduling through the app.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
