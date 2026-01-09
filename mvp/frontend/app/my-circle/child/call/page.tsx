'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import VideoCall from '@/components/kidcoms/video-call';

interface CallSession {
  sessionId: string;
  roomUrl: string;
  token: string;
  participantName: string;
  contactName: string;
  callType: 'video' | 'voice';
}

function ChildCallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callEnded, setCallEnded] = useState(false);

  useEffect(() => {
    loadCallSession();
  }, [sessionId]);

  function loadCallSession() {
    try {
      const sessionStr = localStorage.getItem('child_call_session');
      if (!sessionStr) {
        setError('No call session found');
        setIsLoading(false);
        return;
      }

      const session = JSON.parse(sessionStr) as CallSession;
      if (session.sessionId !== sessionId) {
        setError('Session mismatch');
        setIsLoading(false);
        return;
      }

      setCallSession(session);
      setIsLoading(false);
    } catch {
      setError('Failed to load call session');
      setIsLoading(false);
    }
  }

  function handleEndCall() {
    // Clean up session
    localStorage.removeItem('child_call_session');
    setCallEnded(true);

    // Redirect after a moment
    setTimeout(() => {
      router.push('/my-circle/child/dashboard');
    }, 2000);
  }

  function handleGoBack() {
    localStorage.removeItem('child_call_session');
    router.push('/my-circle/child/dashboard');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" />
          <p className="text-xl">Connecting your call...</p>
        </div>
      </div>
    );
  }

  if (error || !callSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error || 'Something went wrong'}</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-purple-500 text-white rounded-full font-semibold hover:bg-purple-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (callEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Call Ended</h1>
          <p className="text-gray-600 mb-4">
            You talked with {callSession.contactName}!
          </p>
          <p className="text-sm text-gray-400">Going back to your circle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm p-4 flex items-center justify-between">
        <button
          onClick={handleGoBack}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="text-center text-white">
          <h1 className="text-lg font-bold">Calling {callSession.contactName}</h1>
          <p className="text-sm text-white/60">
            {callSession.callType === 'video' ? 'Video Call' : 'Voice Call'}
          </p>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Video Area - VideoCall component has its own controls */}
      <div className="flex-1">
        <VideoCall
          roomUrl={callSession.roomUrl}
          token={callSession.token}
          userName={callSession.participantName}
          onLeave={handleEndCall}
        />
      </div>
    </div>
  );
}

export default function ChildCallPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      }
    >
      <ChildCallContent />
    </Suspense>
  );
}
