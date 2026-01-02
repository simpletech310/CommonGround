'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { casesAPI, messagesAPI, courtSettingsAPI, Case, Message, CourtSettingsPublic } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { PageContainer, EmptyState } from '@/components/layout';
import { MessageCompose } from '@/components/messages/message-compose';
import {
  MessageSquare,
  Plus,
  X,
  Sparkles,
  Lock,
  AlertTriangle,
  Send,
  Clock,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';

function MessagesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseIdParam = searchParams.get('case');

  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [ariaSettings, setAriaSettings] = useState<{
    aria_enabled: boolean;
    aria_provider: string;
    aria_disabled_at?: string;
    aria_disabled_by?: string;
  } | null>(null);
  const [isUpdatingAria, setIsUpdatingAria] = useState(false);
  const [courtSettings, setCourtSettings] = useState<CourtSettingsPublic | null>(null);

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
      // Show both pending and active cases
      const availableCases = data.filter((c) => c.status === 'active' || c.status === 'pending');
      setCases(availableCases);

      // Auto-select first available case if available
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
    setShowCompose(false);
    setCourtSettings(null);
    await loadMessages(caseItem.id);
    await loadAriaSettings(caseItem.id);
    await loadCourtSettings(caseItem.id);
  };

  const loadCourtSettings = async (caseId: string) => {
    try {
      const settings = await courtSettingsAPI.getSettings(caseId);
      setCourtSettings(settings);
    } catch (err) {
      console.error('Failed to load court settings:', err);
      setCourtSettings(null);
    }
  };

  const loadAriaSettings = async (caseId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/cases/${caseId}/aria-settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAriaSettings(data);
      }
    } catch (err) {
      console.error('Failed to load ARIA settings:', err);
    }
  };

  const toggleAriaEnabled = async () => {
    if (!selectedCase || !ariaSettings) return;

    try {
      setIsUpdatingAria(true);
      const response = await fetch(`http://localhost:8000/api/v1/cases/${selectedCase.id}/aria-settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aria_enabled: !ariaSettings.aria_enabled,
          aria_provider: ariaSettings.aria_provider,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAriaSettings(data);
      } else {
        const errorData = await response.json();
        alert(`Failed to update ARIA settings: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to update ARIA settings:', err);
      alert('Failed to update ARIA settings');
    } finally {
      setIsUpdatingAria(false);
    }
  };

  const loadMessages = async (caseId: string) => {
    try {
      setIsLoadingMessages(true);
      setError(null);
      const data = await messagesAPI.list(caseId);
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
    if (selectedCase) {
      loadMessages(selectedCase.id);
    }
  };

  const getOtherParentId = () => {
    if (!selectedCase || !user) return '';
    // Find the other parent from case participants
    const otherParticipant = selectedCase.participants?.find(
      (p) => p.user_id !== user.id
    );
    return otherParticipant?.user_id || '';
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <PageContainer className="max-w-7xl">
        {/* Mobile Case Selector */}
        <div className="lg:hidden mb-4">
          <Card>
            <CardContent className="py-3">
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Select Case
              </label>
              {isLoadingCases ? (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                </div>
              ) : cases.length === 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">No active cases</span>
                  <Link href="/cases/new">
                    <Button size="sm">Create Case</Button>
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedCase?.id || ''}
                  onChange={(e) => {
                    const caseItem = cases.find((c) => c.id === e.target.value);
                    if (caseItem) handleSelectCase(caseItem);
                  }}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select a case...</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_name} {caseItem.status === 'pending' ? '(Pending)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Case List (Desktop only) */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Cases</CardTitle>
                <CardDescription>Select a case to view messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {isLoadingCases && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
                  </div>
                )}

                {!isLoadingCases && cases.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">No active cases</p>
                    <Link href="/cases/new">
                      <Button size="sm">Create Case</Button>
                    </Link>
                  </div>
                )}

                {cases.map((caseItem) => (
                  <button
                    key={caseItem.id}
                    onClick={() => handleSelectCase(caseItem)}
                    className={`w-full text-left p-3 rounded-lg transition-smooth ${
                      selectedCase?.id === caseItem.id
                        ? 'bg-cg-primary-subtle border-2 border-cg-primary/30'
                        : 'bg-secondary/50 border-2 border-transparent hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">{caseItem.case_name}</p>
                      {caseItem.status === 'pending' && (
                        <Badge variant="warning" size="sm">Pending</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{caseItem.state}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Area - Messages */}
          <div className="flex-1 min-w-0">
            {!selectedCase && (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={MessageSquare}
                    title="Select a case to view messages"
                    description="Choose a case from the sidebar to start communicating"
                  />
                </CardContent>
              </Card>
            )}

            {selectedCase && (
              <div className="space-y-6">
                {/* Court Controls Notice */}
                {courtSettings && (courtSettings.in_app_communication_only || courtSettings.aria_enforcement_locked) && (
                  <Alert variant="default" className="bg-cg-warning-subtle border-cg-warning/30">
                    <AlertTriangle className="h-4 w-4 text-cg-warning" />
                    <AlertDescription>
                      <div className="font-medium text-foreground mb-2">Court-Ordered Controls Active</div>
                      <div className="flex flex-wrap gap-2">
                        {courtSettings.in_app_communication_only && (
                          <Badge variant="warning" size="sm">In-App Communication Only</Badge>
                        )}
                        {courtSettings.aria_enforcement_locked && (
                          <Badge variant="warning" size="sm">ARIA Moderation Required</Badge>
                        )}
                      </div>
                      {courtSettings.in_app_communication_only && (
                        <p className="text-sm text-muted-foreground mt-2">
                          You are required to use this platform for all communication with the other parent.
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Case Header */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">{selectedCase.case_name}</CardTitle>
                        <CardDescription className="hidden sm:block">AI-powered communication with conflict prevention</CardDescription>

                        {/* ARIA Toggle */}
                        {ariaSettings && (
                          <div className="flex items-center gap-3 sm:gap-4 mt-4 pt-4 border-t border-border">
                            <Switch
                              checked={ariaSettings.aria_enabled}
                              onCheckedChange={courtSettings?.aria_enforcement_locked ? undefined : toggleAriaEnabled}
                              disabled={isUpdatingAria || courtSettings?.aria_enforcement_locked}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Sparkles className="h-4 w-4 text-cg-primary flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground">
                                  ARIA
                                </span>
                                <Badge
                                  variant={ariaSettings.aria_enabled ? 'success' : 'secondary'}
                                  size="sm"
                                >
                                  {ariaSettings.aria_enabled ? 'ON' : 'OFF'}
                                </Badge>
                                {courtSettings?.aria_enforcement_locked && (
                                  <Badge variant="warning" size="sm">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Locked
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                                {courtSettings?.aria_enforcement_locked
                                  ? 'ARIA moderation is required by court order.'
                                  : ariaSettings.aria_enabled
                                    ? `AI monitoring active`
                                    : 'ARIA is disabled'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => setShowCompose(!showCompose)}
                        disabled={!getOtherParentId()}
                        title={!getOtherParentId() ? "Waiting for other parent to join case" : ""}
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
                {showCompose && selectedCase && (
                  <>
                    {getOtherParentId() ? (
                      <MessageCompose
                        caseId={selectedCase.id}
                        recipientId={getOtherParentId()}
                        onMessageSent={handleMessageSent}
                        ariaEnabled={ariaSettings?.aria_enabled ?? true}
                      />
                    ) : (
                      <Alert variant="default" className="bg-cg-warning-subtle border-cg-warning/30">
                        <AlertTriangle className="h-4 w-4 text-cg-warning" />
                        <AlertDescription>
                          <p className="font-medium text-foreground">Can't send messages yet</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            The other parent needs to accept your case invitation before you can exchange messages.
                            {selectedCase.status === 'pending' && (
                              <span className="block mt-2">
                                Case status: <Badge variant="warning" size="sm">Pending</Badge> - Waiting for other parent to join
                              </span>
                            )}
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
                        description="Start the conversation by sending a message"
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
