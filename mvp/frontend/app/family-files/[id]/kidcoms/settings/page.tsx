'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Settings,
  ChevronLeft,
  Loader2,
  Video,
  MessageCircle,
  Film,
  Gamepad2,
  PenTool,
  Bell,
  Clock,
  Users,
  Shield,
  Save,
} from 'lucide-react';
import { kidcomsAPI, familyFilesAPI, KidComsSettings, KidComsSettingsUpdate } from '@/lib/api';

export default function KidComsSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const familyFileId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [familyTitle, setFamilyTitle] = useState<string>('');
  const [settings, setSettings] = useState<KidComsSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, [familyFileId]);

  async function loadSettings() {
    try {
      setIsLoading(true);
      setError(null);

      const [settingsData, familyData] = await Promise.all([
        kidcomsAPI.getSettings(familyFileId),
        familyFilesAPI.get(familyFileId),
      ]);

      setSettings(settingsData);
      setFamilyTitle(familyData.title);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: KidComsSettingsUpdate = {
        circle_approval_mode: settings.circle_approval_mode,
        enforce_availability: settings.enforce_availability,
        require_parent_notification: settings.require_parent_notification,
        notify_on_session_start: settings.notify_on_session_start,
        notify_on_session_end: settings.notify_on_session_end,
        notify_on_aria_flag: settings.notify_on_aria_flag,
        allowed_features: settings.allowed_features,
        max_session_duration_minutes: settings.max_session_duration_minutes,
        max_daily_sessions: settings.max_daily_sessions,
        max_participants_per_session: settings.max_participants_per_session,
        require_parent_in_call: settings.require_parent_in_call,
        allow_child_to_initiate: settings.allow_child_to_initiate,
        record_sessions: settings.record_sessions,
      };

      const updated = await kidcomsAPI.updateSettings(familyFileId, updateData);
      setSettings(updated);
      setSuccess('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }

  function updateFeature(feature: keyof KidComsSettings['allowed_features'], value: boolean) {
    if (!settings) return;
    setSettings({
      ...settings,
      allowed_features: {
        ...settings.allowed_features,
        [feature]: value,
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/family-files/${familyFileId}/kidcoms`)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">KidComs Settings</h1>
                  <p className="text-sm text-gray-500">{familyTitle}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Circle Approval */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Circle Approval</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Control how circle contacts are approved for video calls
          </p>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="approval_mode"
                checked={settings.circle_approval_mode === 'both_parents'}
                onChange={() => setSettings({ ...settings, circle_approval_mode: 'both_parents' })}
                className="text-purple-600"
              />
              <div>
                <p className="font-medium text-gray-900">Both Parents Required</p>
                <p className="text-sm text-gray-500">Both parents must approve each contact</p>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="approval_mode"
                checked={settings.circle_approval_mode === 'either_parent'}
                onChange={() => setSettings({ ...settings, circle_approval_mode: 'either_parent' })}
                className="text-purple-600"
              />
              <div>
                <p className="font-medium text-gray-900">Either Parent</p>
                <p className="text-sm text-gray-500">One parent approval is sufficient</p>
              </div>
            </label>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Video className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Allowed Features</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Enable or disable KidComs features for your family
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'video', label: 'Video Calls', icon: Video },
              { key: 'chat', label: 'Chat', icon: MessageCircle },
              { key: 'theater', label: 'Theater', icon: Film },
              { key: 'arcade', label: 'Arcade', icon: Gamepad2 },
              { key: 'whiteboard', label: 'Whiteboard', icon: PenTool },
            ].map(({ key, label, icon: Icon }) => (
              <label
                key={key}
                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  settings.allowed_features[key as keyof typeof settings.allowed_features]
                    ? 'border-purple-500 bg-purple-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={settings.allowed_features[key as keyof typeof settings.allowed_features]}
                  onChange={(e) => updateFeature(key as keyof typeof settings.allowed_features, e.target.checked)}
                  className="text-purple-600 rounded"
                />
                <Icon className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Session Limits */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Session Limits</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Duration (minutes)
              </label>
              <input
                type="number"
                value={settings.max_session_duration_minutes}
                onChange={(e) => setSettings({ ...settings, max_session_duration_minutes: parseInt(e.target.value) || 60 })}
                min={15}
                max={180}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Daily Sessions
              </label>
              <input
                type="number"
                value={settings.max_daily_sessions}
                onChange={(e) => setSettings({ ...settings, max_daily_sessions: parseInt(e.target.value) || 5 })}
                min={1}
                max={20}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants
              </label>
              <input
                type="number"
                value={settings.max_participants_per_session}
                onChange={(e) => setSettings({ ...settings, max_participants_per_session: parseInt(e.target.value) || 4 })}
                min={2}
                max={10}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Parental Controls */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Parental Controls</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Allow Child to Initiate Calls</p>
                <p className="text-sm text-gray-500">Children can start video calls themselves</p>
              </div>
              <input
                type="checkbox"
                checked={settings.allow_child_to_initiate}
                onChange={(e) => setSettings({ ...settings, allow_child_to_initiate: e.target.checked })}
                className="text-purple-600 rounded h-5 w-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Require Parent in Call</p>
                <p className="text-sm text-gray-500">A parent must be present during calls</p>
              </div>
              <input
                type="checkbox"
                checked={settings.require_parent_in_call}
                onChange={(e) => setSettings({ ...settings, require_parent_in_call: e.target.checked })}
                className="text-purple-600 rounded h-5 w-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Record Sessions</p>
                <p className="text-sm text-gray-500">Automatically record all video sessions</p>
              </div>
              <input
                type="checkbox"
                checked={settings.record_sessions}
                onChange={(e) => setSettings({ ...settings, record_sessions: e.target.checked })}
                className="text-purple-600 rounded h-5 w-5"
              />
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Session Started</p>
                <p className="text-sm text-gray-500">Notify when a session begins</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notify_on_session_start}
                onChange={(e) => setSettings({ ...settings, notify_on_session_start: e.target.checked })}
                className="text-purple-600 rounded h-5 w-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Session Ended</p>
                <p className="text-sm text-gray-500">Notify when a session ends</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notify_on_session_end}
                onChange={(e) => setSettings({ ...settings, notify_on_session_end: e.target.checked })}
                className="text-purple-600 rounded h-5 w-5"
              />
            </label>
            <label className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">ARIA Flags</p>
                <p className="text-sm text-gray-500">Notify when ARIA flags a message</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notify_on_aria_flag}
                onChange={(e) => setSettings({ ...settings, notify_on_aria_flag: e.target.checked })}
                className="text-purple-600 rounded h-5 w-5"
              />
            </label>
          </div>
        </div>
      </main>
    </div>
  );
}
