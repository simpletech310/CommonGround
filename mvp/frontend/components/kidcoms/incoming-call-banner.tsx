'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, PhoneIncoming, X, Video, User } from 'lucide-react';
import { kidcomsAPI, KidComsSession } from '@/lib/api';

interface IncomingCallBannerProps {
  familyFileId: string;
  pollInterval?: number; // ms, default 5000
}

export function IncomingCallBanner({
  familyFileId,
  pollInterval = 5000,
}: IncomingCallBannerProps) {
  const router = useRouter();
  const [incomingSession, setIncomingSession] = useState<KidComsSession | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [dismissedSessionIds, setDismissedSessionIds] = useState<Set<string>>(new Set());

  const checkForIncomingCalls = useCallback(async () => {
    try {
      const response = await kidcomsAPI.getActiveSessions(familyFileId);

      // Find a session that hasn't been dismissed
      const availableSession = response.items.find(
        (session) => !dismissedSessionIds.has(session.id)
      );

      if (availableSession && !isDismissed) {
        setIncomingSession(availableSession);
      } else if (!availableSession) {
        setIncomingSession(null);
      }
    } catch (error) {
      // Silently fail - user might not be authenticated or endpoint unavailable
      console.debug('Error checking for incoming calls:', error);
    }
  }, [familyFileId, dismissedSessionIds, isDismissed]);

  useEffect(() => {
    // Initial check
    checkForIncomingCalls();

    // Set up polling
    const interval = setInterval(checkForIncomingCalls, pollInterval);

    return () => clearInterval(interval);
  }, [checkForIncomingCalls, pollInterval]);

  const handleJoin = () => {
    if (incomingSession) {
      router.push(`/family-files/${familyFileId}/kidcoms/session/${incomingSession.id}`);
    }
  };

  const handleDismiss = () => {
    if (incomingSession) {
      setDismissedSessionIds((prev) => new Set(prev).add(incomingSession.id));
      setIncomingSession(null);
    }
  };

  if (!incomingSession) {
    return null;
  }

  // Get caller info from participants
  const caller = incomingSession.participants?.find(
    (p) => p.id === incomingSession.initiated_by_id
  );
  const callerName = caller?.name || 'Someone';

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-2xl p-4 max-w-sm">
        {/* Pulsing ring effect */}
        <div className="absolute -inset-1 bg-purple-500 rounded-xl opacity-30 animate-pulse" />

        <div className="relative flex items-start space-x-4">
          {/* Animated phone icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
              <PhoneIncoming className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Call info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-lg">Incoming Video Call</p>
            <p className="text-white/80 text-sm flex items-center mt-1">
              <User className="h-4 w-4 mr-1" />
              {callerName} is calling...
            </p>
            {incomingSession.title && (
              <p className="text-white/60 text-xs mt-1 truncate">
                {incomingSession.title}
              </p>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="relative mt-4 flex space-x-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <Phone className="h-4 w-4 mr-2 rotate-[135deg]" />
            Decline
          </button>
          <button
            onClick={handleJoin}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <Video className="h-4 w-4 mr-2" />
            Join Call
          </button>
        </div>

        {/* Session type indicator */}
        <div className="relative mt-3 flex items-center justify-center">
          <span className="text-white/50 text-xs">
            {incomingSession.session_type.replace('_', ' ')} session
          </span>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallBanner;
