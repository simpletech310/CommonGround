'use client';

import { useState } from 'react';
import { messagesAPI, ARIAAnalysisResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ARIAIntervention } from './aria-intervention';

interface MessageComposeProps {
  caseId: string;
  agreementId?: string;  // SharedCare Agreement context
  recipientId: string;
  onMessageSent: () => void;
  ariaEnabled?: boolean;
}

export function MessageCompose({ caseId, agreementId, recipientId, onMessageSent, ariaEnabled = true }: MessageComposeProps) {
  const [message, setMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [analysis, setAnalysis] = useState<ARIAAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      // Use case-level ARIA settings (backend reads from case)
      const result = await messagesAPI.analyze(caseId, message);
      setAnalysis(result);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to analyze message');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendDirect = async (content: string) => {
    try {
      setIsSending(true);
      setError(null);

      // Debug: Check if we have auth token
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      console.log('Sending message with auth token:', token ? 'Present' : 'Missing');
      console.log('Message payload:', {
        case_id: caseId,
        recipient_id: recipientId,
        content: content.substring(0, 50) + '...',
        message_type: 'text',
      });

      await messagesAPI.send({
        case_id: caseId,
        agreement_id: agreementId,
        recipient_id: recipientId,
        content,
        message_type: 'text',
      });

      // Clear form
      setMessage('');
      setAnalysis(null);
      onMessageSent();
    } catch (err: any) {
      console.error('Failed to send message:', err);

      // More detailed error messages
      let errorMessage = 'Failed to send message';
      if (err.status === 401) {
        errorMessage = 'Authentication error. Please try logging in again.';
      } else if (err.status === 422) {
        errorMessage = 'Invalid message format. Please check your message.';
      } else if (err.status === 403) {
        errorMessage = 'You do not have permission to send messages in this case.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = () => {
    if (analysis?.suggestion) {
      handleSendDirect(analysis.suggestion);
    }
  };

  const handleModify = (newMessage: string) => {
    handleSendDirect(newMessage);
  };

  const handleReject = (newMessage: string) => {
    handleSendDirect(newMessage);
  };

  const handleSendAnyway = () => {
    handleSendDirect(message);
  };

  const handleCancel = () => {
    setAnalysis(null);
    setError(null);
  };

  const handleQuickSend = async () => {
    // If ARIA is enabled, automatically analyze before sending
    if (ariaEnabled) {
      if (!message.trim()) {
        setError('Please enter a message');
        return;
      }

      try {
        setIsAnalyzing(true);
        setError(null);

        // Analyze the message with ARIA
        const result = await messagesAPI.analyze(caseId, message);

        // If flagged, show intervention UI
        if (result.is_flagged) {
          setAnalysis(result);
          setIsAnalyzing(false);
          return; // Don't send automatically - wait for user decision
        }

        // Not flagged - send automatically
        setIsAnalyzing(false);
        await handleSendDirect(message);
      } catch (err: any) {
        console.error('ARIA analysis failed:', err);
        setError(err.message || 'Failed to analyze message');
        setIsAnalyzing(false);
      }
    } else {
      // ARIA disabled - send directly without analysis
      await handleSendDirect(message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ARIA Intervention */}
      {analysis && analysis.is_flagged && (
        <ARIAIntervention
          analysis={analysis}
          originalMessage={message}
          onAccept={handleAccept}
          onModify={handleModify}
          onReject={handleReject}
          onSendAnyway={handleSendAnyway}
          onCancel={handleCancel}
        />
      )}

      {/* Compose Form */}
      {!analysis?.is_flagged && (
        <Card>
          <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground resize-none"
                rows={4}
                disabled={isSending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length} / 10000 characters
              </p>
            </div>

            {/* Analysis Result (Green) */}
            {analysis && !analysis.is_flagged && (
              <Card className="border-cg-success/30 bg-cg-success/10">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cg-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-cg-success">Message looks good!</p>
                      <p className="text-sm text-cg-success/80 hidden sm:block">No conflict detected. Safe to send.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={handleAnalyze}
                variant="outline"
                disabled={!message.trim() || isAnalyzing || isSending}
                className="w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="hidden sm:inline">Preview with ARIA</span>
                    <span className="sm:hidden">Preview</span>
                  </>
                )}
              </Button>

              <Button
                onClick={handleQuickSend}
                disabled={!message.trim() || isAnalyzing || isSending}
                className="w-full sm:flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {ariaEnabled ? 'Checking...' : 'Processing...'}
                  </>
                ) : isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Message
                  </>
                )}
              </Button>
            </div>

            {/* Help Text - Hidden on mobile for cleaner UI */}
            <div className="hidden sm:flex items-start gap-2 p-3 bg-cg-primary-subtle border border-cg-primary/20 rounded-md">
              <svg className="w-5 h-5 text-cg-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-foreground/80">
                <p className="font-medium">ARIA helps you communicate effectively</p>
                <p className="mt-1">
                  {ariaEnabled
                    ? "Messages are automatically analyzed before sending."
                    : "ARIA is disabled. Click 'Preview' to analyze your message."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
