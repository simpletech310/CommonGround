'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Gavel } from 'lucide-react';
import { calendarAPI, CalendarDataV2, EventV2, BusyPeriod, ExchangeInstanceForCalendar, CourtEventForCalendar } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CalendarViewProps {
  caseId: string;
  onCreateEvent?: (date: Date) => void;
  onEventClick?: (event: EventV2) => void;
}

export default function CalendarView({
  caseId,
  onCreateEvent,
  onEventClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDataV2 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [caseId, currentDate]);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get first and last day of current month (use UTC to avoid timezone issues)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      // Use UTC dates to ensure we get all events regardless of timezone
      const firstDay = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      const lastDay = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));

      const data = await calendarAPI.getData(
        caseId,
        firstDay.toISOString(),
        lastDay.toISOString(),
        true // Include busy periods
      );

      setCalendarData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load calendar');
      console.error('Error loading calendar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date): EventV2[] => {
    if (!calendarData) return [];

    return calendarData.events.filter(event => {
      const eventStart = new Date(event.start_time);
      return (
        eventStart.getDate() === date.getDate() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear()
      );
    });
  };

  const getBusyPeriodsForDate = (date: Date): BusyPeriod[] => {
    if (!calendarData) return [];

    return calendarData.busy_periods.filter(period => {
      const periodStart = new Date(period.start_time);
      return (
        periodStart.getDate() === date.getDate() &&
        periodStart.getMonth() === date.getMonth() &&
        periodStart.getFullYear() === date.getFullYear()
      );
    });
  };

  const getExchangesForDate = (date: Date): ExchangeInstanceForCalendar[] => {
    if (!calendarData?.exchanges) return [];

    return calendarData.exchanges.filter(exchange => {
      const exchangeTime = new Date(exchange.scheduled_time);
      return (
        exchangeTime.getDate() === date.getDate() &&
        exchangeTime.getMonth() === date.getMonth() &&
        exchangeTime.getFullYear() === date.getFullYear()
      );
    });
  };

  const getCourtEventsForDate = (date: Date): CourtEventForCalendar[] => {
    if (!calendarData?.court_events) return [];

    return calendarData.court_events.filter(event => {
      const eventDate = new Date(event.event_date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const calendarDays = generateCalendarDays();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{monthName}</h2>
        <div className="flex items-center gap-2">
          <Button onClick={today} variant="outline" size="sm">
            Today
          </Button>
          <Button onClick={previousMonth} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={nextMonth} variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Collections Legend */}
      {calendarData && calendarData.my_collections.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-700">My Collections:</span>
          {calendarData.my_collections.map(collection => (
            <div key={collection.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: collection.color }}
              />
              <span className="text-sm text-gray-600">{collection.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm text-gray-600">Pickup/Dropoff</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-sm text-gray-600">Court Event</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm text-gray-600">Other Parent (Busy)</span>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <Card className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-gray-100 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-xs sm:text-sm font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 auto-rows-fr min-h-[400px] sm:min-h-[500px]">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="border-r border-b bg-gray-50" />;
            }

            const events = getEventsForDate(date);
            const exchanges = getExchangesForDate(date);
            const courtEvents = getCourtEventsForDate(date);
            const busyPeriods = getBusyPeriodsForDate(date);
            const isTodayDate = isToday(date);

            return (
              <div
                key={date.toISOString()}
                className={`border-r border-b p-2 min-h-[100px] hover:bg-gray-50 transition-colors ${
                  isTodayDate ? 'bg-blue-50' : ''
                }`}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isTodayDate ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <button
                    onClick={() => onCreateEvent?.(date)}
                    className="opacity-0 hover:opacity-100 transition-opacity"
                    aria-label="Add event"
                  >
                    <Plus className="h-4 w-4 text-gray-400 hover:text-blue-600" />
                  </button>
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {events.slice(0, 3).map(event => {
                    const collection = calendarData?.my_collections.find(
                      c => c.id === event.collection_id
                    );
                    const eventColor = event.is_owner
                      ? collection?.color || '#3B82F6'
                      : '#6B7280'; // Gray for shared events

                    // RSVP indicator
                    const rsvpStatus = event.my_attendance?.rsvp_status;
                    const rsvpIndicator = rsvpStatus === 'going' ? '✓' :
                                          rsvpStatus === 'not_going' ? '✗' :
                                          rsvpStatus === 'maybe' ? '?' : '';

                    return (
                      <button
                        key={event.id}
                        onClick={() => onEventClick?.(event)}
                        className="w-full text-left px-2 py-1 rounded text-xs hover:opacity-80 transition-opacity truncate flex items-center gap-1"
                        style={{
                          backgroundColor: eventColor,
                          color: 'white',
                        }}
                        title={`${event.title}${rsvpStatus ? ` (${rsvpStatus})` : ''}`}
                      >
                        {rsvpIndicator && (
                          <span className={`flex-shrink-0 ${
                            rsvpStatus === 'going' ? 'text-green-200' :
                            rsvpStatus === 'not_going' ? 'text-red-200' : 'text-yellow-200'
                          }`}>
                            {rsvpIndicator}
                          </span>
                        )}
                        <span className="truncate">
                          {formatEventTime(event.start_time)} {event.title}
                        </span>
                      </button>
                    );
                  })}

                  {/* Exchanges (Pickup/Dropoff) */}
                  {exchanges.slice(0, 2).map(exchange => (
                    <div
                      key={exchange.id}
                      className="w-full px-2 py-1 rounded text-xs bg-purple-500 text-white truncate flex items-center gap-1"
                      title={`${exchange.title} - ${exchange.location || 'No location'}`}
                    >
                      <RefreshCw className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {formatEventTime(exchange.scheduled_time)} {exchange.title}
                      </span>
                    </div>
                  ))}

                  {/* Court Events */}
                  {courtEvents.slice(0, 2).map(courtEvent => (
                    <div
                      key={courtEvent.id}
                      className={`w-full px-2 py-1 rounded text-xs text-white truncate flex items-center gap-1 ${
                        courtEvent.is_mandatory ? 'bg-red-600' : 'bg-slate-600'
                      }`}
                      title={`${courtEvent.title}${courtEvent.is_mandatory ? ' (Required)' : ''} - ${courtEvent.location || 'See details'}`}
                    >
                      <Gavel className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {courtEvent.start_time ? formatTimeString(courtEvent.start_time) : ''} {courtEvent.title}
                      </span>
                    </div>
                  ))}

                  {/* Busy Periods */}
                  {busyPeriods.slice(0, 2).map((period, i) => (
                    <div
                      key={i}
                      className="px-2 py-1 rounded text-xs bg-gray-300 text-gray-700 truncate"
                      title={period.label}
                    >
                      {period.label}
                    </div>
                  ))}

                  {/* Show "more" indicator */}
                  {events.length + exchanges.length + courtEvents.length + busyPeriods.length > 3 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{events.length + exchanges.length + courtEvents.length + busyPeriods.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </Card>

      {/* Summary */}
      {calendarData && (
        <div className="text-sm text-gray-600 text-center">
          {calendarData.events.length === 0 && (calendarData.exchanges?.length || 0) === 0 && (calendarData.court_events?.length || 0) === 0 && calendarData.busy_periods.length === 0 ? (
            <span className="text-gray-400">
              No events this month. Click the + on any day to create one!
            </span>
          ) : (
            <>
              {calendarData.events.length} event{calendarData.events.length !== 1 ? 's' : ''}
              {(calendarData.exchanges?.length || 0) > 0 && (
                <span> • {calendarData.exchanges.length} exchange{calendarData.exchanges.length !== 1 ? 's' : ''}</span>
              )}
              {(calendarData.court_events?.length || 0) > 0 && (
                <span> • {calendarData.court_events.length} court event{calendarData.court_events.length !== 1 ? 's' : ''}</span>
              )}
              {calendarData.busy_periods.length > 0 && (
                <span> • {calendarData.busy_periods.length} busy period{calendarData.busy_periods.length !== 1 ? 's' : ''}</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatTimeString(timeString: string): string {
  // Handle time strings like "09:00:00" or "14:30:00"
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}
