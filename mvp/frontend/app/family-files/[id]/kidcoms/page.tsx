'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Video,
  Users,
  Settings,
  Plus,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  MessageCircle,
  Film,
  Gamepad2,
  PenTool,
  ChevronLeft,
} from 'lucide-react';
import {
  circleAPI,
  kidcomsAPI,
  familyFilesAPI,
  CircleContact,
  KidComsSession,
  KidComsSettings,
} from '@/lib/api';
import { IncomingCallBanner } from '@/components/kidcoms/incoming-call-banner';

interface Child {
  id: string;
  first_name: string;
  preferred_name?: string;
  photo_url?: string;
}

export default function KidComsPage() {
  const params = useParams();
  const router = useRouter();
  const familyFileId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [familyTitle, setFamilyTitle] = useState<string>('');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [contacts, setContacts] = useState<CircleContact[]>([]);
  const [sessions, setSessions] = useState<KidComsSession[]>([]);
  const [settings, setSettings] = useState<KidComsSettings | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);

  useEffect(() => {
    loadData();
  }, [familyFileId]);

  useEffect(() => {
    if (selectedChild && familyFileId) {
      loadChildData();
    }
  }, [selectedChild?.id]);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);

      const familyData = await familyFilesAPI.get(familyFileId);
      setFamilyTitle(familyData.title);
      setChildren(familyData.children || []);

      if (familyData.children && familyData.children.length > 0) {
        setSelectedChild(familyData.children[0]);
      }

      try {
        const settingsData = await kidcomsAPI.getSettings(familyFileId);
        setSettings(settingsData);
      } catch {
        // Settings may not exist yet
      }

      const sessionsData = await kidcomsAPI.listSessions(familyFileId, { limit: 10 });
      setSessions(sessionsData.items);
    } catch (err) {
      console.error('Error loading KidComs data:', err);
      setError('Failed to load KidComs data');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadChildData() {
    if (!selectedChild || !familyFileId) return;

    try {
      const contactsData = await circleAPI.list(familyFileId, {
        childId: selectedChild.id,
      });
      setContacts(contactsData.items);
    } catch (err) {
      console.error('Error loading child data:', err);
    }
  }

  async function startVideoCall(contactId?: string) {
    if (!selectedChild || !familyFileId) return;

    try {
      setIsStartingSession(true);
      const session = await kidcomsAPI.createSession({
        family_file_id: familyFileId,
        child_id: selectedChild.id,
        session_type: 'video_call',
        invited_contact_ids: contactId ? [contactId] : undefined,
      });

      router.push(`/family-files/${familyFileId}/kidcoms/session/${session.id}`);
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start video call');
    } finally {
      setIsStartingSession(false);
    }
  }

  function getSessionStatusIcon(status: string) {
    switch (status) {
      case 'active':
        return <Phone className="h-4 w-4 text-green-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-400" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  }

  function getSessionTypeIcon(type: string) {
    switch (type) {
      case 'theater':
        return <Film className="h-4 w-4" />;
      case 'arcade':
        return <Gamepad2 className="h-4 w-4" />;
      case 'whiteboard':
        return <PenTool className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Incoming Call Banner */}
      <IncomingCallBanner familyFileId={familyFileId} />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/family-files/${familyFileId}`)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">KidComs</h1>
                <p className="text-sm text-gray-500">{familyTitle}</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/family-files/${familyFileId}/kidcoms/settings`)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Child Selection & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Child Selector */}
            {children.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Select Child</h3>
                <div className="space-y-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChild(child)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        selectedChild?.id === child.id
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-semibold">
                        {(child.preferred_name || child.first_name)[0]}
                      </div>
                      <span className="font-medium text-gray-900">
                        {child.preferred_name || child.first_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => startVideoCall()}
                  disabled={!selectedChild || isStartingSession}
                  className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isStartingSession ? (
                    <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                  ) : (
                    <Video className="h-8 w-8 text-purple-600" />
                  )}
                  <span className="mt-2 text-sm font-medium text-purple-700">Video Call</span>
                </button>
                <button
                  disabled
                  className="flex flex-col items-center p-4 bg-gray-50 rounded-xl opacity-50 cursor-not-allowed"
                >
                  <MessageCircle className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm font-medium text-gray-500">Chat</span>
                </button>
                <button
                  disabled
                  className="flex flex-col items-center p-4 bg-gray-50 rounded-xl opacity-50 cursor-not-allowed"
                >
                  <Film className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm font-medium text-gray-500">Theater</span>
                </button>
                <button
                  disabled
                  className="flex flex-col items-center p-4 bg-gray-50 rounded-xl opacity-50 cursor-not-allowed"
                >
                  <Gamepad2 className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm font-medium text-gray-500">Arcade</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center Column - Circle Contacts */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">My Circle</h3>
                <button
                  onClick={() => router.push(`/family-files/${familyFileId}/kidcoms/circle`)}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Manage</span>
                </button>
              </div>

              {contacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No circle contacts yet</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Add trusted contacts to your circle
                  </p>
                  <button
                    onClick={() => router.push(`/family-files/${familyFileId}/kidcoms/circle`)}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                  >
                    Add Contacts
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-semibold">
                          {contact.contact_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{contact.contact_name}</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {contact.relationship_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {contact.can_communicate ? (
                          <button
                            onClick={() => startVideoCall(contact.id)}
                            disabled={isStartingSession}
                            className="p-2 bg-green-100 hover:bg-green-200 rounded-full transition-colors"
                          >
                            <Phone className="h-4 w-4 text-green-600" />
                          </button>
                        ) : (
                          <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Recent Sessions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h3>

              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No sessions yet</p>
                  <p className="text-sm text-gray-400">
                    Start a video call to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        if (session.status === 'active' || session.status === 'waiting') {
                          router.push(`/family-files/${familyFileId}/kidcoms/session/${session.id}`);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                        session.status === 'active' || session.status === 'waiting'
                          ? 'bg-purple-50 hover:bg-purple-100 cursor-pointer'
                          : 'bg-gray-50 cursor-default'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg">
                          {getSessionTypeIcon(session.session_type)}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            {session.title || 'Video Call'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {session.started_at
                              ? new Date(session.started_at).toLocaleDateString()
                              : 'Scheduled'}
                          </p>
                        </div>
                      </div>
                      {getSessionStatusIcon(session.status)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Feature Status */}
            {settings && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Features</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${settings.allowed_features.video ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-gray-600">Video</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${settings.allowed_features.chat ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-gray-600">Chat</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${settings.allowed_features.theater ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-gray-600">Theater</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${settings.allowed_features.arcade ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-gray-600">Arcade</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
