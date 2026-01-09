'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Phone,
  MessageCircle,
  Film,
  LogOut,
  Loader2,
  Users,
  Clock,
  Calendar,
  Shield,
  ChevronRight,
  X,
} from 'lucide-react';
import { myCircleAPI, CirclePermission } from '@/lib/api';

interface CircleUserData {
  userId: string;
  contactId: string;
  contactName: string;
  familyFileId: string;
  childIds?: string[];
}

interface ChildWithPermissions {
  child_id: string;
  child_name: string;
  avatar_id?: string;
  permissions: CirclePermission;
}

const CHILD_AVATARS: Record<string, string> = {
  lion: '🦁',
  panda: '🐼',
  unicorn: '🦄',
  bear: '🐻',
  cat: '🐱',
  dog: '🐶',
  rabbit: '🐰',
  fox: '🦊',
  koala: '🐨',
  penguin: '🐧',
  monkey: '🐵',
  dragon: '🐉',
};

export default function CircleContactDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<CircleUserData | null>(null);
  const [children, setChildren] = useState<ChildWithPermissions[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildWithPermissions | null>(null);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const token = localStorage.getItem('circle_token');
      const userStr = localStorage.getItem('circle_user');

      if (!token || !userStr) {
        router.push('/my-circle/contact');
        return;
      }

      const user = JSON.parse(userStr) as CircleUserData;
      setUserData(user);

      // Load permissions for this contact
      await loadChildrenWithPermissions(user.contactId);
    } catch (err) {
      console.error('Error loading user data:', err);
      router.push('/my-circle/contact');
    }
  }

  async function loadChildrenWithPermissions(contactId: string) {
    try {
      setIsLoading(true);
      const permissions = await myCircleAPI.getContactPermissions(contactId);

      // Convert permissions to children with permissions
      const childrenData: ChildWithPermissions[] = permissions.map((perm) => ({
        child_id: perm.child_id,
        child_name: perm.child_name || 'Child',
        avatar_id: perm.avatar_id,
        permissions: perm,
      }));

      setChildren(childrenData);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Failed to load your connections. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('circle_token');
    localStorage.removeItem('circle_user');
    router.push('/my-circle/contact');
  }

  function getChildAvatar(avatarId?: string): string {
    if (avatarId && CHILD_AVATARS[avatarId]) {
      return CHILD_AVATARS[avatarId];
    }
    return '🧒';
  }

  function isWithinAllowedHours(permission: CirclePermission): boolean {
    if (!permission.allowed_hours_start || !permission.allowed_hours_end) {
      return true; // No restrictions
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMin] = permission.allowed_hours_start.split(':').map(Number);
    const [endHour, endMin] = permission.allowed_hours_end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  }

  function isAllowedDay(permission: CirclePermission): boolean {
    if (!permission.allowed_days || permission.allowed_days.length === 0) {
      return true; // No restrictions
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    return permission.allowed_days.includes(today);
  }

  function canCommunicate(permission: CirclePermission): { allowed: boolean; reason?: string } {
    if (!permission.is_active) {
      return { allowed: false, reason: 'Connection is not active' };
    }

    if (!isAllowedDay(permission)) {
      return { allowed: false, reason: 'Not available on this day' };
    }

    if (!isWithinAllowedHours(permission)) {
      return { allowed: false, reason: 'Outside allowed hours' };
    }

    return { allowed: true };
  }

  async function handleStartCall(child: ChildWithPermissions, type: 'video' | 'voice') {
    const canCall = canCommunicate(child.permissions);
    if (!canCall.allowed) {
      alert(canCall.reason);
      return;
    }

    if (type === 'video' && !child.permissions.can_video_call) {
      alert('Video calls are not enabled for this connection');
      return;
    }

    if (type === 'voice' && !child.permissions.can_voice_call) {
      alert('Voice calls are not enabled for this connection');
      return;
    }

    setIsStartingCall(true);
    // TODO: Implement actual call initiation via kidcomsAPI
    setTimeout(() => {
      alert(`Starting ${type} call with ${child.child_name}...`);
      setIsStartingCall(false);
      setSelectedChild(null);
    }, 1000);
  }

  function formatTime(timeStr?: string): string {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  function formatDays(days?: string[]): string {
    if (!days || days.length === 0) return 'Any day';
    if (days.length === 7) return 'Every day';

    const dayAbbrev: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    };

    return days.map(d => dayAbbrev[d] || d).join(', ');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-cyan-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">My Circle</h1>
              <p className="text-sm text-gray-500">Welcome, {userData?.contactName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        {/* Children Grid */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Connections</h2>

        {children.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Connections Yet</h3>
            <p className="text-gray-500">
              You'll see children you can connect with here once a parent adds you to their circle.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {children.map((child) => {
              const status = canCommunicate(child.permissions);

              return (
                <button
                  key={child.child_id}
                  onClick={() => status.allowed && setSelectedChild(child)}
                  disabled={!status.allowed}
                  className={`bg-white rounded-2xl shadow-sm p-6 text-left transition-all ${
                    status.allowed
                      ? 'hover:shadow-md hover:scale-[1.02] cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="text-5xl">{getChildAvatar(child.avatar_id)}</div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800 truncate">
                          {child.child_name}
                        </h3>
                        {status.allowed ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            Unavailable
                          </span>
                        )}
                      </div>

                      {/* Permissions */}
                      <div className="flex gap-2 mt-2">
                        {child.permissions.can_video_call && (
                          <div className="p-1.5 bg-green-100 rounded-lg" title="Video Calls">
                            <Video className="h-4 w-4 text-green-600" />
                          </div>
                        )}
                        {child.permissions.can_voice_call && (
                          <div className="p-1.5 bg-blue-100 rounded-lg" title="Voice Calls">
                            <Phone className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        {child.permissions.can_chat && (
                          <div className="p-1.5 bg-purple-100 rounded-lg" title="Chat">
                            <MessageCircle className="h-4 w-4 text-purple-600" />
                          </div>
                        )}
                        {child.permissions.can_theater && (
                          <div className="p-1.5 bg-orange-100 rounded-lg" title="Watch Together">
                            <Film className="h-4 w-4 text-orange-600" />
                          </div>
                        )}
                      </div>

                      {/* Schedule */}
                      {(child.permissions.allowed_hours_start || child.permissions.allowed_days?.length) && (
                        <div className="mt-3 space-y-1">
                          {child.permissions.allowed_hours_start && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock className="h-3.5 w-3.5" />
                              <span>
                                {formatTime(child.permissions.allowed_hours_start)} - {formatTime(child.permissions.allowed_hours_end)}
                              </span>
                            </div>
                          )}
                          {child.permissions.allowed_days && child.permissions.allowed_days.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{formatDays(child.permissions.allowed_days)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status Reason */}
                      {!status.allowed && status.reason && (
                        <p className="mt-2 text-xs text-amber-600">{status.reason}</p>
                      )}
                    </div>

                    {/* Arrow */}
                    {status.allowed && (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Safety Notice */}
        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Shield className="h-4 w-4" />
          <span>All communications are monitored for child safety</span>
        </div>
      </main>

      {/* Call Modal */}
      {selectedChild && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-in zoom-in-95">
            {/* Close Button */}
            <button
              onClick={() => setSelectedChild(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Avatar */}
            <div className="text-center">
              <div className="text-7xl mb-4">{getChildAvatar(selectedChild.avatar_id)}</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {selectedChild.child_name}
              </h2>
              <p className="text-gray-500 mb-6">Choose how to connect</p>
            </div>

            {/* Call Options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {selectedChild.permissions.can_video_call && (
                <button
                  onClick={() => handleStartCall(selectedChild, 'video')}
                  disabled={isStartingCall}
                  className="flex flex-col items-center gap-2 p-4 bg-green-100 hover:bg-green-200 rounded-2xl transition-colors disabled:opacity-50"
                >
                  {isStartingCall ? (
                    <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                  ) : (
                    <Video className="h-8 w-8 text-green-600" />
                  )}
                  <span className="font-semibold text-green-700">Video Call</span>
                </button>
              )}
              {selectedChild.permissions.can_voice_call && (
                <button
                  onClick={() => handleStartCall(selectedChild, 'voice')}
                  disabled={isStartingCall}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-100 hover:bg-blue-200 rounded-2xl transition-colors disabled:opacity-50"
                >
                  {isStartingCall ? (
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  ) : (
                    <Phone className="h-8 w-8 text-blue-600" />
                  )}
                  <span className="font-semibold text-blue-700">Voice Call</span>
                </button>
              )}
            </div>

            {/* Other Options */}
            <div className="flex justify-center gap-2 mb-6">
              {selectedChild.permissions.can_chat && (
                <button
                  disabled
                  className="p-3 bg-purple-100 rounded-xl opacity-50"
                  title="Coming soon!"
                >
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </button>
              )}
              {selectedChild.permissions.can_theater && (
                <button
                  disabled
                  className="p-3 bg-orange-100 rounded-xl opacity-50"
                  title="Coming soon!"
                >
                  <Film className="h-6 w-6 text-orange-600" />
                </button>
              )}
            </div>

            {/* Cancel */}
            <button
              onClick={() => setSelectedChild(null)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
