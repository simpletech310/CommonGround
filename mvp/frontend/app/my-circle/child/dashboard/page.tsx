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
  Heart,
  Star,
} from 'lucide-react';
import { ChildContact, kidcomsAPI, ChildSessionCreate } from '@/lib/api';

const ROOM_COLORS = [
  'from-red-400 to-pink-500',
  'from-orange-400 to-red-500',
  'from-yellow-400 to-orange-500',
  'from-green-400 to-teal-500',
  'from-teal-400 to-cyan-500',
  'from-blue-400 to-indigo-500',
  'from-indigo-400 to-purple-500',
  'from-purple-400 to-pink-500',
  'from-pink-400 to-rose-500',
  'from-rose-400 to-red-500',
];

const RELATIONSHIP_EMOJIS: Record<string, string> = {
  parent_a: '👩',
  parent_b: '👨',
  grandparent: '👴',
  aunt: '👩',
  uncle: '👨',
  cousin: '🧒',
  family_friend: '🤗',
  godparent: '💝',
  step_parent: '💕',
  sibling: '👦',
  therapist: '🧠',
  tutor: '📚',
  coach: '⚽',
  other: '💜',
};

interface ChildUserData {
  userId: string;
  childId: string;
  childName: string;
  avatarId?: string;
  familyFileId: string;
}

export default function ChildDashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<ChildUserData | null>(null);
  const [contacts, setContacts] = useState<ChildContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChildContact | null>(null);
  const [isStartingCall, setIsStartingCall] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  function loadUserData() {
    try {
      const token = localStorage.getItem('child_token');
      const userStr = localStorage.getItem('child_user');

      if (!token || !userStr) {
        router.push('/my-circle/child');
        return;
      }

      const user = JSON.parse(userStr) as ChildUserData;
      setUserData(user);

      // Load contacts from stored login response
      const storedContacts = localStorage.getItem('child_contacts');
      if (storedContacts) {
        setContacts(JSON.parse(storedContacts));
      }

      // Mock contacts for demo (would come from login response)
      if (!storedContacts) {
        setContacts([
          {
            contact_id: '1',
            contact_type: 'parent_a',
            display_name: 'Mom',
            room_number: 1,
            can_video_call: true,
            can_voice_call: true,
            can_chat: true,
            can_theater: true,
          },
          {
            contact_id: '2',
            contact_type: 'parent_b',
            display_name: 'Dad',
            room_number: 2,
            can_video_call: true,
            can_voice_call: true,
            can_chat: true,
            can_theater: true,
          },
        ]);
      }

      setIsLoading(false);
    } catch {
      router.push('/my-circle/child');
    }
  }

  function handleLogout() {
    localStorage.removeItem('child_token');
    localStorage.removeItem('child_user');
    localStorage.removeItem('child_contacts');
    router.push('/my-circle/child');
  }

  async function handleStartCall(contact: ChildContact, type: 'video' | 'voice') {
    setIsStartingCall(true);
    try {
      // Create session via API
      const sessionData: ChildSessionCreate = {
        contact_type: contact.contact_type,
        contact_id: contact.contact_id,
        session_type: type === 'video' ? 'video_call' : 'voice_call',
      };

      const response = await kidcomsAPI.createChildSession(sessionData);

      // Store session info for the call page
      localStorage.setItem('child_call_session', JSON.stringify({
        sessionId: response.session_id,
        roomUrl: response.room_url,
        token: response.token,
        participantName: response.participant_name,
        contactName: contact.display_name,
        callType: type,
      }));

      // Redirect to the call page
      router.push(`/my-circle/child/call?session=${response.session_id}`);
    } catch (error) {
      console.error('Failed to start call:', error);
      alert(error instanceof Error ? error.message : 'Failed to start call. Please try again.');
      setIsStartingCall(false);
      setSelectedContact(null);
    }
  }

  function getEmoji(contact: ChildContact) {
    return RELATIONSHIP_EMOJIS[contact.relationship || contact.contact_type] || '💜';
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400">
      {/* Header */}
      <header className="bg-white/20 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">
              {userData?.avatarId ? (
                RELATIONSHIP_EMOJIS[userData.avatarId] || '🦄'
              ) : (
                '🦄'
              )}
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">Hi {userData?.childName}!</h1>
              <p className="text-white/80 text-sm">Who do you want to call?</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Rooms Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Contact Rooms */}
          {contacts.map((contact, index) => (
            <button
              key={contact.contact_id}
              onClick={() => setSelectedContact(contact)}
              className={`relative bg-gradient-to-br ${ROOM_COLORS[contact.room_number % ROOM_COLORS.length]} rounded-3xl p-6 text-white shadow-lg hover:scale-105 transition-transform aspect-square flex flex-col items-center justify-center`}
            >
              {/* Room Number Badge */}
              <div className="absolute top-2 right-2 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center text-xs font-bold">
                {contact.room_number}
              </div>

              {/* Avatar */}
              <div className="text-5xl mb-2">{getEmoji(contact)}</div>

              {/* Name */}
              <span className="font-bold text-lg">{contact.display_name}</span>

              {/* Relationship */}
              {contact.relationship && (
                <span className="text-white/80 text-xs capitalize mt-1">
                  {contact.relationship.replace('_', ' ')}
                </span>
              )}

              {/* Online Indicator (mock) */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs">Online</span>
              </div>
            </button>
          ))}

          {/* Empty Rooms */}
          {Array.from({ length: Math.max(0, 10 - contacts.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="bg-white/20 rounded-3xl p-6 aspect-square flex flex-col items-center justify-center text-white/40"
            >
              <div className="text-4xl mb-2">🏠</div>
              <span className="text-sm">Empty Room</span>
              <span className="text-xs mt-1">Room {contacts.length + i + 1}</span>
            </div>
          ))}
        </div>

        {/* Fun Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-white text-center">
            <Heart className="h-8 w-8 mx-auto mb-2 text-pink-200" />
            <div className="text-2xl font-bold">{contacts.length}</div>
            <div className="text-sm text-white/80">People in My Circle</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-white text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-200" />
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-white/80">Calls This Week</div>
          </div>
        </div>
      </main>

      {/* Call Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center animate-in zoom-in-95">
            {/* Avatar */}
            <div className="text-7xl mb-4">{getEmoji(selectedContact)}</div>

            {/* Name */}
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {selectedContact.display_name}
            </h2>
            {selectedContact.relationship && (
              <p className="text-gray-500 capitalize mb-6">
                {selectedContact.relationship.replace('_', ' ')}
              </p>
            )}

            {/* Call Options */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {selectedContact.can_video_call && (
                <button
                  onClick={() => handleStartCall(selectedContact, 'video')}
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
              {selectedContact.can_voice_call && (
                <button
                  onClick={() => handleStartCall(selectedContact, 'voice')}
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
              {selectedContact.can_chat && (
                <button
                  disabled
                  className="p-3 bg-purple-100 rounded-xl opacity-50"
                  title="Coming soon!"
                >
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </button>
              )}
              {selectedContact.can_theater && (
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
              onClick={() => setSelectedContact(null)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 font-semibold transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/20 backdrop-blur-sm p-4 text-center text-white/60 text-sm">
        Need help? Find a grown-up! 💜
      </footer>
    </div>
  );
}
