'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Settings,
  Mail,
  Check,
  X,
  Loader2,
  ChevronRight,
  Video,
  Phone,
  MessageCircle,
  Film,
  Clock,
  Calendar,
  Edit2,
  Trash2,
  UserPlus,
  QrCode,
  Copy,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { myCircleAPI, familyFilesAPI, KidComsRoom, CirclePermission, FamilyFileChild } from '@/lib/api';

interface PageParams {
  params: Promise<{ id: string }>;
}

const ROOM_COLORS = [
  'bg-red-100 border-red-300 text-red-700',
  'bg-orange-100 border-orange-300 text-orange-700',
  'bg-amber-100 border-amber-300 text-amber-700',
  'bg-yellow-100 border-yellow-300 text-yellow-700',
  'bg-lime-100 border-lime-300 text-lime-700',
  'bg-green-100 border-green-300 text-green-700',
  'bg-teal-100 border-teal-300 text-teal-700',
  'bg-cyan-100 border-cyan-300 text-cyan-700',
  'bg-blue-100 border-blue-300 text-blue-700',
  'bg-purple-100 border-purple-300 text-purple-700',
];

const RELATIONSHIP_OPTIONS = [
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'family_friend', label: 'Family Friend' },
  { value: 'godparent', label: 'Godparent' },
  { value: 'step_parent', label: 'Step Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'coach', label: 'Coach' },
  { value: 'other', label: 'Other' },
];

