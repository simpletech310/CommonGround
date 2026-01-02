'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { childrenAPI, ChildProfile } from '@/lib/api';

const TABS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'medical', label: 'Medical' },
  { id: 'education', label: 'Education' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'emergency', label: 'Emergency' },
];

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function ChildProfilePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const childId = params.childId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [editMode, setEditMode] = useState(false);

  // Form states for each section
  const [basicForm, setBasicForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    preferred_name: '',
    date_of_birth: '',
    gender: '',
  });

  const [medicalForm, setMedicalForm] = useState({
    allergies: '',
    medications: '',
    medical_conditions: '',
    blood_type: '',
    pediatrician_name: '',
    pediatrician_phone: '',
    dentist_name: '',
    dentist_phone: '',
    therapist_name: '',
    therapist_phone: '',
    insurance_provider: '',
    insurance_policy_number: '',
  });

  const [educationForm, setEducationForm] = useState({
    school_name: '',
    school_phone: '',
    grade_level: '',
    teacher_name: '',
    teacher_email: '',
    has_iep: false,
    has_504_plan: false,
    education_notes: '',
  });

  const [preferencesForm, setPreferencesForm] = useState({
    favorite_foods: '',
    food_dislikes: '',
    favorite_activities: '',
    comfort_items: '',
    bedtime_routine: '',
    clothing_size: '',
    shoe_size: '',
    temperament_notes: '',
    fears_anxieties: '',
    calming_strategies: '',
  });

  const [emergencyForm, setEmergencyForm] = useState({
    emergency_contacts: [] as { name: string; relationship: string; phone: string }[],
  });

  useEffect(() => {
    loadChild();
  }, [childId]);

  const loadChild = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await childrenAPI.get(childId);
      setChild(data);

      // Populate forms
      setBasicForm({
        first_name: data.first_name || '',
        middle_name: data.middle_name || '',
        last_name: data.last_name || '',
        preferred_name: data.preferred_name || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || '',
      });

      setMedicalForm({
        allergies: data.allergies || '',
        medications: data.medications || '',
        medical_conditions: data.medical_conditions || '',
        blood_type: data.blood_type || '',
        pediatrician_name: data.pediatrician_name || '',
        pediatrician_phone: data.pediatrician_phone || '',
        dentist_name: data.dentist_name || '',
        dentist_phone: data.dentist_phone || '',
        therapist_name: data.therapist_name || '',
        therapist_phone: data.therapist_phone || '',
        insurance_provider: data.insurance_provider || '',
        insurance_policy_number: data.insurance_policy_number || '',
      });

      setEducationForm({
        school_name: data.school_name || '',
        school_phone: data.school_phone || '',
        grade_level: data.grade_level || '',
        teacher_name: data.teacher_name || '',
        teacher_email: data.teacher_email || '',
        has_iep: data.has_iep || false,
        has_504_plan: data.has_504_plan || false,
        education_notes: data.education_notes || '',
      });

      setPreferencesForm({
        favorite_foods: data.favorite_foods || '',
        food_dislikes: data.food_dislikes || '',
        favorite_activities: data.favorite_activities || '',
        comfort_items: data.comfort_items || '',
        bedtime_routine: data.bedtime_routine || '',
        clothing_size: data.clothing_size || '',
        shoe_size: data.shoe_size || '',
        temperament_notes: data.temperament_notes || '',
        fears_anxieties: data.fears_anxieties || '',
        calming_strategies: data.calming_strategies || '',
      });

      if (data.emergency_contacts) {
        try {
          const contacts = typeof data.emergency_contacts === 'string'
            ? JSON.parse(data.emergency_contacts)
            : data.emergency_contacts;
          setEmergencyForm({ emergency_contacts: contacts });
        } catch {
          setEmergencyForm({ emergency_contacts: [] });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load child profile');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setSaving(true);
      setError(null);
      await childrenAPI.approve(childId);
      setSuccess('Profile approved successfully!');
      loadChild();
    } catch (err: any) {
      setError(err.message || 'Failed to approve profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBasic = async () => {
    try {
      setSaving(true);
      setError(null);
      await childrenAPI.updateBasic(childId, basicForm);
      setSuccess('Basic information saved!');
      setEditMode(false);
      loadChild();
    } catch (err: any) {
      setError(err.message || 'Failed to save basic information');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMedical = async () => {
    try {
      setSaving(true);
      setError(null);
      await childrenAPI.updateMedical(childId, medicalForm);
      setSuccess('Medical information saved!');
      setEditMode(false);
      loadChild();
    } catch (err: any) {
      setError(err.message || 'Failed to save medical information');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEducation = async () => {
    try {
      setSaving(true);
      setError(null);
      await childrenAPI.updateEducation(childId, educationForm);
      setSuccess('Education information saved!');
      setEditMode(false);
      loadChild();
    } catch (err: any) {
      setError(err.message || 'Failed to save education information');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      await childrenAPI.updatePreferences(childId, preferencesForm);
      setSuccess('Preferences saved!');
      setEditMode(false);
      loadChild();
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmergency = async () => {
    try {
      setSaving(true);
      setError(null);
      await childrenAPI.updateEmergencyContacts(childId, emergencyForm);
      setSuccess('Emergency contacts saved!');
      setEditMode(false);
      loadChild();
    } catch (err: any) {
      setError(err.message || 'Failed to save emergency contacts');
    } finally {
      setSaving(false);
    }
  };

  const addEmergencyContact = () => {
    setEmergencyForm({
      emergency_contacts: [
        ...emergencyForm.emergency_contacts,
        { name: '', relationship: '', phone: '' },
      ],
    });
  };

  const removeEmergencyContact = (index: number) => {
    const contacts = [...emergencyForm.emergency_contacts];
    contacts.splice(index, 1);
    setEmergencyForm({ emergency_contacts: contacts });
  };

  const updateEmergencyContact = (index: number, field: string, value: string) => {
    const contacts = [...emergencyForm.emergency_contacts];
    contacts[index] = { ...contacts[index], [field]: value };
    setEmergencyForm({ emergency_contacts: contacts });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Child not found'}</p>
              <Button onClick={() => router.push(`/cases/${caseId}/children`)}>
                Back to Children
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = child.status === 'pending_approval';
  const age = calculateAge(child.date_of_birth);

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/cases/${caseId}/children`)}
        >
          &larr; Back to Children
        </Button>
      </div>

      {/* Pending Approval Banner */}
      {isPending && (
        <Card className="mb-6 bg-yellow-50 border-yellow-300">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="text-2xl">⏳</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Pending Approval</h3>
                <p className="text-sm text-yellow-800 mb-4">
                  This profile is awaiting approval from the other parent.
                  Once both parents approve, the profile will become active and
                  both parents can add additional information.
                </p>
                <Button onClick={handleApprove} disabled={saving}>
                  {saving ? 'Approving...' : 'Approve This Profile'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            {/* Profile Photo */}
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {child.photo_url ? (
                <img
                  src={child.photo_url}
                  alt={`${child.first_name}'s photo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {child.preferred_name || child.first_name} {child.last_name}
                </h1>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    child.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : child.status === 'pending_approval'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {child.status === 'active'
                    ? 'Active'
                    : child.status === 'pending_approval'
                    ? 'Pending Approval'
                    : 'Archived'}
                </span>
              </div>
              <p className="text-gray-600">
                {age} years old
                {child.school_name && ` • ${child.school_name}`}
                {child.grade_level && `, ${child.grade_level}`}
              </p>
              {child.preferred_name && child.preferred_name !== child.first_name && (
                <p className="text-sm text-gray-500">
                  Full name: {child.first_name} {child.middle_name} {child.last_name}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            {child.status === 'active' && (
              <div className="ml-auto">
                <Button
                  onClick={() => router.push(`/cases/${caseId}/children/${childId}/cubbie`)}
                >
                  📦 {child.first_name}'s Cubbie
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setEditMode(false);
              setError(null);
              setSuccess(null);
            }}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Basic Information</h2>
                {!editMode && child.status === 'active' && (
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                )}
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={basicForm.first_name}
                        onChange={(e) =>
                          setBasicForm({ ...basicForm, first_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Middle Name</Label>
                      <Input
                        value={basicForm.middle_name}
                        onChange={(e) =>
                          setBasicForm({ ...basicForm, middle_name: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={basicForm.last_name}
                      onChange={(e) =>
                        setBasicForm({ ...basicForm, last_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Name</Label>
                    <Input
                      value={basicForm.preferred_name}
                      onChange={(e) =>
                        setBasicForm({ ...basicForm, preferred_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={basicForm.date_of_birth}
                      onChange={(e) =>
                        setBasicForm({ ...basicForm, date_of_birth: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <select
                      value={basicForm.gender}
                      onChange={(e) =>
                        setBasicForm({ ...basicForm, gender: e.target.value })
                      }
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non_binary">Non-binary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveBasic} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">First Name</Label>
                      <p>{child.first_name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Middle Name</Label>
                      <p>{child.middle_name || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Last Name</Label>
                    <p>{child.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Preferred Name</Label>
                    <p>{child.preferred_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Date of Birth</Label>
                    <p>
                      {new Date(child.date_of_birth).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Gender</Label>
                    <p>{child.gender || 'Not specified'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medical Tab */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Medical Information</h2>
                {!editMode && child.status === 'active' && (
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                )}
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Allergies</Label>
                    <textarea
                      value={medicalForm.allergies}
                      onChange={(e) =>
                        setMedicalForm({ ...medicalForm, allergies: e.target.value })
                      }
                      className="w-full p-2 border rounded-md min-h-[80px]"
                      placeholder="List any allergies (food, medication, environmental)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Medications</Label>
                    <textarea
                      value={medicalForm.medications}
                      onChange={(e) =>
                        setMedicalForm({ ...medicalForm, medications: e.target.value })
                      }
                      className="w-full p-2 border rounded-md min-h-[80px]"
                      placeholder="List any medications and dosages"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Medical Conditions</Label>
                    <textarea
                      value={medicalForm.medical_conditions}
                      onChange={(e) =>
                        setMedicalForm({ ...medicalForm, medical_conditions: e.target.value })
                      }
                      className="w-full p-2 border rounded-md min-h-[80px]"
                      placeholder="Any ongoing medical conditions or health concerns"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Blood Type</Label>
                      <select
                        value={medicalForm.blood_type}
                        onChange={(e) =>
                          setMedicalForm({ ...medicalForm, blood_type: e.target.value })
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">Unknown</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                  <h3 className="font-medium pt-4">Healthcare Providers</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pediatrician Name</Label>
                      <Input
                        value={medicalForm.pediatrician_name}
                        onChange={(e) =>
                          setMedicalForm({ ...medicalForm, pediatrician_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pediatrician Phone</Label>
                      <Input
                        value={medicalForm.pediatrician_phone}
                        onChange={(e) =>
                          setMedicalForm({ ...medicalForm, pediatrician_phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Dentist Name</Label>
                      <Input
                        value={medicalForm.dentist_name}
                        onChange={(e) =>
                          setMedicalForm({ ...medicalForm, dentist_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dentist Phone</Label>
                      <Input
                        value={medicalForm.dentist_phone}
                        onChange={(e) =>
                          setMedicalForm({ ...medicalForm, dentist_phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Therapist/Counselor Name</Label>
                      <Input
                        value={medicalForm.therapist_name}
                        onChange={(e) =>
                          setMedicalForm({ ...medicalForm, therapist_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Therapist/Counselor Phone</Label>
                      <Input
                        value={medicalForm.therapist_phone}
                        onChange={(e) =>
                          setMedicalForm({ ...medicalForm, therapist_phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <h3 className="font-medium pt-4">Insurance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Insurance Provider</Label>
                      <Input
                        value={medicalForm.insurance_provider}
                        onChange={(e) =>
                          setMedicalForm({ ...medicalForm, insurance_provider: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Policy Number</Label>
                      <Input
                        value={medicalForm.insurance_policy_number}
                        onChange={(e) =>
                          setMedicalForm({ ...medicalForm, insurance_policy_number: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveMedical} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-500">Allergies</Label>
                    <p>{child.allergies || 'None reported'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Medications</Label>
                    <p>{child.medications || 'None'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Medical Conditions</Label>
                    <p>{child.medical_conditions || 'None reported'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Blood Type</Label>
                    <p>{child.blood_type || 'Unknown'}</p>
                  </div>
                  <h3 className="font-medium pt-4">Healthcare Providers</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Pediatrician</Label>
                      <p>{child.pediatrician_name || '-'}</p>
                      <p className="text-sm text-gray-500">{child.pediatrician_phone}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Dentist</Label>
                      <p>{child.dentist_name || '-'}</p>
                      <p className="text-sm text-gray-500">{child.dentist_phone}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Therapist/Counselor</Label>
                    <p>{child.therapist_name || '-'}</p>
                    <p className="text-sm text-gray-500">{child.therapist_phone}</p>
                  </div>
                  <h3 className="font-medium pt-4">Insurance</h3>
                  <div>
                    <Label className="text-gray-500">Provider</Label>
                    <p>{child.insurance_provider || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Policy Number</Label>
                    <p>{child.insurance_policy_number || '-'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Education</h2>
                {!editMode && child.status === 'active' && (
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                )}
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>School Name</Label>
                      <Input
                        value={educationForm.school_name}
                        onChange={(e) =>
                          setEducationForm({ ...educationForm, school_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>School Phone</Label>
                      <Input
                        value={educationForm.school_phone}
                        onChange={(e) =>
                          setEducationForm({ ...educationForm, school_phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Grade Level</Label>
                    <Input
                      value={educationForm.grade_level}
                      onChange={(e) =>
                        setEducationForm({ ...educationForm, grade_level: e.target.value })
                      }
                      placeholder="e.g., 3rd Grade, Kindergarten"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Teacher Name</Label>
                      <Input
                        value={educationForm.teacher_name}
                        onChange={(e) =>
                          setEducationForm({ ...educationForm, teacher_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teacher Email</Label>
                      <Input
                        type="email"
                        value={educationForm.teacher_email}
                        onChange={(e) =>
                          setEducationForm({ ...educationForm, teacher_email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="has_iep"
                        checked={educationForm.has_iep}
                        onChange={(e) =>
                          setEducationForm({ ...educationForm, has_iep: e.target.checked })
                        }
                      />
                      <Label htmlFor="has_iep">Has IEP (Individualized Education Program)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="has_504"
                        checked={educationForm.has_504_plan}
                        onChange={(e) =>
                          setEducationForm({ ...educationForm, has_504_plan: e.target.checked })
                        }
                      />
                      <Label htmlFor="has_504">Has 504 Plan</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Education Notes</Label>
                    <textarea
                      value={educationForm.education_notes}
                      onChange={(e) =>
                        setEducationForm({ ...educationForm, education_notes: e.target.value })
                      }
                      className="w-full p-2 border rounded-md min-h-[80px]"
                      placeholder="Any additional notes about education"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEducation} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-500">School</Label>
                    <p>{child.school_name || '-'}</p>
                    <p className="text-sm text-gray-500">{child.school_phone}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Grade Level</Label>
                    <p>{child.grade_level || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Teacher</Label>
                    <p>{child.teacher_name || '-'}</p>
                    <p className="text-sm text-gray-500">{child.teacher_email}</p>
                  </div>
                  <div className="flex gap-4">
                    {child.has_iep && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                        Has IEP
                      </span>
                    )}
                    {child.has_504_plan && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
                        Has 504 Plan
                      </span>
                    )}
                  </div>
                  {child.education_notes && (
                    <div>
                      <Label className="text-gray-500">Notes</Label>
                      <p>{child.education_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Preferences & Personality</h2>
                {!editMode && child.status === 'active' && (
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                )}
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <h3 className="font-medium">Food</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Favorite Foods</Label>
                      <textarea
                        value={preferencesForm.favorite_foods}
                        onChange={(e) =>
                          setPreferencesForm({ ...preferencesForm, favorite_foods: e.target.value })
                        }
                        className="w-full p-2 border rounded-md min-h-[60px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Food Dislikes</Label>
                      <textarea
                        value={preferencesForm.food_dislikes}
                        onChange={(e) =>
                          setPreferencesForm({ ...preferencesForm, food_dislikes: e.target.value })
                        }
                        className="w-full p-2 border rounded-md min-h-[60px]"
                      />
                    </div>
                  </div>
                  <h3 className="font-medium pt-2">Activities & Comfort</h3>
                  <div className="space-y-2">
                    <Label>Favorite Activities</Label>
                    <textarea
                      value={preferencesForm.favorite_activities}
                      onChange={(e) =>
                        setPreferencesForm({ ...preferencesForm, favorite_activities: e.target.value })
                      }
                      className="w-full p-2 border rounded-md min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Comfort Items</Label>
                    <textarea
                      value={preferencesForm.comfort_items}
                      onChange={(e) =>
                        setPreferencesForm({ ...preferencesForm, comfort_items: e.target.value })
                      }
                      className="w-full p-2 border rounded-md min-h-[60px]"
                      placeholder="Special toys, blankets, or items that help them feel secure"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bedtime Routine</Label>
                    <textarea
                      value={preferencesForm.bedtime_routine}
                      onChange={(e) =>
                        setPreferencesForm({ ...preferencesForm, bedtime_routine: e.target.value })
                      }
                      className="w-full p-2 border rounded-md min-h-[60px]"
                    />
                  </div>
                  <h3 className="font-medium pt-2">Sizes</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Clothing Size</Label>
                      <Input
                        value={preferencesForm.clothing_size}
                        onChange={(e) =>
                          setPreferencesForm({ ...preferencesForm, clothing_size: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Shoe Size</Label>
                      <Input
                        value={preferencesForm.shoe_size}
                        onChange={(e) =>
                          setPreferencesForm({ ...preferencesForm, shoe_size: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <h3 className="font-medium pt-2">Temperament & Emotional Needs</h3>
                  <div className="space-y-2">
                    <Label>Temperament Notes</Label>
                    <textarea
                      value={preferencesForm.temperament_notes}
                      onChange={(e) =>
                        setPreferencesForm({ ...preferencesForm, temperament_notes: e.target.value })
                      }
                      className="w-full p-2 border rounded-md min-h-[60px]"
                      placeholder="General personality traits and tendencies"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fears & Anxieties</Label>
                    <textarea
                      value={preferencesForm.fears_anxieties}
                      onChange={(e) =>
                        setPreferencesForm({ ...preferencesForm, fears_anxieties: e.target.value })
                      }
                      className="w-full p-2 border rounded-md min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Calming Strategies</Label>
                    <textarea
                      value={preferencesForm.calming_strategies}
                      onChange={(e) =>
                        setPreferencesForm({ ...preferencesForm, calming_strategies: e.target.value })
                      }
                      className="w-full p-2 border rounded-md min-h-[60px]"
                      placeholder="What helps them calm down when upset"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSavePreferences} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-medium">Food</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Favorite Foods</Label>
                      <p>{child.favorite_foods || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Food Dislikes</Label>
                      <p>{child.food_dislikes || '-'}</p>
                    </div>
                  </div>
                  <h3 className="font-medium pt-2">Activities & Comfort</h3>
                  <div>
                    <Label className="text-gray-500">Favorite Activities</Label>
                    <p>{child.favorite_activities || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Comfort Items</Label>
                    <p>{child.comfort_items || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Bedtime Routine</Label>
                    <p>{child.bedtime_routine || '-'}</p>
                  </div>
                  <h3 className="font-medium pt-2">Sizes</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Clothing</Label>
                      <p>{child.clothing_size || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Shoes</Label>
                      <p>{child.shoe_size || '-'}</p>
                    </div>
                  </div>
                  <h3 className="font-medium pt-2">Temperament & Emotional Needs</h3>
                  <div>
                    <Label className="text-gray-500">Temperament</Label>
                    <p>{child.temperament_notes || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Fears & Anxieties</Label>
                    <p>{child.fears_anxieties || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Calming Strategies</Label>
                    <p>{child.calming_strategies || '-'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Emergency Tab */}
          {activeTab === 'emergency' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Emergency Contacts</h2>
                {!editMode && child.status === 'active' && (
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                )}
              </div>

              {editMode ? (
                <div className="space-y-4">
                  {emergencyForm.emergency_contacts.map((contact, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">Contact {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => removeEmergencyContact(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={contact.name}
                            onChange={(e) =>
                              updateEmergencyContact(index, 'name', e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Relationship</Label>
                          <Input
                            value={contact.relationship}
                            onChange={(e) =>
                              updateEmergencyContact(index, 'relationship', e.target.value)
                            }
                            placeholder="e.g., Grandmother, Uncle"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={contact.phone}
                            onChange={(e) =>
                              updateEmergencyContact(index, 'phone', e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button variant="outline" onClick={addEmergencyContact}>
                    + Add Emergency Contact
                  </Button>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEmergency} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {emergencyForm.emergency_contacts.length > 0 ? (
                    emergencyForm.emergency_contacts.map((contact, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xl">👤</span>
                          </div>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-gray-500">{contact.relationship}</p>
                          </div>
                          <div className="ml-auto">
                            <p className="text-gray-600">{contact.phone}</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No emergency contacts added yet.</p>
                      {child.status === 'active' && (
                        <Button
                          variant="outline"
                          onClick={() => setEditMode(true)}
                          className="mt-4"
                        >
                          Add Emergency Contact
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
