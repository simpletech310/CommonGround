'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { casesAPI, agreementsAPI, Case, Agreement } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';

function AgreementsListContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [isLoadingAgreements, setIsLoadingAgreements] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuilderChoice, setShowBuilderChoice] = useState(false);
  const [isCreatingAgreement, setIsCreatingAgreement] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setIsLoadingCases(true);
      setError(null);
      const data = await casesAPI.list();
      // Show both pending and active cases
      const availableCases = data.filter((c) => c.status === 'active' || c.status === 'pending');
      setCases(availableCases);

      if (availableCases.length > 0) {
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
    await loadAgreements(caseItem.id);
  };

  const loadAgreements = async (caseId: string) => {
    try {
      setIsLoadingAgreements(true);
      setError(null);
      const data = await agreementsAPI.list(caseId);
      setAgreements(data);
    } catch (err: any) {
      console.error('Failed to load agreements:', err);
      // Don't set error for 404 - just means no agreements yet
      if (err.status !== 404) {
        setError(err.message || 'Failed to load agreements');
      }
    } finally {
      setIsLoadingAgreements(false);
    }
  };

  const createAgreementWithBuilder = async (useAria: boolean) => {
    if (!selectedCase) return;

    try {
      setIsCreatingAgreement(true);
      setShowBuilderChoice(false);
      const newAgreement = await agreementsAPI.create({
        case_id: selectedCase.id,
        title: `${selectedCase.case_name} - Parenting Agreement`,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'pending_approval':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'draft':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'rejected':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'expired':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar - Case Selection */}
          <div className="w-80 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle>Cases</CardTitle>
                <CardDescription>Select a case to view agreements</CardDescription>
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
          </div>

          {/* Main Area - Agreements */}
          <div className="flex-1">
            {!selectedCase && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a case to view agreements
                    </h3>
                    <p className="text-gray-600">
                      Choose a case from the sidebar to manage custody agreements
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedCase && (
              <div className="space-y-6">
                {/* Case Header */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedCase.case_name} - Agreements</CardTitle>
                        <CardDescription>Custody and parenting agreements</CardDescription>
                      </div>
                      <Button
                        onClick={() => setShowBuilderChoice(true)}
                        disabled={isCreatingAgreement}
                      >
                        {isCreatingAgreement ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Agreement
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Loading State */}
                {isLoadingAgreements && (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading agreements...</p>
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
                          <p className="font-medium text-red-900">Failed to load agreements</p>
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="mt-4" onClick={() => loadAgreements(selectedCase.id)}>
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Empty State */}
                {!isLoadingAgreements && !error && agreements.length === 0 && (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No agreements yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Create your first custody agreement to get started
                        </p>
                        <Link href={`/agreements/new?case=${selectedCase.id}`}>
                          <Button>Create First Agreement</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Agreements List */}
                {!isLoadingAgreements && !error && agreements.length > 0 && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {agreements.map((agreement) => (
                      <Card
                        key={agreement.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/agreements/${agreement.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{agreement.title}</CardTitle>
                              <CardDescription className="mt-1">
                                Version {agreement.version}
                              </CardDescription>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agreement.status)}`}>
                              {getStatusLabel(agreement.status)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Created: {new Date(agreement.created_at).toLocaleDateString()}</p>

                            {agreement.status === 'pending_approval' && (
                              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-xs font-medium text-yellow-900">
                                  Awaiting approval from both parents
                                </p>
                                <div className="mt-2 text-xs text-yellow-800">
                                  <p>Petitioner: {agreement.petitioner_approved ? '✓ Approved' : '○ Pending'}</p>
                                  <p>Respondent: {agreement.respondent_approved ? '✓ Approved' : '○ Pending'}</p>
                                </div>
                              </div>
                            )}

                            {agreement.status === 'approved' && agreement.effective_date && (
                              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-xs font-medium text-green-900">
                                  Effective: {new Date(agreement.effective_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t">
                            <Button variant="outline" className="w-full" onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/agreements/${agreement.id}`);
                            }}>
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Builder Choice Modal */}
        {showBuilderChoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Choose How to Build Your Agreement
              </h2>
              <p className="text-gray-600 mb-6">
                Select the approach that works best for you
              </p>

              <div className="space-y-4">
                {/* ARIA Option */}
                <button
                  onClick={() => createAgreementWithBuilder(true)}
                  disabled={isCreatingAgreement}
                  className="w-full text-left p-6 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      A
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Talk to ARIA (Recommended)
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Have a natural conversation about your custody arrangement. ARIA will ask
                        questions, understand casual language, and create your agreement for you.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Conversational
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Faster
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          AI-Powered
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Wizard Option */}
                <button
                  onClick={() => createAgreementWithBuilder(false)}
                  disabled={isCreatingAgreement}
                  className="w-full text-left p-6 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Step-by-Step Wizard
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Fill out structured forms with clear sections for custody schedules,
                        holidays, decision-making, and more.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Structured
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Traditional
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Detailed
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowBuilderChoice(false)}
                  disabled={isCreatingAgreement}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AgreementsListPage() {
  return (
    <ProtectedRoute>
      <AgreementsListContent />
    </ProtectedRoute>
  );
}
