'use client';

import { useState } from 'react';
import { messagesAPI, ARIAAnalysisResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ARIAIntervention } from './aria-intervention';

interface MessageComposeProps {
  caseId: string;
  recipientId: string;
  onMessageSent: () => void;
}

export function MessageCompose({ caseId, recipientId, onMessageSent }: MessageComposeProps) {
  const [message, setMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [analysis, setAnalysis] = useState<ARIAAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<'regex' | 'claude' | 'openai'>('regex');
  const [useAI, setUseAI] = useState(false);

  const handleAnalyze = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);
      const result = await messagesAPI.analyze(caseId, message, useAI, aiProvider);
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

      await messagesAPI.send({
        message_data: {
          case_id: caseId,
          recipient_id: recipientId,
          content,
          message_type: 'text',
        },
      });

      // Clear form
      setMessage('');
      setAnalysis(null);
      onMessageSent();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message');
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

  const handleQuickSend = () => {
    // For green messages, send directly without showing intervention
    if (analysis && analysis.toxicity_level === 'green') {
      handleSendDirect(message);
    } else {
      handleAnalyze();
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
          <CardContent className="pt-6 space-y-4">
            {/* Message Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                disabled={isSending}
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length} / 10000 characters
              </p>
            </div>

            {/* AI Provider Selection */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Use AI Analysis</span>
              </label>

              {useAI && (
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as 'claude' | 'openai')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="openai">GPT-4 (OpenAI)</option>
                </select>
              )}
            </div>

            {/* Analysis Result (Green) */}
            {analysis && !analysis.is_flagged && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-green-900">Message looks good!</p>
                      <p className="text-sm text-green-700">No conflict detected. Safe to send.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAnalyze}
                variant="outline"
                disabled={!message.trim() || isAnalyzing || isSending}
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Preview with ARIA
                  </>
                )}
              </Button>

              <Button
                onClick={handleQuickSend}
                disabled={!message.trim() || isAnalyzing || isSending}
                className="flex-1"
              >
                {isSending ? (
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

            {/* Help Text */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-900">
                <p className="font-medium">ARIA helps you communicate effectively</p>
                <p className="mt-1">
                  Click "Preview with ARIA" to check for potential conflict before sending.
                  {useAI ? ' AI analysis provides deeper insights but takes longer.' : ' Fast analysis uses pattern matching.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
