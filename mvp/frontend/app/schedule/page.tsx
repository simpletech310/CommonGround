'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, FolderOpen, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { casesAPI, Case, MyTimeCollection, EventV2 } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { PageContainer, EmptyState } from '@/components/layout';
import { Select, SelectOption } from '@/components/ui/select';
import CollectionsManager from '@/components/schedule/collections-manager';
import TimeBlocksManager from '@/components/schedule/time-blocks-manager';
import CalendarView from '@/components/schedule/calendar-view';
import EventForm from '@/components/schedule/event-form';
import EventDetails from '@/components/schedule/event-details';
import ExchangeForm from '@/components/schedule/exchange-form';

function ScheduleContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<MyTimeCollection | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [eventFormDate, setEventFormDate] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<EventV2 | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'collections' | 'blocks'>('calendar');
  const [calendarKey, setCalendarKey] = useState(0); // For refreshing calendar
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCases();
    }
  }, [user]);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await casesAPI.list();
      setCases(data);

      const activeCase = data.find(c => c.status === 'active');
      if (activeCase) {
        setSelectedCase(activeCase);
      } else if (data.length > 0) {
        setSelectedCase(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = (date?: Date) => {
    setEventFormDate(date);
    setShowEventForm(true);
  };

  const handleEventCreated = () => {
    setShowEventForm(false);
    setEventFormDate(undefined);
    setCalendarKey(prev => prev + 1); // Refresh calendar
  };

  const handleExchangeCreated = () => {
    setShowExchangeForm(false);
    setCalendarKey(prev => prev + 1); // Refresh calendar
  };

  const handleEventClick = (event: EventV2) => {
    setSelectedEvent(event);
  };

  const handleRsvpUpdate = () => {
    setCalendarKey(prev => prev + 1); // Refresh calendar after RSVP
  };

  const handleCollectionSelect = (collection: MyTimeCollection) => {
    setSelectedCollection(collection);
    setActiveTab('blocks');
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageContainer>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading schedule...</p>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!selectedCase) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageContainer>
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={Calendar}
                title="No Cases Found"
                description="You need to create or join a case to access the schedule."
                action={{
                  label: 'Go to Cases',
                  onClick: () => router.push('/cases'),
                }}
              />
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Page Header */}
      <div className="border-b border-border bg-card">
        <PageContainer className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Schedule & Calendar</h1>
              <p className="text-muted-foreground mt-1">{selectedCase.case_name}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleCreateEvent()} className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                New Event
              </Button>
              <Button
                onClick={() => setShowExchangeForm(true)}
                variant="outline"
                className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <RefreshCw className="h-5 w-5" />
                Pickup/Dropoff
              </Button>
            </div>
          </div>
          {cases.length > 1 && (
            <div className="mt-4 max-w-xs">
              <Select
                value={selectedCase.id}
                onChange={(e) => {
                  const case_ = cases.find(c => c.id === e.target.value);
                  if (case_) setSelectedCase(case_);
                }}
              >
                {cases.map(case_ => (
                  <SelectOption key={case_.id} value={case_.id}>{case_.case_name}</SelectOption>
                ))}
              </Select>
            </div>
          )}
        </PageContainer>
      </div>

      <PageContainer className="py-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-border overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-smooth ${
                activeTab === 'calendar'
                  ? 'border-cg-primary text-cg-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-5 w-5" />
              Calendar View
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-smooth ${
                activeTab === 'collections'
                  ? 'border-cg-primary text-cg-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderOpen className="h-5 w-5" />
              My Collections
            </button>
            <button
              onClick={() => setActiveTab('blocks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-smooth ${
                activeTab === 'blocks'
                  ? 'border-cg-primary text-cg-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="h-5 w-5" />
              Time Blocks
              <Badge variant="secondary" size="sm">Private</Badge>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'calendar' && (
            <CalendarView
              key={calendarKey}
              caseId={selectedCase.id}
              onCreateEvent={handleCreateEvent}
              onEventClick={handleEventClick}
            />
          )}
          {activeTab === 'collections' && (
            <div className="max-w-3xl mx-auto">
              <CollectionsManager caseId={selectedCase.id} onCollectionSelect={handleCollectionSelect} />
            </div>
          )}
          {activeTab === 'blocks' && (
            <div className="max-w-3xl mx-auto">
              <TimeBlocksManager caseId={selectedCase.id} selectedCollection={selectedCollection || undefined} />
            </div>
          )}
        </div>
      </PageContainer>

      {showEventForm && (
        <EventForm
          caseId={selectedCase.id}
          onClose={() => {
            setShowEventForm(false);
            setEventFormDate(undefined);
          }}
          onSuccess={handleEventCreated}
          initialDate={eventFormDate}
        />
      )}

      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onRsvpUpdate={handleRsvpUpdate}
        />
      )}

      {showExchangeForm && (
        <ExchangeForm
          caseId={selectedCase.id}
          onClose={() => setShowExchangeForm(false)}
          onSuccess={handleExchangeCreated}
        />
      )}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <ScheduleContent />
    </ProtectedRoute>
  );
}
