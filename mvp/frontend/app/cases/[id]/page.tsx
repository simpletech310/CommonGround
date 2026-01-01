'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { casesAPI, agreementsAPI, Case, Agreement } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProtectedRoute } from '@/components/protected-route';

function CaseDetailsContent() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAgreement, setIsLoadingAgreement] = useState(false);
  const [isCreatingAgreement, setIsCreatingAgreement] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invitation acceptance
  const [invitationToken, setInvitationToken] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // Builder choice modal
  const [showBuilderChoice, setShowBuilderChoice] = useState(false);

  useEffect(() => {
    loadCase();
    loadAgreement();
  }, [caseId]);

  const loadCase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await casesAPI.get(caseId);
      setCaseData(data);
    } catch (err: any) {
      console.error('Failed to load case:', err);
      setError(err.message || 'Failed to load case');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAgreement = async () => {
    try {
      setIsLoadingAgreement(true);
      const agreements = await agreementsAPI.list(caseId);
      if (agreements.length > 0) {
        setAgreement(agreements[0]);
      }
    } catch (err: any) {
      console.error('Failed to load agreement:', err);
      // Silently fail - it's ok if no agreement exists
    } finally {
      setIsLoadingAgreement(false);
    }
  };

  const handleAgreementAction = async () => {
    if (agreement) {
      // Agreement exists - navigate to it
      router.push(`/agreements/${agreement.id}`);
    } else {
      // No agreement - show choice modal
      setShowBuilderChoice(true);
    }
  };

  const createAgreementWithBuilder = async (useAria: boolean) => {
    try {
      setIsCreatingAgreement(true);
      setShowBuilderChoice(false);
      const newAgreement = await agreementsAPI.create({
        case_id: caseId,
        title: `${caseData?.case_name} - Parenting Agreement`,
        agreement_type: 'parenting_plan',
      });

      // Navigate to chosen builder
      if (useAria) {
        router.push(`/agreements/${newAgreement.id}/aria`);
      } else {
        router.push(`/agreements/${newAgreement.id}/builder`);
      }
    } catch (err: any) {
      console.error('Failed to create agreement:', err);
      setError(err.message || 'Failed to create agreement');
      setIsCreatingAgreement(false);
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcceptError(null);

    if (!invitationToken.trim()) {
      setAcceptError('Please enter the invitation token');
      return;
    }

    try {
      setIsAccepting(true);
      await casesAPI.acceptInvitation(caseId, invitationToken);

      // Reload case data to show updated status
      await loadCase();
      setInvitationToken('');
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      setAcceptError(err.message || 'Invalid invitation token');
    } finally {
      setIsAccepting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'suspended':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'closed':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'active':
        return 'This case is active and both parents have joined.';
      case 'pending':
        return 'Waiting for the other parent to accept the invitation.';
      case 'suspended':
        return 'This case has been temporarily suspended.';
      case 'closed':
        return 'This case has been closed.';
      default:
        return '';
    }
  };

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
                <Link href="/cases" className="text-sm font-medium text-blue-600">
                  Cases
                </Link>
                <Link href="/messages" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Messages
                </Link>
                <Link href="/agreements" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Agreements
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/cases">
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Cases
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading case details...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-red-900">Failed to load case</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4" onClick={loadCase}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Case Details */}
        {!isLoading && !error && caseData && (
          <div className="space-y-6">
            {/* Case Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{caseData.case_name}</CardTitle>
                    {caseData.case_number && (
                      <p className="text-sm text-gray-500 mt-1">
                        Case Number: {caseData.case_number}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(caseData.status)}`}>
                      {caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1)}
                    </span>

                    {/* Agreement Button */}
                    <Button
                      onClick={handleAgreementAction}
                      disabled={isCreatingAgreement || isLoadingAgreement}
                      className="bg-black hover:bg-gray-800 text-white"
                    >
                      {isCreatingAgreement ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : isLoadingAgreement ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Loading...
                        </>
                      ) : agreement ? (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Agreement
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Build Agreement
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>State: {caseData.state}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Created: {new Date(caseData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>

                  {caseData.updated_at !== caseData.created_at && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Updated: {new Date(caseData.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                {/* Status Message */}
                <div className={`mt-4 p-4 rounded-lg border ${getStatusColor(caseData.status)}`}>
                  <p className="text-sm font-medium">
                    {getStatusMessage(caseData.status)}
                  </p>
                </div>

                {/* Agreement Status */}
                {agreement && (
                  <div className="mt-4 p-4 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-900">
                          {agreement.title}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        agreement.status === 'approved' ? 'bg-green-100 text-green-700' :
                        agreement.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {agreement.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700">
                      {agreement.status === 'draft' && 'Continue building your custody agreement'}
                      {agreement.status === 'pending_approval' && 'Waiting for both parents to approve'}
                      {agreement.status === 'approved' && 'Agreement is active and court-ready'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invitation Acceptance (only for pending cases) */}
            {caseData.status === 'pending' && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle>Accept Case Invitation</CardTitle>
                  <CardDescription>
                    Enter the invitation token you received via email to join this case
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAcceptInvitation} className="space-y-4">
                    <div>
                      <Label htmlFor="invitationToken">Invitation Token</Label>
                      <Input
                        id="invitationToken"
                        type="text"
                        placeholder="Enter token from email"
                        value={invitationToken}
                        onChange={(e) => setInvitationToken(e.target.value)}
                        className="mt-1"
                        disabled={isAccepting}
                      />
                    </div>

                    {acceptError && (
                      <div className="flex items-center gap-2 text-red-700 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {acceptError}
                      </div>
                    )}

                    <Button type="submit" disabled={isAccepting}>
                      {isAccepting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Accepting...
                        </>
                      ) : (
                        'Accept Invitation'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions (for active cases) */}
            {caseData.status === 'active' && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Manage your case and communicate with the other parent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-2" onClick={() => router.push(`/messages?case=${caseId}`)}>
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <span className="font-medium">Send Message</span>
                      <span className="text-xs text-gray-500">ARIA-powered communication</span>
                    </Button>

                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-2" onClick={() => router.push(`/schedule?case=${caseId}`)}>
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">View Schedule</span>
                      <span className="text-xs text-gray-500">Parenting time calendar</span>
                    </Button>

                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-2" onClick={() => router.push(`/cases/${caseId}/exports`)}>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-medium">Export Case</span>
                      <span className="text-xs text-gray-500">Court-ready documentation</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Case Information */}
            <Card>
              <CardHeader>
                <CardTitle>Case Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Case ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{caseData.id}</dd>
                  </div>

                  {caseData.case_number && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Court Case Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{caseData.case_number}</dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Jurisdiction</dt>
                    <dd className="mt-1 text-sm text-gray-900">{caseData.state}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(caseData.status)}`}>
                        {caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1)}
                      </span>
                    </dd>
                  </div>
                </dl>

                {caseData.invitation_token && caseData.status === 'pending' && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">Invitation Token:</p>
                    <code className="block p-2 bg-white border border-blue-300 rounded text-sm font-mono text-blue-900 break-all">
                      {caseData.invitation_token}
                    </code>
                    <p className="text-xs text-blue-700 mt-2">
                      Share this token with the other parent to allow them to join the case
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Builder Choice Modal */}
        {showBuilderChoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <CardTitle>Choose How to Build Your Agreement</CardTitle>
                <CardDescription>
                  Pick the method that works best for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ARIA Option */}
                <button
                  onClick={() => createAgreementWithBuilder(true)}
                  disabled={isCreatingAgreement}
                  className="w-full p-6 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      A
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Talk to ARIA (Recommended)
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Have a natural conversation about your custody arrangement. ARIA understands casual language and will guide you through everything.
                      </p>
                      <div className="text-sm text-gray-500">
                        <p className="font-medium text-purple-700 mb-1">Best for:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>People who prefer talking over forms</li>
                          <li>Complex or unique arrangements</li>
                          <li>Those who want conversational guidance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Wizard Option */}
                <button
                  onClick={() => createAgreementWithBuilder(false)}
                  disabled={isCreatingAgreement}
                  className="w-full p-6 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Step-by-Step Wizard
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Fill out structured forms with clear sections. Good for straightforward arrangements.
                      </p>
                      <div className="text-sm text-gray-500">
                        <p className="font-medium text-blue-700 mb-1">Best for:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>People who prefer forms and structure</li>
                          <li>Standard custody arrangements</li>
                          <li>Those who like to see progress step-by-step</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Cancel */}
                <div className="flex justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowBuilderChoice(false)}
                    disabled={isCreatingAgreement}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CaseDetailsPage() {
  return (
    <ProtectedRoute>
      <CaseDetailsContent />
    </ProtectedRoute>
  );
}
