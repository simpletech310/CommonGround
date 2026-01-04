'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { familyFilesAPI, agreementsAPI, messagesAPI, FamilyFileDetail, Agreement, Message } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { PageContainer, EmptyState } from '@/components/layout';
import { MessageCompose } from '@/components/messages/message-compose';
import {
  MessageSquare,
  Plus,
  X,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle,
  Lightbulb,
  FileText,
  ChevronRight,
  Users,
} from 'lucide-react';

interface FamilyFileWithAgreements {
  familyFile: FamilyFileDetail;
  agreements: Agreement[];
}

function MessagesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agreementIdParam = searchParams.get('agreement');
  const familyFileIdParam = searchParams.get('familyFile');

  const [familyFilesWithAgreements, setFamilyFilesWithAgreements] = useState<FamilyFileWithAgreements[]>([]);
  const [selectedFamilyFile, setSelectedFamilyFile] = useState<FamilyFileDetail | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingFamilyFiles, setIsLoadingFamilyFiles] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    loadFamilyFilesAndAgreements();
  }, []);

  useEffect(() => {
    // Handle URL params for pre-selecting agreement
    if (familyFilesWithAgreements.length > 0 && agreementIdParam) {
      for (const item of familyFilesWithAgreements) {
        const agreement = item.agreements.find(a => a.id === agreementIdParam);
        if (agreement) {
          setSelectedFamilyFile(item.familyFile);
          handleSelectAgreement(agreement, item.familyFile);
          break;
        }
      }
    }
  }, [agreementIdParam, familyFilesWithAgreements]);

  const loadFamilyFilesAndAgreements = async () => {
    try {
      setIsLoadingFamilyFiles(true);
      setError(null);

      // Load family files
      const familyFilesResponse = await familyFilesAPI.list();
      const familyFiles = familyFilesResponse.items || [];

      // Load agreements for each family file
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

      // Auto-select first family file with agreements if available
      if (filesWithAgreements.length > 0 && !selectedFamilyFile) {
        const firstWithAgreements = filesWithAgreements.find(f => f.agreements.length > 0);
        if (firstWithAgreements) {
          setSelectedFamilyFile(firstWithAgreements.familyFile);
          if (firstWithAgreements.agreements.length > 0) {
            handleSelectAgreement(firstWithAgreements.agreements[0], firstWithAgreements.familyFile);
          }
        } else {
          setSelectedFamilyFile(filesWithAgreements[0].familyFile);
        }
      }
    } catch (err: any) {
      console.error('Failed to load family files:', err);
      setError(err.message || 'Failed to load family files');
    } finally {
      setIsLoadingFamilyFiles(false);
    }
  };

  const handleSelectFamilyFile = (familyFile: FamilyFileDetail) => {
    setSelectedFamilyFile(familyFile);
    setSelectedAgreement(null);
    setMessages([]);
    setShowCompose(false);
  };

  const handleSelectAgreement = async (agreement: Agreement, familyFile?: FamilyFileDetail) => {
    if (familyFile) {
      setSelectedFamilyFile(familyFile);
    }
    setSelectedAgreement(agreement);
    setShowCompose(false);
    await loadMessages(agreement.id);
  };

  const loadMessages = async (agreementId: string) => {
    try {
      setIsLoadingMessages(true);
      setError(null);
      const data = await messagesAPI.listByAgreement(agreementId);
      setMessages(data.reverse()); // Reverse to show oldest first
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleMessageSent = () => {
    setShowCompose(false);
    if (selectedAgreement) {
      loadMessages(selectedAgreement.id);
    }
  };

  const getOtherParentId = () => {
    if (!selectedFamilyFile || !user) return '';
    // Get the other parent from the family file
    if (selectedFamilyFile.parent_a_id === user.id) {
      return selectedFamilyFile.parent_b_id || '';
    } else {
      return selectedFamilyFile.parent_a_id;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
        date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary" size="sm">Draft</Badge>;
      case 'pending_approval':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  // Get agreements for selected family file
  const selectedFamilyFileData = familyFilesWithAgreements.find(
    f => f.familyFile.id === selectedFamilyFile?.id
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <PageContainer className="max-w-7xl">
        {/* Mobile Selector */}
        <div className="lg:hidden mb-4 space-y-3">
          <Card>
            <CardContent className="py-3">
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Family File
              </label>
              {isLoadingFamilyFiles ? (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                </div>
              ) : familyFilesWithAgreements.length === 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">No family files</span>
                  <Link href="/family-files/new">
                    <Button size="sm">Create Family File</Button>
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedFamilyFile?.id || ''}
                  onChange={(e) => {
                    const item = familyFilesWithAgreements.find(f => f.familyFile.id === e.target.value);
                    if (item) handleSelectFamilyFile(item.familyFile);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select a family file...</option>
                  {familyFilesWithAgreements.map((item) => (
                    <option key={item.familyFile.id} value={item.familyFile.id}>
                      {item.familyFile.name} ({item.agreements.length} agreements)
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>

          {selectedFamilyFile && selectedFamilyFileData && (
            <Card>
              <CardContent className="py-3">
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  SharedCare Agreement
                </label>
                {selectedFamilyFileData.agreements.length === 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">No agreements</span>
                    <Link href={`/agreements?familyFileId=${selectedFamilyFile.id}`}>
                      <Button size="sm">Create Agreement</Button>
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedAgreement?.id || ''}
                    onChange={(e) => {
                      const agreement = selectedFamilyFileData.agreements.find(a => a.id === e.target.value);
                      if (agreement) handleSelectAgreement(agreement);
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Select an agreement...</option>
                    {selectedFamilyFileData.agreements.map((agreement) => (
                      <option key={agreement.id} value={agreement.id}>
                        {agreement.title} ({agreement.status})
                      </option>
                    ))}
                  </select>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Family Files & Agreements (Desktop only) */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Family Files
                </CardTitle>
                <CardDescription>Select an agreement to view messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {isLoadingFamilyFiles && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                  </div>
                )}

                {!isLoadingFamilyFiles && familyFilesWithAgreements.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">No family files</p>
                    <Link href="/family-files/new">
                      <Button size="sm">Create Family File</Button>
                    </Link>
                  </div>
                )}

                {familyFilesWithAgreements.map((item) => (
                  <div key={item.familyFile.id} className="space-y-2">
                    <button
                      onClick={() => handleSelectFamilyFile(item.familyFile)}
                      className={`w-full text-left p-3 rounded-lg transition-smooth ${
                        selectedFamilyFile?.id === item.familyFile.id && !selectedAgreement
                          ? 'bg-cg-primary-subtle border-2 border-cg-primary/30'
                          : 'bg-secondary/50 border-2 border-transparent hover:bg-secondary'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{item.familyFile.name}</p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.agreements.length} agreement{item.agreements.length !== 1 ? 's' : ''}
                      </p>
                    </button>

                    {/* Show agreements when family file is selected */}
                    {selectedFamilyFile?.id === item.familyFile.id && (
                      <div className="ml-3 pl-3 border-l-2 border-border space-y-2">
                        {item.agreements.length === 0 ? (
                          <div className="py-2">
                            <p className="text-xs text-muted-foreground mb-2">No agreements yet</p>
                            <Link href={`/agreements?familyFileId=${item.familyFile.id}`}>
                              <Button size="sm" variant="outline" className="w-full">
                                <Plus className="h-3 w-3 mr-1" />
                                Create Agreement
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          item.agreements.map((agreement) => (
                            <button
                              key={agreement.id}
                              onClick={() => handleSelectAgreement(agreement)}
                              className={`w-full text-left p-2 rounded-md transition-smooth ${
                                selectedAgreement?.id === agreement.id
                                  ? 'bg-cg-primary text-white'
                                  : 'bg-background hover:bg-secondary'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{agreement.title}</p>
                                  <div className="mt-0.5">
                                    {getStatusBadge(agreement.status)}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Area - Messages */}
          <div className="flex-1 min-w-0">
            {!selectedAgreement && (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={MessageSquare}
                    title="Select an agreement to view messages"
                    description="Choose a SharedCare Agreement from the sidebar to start communicating. Messages are organized by agreement so you can keep Summer Schedule and School Year Schedule conversations separate."
                  />
                </CardContent>
              </Card>
            )}

            {selectedAgreement && selectedFamilyFile && (
              <div className="space-y-6">
                {/* Agreement Header */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Users className="h-4 w-4" />
                          {selectedFamilyFile.name}
                        </div>
                        <CardTitle className="truncate flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {selectedAgreement.title}
                        </CardTitle>
                        <CardDescription className="hidden sm:flex items-center gap-2 mt-1">
                          Messages for this SharedCare Agreement
                          {getStatusBadge(selectedAgreement.status)}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setShowCompose(!showCompose)}
                        disabled={!getOtherParentId()}
                        title={!getOtherParentId() ? "Waiting for other parent to join" : ""}
                        className="w-full sm:w-auto flex-shrink-0"
                      >
                        {showCompose ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            New Message
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>

                {/* Compose Area */}
                {showCompose && (
                  <>
                    {getOtherParentId() ? (
                      <MessageCompose
                        caseId={selectedAgreement.case_id || selectedFamilyFile.id}
                        agreementId={selectedAgreement.id}
                        recipientId={getOtherParentId()}
                        onMessageSent={handleMessageSent}
                        ariaEnabled={true}
                      />
                    ) : (
                      <Alert variant="default" className="bg-cg-warning-subtle border-cg-warning/30">
                        <AlertTriangle className="h-4 w-4 text-cg-warning" />
                        <AlertDescription>
                          <p className="font-medium text-foreground">Can't send messages yet</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            The other parent needs to join this family file before you can exchange messages.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                {/* Messages Thread */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMessages && (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
                        <p className="mt-4 text-muted-foreground">Loading messages...</p>
                      </div>
                    )}

                    {!isLoadingMessages && messages.length === 0 && (
                      <EmptyState
                        icon={MessageSquare}
                        title="No messages yet"
                        description={`Start a conversation about "${selectedAgreement.title}"`}
                        action={{
                          label: 'Send First Message',
                          onClick: () => setShowCompose(true),
                        }}
                      />
                    )}

                    {!isLoadingMessages && messages.length > 0 && (
                      <div className="space-y-3 sm:space-y-4">
                        {messages.map((message) => {
                          const isSent = message.sender_id === user?.id;

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[85%] sm:max-w-md ${isSent ? 'ml-4 sm:ml-12' : 'mr-4 sm:mr-12'}`}>
                                <div
                                  className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                                    isSent
                                      ? 'bg-cg-primary text-white rounded-br-md'
                                      : 'bg-secondary text-foreground rounded-bl-md'
                                  }`}
                                >
                                  {message.was_flagged && (
                                    <div className={`flex items-center gap-2 mb-2 pb-2 border-b ${isSent ? 'border-white/20' : 'border-border'}`}>
                                      <Lightbulb className="h-3 w-3" />
                                      <span className="text-xs opacity-75">ARIA reviewed</span>
                                    </div>
                                  )}

                                  <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>

                                  {message.original_content && (
                                    <details className={`mt-2 pt-2 border-t ${isSent ? 'border-white/20' : 'border-border'}`}>
                                      <summary className="text-xs opacity-75 cursor-pointer">
                                        View original
                                      </summary>
                                      <p className="text-xs opacity-75 mt-1 italic break-words">
                                        "{message.original_content}"
                                      </p>
                                    </details>
                                  )}
                                </div>

                                <div className={`flex items-center gap-1.5 sm:gap-2 mt-1 text-xs text-muted-foreground ${isSent ? 'justify-end' : 'justify-start'}`}>
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTime(message.sent_at)}</span>
                                  {isSent && (
                                    <CheckCircle className="h-3 w-3 text-cg-success" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <MessagesContent />
    </ProtectedRoute>
  );
}
