'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DailyCall } from '@daily-co/daily-js';
import {
  X,
  Library,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from 'lucide-react';
import { TheaterVideoPlayer } from './theater-video-player';
import { ContentLibrary } from './content-library';
import {
  TheaterSyncMessage,
  createTheaterMessage,
  extractYouTubeId,
} from '@/lib/theater-content';

type ContentType = 'video' | 'pdf' | 'youtube';

interface TheaterContent {
  type: ContentType;
  url: string;
  title: string;
}

interface TheaterState {
  isPlaying: boolean;
  currentTime: number;
  currentPage?: number;
  duration?: number;
}

interface VideoParticipant {
  odId: string;
  odName: string;
  isLocal: boolean;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  videoOn: boolean;
  audioOn: boolean;
}

interface TheaterModeProps {
  isActive: boolean;
  isController: boolean;  // Is this user the parent/controller
  userId: string;
  userName: string;
  callRef: React.RefObject<DailyCall | null>;
  participants: Map<string, VideoParticipant>;
  isVideoOn: boolean;
  isAudioOn: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onExit: () => void;
}

export function TheaterMode({
  isActive,
  isController,
  userId,
  userName,
  callRef,
  participants,
  isVideoOn,
  isAudioOn,
  onToggleVideo,
  onToggleAudio,
  onExit,
}: TheaterModeProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [content, setContent] = useState<TheaterContent | null>(null);
  const [theaterState, setTheaterState] = useState<TheaterState>({
    isPlaying: false,
    currentTime: 0,
  });

  // Sync interval for periodic state updates
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle incoming theater messages
  useEffect(() => {
    const call = callRef.current;
    if (!call) return;

    const handleAppMessage = (event: { data: TheaterSyncMessage; fromId: string }) => {
      const message = event.data;
      if (message.type !== 'theater_control') return;

      const { action, contentType, contentUrl, currentTime, currentPage, isPlaying, contentTitle } = message.data;

      console.log('Theater message received:', action, { contentType, contentUrl, currentTime, isPlaying });

      switch (action) {
        case 'start':
          // Parent started theater with content
          setContent({
            type: contentType,
            url: contentUrl,
            title: contentTitle || 'Theater',
          });
          setTheaterState({
            isPlaying: isPlaying ?? false,
            currentTime: currentTime ?? 0,
            currentPage: currentPage,
          });
          break;

        case 'stop':
          // Parent stopped theater
          setContent(null);
          setTheaterState({ isPlaying: false, currentTime: 0 });
          break;

        case 'play':
        case 'pause':
        case 'seek':
          // Playback control
          setTheaterState((prev) => ({
            ...prev,
            isPlaying: action === 'play' ? true : action === 'pause' ? false : prev.isPlaying,
            currentTime: currentTime ?? prev.currentTime,
            currentPage: currentPage ?? prev.currentPage,
          }));
          break;

        case 'page':
          // PDF page change
          setTheaterState((prev) => ({
            ...prev,
            currentPage: currentPage,
          }));
          break;

        case 'sync_request':
          // Non-controller requesting sync (controller responds with current state)
          if (isController && content) {
            broadcastState('play');
          }
          break;
      }
    };

    call.on('app-message', handleAppMessage);

    return () => {
      call.off('app-message', handleAppMessage);
    };
  }, [callRef, isController, content]);

  // Request sync when joining as non-controller
  useEffect(() => {
    if (isActive && !isController && callRef.current) {
      // Request current state from controller
      const syncRequest = createTheaterMessage(
        'sync_request',
        'video',
        '',
        userId,
        { senderName: userName }
      );
      callRef.current.sendAppMessage(syncRequest, '*');
    }
  }, [isActive, isController, userId, userName, callRef]);

  // Broadcast current state to all participants
  const broadcastState = useCallback((action: TheaterSyncMessage['data']['action']) => {
    const call = callRef.current;
    if (!call || !content || !isController) return;

    const message = createTheaterMessage(
      action,
      content.type,
      content.url,
      userId,
      {
        contentTitle: content.title,
        currentTime: theaterState.currentTime,
        currentPage: theaterState.currentPage,
        isPlaying: theaterState.isPlaying,
        senderName: userName,
      }
    );

    call.sendAppMessage(message, '*');
  }, [callRef, content, isController, userId, userName, theaterState]);

  // Periodic sync (every 5 seconds while playing)
  useEffect(() => {
    if (isController && content && theaterState.isPlaying) {
      syncIntervalRef.current = setInterval(() => {
        broadcastState('seek');
      }, 5000);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isController, content, theaterState.isPlaying, broadcastState]);

  // Content selection handler
  const handleContentSelect = (selected: { type: ContentType; url: string; title: string }) => {
    setContent(selected);
    setShowLibrary(false);
    setTheaterState({ isPlaying: false, currentTime: 0, currentPage: 1 });

    // Broadcast to all participants
    if (callRef.current) {
      const message = createTheaterMessage(
        'start',
        selected.type,
        selected.url,
        userId,
        {
          contentTitle: selected.title,
          currentTime: 0,
          currentPage: 1,
          isPlaying: false,
          senderName: userName,
        }
      );
      callRef.current.sendAppMessage(message, '*');
    }
  };

  // Playback control handlers (controller only)
  const handlePlay = () => {
    setTheaterState((prev) => ({ ...prev, isPlaying: true }));
    broadcastState('play');
  };

  const handlePause = () => {
    setTheaterState((prev) => ({ ...prev, isPlaying: false }));
    broadcastState('pause');
  };

  const handleSeek = (time: number) => {
    setTheaterState((prev) => ({ ...prev, currentTime: time }));
    broadcastState('seek');
  };

  const handleTimeUpdate = (time: number, duration: number) => {
    setTheaterState((prev) => ({ ...prev, currentTime: time, duration }));
  };

  // Exit theater
  const handleExit = () => {
    if (isController && callRef.current) {
      const message = createTheaterMessage('stop', 'video', '', userId, { senderName: userName });
      callRef.current.sendAppMessage(message, '*');
    }
    setContent(null);
    setTheaterState({ isPlaying: false, currentTime: 0 });
    onExit();
  };

  if (!isActive) return null;

  // Get participants for PiP
  const participantList = Array.from(participants.values());
  const localParticipant = participantList.find((p) => p.isLocal);
  const remoteParticipants = participantList.filter((p) => !p.isLocal);

  return (
    <div className="fixed inset-0 z-40 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50">
        <div className="flex items-center space-x-3">
          <span className="text-purple-400 text-sm font-medium px-2 py-1 bg-purple-500/20 rounded">
            Theater Mode
          </span>
          {content && (
            <span className="text-white font-medium">{content.title}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isController && (
            <button
              onClick={() => setShowLibrary(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Library className="h-4 w-4" />
              <span className="text-sm">Library</span>
            </button>
          )}
          <button
            onClick={handleExit}
            className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="text-sm">Exit Theater</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative p-4">
        {/* PiP Video Windows */}
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
          {/* Remote participant(s) PiP */}
          {remoteParticipants.slice(0, 1).map((participant) => (
            <div
              key={participant.odId}
              className="w-32 h-24 md:w-40 md:h-28 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 bg-gray-800"
            >
              <PiPVideoTile participant={participant} />
            </div>
          ))}

          {/* Local participant PiP */}
          {localParticipant && (
            <div className="w-32 h-24 md:w-40 md:h-28 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 bg-gray-800">
              <PiPVideoTile participant={localParticipant} />
            </div>
          )}
        </div>

        {/* Content Player */}
        <div className="h-full max-w-5xl mx-auto">
          {!content ? (
            // No content selected - show prompt
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center">
                <Library className="h-20 w-20 text-gray-600 mx-auto mb-4" />
                <h2 className="text-xl text-white mb-2">
                  {isController ? 'Choose something to watch together' : 'Waiting for content...'}
                </h2>
                <p className="text-gray-400 mb-6">
                  {isController
                    ? 'Select a video, storybook, or YouTube link from the library'
                    : 'The parent will select something to watch'}
                </p>
                {isController && (
                  <button
                    onClick={() => setShowLibrary(true)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Open Library
                  </button>
                )}
              </div>
            </div>
          ) : content.type === 'video' ? (
            // Video player
            <TheaterVideoPlayer
              src={content.url}
              title={content.title}
              isController={isController}
              currentTime={theaterState.currentTime}
              isPlaying={theaterState.isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : content.type === 'youtube' ? (
            // YouTube player (placeholder for now)
            <div className="h-full flex items-center justify-center bg-gray-800 rounded-xl">
              <div className="text-center">
                <p className="text-white mb-4">YouTube: {content.url}</p>
                <p className="text-gray-400">YouTube player coming soon</p>
              </div>
            </div>
          ) : content.type === 'pdf' ? (
            // PDF viewer (placeholder for now)
            <div className="h-full flex items-center justify-center bg-gray-800 rounded-xl">
              <div className="text-center">
                <p className="text-white mb-4">{content.title}</p>
                <p className="text-gray-400">PDF viewer coming soon</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-4 py-3 bg-gray-800/90">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={onToggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioOn
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          <button
            onClick={onToggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoOn
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Content Library Modal */}
      <ContentLibrary
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={handleContentSelect}
      />
    </div>
  );
}

// Small PiP video tile component
function PiPVideoTile({ participant }: { participant: VideoParticipant }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (participant.videoTrack) {
      const stream = new MediaStream([participant.videoTrack]);
      video.srcObject = stream;
      video.play().catch(console.error);
    } else {
      video.srcObject = null;
    }
  }, [participant.videoTrack]);

  useEffect(() => {
    if (participant.isLocal) return;

    if (participant.audioTrack && audioRef.current) {
      const stream = new MediaStream([participant.audioTrack]);
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(console.error);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.srcObject = null;
      }
    };
  }, [participant.audioTrack, participant.isLocal]);

  return (
    <div className="relative h-full w-full">
      {participant.videoOn && participant.videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white text-lg font-semibold">
            {participant.odName[0]?.toUpperCase() || '?'}
          </div>
        </div>
      )}

      {/* Hidden audio element for remote participant */}
      {!participant.isLocal && <audio ref={audioRef} />}

      {/* Name label */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-0.5">
        <span className="text-white text-xs truncate block">
          {participant.odName}
          {participant.isLocal && ' (You)'}
        </span>
      </div>

      {/* Mute indicator */}
      {!participant.audioOn && (
        <div className="absolute top-1 right-1 p-1 bg-red-500 rounded-full">
          <MicOff className="h-2.5 w-2.5 text-white" />
        </div>
      )}
    </div>
  );
}
