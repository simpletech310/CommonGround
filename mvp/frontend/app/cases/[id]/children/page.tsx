'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { childrenAPI, ChildProfileBasic } from '@/lib/api';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending_approval: {
    label: 'Pending Approval',
    className: 'bg-yellow-100 text-yellow-800',
  },
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-500',
  },
};

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

export default function ChildrenListPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildProfileBasic[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadChildren();
  }, [caseId, showArchived]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await childrenAPI.listForCase(caseId, true, showArchived);
      setChildren(response.children);
    } catch (err: any) {
      setError(err.message || 'Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (childId: string) => {
    try {
      await childrenAPI.approve(childId);
      loadChildren();
    } catch (err: any) {
      setError(err.message || 'Failed to approve child profile');
    }
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

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Children</h1>
          <p className="text-gray-500">
            Manage child profiles for this case
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
          <Button onClick={() => router.push(`/cases/${caseId}/children/new`)}>
            + Add Child
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {/* Children List */}
      {children.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👶</div>
              <h3 className="text-lg font-semibold mb-2">No Children Added Yet</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Add your children to this case to track their information, schedules, and belongings in one place.
              </p>
              <Button onClick={() => router.push(`/cases/${caseId}/children/new`)}>
                Add First Child
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {children.map((child) => {
            const statusInfo = STATUS_BADGES[child.status] || STATUS_BADGES.active;
            const age = calculateAge(child.date_of_birth);
            const isPending = child.status === 'pending_approval';

            return (
              <Card
                key={child.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  child.status === 'archived' ? 'opacity-60' : ''
                }`}
                onClick={() => router.push(`/cases/${caseId}/children/${child.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Profile Photo */}
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {child.photo_url ? (
                        <img
                          src={child.photo_url}
                          alt={`${child.first_name}'s photo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>

                    {/* Child Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">
                          {child.first_name} {child.last_name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        {age} years old
                        {child.school_name && ` • ${child.school_name}`}
                        {child.grade_level && `, ${child.grade_level}`}
                      </p>
                      {isPending && (
                        <p className="text-sm text-yellow-600 mt-1">
                          Awaiting approval from co-parent
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {isPending && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(child.id)}
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/cases/${caseId}/children/${child.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">About Child Profiles</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Both parents can contribute information to create a complete profile</li>
            <li>• New profiles require approval from the other parent before becoming active</li>
            <li>• Track medical info, school details, preferences, and more</li>
            <li>• All changes are logged for court documentation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
