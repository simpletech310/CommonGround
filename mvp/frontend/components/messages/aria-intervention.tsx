'use client';

import { useState } from 'react';
import { ARIAAnalysisResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ARIAInterventionProps {
  analysis: ARIAAnalysisResponse;
  originalMessage: string;
  onAccept: () => void;
  onModify: (newMessage: string) => void;
  onReject: (newMessage: string) => void;
  onSendAnyway: () => void;
  onCancel: () => void;
}

export function ARIAIntervention({
  analysis,
  originalMessage,
  onAccept,
  onModify,
  onReject,
  onSendAnyway,
  onCancel,
}: ARIAInterventionProps) {
  const [action, setAction] = useState<'none' | 'modify' | 'reject'>('none');
  const [editedMessage, setEditedMessage] = useState(analysis.suggestion || '');

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'green':
        return 'border-green-200 bg-green-50';
      case 'yellow':
        return 'border-yellow-200 bg-yellow-50';
      case 'orange':
        return 'border-orange-200 bg-orange-50';
      case 'red':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'green':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'yellow':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'orange':
        return (
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'red':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getLevelTitle = (level: string) => {
    switch (level) {
      case 'green':
        return 'Message looks good!';
      case 'yellow':
        return 'ARIA suggests a rewrite';
      case 'orange':
        return 'Strong warning: This message may escalate conflict';
      case 'red':
        return 'This message requires revision before sending';
      default:
        return 'Analysis complete';
    }
  };

  const canSendAnyway = analysis.toxicity_level !== 'red';

  return (
    <Card className={`border-2 ${getLevelColor(analysis.toxicity_level)}`}>
      <CardHeader>
        <div className="flex items-start gap-3">
          {getLevelIcon(analysis.toxicity_level)}
          <div className="flex-1">
            <CardTitle className="text-lg">{getLevelTitle(analysis.toxicity_level)}</CardTitle>
            <CardDescription className="mt-1">{analysis.explanation}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toxicity Score */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Conflict Risk</span>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(analysis.toxicity_score * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                analysis.toxicity_level === 'green'
                  ? 'bg-green-500'
                  : analysis.toxicity_level === 'yellow'
                  ? 'bg-yellow-500'
                  : analysis.toxicity_level === 'orange'
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${analysis.toxicity_score * 100}%` }}
            />
          </div>
        </div>

        {/* Categories */}
        {analysis.categories.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Detected Issues:</p>
            <div className="flex flex-wrap gap-2">
              {analysis.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700"
                >
                  {category.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Triggers */}
        {analysis.triggers.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Specific Concerns:</p>
            <ul className="list-disc list-inside space-y-1">
              {analysis.triggers.map((trigger, index) => (
                <li key={index} className="text-sm text-gray-600">
                  "{trigger}"
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Original Message */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Your Original Message:</p>
          <div className="p-3 bg-white border border-gray-300 rounded text-sm text-gray-900">
            {originalMessage}
          </div>
        </div>

        {/* Suggestion */}
        {analysis.suggestion && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">ARIA's Suggested Alternative:</p>
            <div className="p-3 bg-white border-2 border-blue-300 rounded text-sm text-gray-900">
              {analysis.suggestion}
            </div>
          </div>
        )}

        {/* Edit Actions */}
        {action === 'none' && (
          <div className="space-y-2 pt-4">
            {analysis.suggestion && (
              <Button className="w-full" onClick={onAccept}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept ARIA's Suggestion
              </Button>
            )}

            {analysis.suggestion && (
              <Button variant="outline" className="w-full" onClick={() => setAction('modify')}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modify Suggestion
              </Button>
            )}

            <Button variant="outline" className="w-full" onClick={() => setAction('reject')}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Rewrite Myself
            </Button>

            <div className="flex gap-2">
              {canSendAnyway && (
                <Button variant="outline" className="flex-1" onClick={onSendAnyway}>
                  Send Original Anyway
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
            </div>

            {!canSendAnyway && (
              <p className="text-xs text-red-600 text-center mt-2">
                This message has a high conflict risk and requires revision before sending.
              </p>
            )}
          </div>
        )}

        {/* Modify Mode */}
        {action === 'modify' && (
          <div className="space-y-3 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edit ARIA's Suggestion:
              </label>
              <textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => onModify(editedMessage)}>
                Send Modified Message
              </Button>
              <Button variant="outline" onClick={() => setAction('none')}>
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Reject/Rewrite Mode */}
        {action === 'reject' && (
          <div className="space-y-3 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Write Your Alternative:
              </label>
              <textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                placeholder="Type your new message here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => onReject(editedMessage)}>
                Send Rewritten Message
              </Button>
              <Button variant="outline" onClick={() => setAction('none')}>
                Back
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
