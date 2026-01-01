'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { casesAPI, messagesAPI, Case, Message } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';
import { MessageCompose } from '@/components/messages/message-compose';

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
    await loadMessages(caseItem.id);
    await loadAriaSettings(caseItem.id);
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
                <Link href="/cases" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Cases
                </Link>
                <Link href="/messages" className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-1">
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
        <div className="flex gap-6">
          {/* Sidebar - Case List */}
          <div className="w-80 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle>Cases</CardTitle>
                <CardDescription>Select a case to view messages</CardDescription>
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

          {/* Main Area - Messages */}
          <div className="flex-1">
            {!selectedCase && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a case to view messages
                    </h3>
                    <p className="text-gray-600">
                      Choose a case from the sidebar to start communicating
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
                      <div className="flex-1">
                        <CardTitle>{selectedCase.case_name}</CardTitle>
                        <CardDescription>AI-powered communication with conflict prevention</CardDescription>

                        {/* ARIA Toggle */}
                        {ariaSettings && (
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                            <button
                              onClick={toggleAriaEnabled}
                              disabled={isUpdatingAria}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                ariaSettings.aria_enabled ? 'bg-blue-600' : 'bg-gray-200'
                              } ${isUpdatingAria ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  ariaSettings.aria_enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  ARIA Protection
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  ariaSettings.aria_enabled
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {ariaSettings.aria_enabled ? 'ON' : 'OFF'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {ariaSettings.aria_enabled
                                  ? `AI monitoring with ${ariaSettings.aria_provider === 'claude' ? 'Claude' : ariaSettings.aria_provider === 'openai' ? 'OpenAI' : 'Pattern matching'} • All messages are analyzed for court documentation`
                                  : 'ARIA is disabled • Messages will not be analyzed'}
                              </p>
                              {ariaSettings.aria_disabled_at && !ariaSettings.aria_enabled && (
                                <p className="text-xs text-amber-600 mt-1">
                                  ⚠️ Disabled on {new Date(ariaSettings.aria_disabled_at).toLocaleDateString()} • This action is tracked for court records
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => setShowCompose(!showCompose)}
                        disabled={!getOtherParentId()}
                        title={!getOtherParentId() ? "Waiting for other parent to join case" : ""}
                        className="ml-4"
                      >
                        {showCompose ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
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
                      <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <p className="font-medium text-yellow-900">Can't send messages yet</p>
                              <p className="text-sm text-yellow-700 mt-1">
                                The other parent needs to accept your case invitation before you can exchange messages.
                                {selectedCase.status === 'pending' && (
                                  <span className="block mt-2">
                                    Case status: <span className="font-semibold">Pending</span> - Waiting for other parent to join
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading messages...</p>
                      </div>
                    )}

                    {!isLoadingMessages && messages.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No messages yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Start the conversation by sending a message
                        </p>
                        <Button onClick={() => setShowCompose(true)}>
                          Send First Message
                        </Button>
                      </div>
                    )}

                    {!isLoadingMessages && messages.length > 0 && (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isSent = message.sender_id === user?.id;

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-md ${isSent ? 'ml-12' : 'mr-12'}`}>
                                <div
                                  className={`rounded-lg p-4 ${
                                    isSent
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  {message.was_flagged && (
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-opacity-20">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                      </svg>
                                      <span className="text-xs opacity-75">ARIA reviewed</span>
                                    </div>
                                  )}

                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                                  {message.original_content && (
                                    <details className="mt-2 pt-2 border-t border-opacity-20">
                                      <summary className="text-xs opacity-75 cursor-pointer">
                                        View original message
                                      </summary>
                                      <p className="text-xs opacity-75 mt-1 italic">
                                        "{message.original_content}"
                                      </p>
                                    </details>
                                  )}
                                </div>

                                <p className={`text-xs text-gray-500 mt-1 ${isSent ? 'text-right' : 'text-left'}`}>
                                  {formatTime(message.sent_at)}
                                </p>
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
      </main>
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
