'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import {
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  MessageCircle,
  Film,
  Gamepad2,
  PenTool,
  Users,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Send,
} from 'lucide-react';
import { kidcomsAPI, KidComsSession, KidComsMessage } from '@/lib/api';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const familyFileId = params.id as string;
  const sessionId = params.sessionId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<KidComsSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);

  // Daily.co call object
  const callRef = useRef<DailyCall | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isCallJoined, setIsCallJoined] = useState(false);
  const [isJoiningCall, setIsJoiningCall] = useState(false);

  // Video controls
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  // Side panel
  const [activePanel, setActivePanel] = useState<'chat' | 'participants' | null>(null);
  const [messages, setMessages] = useState<KidComsMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Load session data
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Poll for new messages and session updates every 3 seconds
  useEffect(() => {
    if (!session) return;

    const pollData = async () => {
      try {
        // Poll messages
        const messagesData = await kidcomsAPI.getMessages(sessionId);
        setMessages(messagesData.items);

        // Also refresh session to get latest participant list
        const sessionData = await kidcomsAPI.getSession(sessionId);
        setSession(sessionData);
      } catch (err) {
        console.error('Error polling data:', err);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollData, 3000);

    return () => clearInterval(interval);
  }, [sessionId, session?.id]);

  // Initialize Daily.co call when token and roomUrl are available
  useEffect(() => {
    if (token && roomUrl && !callRef.current && !isJoiningCall) {
      initializeCall();
    }

    // Cleanup on unmount
    return () => {
      if (callRef.current) {
        callRef.current.destroy();
        callRef.current = null;
      }
    };
  }, [token, roomUrl]);

  async function initializeCall() {
    if (!token || !roomUrl || !videoContainerRef.current) return;

    try {
      setIsJoiningCall(true);
      console.log('Initializing Daily.co call with:', { roomUrl, tokenLength: token?.length });

      // Create Daily call frame with explicit video/audio settings
      const callFrame = DailyIframe.createFrame(videoContainerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          minHeight: '400px',
          border: '0',
          borderRadius: '12px',
        },
        showLeaveButton: false,
        showFullscreenButton: true,
        // Explicitly enable video and audio
        startVideoOff: false,
        startAudioOff: false,
      });

      callRef.current = callFrame;

      // Set up event listeners
      callFrame.on('joining-meeting', () => {
        console.log('Daily.co: joining-meeting');
      });

      callFrame.on('joined-meeting', (event) => {
        console.log('Daily.co: joined-meeting', event);
        setIsCallJoined(true);
        setIsJoiningCall(false);
      });

      callFrame.on('participant-joined', (event) => {
        console.log('Daily.co: participant-joined', event);
      });

      callFrame.on('participant-left', (event) => {
        console.log('Daily.co: participant-left', event);
      });

      callFrame.on('left-meeting', () => {
        console.log('Daily.co: left-meeting');
        setIsCallJoined(false);
      });

      callFrame.on('error', (event) => {
        console.error('Daily.co error:', event);
        setError('Video call error occurred');
        setIsJoiningCall(false);
      });

      callFrame.on('camera-error', (event) => {
        console.error('Daily.co camera error:', event);
      });

      callFrame.on('track-started', (event) => {
        console.log('Daily.co: track-started', event);
      });

      callFrame.on('track-stopped', (event) => {
        console.log('Daily.co: track-stopped', event);
      });

      callFrame.on('active-speaker-change', (event) => {
        console.log('Daily.co: active-speaker-change', event);
      });

      // Join the call with the token
      console.log('Attempting to join Daily.co room...', { roomUrl });
      await callFrame.join({
        url: roomUrl,
        token: token,
        // Request camera/microphone access
        startVideoOff: false,
        startAudioOff: false,
      });
      console.log('Daily.co join call completed');

      // Log participants after join
      const participants = callFrame.participants();
      console.log('Daily.co participants after join:', participants);

    } catch (err) {
      console.error('Error initializing Daily.co call:', err);
      setError('Failed to initialize video call');
      setIsJoiningCall(false);
    }
  }

  async function loadSession() {
    try {
      setIsLoading(true);
      setError(null);

      // Get session details
      const sessionData = await kidcomsAPI.getSession(sessionId);
      setSession(sessionData);

      // If session is active, join it
      if (sessionData.status === 'active' || sessionData.status === 'waiting') {
        const joinData = await kidcomsAPI.joinSession(sessionId);
        setToken(joinData.token);
        setRoomUrl(joinData.room_url);
      }

      // Load messages
      const messagesData = await kidcomsAPI.getMessages(sessionId);
      setMessages(messagesData.items);
    } catch (err) {
      console.error('Error loading session:', err);
      setError('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEndCall() {
    try {
      // Leave Daily.co call first
      if (callRef.current) {
        await callRef.current.leave();
        callRef.current.destroy();
        callRef.current = null;
      }

      // End the session on the backend
      await kidcomsAPI.endSession(sessionId);
      router.push(`/family-files/${familyFileId}/kidcoms`);
    } catch (err) {
      console.error('Error ending call:', err);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim()) return;

    try {
      setIsSendingMessage(true);
      const message = await kidcomsAPI.sendMessage(sessionId, newMessage.trim());
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  }

  const toggleVideo = useCallback(async () => {
    if (callRef.current) {
      const newState = !isVideoOn;
      await callRef.current.setLocalVideo(newState);
      setIsVideoOn(newState);
    }
  }, [isVideoOn]);

  const toggleAudio = useCallback(async () => {
    if (callRef.current) {
      const newState = !isAudioOn;
      await callRef.current.setLocalAudio(newState);
      setIsAudioOn(newState);
    }
  }, [isAudioOn]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white">Connecting to call...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-white mb-4">{error || 'Session not found'}</p>
          <button
            onClick={() => router.push(`/family-files/${familyFileId}/kidcoms`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to KidComs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/family-files/${familyFileId}/kidcoms`)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-white font-semibold">{session.title || 'Video Call'}</h1>
              <p className="text-sm text-gray-400">
                {isCallJoined ? 'Connected' : isJoiningCall ? 'Connecting...' : session.status}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs ${
              isCallJoined
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {session.participants.length} participants
            </span>
          </div>
        </header>

        {/* Video Grid */}
        <div className="flex-1 p-4 min-h-[500px]">
          {token && roomUrl ? (
            <div
              ref={videoContainerRef}
              className="h-full min-h-[450px] bg-gray-800 rounded-xl overflow-hidden"
            >
              {isJoiningCall && !isCallJoined && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
                    <p className="text-gray-400">Joining video call...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full bg-gray-800 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-gray-400">Waiting to connect...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-800 px-4 py-4">
          <div className="flex items-center justify-center space-x-4">
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              disabled={!isCallJoined}
              className={`p-4 rounded-full transition-colors ${
                isAudioOn
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } ${!isCallJoined ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              disabled={!isCallJoined}
              className={`p-4 rounded-full transition-colors ${
                isVideoOn
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } ${!isCallJoined ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </button>

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              <PhoneOff className="h-6 w-6" />
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-gray-700" />

            {/* Feature Toggles */}
            <button
              onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
              className={`p-3 rounded-full transition-colors ${
                activePanel === 'chat'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
            </button>

            <button
              onClick={() => setActivePanel(activePanel === 'participants' ? null : 'participants')}
              className={`p-3 rounded-full transition-colors ${
                activePanel === 'participants'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <Users className="h-5 w-5" />
            </button>

            {/* Feature buttons - disabled for now */}
            <button
              disabled
              className="p-3 rounded-full bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
            >
              <Film className="h-5 w-5" />
            </button>

            <button
              disabled
              className="p-3 rounded-full bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
            >
              <Gamepad2 className="h-5 w-5" />
            </button>

            <button
              disabled
              className="p-3 rounded-full bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
            >
              <PenTool className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      {activePanel && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold capitalize">{activePanel}</h3>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {activePanel === 'chat' && (
              <div className="flex flex-col h-full">
                {/* Messages */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center text-sm">No messages yet</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.aria_flagged
                            ? 'bg-yellow-900/30 border border-yellow-700'
                            : 'bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-purple-400">
                            {msg.sender_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.sent_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-white text-sm">{msg.content}</p>
                        {msg.aria_flagged && (
                          <p className="text-xs text-yellow-500 mt-1">
                            Moderated by ARIA
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isSendingMessage || !newMessage.trim()}
                      className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'participants' && (
              <div className="p-4 space-y-3">
                {session.participants.map((participant, index) => (
                  <div
                    key={participant.id || index}
                    className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                      {participant.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{participant.name}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {participant.participant_type.replace('_', ' ')}
                      </p>
                    </div>
                    {participant.joined_at && (
                      <span className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
