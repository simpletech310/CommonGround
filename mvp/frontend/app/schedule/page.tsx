'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, FolderOpen, RefreshCw, Users, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { familyFilesAPI, agreementsAPI, exchangesAPI, FamilyFileDetail, Agreement, MyTimeCollection, EventV2, ExchangeInstanceForCalendar, CustodyExchangeInstance } from '@/lib/api';
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
import SilentHandoffCheckIn from '@/components/schedule/silent-handoff-checkin';

interface FamilyFileWithAgreements {
  familyFile: FamilyFileDetail;
  agreements: Agreement[];
}

function ScheduleContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [familyFilesWithAgreements, setFamilyFilesWithAgreements] = useState<FamilyFileWithAgreements[]>([]);
  const [selectedFamilyFile, setSelectedFamilyFile] = useState<FamilyFileDetail | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<MyTimeCollection | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [eventFormDate, setEventFormDate] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<EventV2 | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'collections' | 'blocks'>('calendar');
  const [calendarKey, setCalendarKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExchangeInstance, setSelectedExchangeInstance] = useState<CustodyExchangeInstance | null>(null);

  useEffect(() => {
    if (user) {
      loadFamilyFilesAndAgreements();
    }
  }, [user]);

  const loadFamilyFilesAndAgreements = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const familyFilesResponse = await familyFilesAPI.list();
      const familyFiles = familyFilesResponse.items || [];

      const filesWithAgreements: FamilyFileWithAgreements[] = [];

      for (const ff of familyFiles) {
        try {
          const agreementsResponse = await agreementsAPI.listForFamilyFile(ff.id);
          filesWithAgreements.push({
            familyFile: ff,
            agreements: agreementsResponse,
          });
        } catch (err) {
          console.error(`Failed to load agreements for family file ${ff.id}:`, err);
          filesWithAgreements.push({
            familyFile: ff,
            agreements: [],
          });
        }
      }

      setFamilyFilesWithAgreements(filesWithAgreements);

      // Auto-select first family file with agreements
      if (filesWithAgreements.length > 0) {
        const firstWithAgreements = filesWithAgreements.find(f => f.agreements.length > 0);
        if (firstWithAgreements) {
          setSelectedFamilyFile(firstWithAgreements.familyFile);
          if (firstWithAgreements.agreements.length > 0) {
            setSelectedAgreement(firstWithAgreements.agreements[0]);
          }
        } else {
          setSelectedFamilyFile(filesWithAgreements[0].familyFile);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load family files');
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
    setCalendarKey(prev => prev + 1);
  };

  const handleExchangeCreated = () => {
    setShowExchangeForm(false);
    setCalendarKey(prev => prev + 1);
  };

  const handleEventClick = (event: EventV2) => {
    setSelectedEvent(event);
  };

  const handleRsvpUpdate = () => {
    setCalendarKey(prev => prev + 1);
  };

  const handleCollectionSelect = (collection: MyTimeCollection) => {
    setSelectedCollection(collection);
    setActiveTab('blocks');
  };

  const handleExchangeClick = async (exchange: ExchangeInstanceForCalendar) => {
    if (!selectedFamilyFile) return;

    try {
      const exchangeDate = new Date(exchange.scheduled_time);
      const startDate = new Date(exchangeDate);
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date(exchangeDate);
      endDate.setDate(endDate.getDate() + 1);

      // Use family file ID for exchanges (they still use case_id which maps to family_file in the legacy system)
      const instances = await exchangesAPI.getUpcoming(
        selectedFamilyFile.id,
        startDate.toISOString(),
        endDate.toISOString()
      );
      const fullInstance = instances.find(inst => inst.id === exchange.id);

      if (fullInstance) {
        setSelectedExchangeInstance(fullInstance);
      } else {
        console.error('Exchange instance not found:', exchange.id);
      }
    } catch (err: any) {
      console.error('Failed to load exchange details:', err);
    }
  };

  const handleCheckInComplete = (updatedInstance: CustodyExchangeInstance) => {
    setSelectedExchangeInstance(updatedInstance);
    setCalendarKey(prev => prev + 1);
  };

  const handleFamilyFileChange = (familyFileId: string) => {
    const item = familyFilesWithAgreements.find(f => f.familyFile.id === familyFileId);
    if (item) {
      setSelectedFamilyFile(item.familyFile);
      if (item.agreements.length > 0) {
        setSelectedAgreement(item.agreements[0]);
      } else {
        setSelectedAgreement(null);
      }
      setCalendarKey(prev => prev + 1);
    }
  };

  const handleAgreementChange = (agreementId: string) => {
    const currentData = familyFilesWithAgreements.find(f => f.familyFile.id === selectedFamilyFile?.id);
    const agreement = currentData?.agreements.find(a => a.id === agreementId);
    if (agreement) {
      setSelectedAgreement(agreement);
      setCalendarKey(prev => prev + 1);
    }
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

  if (!selectedFamilyFile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageContainer>
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={Calendar}
                title="No Family Files Found"
                description="You need to create or join a Family File to access the schedule."
                action={{
                  label: 'Go to Family Files',
                  onClick: () => router.push('/family-files'),
                }}
              />
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  const currentFamilyFileData = familyFilesWithAgreements.find(f => f.familyFile.id === selectedFamilyFile.id);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Page Header */}
      <div className="border-b border-border bg-card">
        <PageContainer className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">TimeBridge</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Users className="h-4 w-4" />
                <span>{selectedFamilyFile.name}</span>
                {selectedAgreement && (
                  <>
                    <span className="text-border">/</span>
                    <FileText className="h-4 w-4" />
                    <span>{selectedAgreement.title}</span>
                  </>
                )}
              </div>
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

          {/* Family File and Agreement Selectors */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            {familyFilesWithAgreements.length > 1 && (
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-muted-foreground mb-1">Family File</label>
                <Select
                  value={selectedFamilyFile.id}
                  onChange={(e) => handleFamilyFileChange(e.target.value)}
                >
                  {familyFilesWithAgreements.map(item => (
                    <SelectOption key={item.familyFile.id} value={item.familyFile.id}>
                      {item.familyFile.name}
                    </SelectOption>
                  ))}
                </Select>
              </div>
            )}

            {currentFamilyFileData && currentFamilyFileData.agreements.length > 0 && (
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-muted-foreground mb-1">SharedCare Agreement</label>
                <Select
                  value={selectedAgreement?.id || ''}
                  onChange={(e) => handleAgreementChange(e.target.value)}
                >
                  <SelectOption value="">All Agreements</SelectOption>
                  {currentFamilyFileData.agreements.map(agreement => (
                    <SelectOption key={agreement.id} value={agreement.id}>
                      {agreement.title}
                    </SelectOption>
                  ))}
                </Select>
              </div>
            )}
          </div>
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
              caseId={selectedFamilyFile.id}
              agreementId={selectedAgreement?.id}
              onCreateEvent={handleCreateEvent}
              onEventClick={handleEventClick}
              onExchangeClick={handleExchangeClick}
            />
          )}
          {activeTab === 'collections' && (
            <div className="max-w-3xl mx-auto">
              <CollectionsManager caseId={selectedFamilyFile.id} onCollectionSelect={handleCollectionSelect} />
            </div>
          )}
          {activeTab === 'blocks' && (
            <div className="max-w-3xl mx-auto">
              <TimeBlocksManager caseId={selectedFamilyFile.id} selectedCollection={selectedCollection || undefined} />
            </div>
          )}
        </div>
      </PageContainer>

      {showEventForm && (
        <EventForm
          caseId={selectedFamilyFile.id}
          agreementId={selectedAgreement?.id}
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
          caseId={selectedFamilyFile.id}
          agreementId={selectedAgreement?.id}
          onClose={() => setShowExchangeForm(false)}
          onSuccess={handleExchangeCreated}
        />
      )}

      {selectedExchangeInstance && (
        <SilentHandoffCheckIn
          instance={selectedExchangeInstance}
          onCheckInComplete={handleCheckInComplete}
          onClose={() => setSelectedExchangeInstance(null)}
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
