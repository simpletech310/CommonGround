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
import { PageContainer, EmptyState } from '@/components/layout';
import { useRouter } from 'next/navigation';
import {
  familyFilesAPI,
  agreementsAPI,
  FamilyFileDetail,
  FamilyFileChild,
  Agreement,
  AgreementQuickSummary,
} from '@/lib/api';
import {
  Calendar,
  MessageSquare,
  FileText,
  ChevronRight,
  Plus,
  FolderOpen,
} from 'lucide-react';

/**
 * CommonGround Parent Dashboard
 *
 * Design: Child-centered view - children are the focus, not the conflict.
 * Philosophy: "It's about the children, not the parents."
 *
 * Architecture: Family Files are the primary container.
 * SharedCare Agreements live inside Family Files.
 */

interface FamilyFileWithData {
  familyFile: FamilyFileDetail;
  agreements: Agreement[];
  agreementSummary: AgreementQuickSummary | null;
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

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [familyFilesWithData, setFamilyFilesWithData] = useState<FamilyFileWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const familyFilesResponse = await familyFilesAPI.list();
      const familyFiles = familyFilesResponse.items;

      // Fetch additional data for each family file
      const filesWithData: FamilyFileWithData[] = await Promise.all(
        familyFiles.map(async (ff) => {
          let agreements: Agreement[] = [];
          let agreementSummary: AgreementQuickSummary | null = null;
          let familyFileDetail: FamilyFileDetail;

          try {
            // Get full family file details (includes children)
            familyFileDetail = await familyFilesAPI.get(ff.id);
          } catch {
            // Fallback to basic info
            familyFileDetail = {
              ...ff,
              children: [],
              active_agreement_count: 0,
              quick_accord_count: 0,
            };
          }

          // Load agreements for active family files
          if (ff.status === 'active') {
            try {
              const agreementsData = await agreementsAPI.listForFamilyFile(ff.id);
              agreements = agreementsData.items;

              // Get summary for the active agreement
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
          }

          return { familyFile: familyFileDetail, agreements, agreementSummary };
        })
      );

      setFamilyFilesWithData(filesWithData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get all children from active family files
  const allChildren = familyFilesWithData
    .filter((f) => f.familyFile.status === 'active')
    .flatMap((f) => f.familyFile.children || []);

  // Get pending family files (awaiting parent B)
  const pendingFamilyFiles = familyFilesWithData.filter(
    (f) => !f.familyFile.is_complete && f.familyFile.status === 'active'
  );
  const activeFamilyFiles = familyFilesWithData.filter(
    (f) => f.familyFile.status === 'active' && f.familyFile.is_complete
  );

  // Get the primary family file (for quick actions)
  const primaryFamilyFile = activeFamilyFiles[0] || familyFilesWithData[0];

  // Check if user has any setup to complete
  const needsSetup = familyFilesWithData.length === 0;

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

        {/* Pending Family File Alerts */}
        {pendingFamilyFiles.length > 0 && (
          <Alert variant="default" className="mb-6">
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  You have {pendingFamilyFiles.length} Family File
                  {pendingFamilyFiles.length > 1 ? 's' : ''} awaiting the other parent to join.
                </span>
                <Button variant="ghost" size="sm" onClick={() => router.push('/family-files')}>
                  View Family Files
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
            {/* Left Column - Children & Family Files */}
            <div className="lg:col-span-2 space-y-6">
              {/* Children Cards */}
              {allChildren.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Your Children</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/family-files')}
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

              {/* Family Files Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Family Files</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/family-files')}
                  >
                    View all
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                {familyFilesWithData.length > 0 ? (
                  <div className="space-y-4">
                    {familyFilesWithData.slice(0, 2).map(({ familyFile, agreements }) => (
                      <FamilyFileCard
                        key={familyFile.id}
                        familyFile={familyFile}
                        agreementCount={agreements.length}
                        onClick={() => router.push(`/family-files/${familyFile.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <EmptyState
                        icon={FolderOpen}
                        title="No Family Files"
                        description="Create a Family File to start co-parenting"
                        action={{
                          label: 'Create Family File',
                          onClick: () => router.push('/family-files/new'),
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
              {primaryFamilyFile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SharedCare Agreements</CardTitle>
                    <CardDescription>
                      {primaryFamilyFile.familyFile.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {primaryFamilyFile.agreements.length > 0 ? (
                      <div className="space-y-4">
                        {/* AI Summary (if available) */}
                        {primaryFamilyFile.agreementSummary && (
                          <div className="space-y-3">
                            {/* Progress Bar */}
                            <div>
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Completion</span>
                                <span>{primaryFamilyFile.agreementSummary.completion_percentage}%</span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-cg-primary rounded-full transition-all duration-500"
                                  style={{ width: `${primaryFamilyFile.agreementSummary.completion_percentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Summary Text */}
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {primaryFamilyFile.agreementSummary.summary}
                            </p>
                          </div>
                        )}

                        {/* Agreement List */}
                        <div className="space-y-2 pt-2 border-t border-border">
                          {primaryFamilyFile.agreements.slice(0, 2).map((agreement) => (
                            <div
                              key={agreement.id}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm truncate">{agreement.title}</span>
                              </div>
                              <Badge
                                variant={
                                  agreement.status === 'approved' || agreement.status === 'active'
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
                          onClick={() => router.push('/agreements')}
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
function ChildCard({ child }: { child: FamilyFileChild }) {
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

// Family File Card Component
function FamilyFileCard({
  familyFile,
  agreementCount,
  onClick,
}: {
  familyFile: FamilyFileDetail;
  agreementCount: number;
  onClick: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-smooth cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-cg-primary-subtle flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-cg-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{familyFile.title}</h3>
              <p className="text-sm text-muted-foreground">
                {familyFile.children?.length || 0} children • {agreementCount} agreement{agreementCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!familyFile.is_complete && (
              <Badge variant="warning" size="sm">Pending</Badge>
            )}
            {familyFile.has_court_case && (
              <Badge variant="secondary" size="sm">Court Case</Badge>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
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
                <h4 className="font-medium text-foreground">Create a Family File</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Start by creating a Family File and inviting the other parent
                </p>
                <Button
                  className="mt-3"
                  onClick={() => router.push('/family-files/new')}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Create Family File
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-60">
              <div className="flex-shrink-0 h-8 w-8 bg-secondary text-muted-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Build your SharedCare Agreement</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Use ARIA or our guided wizard to create a comprehensive custody agreement
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-60">
              <div className="flex-shrink-0 h-8 w-8 bg-secondary text-muted-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Start co-parenting together</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Send messages, schedule events, and track expenses with AI-powered support
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
