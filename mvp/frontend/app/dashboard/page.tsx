'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { PageContainer, PageHeader, EmptyState } from '@/components/layout';
import { useRouter } from 'next/navigation';
import {
  casesAPI,
  courtSettingsAPI,
  scheduleAPI,
  agreementsAPI,
  Case,
  Child,
  CourtSettingsPublic,
  ScheduleEvent,
  Agreement,
  AgreementQuickSummary,
} from '@/lib/api';
import {
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  ChevronRight,
  Plus,
  Gavel,
} from 'lucide-react';

/**
 * CommonGround Parent Dashboard
 *
 * Design: Child-centered view - children are the focus, not the conflict.
 * Philosophy: "It's about the children, not the parents."
 */

interface CaseWithData {
  case: Case;
  settings: CourtSettingsPublic | null;
  agreements: Agreement[];
  agreementSummary: AgreementQuickSummary | null;
  upcomingEvents: ScheduleEvent[];
}

// Helper to calculate child's age
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Get initials for avatar
function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Format date for display
function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [casesWithData, setCasesWithData] = useState<CaseWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const cases = await casesAPI.list();

      // Fetch additional data for each case
      const casesWithData: CaseWithData[] = await Promise.all(
        cases.map(async (c) => {
          let settings: CourtSettingsPublic | null = null;
          let agreements: Agreement[] = [];
          let agreementSummary: AgreementQuickSummary | null = null;
          let upcomingEvents: ScheduleEvent[] = [];

          if (c.status === 'active') {
            try {
              settings = await courtSettingsAPI.getSettings(c.id);
            } catch {
              // Court settings may not exist
            }

            try {
              agreements = await agreementsAPI.list(c.id);
              // Get summary for the active agreement first, then approved, then first available
              if (agreements.length > 0) {
                const activeAgreement = agreements.find(a => a.status === 'active')
                  || agreements.find(a => a.status === 'approved')
                  || agreements[0];
                try {
                  agreementSummary = await agreementsAPI.getQuickSummary(activeAgreement.id);
                } catch {
                  // Summary may fail if AI is unavailable
                }
              }
            } catch {
              // No agreements yet
            }

            try {
              // Get events for the next 7 days
              const now = new Date();
              const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              const events = await scheduleAPI.getEvents(
                c.id,
                now.toISOString().split('T')[0],
                nextWeek.toISOString().split('T')[0]
              );
              upcomingEvents = events
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .slice(0, 3);
            } catch {
              // No events yet
            }
          }

          return { case: c, settings, agreements, agreementSummary, upcomingEvents };
        })
      );

      setCasesWithData(casesWithData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get all children from active cases
  const allChildren = casesWithData
    .filter((c) => c.case.status === 'active')
    .flatMap((c) => c.case.children || []);

  // Get cases with active court controls
  const casesWithActiveControls = casesWithData.filter(
    (c) => c.settings?.active_controls && c.settings.active_controls.length > 0
  );

  // Get pending cases
  const pendingCases = casesWithData.filter((c) => c.case.status === 'pending');
  const activeCases = casesWithData.filter((c) => c.case.status === 'active');

  // Get the primary active case (for quick actions)
  const primaryCase = activeCases[0];

  // Check if user has any setup to complete
  const needsSetup = activeCases.length === 0;

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageContainer>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-cg-primary border-t-transparent mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Court Controls Banner */}
      {casesWithActiveControls.length > 0 && (
        <div className="bg-cg-warning-subtle border-b border-cg-warning/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            {casesWithActiveControls.map(({ case: c, settings }) => (
              <div key={c.id} className="flex items-start gap-3">
                <Gavel className="h-5 w-5 text-cg-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">
                      Court-Ordered Controls Active
                    </span>
                    <span className="text-muted-foreground text-sm">
                      ({c.case_name})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings?.gps_checkins_required && (
                      <Badge variant="warning" size="sm">GPS Check-ins</Badge>
                    )}
                    {settings?.supervised_exchange_required && (
                      <Badge variant="warning" size="sm">Supervised Exchanges</Badge>
                    )}
                    {settings?.in_app_communication_only && (
                      <Badge variant="warning" size="sm">In-App Communication Only</Badge>
                    )}
                    {settings?.aria_enforcement_locked && (
                      <Badge variant="warning" size="sm">ARIA Moderation Locked</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <PageContainer>
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Welcome back, {user?.first_name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {needsSetup
              ? "Let's get started with setting up your co-parenting account"
              : "Here's what's happening with your family"}
          </p>
        </div>

        {/* Pending Case Alerts */}
        {pendingCases.length > 0 && (
          <Alert variant="default" className="mb-6">
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  You have {pendingCases.length} pending case
                  {pendingCases.length > 1 ? 's' : ''} awaiting the other parent to join.
                </span>
                <Button variant="ghost" size="sm" onClick={() => router.push('/cases')}>
                  View cases
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Grid */}
        {needsSetup ? (
          // Getting Started View
          <GettingStartedSection router={router} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Children & Events */}
            <div className="lg:col-span-2 space-y-6">
              {/* Children Cards */}
              {allChildren.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Your Children</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/cases')}
                    >
                      Manage
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {allChildren.map((child) => (
                      <ChildCard key={child.id} child={child} />
                    ))}
                  </div>
                </section>
              )}

              {/* What's Next - Upcoming Events */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">What's Next</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/schedule')}
                  >
                    View schedule
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                {primaryCase?.upcomingEvents && primaryCase.upcomingEvents.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {primaryCase.upcomingEvents.map((event) => (
                          <EventRow key={event.id} event={event} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <EmptyState
                        icon={Calendar}
                        title="No upcoming events"
                        description="Your schedule is clear for the next 7 days"
                        action={{
                          label: 'Add event',
                          onClick: () => router.push('/schedule'),
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </section>
            </div>

            {/* Right Column - Quick Actions & Status */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/messages')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send a message
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/schedule')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule event
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push('/payments/new')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Log expense
                  </Button>
                </CardContent>
              </Card>

              {/* Agreement Summary */}
              {primaryCase && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Agreement Summary</CardTitle>
                    <CardDescription>
                      {primaryCase.case.case_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {primaryCase.agreements.length > 0 ? (
                      <div className="space-y-4">
                        {/* AI Summary (if available) */}
                        {primaryCase.agreementSummary && (
                          <div className="space-y-3">
                            {/* Progress Bar */}
                            <div>
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Completion</span>
                                <span>{primaryCase.agreementSummary.completion_percentage}%</span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-cg-primary rounded-full transition-all duration-500"
                                  style={{ width: `${primaryCase.agreementSummary.completion_percentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Summary Text */}
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {primaryCase.agreementSummary.summary}
                            </p>

                            {/* Key Points */}
                            {primaryCase.agreementSummary.key_points.length > 0 && (
                              <ul className="space-y-1.5">
                                {primaryCase.agreementSummary.key_points.slice(0, 3).map((point, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <span className="text-cg-success mt-0.5">•</span>
                                    <span className="text-muted-foreground">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {/* Agreement List */}
                        <div className="space-y-2 pt-2 border-t border-border">
                          {primaryCase.agreements.slice(0, 2).map((agreement) => (
                            <div
                              key={agreement.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{agreement.title}</span>
                              </div>
                              <Badge
                                variant={
                                  agreement.status === 'approved'
                                    ? 'success'
                                    : agreement.status === 'pending_approval'
                                    ? 'warning'
                                    : 'secondary'
                                }
                                size="sm"
                              >
                                {agreement.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => router.push('/agreements')}
                        >
                          View all agreements
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          No agreement created yet
                        </p>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/cases/${primaryCase.case.id}`)}
                        >
                          Create agreement
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Co-Parent Communication */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Communication</CardTitle>
                  <CardDescription>
                    Messages with AI-powered moderation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-cg-success" />
                      <span className="text-sm text-muted-foreground">ARIA active</span>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => router.push('/messages')}
                  >
                    Open messages
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}

// Child Card Component
function ChildCard({ child }: { child: Child }) {
  const age = calculateAge(child.date_of_birth);
  const initials = getInitials(child.first_name, child.last_name);

  return (
    <Card className="hover:shadow-md transition-smooth">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 h-14 w-14 rounded-full bg-cg-primary-subtle flex items-center justify-center">
            <span className="text-lg font-semibold text-cg-primary">{initials}</span>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {child.first_name} {child.last_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {age} years old
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Event Row Component
function EventRow({ event }: { event: ScheduleEvent }) {
  const isExchange = event.event_type === 'exchange' || event.title.toLowerCase().includes('exchange');

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-smooth">
      {/* Icon */}
      <div
        className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
          isExchange ? 'bg-cg-primary-subtle' : 'bg-secondary'
        }`}
      >
        {isExchange ? (
          <Users className="h-5 w-5 text-cg-primary" />
        ) : (
          <Calendar className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{event.title}</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatEventDate(event.start_time)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
          )}
        </div>
      </div>
      {/* Type Badge */}
      {isExchange && (
        <Badge variant="default" size="sm">Exchange</Badge>
      )}
    </div>
  );
}

// Getting Started Section for new users
function GettingStartedSection({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Set up your CommonGround account in a few simple steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-cg-primary-subtle text-cg-primary rounded-full flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Create a case</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Start by creating a new co-parenting case and inviting the other parent
                </p>
                <Button
                  className="mt-3"
                  onClick={() => router.push('/cases/new')}
                >
                  Create case
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-60">
              <div className="flex-shrink-0 h-8 w-8 bg-secondary text-muted-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Build your agreement</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Use our guided interview to create a comprehensive custody agreement
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-60">
              <div className="flex-shrink-0 h-8 w-8 bg-secondary text-muted-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Start communicating</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Send messages with AI-powered moderation to reduce conflict
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
