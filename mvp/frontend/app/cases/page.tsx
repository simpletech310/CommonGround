'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { casesAPI, Case } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';

function CasesListContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [selectedCaseForInvitation, setSelectedCaseForInvitation] = useState<Case | null>(null);
  const [invitationCode, setInvitationCode] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await casesAPI.list();
      setCases(data);
    } catch (err: any) {
      console.error('Failed to load cases:', err);
      setError(err.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!selectedCaseForInvitation || !invitationCode.trim()) {
      setAcceptError('Please enter the invitation code');
      return;
    }

    try {
      setIsAccepting(true);
      setAcceptError(null);

      await casesAPI.acceptInvitation(selectedCaseForInvitation.id, invitationCode.trim());

      // Reload cases to show updated status
      await loadCases();

      // Close modal and reset
      setShowInvitationModal(false);
      setSelectedCaseForInvitation(null);
      setInvitationCode('');

      // Show success message or navigate to case
      router.push(`/cases/${selectedCaseForInvitation.id}`);
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      setAcceptError(err.message || 'Failed to accept invitation. Please check the code and try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const getUserRole = (caseItem: Case): 'petitioner' | 'respondent' | null => {
    if (!user || !caseItem.participants) return null;
    const participant = caseItem.participants.find(p => p.user_id === user.id);
    return participant?.role as 'petitioner' | 'respondent' | null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'suspended':
        return 'text-orange-600 bg-orange-100';
      case 'closed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const isParticipantActive = (caseItem: Case): boolean => {
    if (!user || !caseItem.participants) return false;
    const participant = caseItem.participants.find(p => p.user_id === user.id);
    return participant?.is_active ?? false;
  };

  // Cases I created (petitioner) that are still pending - waiting for other parent
  const sentInvitations = cases.filter(c =>
    c.status === 'pending' && getUserRole(c) === 'petitioner' && isParticipantActive(c)
  );

  // Cases I was invited to (respondent) that are pending - need to accept
  const receivedInvitations = cases.filter(c =>
    c.status === 'pending' && getUserRole(c) === 'respondent' && !isParticipantActive(c)
  );

  // Active cases (both parents have joined)
  const activeCases = cases.filter(c => c.status === 'active');

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
                <Link href="/cases" className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Cases</h1>
            <p className="mt-2 text-gray-600">
              Manage your co-parenting cases and invitations
            </p>
          </div>
          <Link href="/cases/new">
            <Button size="lg">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Case
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cases...</p>
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
                  <p className="font-medium text-red-900">Failed to load cases</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4" onClick={loadCases}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Invitations Section - Side by Side */}
        {!isLoading && !error && (sentInvitations.length > 0 || receivedInvitations.length > 0) && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Pending Invitations</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left: Sent Invitations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📤 Invitations Sent</h3>
                <p className="text-sm text-gray-600 mb-4">Cases you created</p>
                {sentInvitations.length > 0 ? (
                  <div className="space-y-3">
                    {sentInvitations.map((caseItem) => (
                      <Card key={caseItem.id} className="border-blue-200 bg-blue-50">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-blue-900 mb-1">{caseItem.case_name}</h4>
                              <p className="text-xs text-blue-700">State: {caseItem.state}</p>
                              <p className="text-xs text-blue-600 mt-1">Waiting for other parent</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/cases/${caseItem.id}`)}
                              className="border-blue-600 text-blue-600 hover:bg-blue-100 text-xs px-3 py-1"
                            >
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-gray-200">
                    <CardContent className="py-8 text-center">
                      <p className="text-sm text-gray-500">No sent invitations</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right: Received Invitations */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📥 Invitations Received</h3>
                <p className="text-sm text-gray-600 mb-4">Enter code to join</p>
                {receivedInvitations.length > 0 ? (
                  <div className="space-y-3">
                    {receivedInvitations.map((caseItem) => (
                      <Card key={caseItem.id} className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-yellow-900 mb-1">{caseItem.case_name}</h4>
                              <p className="text-xs text-yellow-700">State: {caseItem.state}</p>
                              <p className="text-xs text-yellow-600 mt-1">Need invitation code</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedCaseForInvitation(caseItem);
                                setShowInvitationModal(true);
                                setAcceptError(null);
                              }}
                              className="bg-yellow-600 hover:bg-yellow-700 text-xs px-3 py-1"
                            >
                              Accept
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-gray-200">
                    <CardContent className="py-8 text-center">
                      <p className="text-sm text-gray-500">No received invitations</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && cases.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No cases yet
                </h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Create your first case to start managing your co-parenting arrangement
                </p>
                <Link href="/cases/new">
                  <Button>Create Your First Case</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Cases */}
        {!isLoading && !error && activeCases.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">✅ Active Cases</h2>
            <p className="text-sm text-gray-600 mb-4">Cases where both parents have joined</p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeCases.map((caseItem) => (
                <Card key={caseItem.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/cases/${caseItem.id}`)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{caseItem.case_name}</CardTitle>
                        {caseItem.case_number && (
                          <p className="text-sm text-gray-500 mt-1">
                            Case #{caseItem.case_number}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status}
                      </span>
                    </div>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm">{caseItem.state}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">
                      <p>Created: {new Date(caseItem.created_at).toLocaleDateString()}</p>
                      {caseItem.updated_at !== caseItem.created_at && (
                        <p>Updated: {new Date(caseItem.updated_at).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" className="w-full" onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/cases/${caseItem.id}`);
                      }}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Cases Grid (Fallback - if needed) */}
        {!isLoading && !error && cases.length > 0 && sentInvitations.length === 0 && receivedInvitations.length === 0 && activeCases.length === 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cases.map((caseItem) => (
              <Card key={caseItem.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/cases/${caseItem.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{caseItem.case_name}</CardTitle>
                      {caseItem.case_number && (
                        <p className="text-sm text-gray-500 mt-1">
                          Case #{caseItem.case_number}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                  </div>
                  <CardDescription className="mt-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm">{caseItem.state}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500">
                    <p>Created: {new Date(caseItem.created_at).toLocaleDateString()}</p>
                    {caseItem.updated_at !== caseItem.created_at && (
                      <p>Updated: {new Date(caseItem.updated_at).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" className="w-full" onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/cases/${caseItem.id}`);
                    }}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Invitation Modal */}
        {showInvitationModal && selectedCaseForInvitation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Accept Case Invitation</CardTitle>
                <CardDescription>
                  Enter the invitation code to join: {selectedCaseForInvitation.case_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="invitation-code" className="block text-sm font-medium text-gray-700 mb-2">
                      Invitation Code
                    </label>
                    <input
                      id="invitation-code"
                      type="text"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAcceptInvitation();
                        }
                      }}
                      placeholder="Paste your invitation code here"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isAccepting}
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The invitation code was sent to you by the other parent
                    </p>
                  </div>

                  {acceptError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{acceptError}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowInvitationModal(false);
                        setSelectedCaseForInvitation(null);
                        setInvitationCode('');
                        setAcceptError(null);
                      }}
                      disabled={isAccepting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAcceptInvitation}
                      disabled={isAccepting || !invitationCode.trim()}
                      className="flex-1"
                    >
                      {isAccepting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Accepting...
                        </>
                      ) : (
                        'Accept Invitation'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CasesListPage() {
  return (
    <ProtectedRoute>
      <CasesListContent />
    </ProtectedRoute>
  );
}
