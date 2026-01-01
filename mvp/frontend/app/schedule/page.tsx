'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, FolderOpen, ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { casesAPI, Case, MyTimeCollection, EventV2 } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';
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
  const [showCreateMenu, setShowCreateMenu] = useState(false);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading schedule...</div>
      </div>
    );
  }

  if (!selectedCase) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Cases Found</h2>
            <p className="text-gray-600 mb-4">
              You need to create or join a case to access the schedule.
            </p>
            <Button onClick={() => router.push('/cases')}>
              Go to Cases
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Schedule & Calendar</h1>
              <p className="text-gray-600 mt-1">{selectedCase.case_name}</p>
            </div>
            <div className="relative flex gap-2 w-full sm:w-auto">
              <Button onClick={() => handleCreateEvent()} className="flex items-center gap-2 flex-1 sm:flex-none justify-center">
                <Calendar className="h-5 w-5" />
                New Event
              </Button>
              <Button
                onClick={() => setShowExchangeForm(true)}
                variant="outline"
                className="flex items-center gap-2 flex-1 sm:flex-none justify-center border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <RefreshCw className="h-5 w-5" />
                Pickup/Dropoff
              </Button>
            </div>
          </div>
          {cases.length > 1 && (
            <div className="mt-4">
              <select
                value={selectedCase.id}
                onChange={(e) => {
                  const case_ = cases.find(c => c.id === e.target.value);
                  if (case_) setSelectedCase(case_);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {cases.map(case_ => (
                  <option key={case_.id} value={case_.id}>{case_.case_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mb-6 border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'calendar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="h-5 w-5" />
              Calendar View
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'collections'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FolderOpen className="h-5 w-5" />
              My Collections
            </button>
            <button
              onClick={() => setActiveTab('blocks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'blocks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="h-5 w-5" />
              Time Blocks
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Private</span>
            </button>
          </nav>
        </div>

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
      </div>

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
