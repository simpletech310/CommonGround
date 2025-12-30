'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { casesAPI, scheduleAPI, Case, CalendarEvent, ComplianceMetrics, ExchangeCheckIn } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';

function ScheduleContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseIdParam = searchParams.get('case');

  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [compliance, setCompliance] = useState<ComplianceMetrics | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingCompliance, setIsLoadingCompliance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    if (caseIdParam && cases.length > 0) {
      const caseToSelect = cases.find((c) => c.id === caseIdParam);
      if (caseToSelect) {
        handleSelectCase(caseToSelect);
      }
    }
  }, [caseIdParam, cases]);

  const loadCases = async () => {
    try {
      setIsLoadingCases(true);
      setError(null);
      const data = await casesAPI.list();
      const availableCases = data.filter((c) => c.status === 'active' || c.status === 'pending');
      setCases(availableCases);

      if (availableCases.length > 0 && !selectedCase) {
        handleSelectCase(availableCases[0]);
      }
    } catch (err: any) {
      console.error('Failed to load cases:', err);
      setError(err.message || 'Failed to load cases');
    } finally {
      setIsLoadingCases(false);
    }
  };

  const handleSelectCase = async (caseItem: Case) => {
    setSelectedCase(caseItem);
    await Promise.all([
      loadEvents(caseItem.id),
      loadCompliance(caseItem.id)
    ]);
  };

  const loadEvents = async (caseId: string) => {
    try {
      setIsLoadingEvents(true);
      setError(null);

      // Get start and end of current month
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const calendarData = await scheduleAPI.getCalendar(
        caseId,
        start.toISOString(),
        end.toISOString()
      );
      setEvents(calendarData.events);
    } catch (err: any) {
      console.error('Failed to load events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const loadCompliance = async (caseId: string) => {
    try {
      setIsLoadingCompliance(true);
      const metrics = await scheduleAPI.getCompliance(caseId);
      setCompliance(metrics);
    } catch (err: any) {
      console.error('Failed to load compliance:', err);
      // Don't set error - compliance is optional
    } finally {
      setIsLoadingCompliance(false);
    }
  };

  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];

    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.custodial_parent === user?.id) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-700 bg-green-100';
    if (score >= 70) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const formatMonthYear = () => {
    return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const previousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
    if (selectedCase) {
      loadEvents(selectedCase.id);
    }
  };

  const nextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
    if (selectedCase) {
      loadEvents(selectedCase.id);
    }
  };

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    const today = new Date();
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear() &&
      event.is_exchange
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
                CommonGround
              </Link>
              <nav className="flex gap-4">
                <Link href="/cases" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Cases
                </Link>
                <Link href="/messages" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Messages
                </Link>
                <Link href="/agreements" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Agreements
                </Link>
                <Link href="/schedule" className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
                  Schedule
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar - Case Selection */}
          <div className="w-80 flex-shrink-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cases</CardTitle>
                <CardDescription>Select a case to view schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoadingCases && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                )}

                {!isLoadingCases && cases.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-4">No active cases</p>
                    <Link href="/cases/new">
                      <Button size="sm">Create Case</Button>
                    </Link>
                  </div>
                )}

                {cases.map((caseItem) => (
                  <button
                    key={caseItem.id}
                    onClick={() => handleSelectCase(caseItem)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedCase?.id === caseItem.id
                        ? 'bg-blue-50 border-2 border-blue-300'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{caseItem.case_name}</p>
                      {caseItem.status === 'pending' && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{caseItem.state}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Compliance Dashboard */}
            {compliance && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compliance Score</CardTitle>
                  <CardDescription>Last {compliance.period_days} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getComplianceColor(compliance.compliance_score)}`}>
                        {Math.round(compliance.compliance_score)}%
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {compliance.on_time_count} / {compliance.total_exchanges} on time
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">On Time:</span>
                        <span className="font-medium text-green-700">{compliance.on_time_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Within Grace:</span>
                        <span className="font-medium text-yellow-700">{compliance.within_grace_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Late:</span>
                        <span className="font-medium text-red-700">{compliance.late_count}</span>
                      </div>
                      {compliance.average_minutes_late > 0 && (
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-gray-600">Avg. Late:</span>
                          <span className="font-medium">{Math.round(compliance.average_minutes_late)} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Exchanges */}
            {todayEvents.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">Today's Exchanges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {todayEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-white rounded-lg border border-blue-200">
                      <p className="font-medium text-sm text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                      {event.location && (
                        <p className="text-xs text-gray-500 mt-1">{event.location}</p>
                      )}
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowCheckInModal(true);
                        }}
                      >
                        Check In
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Area - Calendar */}
          <div className="flex-1">
            {!selectedCase && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a case to view schedule
                    </h3>
                    <p className="text-gray-600">
                      Choose a case from the sidebar to view parenting time calendar
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedCase && (
              <div className="space-y-6">
                {/* Calendar Header */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>{selectedCase.case_name} - Schedule</CardTitle>
                        <CardDescription>Parenting time calendar and exchange tracking</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={previousMonth}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </Button>
                        <span className="text-lg font-medium px-4">{formatMonthYear()}</span>
                        <Button variant="outline" size="sm" onClick={nextMonth}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Calendar Grid */}
                <Card>
                  <CardContent className="pt-6">
                    {isLoadingEvents ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading calendar...</p>
                      </div>
                    ) : (
                      <div className="calendar-grid">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-2 mb-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7 gap-2">
                          {getDaysInMonth().map((date, index) => {
                            const dayEvents = getEventsForDate(date);
                            const isToday = date &&
                              date.getDate() === new Date().getDate() &&
                              date.getMonth() === new Date().getMonth() &&
                              date.getFullYear() === new Date().getFullYear();

                            return (
                              <div
                                key={index}
                                className={`min-h-24 p-2 rounded-lg border ${
                                  !date ? 'bg-gray-50 border-transparent' :
                                  isToday ? 'bg-blue-50 border-blue-300' :
                                  'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {date && (
                                  <>
                                    <div className={`text-sm font-medium mb-1 ${
                                      isToday ? 'text-blue-600' : 'text-gray-900'
                                    }`}>
                                      {date.getDate()}
                                    </div>
                                    <div className="space-y-1">
                                      {dayEvents.map((event) => (
                                        <div
                                          key={event.id}
                                          className={`text-xs px-2 py-1 rounded border ${getEventColor(event)} cursor-pointer hover:opacity-80`}
                                          onClick={() => {
                                            setSelectedEvent(event);
                                            if (event.is_exchange) {
                                              setShowCheckInModal(true);
                                            }
                                          }}
                                        >
                                          <div className="font-medium truncate">{event.title}</div>
                                          {event.is_exchange && (
                                            <div className="text-xs opacity-75">
                                              {new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-6 mt-6 pt-6 border-t">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                            <span className="text-sm text-gray-600">Your parenting time</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                            <span className="text-sm text-gray-600">Other parent's time</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Check-in Modal (Simple version - can be enhanced) */}
      {showCheckInModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>Exchange Check-In</CardTitle>
              <CardDescription>{selectedEvent.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Time: {new Date(selectedEvent.start).toLocaleString()}</p>
                  {selectedEvent.location && (
                    <p className="text-sm text-gray-600">Location: {selectedEvent.location}</p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    Exchange check-in feature will be fully implemented in the next update.
                    This will allow you to check in with GPS verification and track on-time performance.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowCheckInModal(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={() => setShowCheckInModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
