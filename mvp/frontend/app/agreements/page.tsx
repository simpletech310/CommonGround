'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { familyFilesAPI, agreementsAPI, FamilyFileDetail, Agreement } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';
import { FolderOpen } from 'lucide-react';

interface FamilyFileAgreement {
  id: string;
  agreement_number?: string;
  title: string;
  agreement_type?: string;
  version: number;
  status: string;
  petitioner_approved?: boolean;
  respondent_approved?: boolean;
  effective_date?: string;
  created_at: string;
}

interface FamilyFileWithAgreements extends FamilyFileDetail {
  agreements?: FamilyFileAgreement[];
}

function AgreementsListContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [familyFiles, setFamilyFiles] = useState<FamilyFileWithAgreements[]>([]);
  const [selectedFamilyFile, setSelectedFamilyFile] = useState<FamilyFileWithAgreements | null>(null);
  const [isLoadingFamilyFiles, setIsLoadingFamilyFiles] = useState(true);
  const [isLoadingAgreements, setIsLoadingAgreements] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuilderChoice, setShowBuilderChoice] = useState(false);
  const [isCreatingAgreement, setIsCreatingAgreement] = useState(false);

  useEffect(() => {
    loadFamilyFiles();
  }, []);

  const loadFamilyFiles = async () => {
    try {
      setIsLoadingFamilyFiles(true);
      setError(null);
      const data = await familyFilesAPI.list();
      // Filter to active family files
      const activeFiles = data.items.filter((ff) => ff.status === 'active');
      setFamilyFiles(activeFiles as FamilyFileWithAgreements[]);

      if (activeFiles.length > 0) {
        handleSelectFamilyFile(activeFiles[0] as FamilyFileWithAgreements);
      }
    } catch (err: any) {
      console.error('Failed to load family files:', err);
      setError(err.message || 'Failed to load family files');
    } finally {
      setIsLoadingFamilyFiles(false);
    }
  };

  const handleSelectFamilyFile = async (familyFile: FamilyFileWithAgreements) => {
    setSelectedFamilyFile(familyFile);
    await loadAgreements(familyFile.id);
  };

  const loadAgreements = async (familyFileId: string) => {
    try {
      setIsLoadingAgreements(true);
      setError(null);

      const data = await agreementsAPI.listForFamilyFile(familyFileId);
      setSelectedFamilyFile(prev => prev ? { ...prev, agreements: data.items as FamilyFileAgreement[] } : null);
    } catch (err: any) {
      console.error('Failed to load agreements:', err);
      if (err.status !== 404) {
        setError(err.message || 'Failed to load agreements');
      }
    } finally {
      setIsLoadingAgreements(false);
    }
  };

  const createAgreementWithBuilder = async (useAria: boolean) => {
    if (!selectedFamilyFile) return;

    try {
      setIsCreatingAgreement(true);
      setShowBuilderChoice(false);

      const newAgreement = await agreementsAPI.createForFamilyFile(
        selectedFamilyFile.id,
        { title: `${selectedFamilyFile.title} - SharedCare Agreement` }
      );

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
      case 'active':
        return 'text-green-700 bg-green-100 border-green-200';
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

  const canCreateAgreement = selectedFamilyFile && !selectedFamilyFile.has_court_case;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Family File Selection */}
          <div className="w-full lg:w-80 lg:flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Family Files
                </CardTitle>
                <CardDescription>Select a family file to view agreements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoadingFamilyFiles && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                )}

                {!isLoadingFamilyFiles && familyFiles.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-4">No family files</p>
                    <Link href="/family-files/new">
                      <Button size="sm">Create Family File</Button>
                    </Link>
                  </div>
                )}

                {familyFiles.map((familyFile) => (
                  <button
                    key={familyFile.id}
                    onClick={() => handleSelectFamilyFile(familyFile)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedFamilyFile?.id === familyFile.id
                        ? 'bg-blue-50 border-2 border-blue-300'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{familyFile.title}</p>
                      {familyFile.has_court_case && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                          Court Case
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{familyFile.family_file_number}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Area - Agreements */}
          <div className="flex-1">
            {!selectedFamilyFile && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a family file to view agreements
                    </h3>
                    <p className="text-gray-600">
                      Choose a family file from the sidebar to manage SharedCare agreements
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedFamilyFile && (
              <div className="space-y-6">
                {/* Court Case Notice */}
                {selectedFamilyFile.has_court_case && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚖️</span>
                      <div>
                        <div className="font-medium text-amber-900">Court Custody Case Active</div>
                        <p className="text-sm text-amber-700 mt-1">
                          This family file has an active Court Custody Case. You cannot create new SharedCare Agreements.
                          Use QuickAccords for situational agreements.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Family File Header */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">{selectedFamilyFile.title}</CardTitle>
                        <CardDescription>SharedCare Agreements</CardDescription>
                      </div>
                      <Button
                        className="w-full sm:w-auto"
                        onClick={() => setShowBuilderChoice(true)}
                        disabled={isCreatingAgreement || !canCreateAgreement}
                        title={!canCreateAgreement ? 'Cannot create agreements when court case is active' : ''}
                      >
                        {isCreatingAgreement ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : !canCreateAgreement ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Locked
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
                      <Button variant="outline" className="mt-4" onClick={() => loadAgreements(selectedFamilyFile.id)}>
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Empty State */}
                {!isLoadingAgreements && !error && (!selectedFamilyFile.agreements || selectedFamilyFile.agreements.length === 0) && (
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
                          Create your first SharedCare Agreement to get started
                        </p>
                        {canCreateAgreement && (
                          <Button onClick={() => setShowBuilderChoice(true)}>
                            Create First Agreement
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Agreements List */}
                {!isLoadingAgreements && !error && selectedFamilyFile.agreements && selectedFamilyFile.agreements.length > 0 && (
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                    {selectedFamilyFile.agreements.map((agreement) => (
                      <Card
                        key={agreement.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => router.push(`/agreements/${agreement.id}`)}
                      >
                        <CardHeader className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-lg truncate">{agreement.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {agreement.agreement_number} • Version {agreement.version}
                              </CardDescription>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agreement.status)}`}>
                              {getStatusLabel(agreement.status)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>Created: {new Date(agreement.created_at).toLocaleDateString()}</p>

                            {agreement.status === 'pending_approval' && (
                              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-xs font-medium text-yellow-900">
                                  Awaiting approval from both parents
                                </p>
                                <div className="mt-2 text-xs text-yellow-800">
                                  <p>Parent A: {agreement.petitioner_approved ? '✓ Approved' : '○ Pending'}</p>
                                  <p>Parent B: {agreement.respondent_approved ? '✓ Approved' : '○ Pending'}</p>
                                </div>
                              </div>
                            )}

                            {(agreement.status === 'approved' || agreement.status === 'active') && agreement.effective_date && (
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                Choose How to Build Your Agreement
              </h2>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Select the approach that works best for you
              </p>

              <div className="space-y-3 sm:space-y-4">
                {/* ARIA Option */}
                <button
                  onClick={() => createAgreementWithBuilder(true)}
                  disabled={isCreatingAgreement}
                  className="w-full text-left p-4 sm:p-6 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0">
                      A
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                        Talk to ARIA (Recommended)
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                        Have a natural conversation about your custody arrangement. ARIA will ask
                        questions and create your agreement for you.
                      </p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <span className="px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Conversational
                        </span>
                        <span className="px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Faster
                        </span>
                        <span className="px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
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
                  className="w-full text-left p-4 sm:p-6 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                        Step-by-Step Wizard
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                        Fill out structured forms with clear sections for custody schedules,
                        holidays, and more.
                      </p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <span className="px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Structured
                        </span>
                        <span className="px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Traditional
                        </span>
                        <span className="px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Detailed
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-4 sm:mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowBuilderChoice(false)}
                  disabled={isCreatingAgreement}
                  className="w-full sm:w-auto"
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
