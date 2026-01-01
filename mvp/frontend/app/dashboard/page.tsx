'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { useRouter } from 'next/navigation';
import { casesAPI, courtSettingsAPI, Case, CourtSettingsPublic } from '@/lib/api';

interface CaseWithCourtSettings {
  case: Case;
  settings: CourtSettingsPublic | null;
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [casesWithSettings, setCasesWithSettings] = useState<CaseWithCourtSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCasesAndSettings();
  }, []);

  const loadCasesAndSettings = async () => {
    try {
      setIsLoading(true);
      const cases = await casesAPI.list();

      // Fetch court settings for each active case
      const casesWithSettings: CaseWithCourtSettings[] = await Promise.all(
        cases.map(async (c) => {
          if (c.status === 'active') {
            try {
              const settings = await courtSettingsAPI.getSettings(c.id);
              return { case: c, settings };
            } catch {
              return { case: c, settings: null };
            }
          }
          return { case: c, settings: null };
        })
      );

      setCasesWithSettings(casesWithSettings);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get cases with active court controls
  const casesWithActiveControls = casesWithSettings.filter(
    (c) => c.settings && c.settings.active_controls && c.settings.active_controls.length > 0
  );

  const activeCases = casesWithSettings.filter((c) => c.case.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Court Controls Banner */}
      {casesWithActiveControls.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            {casesWithActiveControls.map(({ case: c, settings }) => (
              <div key={c.id} className="flex items-start gap-3">
                <span className="text-xl">⚖️</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-amber-900">
                      Court-Ordered Controls Active
                    </span>
                    <span className="text-amber-700 text-sm">
                      ({c.case_name})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {settings?.gps_checkins_required && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 border border-amber-300">
                        <span>📍</span> GPS Check-ins Required
                      </span>
                    )}
                    {settings?.supervised_exchange_required && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 border border-amber-300">
                        <span>👁️</span> Supervised Exchanges
                      </span>
                    )}
                    {settings?.in_app_communication_only && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 border border-amber-300">
                        <span>💬</span> In-App Communication Only
                      </span>
                    )}
                    {settings?.aria_enforcement_locked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 border border-amber-300">
                        <span>🤖</span> ARIA Moderation Locked
                      </span>
                    )}
                    {settings?.agreement_edits_locked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 border border-amber-300">
                        <span>🔒</span> Agreement Edits Locked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    These controls have been set by the court and cannot be modified.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h2>
          <p className="mt-2 text-gray-600">
            Here's an overview of your co-parenting dashboard
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Cases Card */}
          <Card>
            <CardHeader>
              <CardTitle>My Cases</CardTitle>
              <CardDescription>
                Manage your co-parenting cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-blue-600">
                  {isLoading ? '...' : activeCases.length}
                </p>
                <p className="text-sm text-gray-500 mt-2">Active cases</p>
                <Button className="mt-4" size="sm" onClick={() => router.push(activeCases.length > 0 ? '/cases' : '/cases/new')}>
                  {activeCases.length > 0 ? 'View cases' : 'Create new case'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Messages Card */}
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communicate with AI-powered moderation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-500 mt-2">Unread messages</p>
                <Button className="mt-4" size="sm" variant="outline">
                  View messages
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Agreements Card */}
          <Card>
            <CardHeader>
              <CardTitle>Agreements</CardTitle>
              <CardDescription>
                Custody and parenting agreements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-purple-600">0</p>
                <p className="text-sm text-gray-500 mt-2">Active agreements</p>
                <Button className="mt-4" size="sm" variant="outline">
                  View agreements
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Set up your CommonGround account in a few simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Create a case</h4>
                  <p className="text-sm text-gray-500">
                    Start by creating a new co-parenting case and inviting the other parent
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push('/cases/new')}>
                    Create case
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Build your agreement</h4>
                  <p className="text-sm text-gray-500">
                    Use our guided interview to create a comprehensive custody agreement
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push('/agreements')}>
                    Build agreement
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Start communicating</h4>
                  <p className="text-sm text-gray-500">
                    Send messages with AI-powered moderation to reduce conflict
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push('/messages')}>
                    Start communicating
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
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
