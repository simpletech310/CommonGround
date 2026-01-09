'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, PhoneIncoming, X, Video } from 'lucide-react';
import { kidcomsAPI, KidComsSession } from '@/lib/api';

interface ChildIncomingCallBannerProps {
  pollInterval?: number; // ms, default 5000
}

export function ChildIncomingCallBanner({
  pollInterval = 5000,
}: ChildIncomingCallBannerProps) {
  const router = useRouter();
  const [incomingSession, setIncomingSession] = useState<KidComsSession | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [dismissedSessionIds, setDismissedSessionIds] = useState<Set<string>>(new Set());

  const checkForIncomingCalls = useCallback(async () => {
    try {
      const response = await kidcomsAPI.getChildActiveSessions();

      // Find a session that hasn't been dismissed and wasn't initiated by the child
      const availableSession = response.items.find(
        (session) => !dismissedSessionIds.has(session.id)
      );

      if (availableSession) {
        setIncomingSession(availableSession);
      } else {
        setIncomingSession(null);
      }
    } catch (error) {
      // Silently fail - user might not be authenticated
      console.debug('Error checking for incoming calls:', error);
    }
  }, [dismissedSessionIds]);

  useEffect(() => {
    // Initial check
    checkForIncomingCalls();

    // Set up polling
    const interval = setInterval(checkForIncomingCalls, pollInterval);

    return () => clearInterval(interval);
  }, [checkForIncomingCalls, pollInterval]);

  const handleJoin = async () => {
    if (!incomingSession) return;

    setIsJoining(true);
    try {
      const joinData = await kidcomsAPI.childJoinSession(incomingSession.id);

      // Store session info for the call page
      localStorage.setItem('child_call_session', JSON.stringify({
        sessionId: joinData.session_id,
        roomUrl: joinData.room_url,
        token: joinData.token,
        participantName: joinData.participant_name,
        contactName: 'Parent', // Could be improved with caller info
        callType: incomingSession.session_type === 'voice_call' ? 'voice' : 'video',
      }));

      router.push(`/my-circle/child/call?session=${joinData.session_id}`);
    } catch (error) {
      console.error('Error joining call:', error);
      setIsJoining(false);
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
    <div className="fixed top-4 left-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 max-w-md mx-auto">
      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl shadow-2xl p-5">
        {/* Pulsing ring effect */}
        <div className="absolute -inset-1 bg-green-400 rounded-3xl opacity-30 animate-pulse" />

        <div className="relative flex items-center space-x-4">
          {/* Animated phone icon */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
              <PhoneIncoming className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Call info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-xl">Incoming Call!</p>
            <p className="text-white/90 text-lg mt-1">
              {callerName} wants to talk
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="relative mt-5 flex space-x-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-lg transition-colors flex items-center justify-center"
          >
            <Phone className="h-5 w-5 mr-2 rotate-[135deg]" />
            Not Now
          </button>
          <button
            onClick={handleJoin}
            disabled={isJoining}
            className="flex-1 px-5 py-3 bg-white hover:bg-gray-100 text-green-600 rounded-2xl font-bold text-lg transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <Video className="h-5 w-5 mr-2" />
            {isJoining ? 'Joining...' : 'Answer!'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChildIncomingCallBanner;