export default function MyCircleManagementPage({ params }: PageParams) {
  const resolvedParams = use(params);
  const familyFileId = resolvedParams.id;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<KidComsRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<KidComsRoom | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showChildSetupModal, setShowChildSetupModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteContactName, setInviteContactName] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [inviteRoomNumber, setInviteRoomNumber] = useState(3);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{ email: string; token: string } | null>(null);

  // Permission editing state
  const [editingPermission, setEditingPermission] = useState<CirclePermission | null>(null);
  const [permissionForm, setPermissionForm] = useState({
    can_video_call: true,
    can_voice_call: true,
    can_chat: false,
    can_theater: true,
    allowed_hours_start: '',
    allowed_hours_end: '',
    allowed_days: [] as string[],
  });
  const [isSavingPermission, setIsSavingPermission] = useState(false);

  // Child setup state
  const [children, setChildren] = useState<FamilyFileChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [childSetupName, setChildSetupName] = useState('');
  const [childSetupPin, setChildSetupPin] = useState('');
  const [childSetupAvatar, setChildSetupAvatar] = useState('lion');
  const [isSettingUpChild, setIsSettingUpChild] = useState(false);

  useEffect(() => {
    loadRooms();
  }, [familyFileId]);

  async function loadRooms() {
    try {
      setIsLoading(true);
      const [roomList, childrenList] = await Promise.all([
        myCircleAPI.getRooms(familyFileId),
        familyFilesAPI.getChildren(familyFileId),
      ]);
      setRooms(roomList.items);
      setChildren(childrenList.items);
      // Pre-select first child if available
      if (childrenList.items.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenList.items[0].id);
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendInvite() {
    if (!inviteEmail || !inviteContactName) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsInviting(true);
      setError(null);

      const response = await myCircleAPI.inviteCircleUser(familyFileId, {
        email: inviteEmail,
        contact_name: inviteContactName,
        relationship_type: inviteRelationship || undefined,
        room_number: inviteRoomNumber,
      });

      setInviteSuccess({
        email: inviteEmail,
        token: response.invite_token,
      });

      // Reload rooms to show the new pending invite
      await loadRooms();
    } catch (err) {
      console.error('Error sending invite:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  }

  async function handleUpdatePermission() {
    if (!editingPermission) return;

    try {
      setIsSavingPermission(true);
      setError(null);

      // Map day names to numbers (0=Sunday, 1=Monday, etc.)
      const dayNameToNumber: Record<string, number> = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };

      await myCircleAPI.updatePermission(editingPermission.id, {
        can_video_call: permissionForm.can_video_call,
        can_voice_call: permissionForm.can_voice_call,
        can_chat: permissionForm.can_chat,
        can_theater: permissionForm.can_theater,
        allowed_start_time: permissionForm.allowed_hours_start || undefined,
        allowed_end_time: permissionForm.allowed_hours_end || undefined,
        allowed_days:
          permissionForm.allowed_days.length > 0
            ? permissionForm.allowed_days.map((day) => dayNameToNumber[day])
            : undefined,
      });

      setShowPermissionModal(false);
      setEditingPermission(null);
      await loadRooms();
    } catch (err) {
      console.error('Error updating permission:', err);
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    } finally {
      setIsSavingPermission(false);
    }
  }

  async function handleSetupChildUser() {
    if (!selectedChildId) {
      setError('Please select a child');
      return;
    }

    if (!childSetupName || !childSetupPin) {
      setError('Please enter a username and PIN');
      return;
    }

    if (childSetupPin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    try {
      setIsSettingUpChild(true);
      setError(null);

      await myCircleAPI.setupChildUser({
        child_id: selectedChildId,
        username: childSetupName,
        pin: childSetupPin,
        avatar_id: childSetupAvatar,
      });

      setShowChildSetupModal(false);
      setChildSetupName('');
      setChildSetupPin('');
      setChildSetupAvatar('lion');

      alert('Child account created! They can now log in with their name and PIN.');
    } catch (err) {
      console.error('Error setting up child:', err);
      setError(err instanceof Error ? err.message : 'Failed to create child account');
    } finally {
      setIsSettingUpChild(false);
    }
  }

  function openPermissionModal(permission: CirclePermission) {
    setEditingPermission(permission);

    // Map numbers back to day names (0=Sunday, 1=Monday, etc.)
    const numberToDayName: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };

    setPermissionForm({
      can_video_call: permission.can_video_call,
      can_voice_call: permission.can_voice_call,
      can_chat: permission.can_chat,
      can_theater: permission.can_theater,
      allowed_hours_start: permission.allowed_start_time || '',
      allowed_hours_end: permission.allowed_end_time || '',
      allowed_days: permission.allowed_days
        ? permission.allowed_days.map((num) => numberToDayName[num])
        : [],
    });
    setShowPermissionModal(true);
  }

  function toggleDay(day: string) {
    setPermissionForm((prev) => ({
      ...prev,
      allowed_days: prev.allowed_days.includes(day)
        ? prev.allowed_days.filter((d) => d !== day)
        : [...prev.allowed_days, day],
    }));
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/my-circle/accept-invite?token=${token}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
  }

  const childLoginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/my-circle/child?family=${familyFileId}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">My Circle</h1>
              <p className="text-sm text-gray-500">Manage communication rooms and contacts</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4 inline" />
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-3 bg-teal-100 rounded-xl">
              <UserPlus className="h-6 w-6 text-teal-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Invite Contact</h3>
              <p className="text-sm text-gray-500">Add someone to your circle</p>
            </div>
          </button>

          <button
            onClick={() => setShowChildSetupModal(true)}
            className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-3 bg-purple-100 rounded-xl">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Setup Child</h3>
              <p className="text-sm text-gray-500">Create child login account</p>
            </div>
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(childLoginUrl);
              alert('Child login link copied!');
            }}
            className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-3 bg-blue-100 rounded-xl">
              <QrCode className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Child Login Link</h3>
              <p className="text-sm text-gray-500">Copy link for child device</p>
            </div>
          </button>
        </div>

        {/* Rooms Grid */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Communication Rooms</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`relative rounded-xl border-2 p-4 transition-all ${
                  room.is_assigned
                    ? ROOM_COLORS[(room.room_number - 1) % ROOM_COLORS.length]
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                {/* Room Number */}
                <div className="absolute top-2 right-2 w-6 h-6 bg-white/50 rounded-full flex items-center justify-center text-xs font-bold">
                  {room.room_number}
                </div>

                {room.is_assigned ? (
                  <>
                    <div className="text-3xl mb-2">
                      {room.room_type === 'parent_a' ? '👩' :
                       room.room_type === 'parent_b' ? '👨' :
                       room.assigned_contact_relationship ? (
                         { grandparent: '👴', aunt: '👩', uncle: '👨', cousin: '🧒', family_friend: '🤗', godparent: '💝', step_parent: '💕', sibling: '👦', therapist: '🧠', tutor: '📚', coach: '⚽' }[room.assigned_contact_relationship] || '💜'
                       ) : '💜'}
                    </div>
                    <h3 className="font-semibold truncate">{room.room_name || room.assigned_contact_name}</h3>
                    <p className="text-xs opacity-75 capitalize">
                      {room.room_type?.replace('_', ' ') || room.assigned_contact_relationship?.replace('_', ' ')}
                    </p>

                    {/* Room type indicator */}
                    {room.room_type === 'circle' && (
                      <div className="flex gap-1 mt-2">
                        <Settings className="h-3 w-3 opacity-50" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-2">
                    <div className="text-2xl mb-2">🏠</div>
                    <p className="text-sm">Empty Room</p>
                    <button
                      onClick={() => {
                        setInviteRoomNumber(room.room_number);
                        setShowInviteModal(true);
                      }}
                      className="mt-2 text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 mx-auto"
                    >
                      <Plus className="h-3 w-3" />
                      Assign
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">How Rooms Work</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p className="mb-2"><strong>Rooms 1-2:</strong> Reserved for parents (auto-assigned)</p>
              <p><strong>Rooms 3-10:</strong> Available for grandparents, aunts, uncles, friends, etc.</p>
            </div>
            <div>
              <p className="mb-2">Each contact can have customized permissions for:</p>
              <div className="flex gap-4">
                <span className="flex items-center gap-1"><Video className="h-4 w-4" /> Video</span>
                <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> Voice</span>
                <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> Chat</span>
                <span className="flex items-center gap-1"><Film className="h-4 w-4" /> Theater</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {inviteSuccess ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Invitation Sent!</h2>
                  <p className="text-gray-500 mt-1">
                    An invitation has been sent to {inviteSuccess.email}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Or share this link directly:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/my-circle/accept-invite?token=${inviteSuccess.token}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => copyInviteLink(inviteSuccess.token)}
                      className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteSuccess(null);
                    setInviteEmail('');
                    setInviteContactName('');
                    setInviteRelationship('');
                  }}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Invite to Circle</h2>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      value={inviteContactName}
                      onChange={(e) => setInviteContactName(e.target.value)}
                      placeholder="e.g., Grandma Susan"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    <select
                      value={inviteRelationship}
                      onChange={(e) => setInviteRelationship(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select relationship...</option>
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number
                    </label>
                    <select
                      value={inviteRoomNumber}
                      onChange={(e) => setInviteRoomNumber(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const room = rooms.find((r) => r.room_number === num);
                        return (
                          <option key={num} value={num} disabled={room?.is_assigned}>
                            Room {num} {room?.is_assigned ? `(${room.room_name || 'Occupied'})` : '(Available)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInvite}
                    disabled={isInviting}
                    className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isInviting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5" />
                        Send Invite
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && editingPermission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Edit Permissions</h2>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Communication Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Communication Types
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'can_video_call', icon: Video, label: 'Video Calls', color: 'green' },
                    { key: 'can_voice_call', icon: Phone, label: 'Voice Calls', color: 'blue' },
                    { key: 'can_chat', icon: MessageCircle, label: 'Chat', color: 'purple' },
                    { key: 'can_theater', icon: Film, label: 'Watch Together', color: 'orange' },
                  ].map(({ key, icon: Icon, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setPermissionForm((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                        permissionForm[key as keyof typeof permissionForm]
                          ? `bg-${color}-100 border-${color}-300 text-${color}-700`
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Allowed Hours (optional)
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="time"
                    value={permissionForm.allowed_hours_start}
                    onChange={(e) => setPermissionForm((prev) => ({ ...prev, allowed_hours_start: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={permissionForm.allowed_hours_end}
                    onChange={(e) => setPermissionForm((prev) => ({ ...prev, allowed_hours_end: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave blank for no time restriction</p>
              </div>

              {/* Day Restrictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Allowed Days (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        permissionForm.allowed_days.includes(day)
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {day.slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave all unselected for no day restriction</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePermission}
                disabled={isSavingPermission}
                className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingPermission ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Child Setup Modal */}
      {showChildSetupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Setup Child Account</h2>
              <button
                onClick={() => setShowChildSetupModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Child
                </label>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select a child...</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Child&apos;s Username
                </label>
                <input
                  type="text"
                  value={childSetupName}
                  onChange={(e) => setChildSetupName(e.target.value)}
                  placeholder="e.g., Emma"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={childSetupPin}
                  onChange={(e) => setChildSetupPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-500 mt-1">Make it easy for your child to remember</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { id: 'lion', emoji: '🦁' },
                    { id: 'panda', emoji: '🐼' },
                    { id: 'unicorn', emoji: '🦄' },
                    { id: 'bear', emoji: '🐻' },
                    { id: 'cat', emoji: '🐱' },
                    { id: 'dog', emoji: '🐶' },
                    { id: 'rabbit', emoji: '🐰' },
                    { id: 'fox', emoji: '🦊' },
                    { id: 'koala', emoji: '🐨' },
                    { id: 'penguin', emoji: '🐧' },
                    { id: 'monkey', emoji: '🐵' },
                    { id: 'dragon', emoji: '🐉' },
                  ].map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => setChildSetupAvatar(avatar.id)}
                      className={`p-2 text-2xl rounded-xl border-2 ${
                        childSetupAvatar === avatar.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {avatar.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowChildSetupModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSetupChildUser}
                disabled={isSettingUpChild}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSettingUpChild ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
