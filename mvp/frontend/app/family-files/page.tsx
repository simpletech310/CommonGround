'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { familyFilesAPI, FamilyFile, FamilyFileInvitation } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { PageContainer, EmptyState } from '@/components/layout';
import {
  Plus,
  FolderHeart,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  FileText,
  Zap,
  Scale,
} from 'lucide-react';

function FamilyFilesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [familyFiles, setFamilyFiles] = useState<FamilyFile[]>([]);
  const [invitations, setInvitations] = useState<FamilyFileInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [filesResponse, invitationsResponse] = await Promise.all([
        familyFilesAPI.list(),
        familyFilesAPI.getInvitations(),
      ]);
      setFamilyFiles(filesResponse.items);
      setInvitations(invitationsResponse.items);
    } catch (err: any) {
      console.error('Failed to load family files:', err);
      setError(err.message || 'Failed to load family files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (id: string) => {
    try {
      setIsAccepting(id);
      await familyFilesAPI.acceptInvitation(id);
      await loadData();
      router.push(`/family-files/${id}`);
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setIsAccepting(null);
    }
  };

  const getStatusBadge = (status: string, isComplete: boolean) => {
    if (status === 'court_linked') {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Scale className="h-3 w-3 mr-1" />
          Court Linked
        </Badge>
      );
    }
    if (!isComplete) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending Co-Parent
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  const getRoleName = (role: string | null) => {
    if (!role) return 'Parent';
    switch (role) {
      case 'mother': return 'Mother';
      case 'father': return 'Father';
      case 'parent_a': return 'Parent A';
      case 'parent_b': return 'Parent B';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Family Files</h1>
          <p className="text-muted-foreground">
            Manage your family co-parenting arrangements
          </p>
        </div>
        <Button onClick={() => router.push('/family-files/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Family File
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Pending Invitations
          </h2>
          {invitations.map((invitation) => (
            <Card key={invitation.id} className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{invitation.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {invitation.family_file_number} - You're invited as {getRoleName(invitation.your_role)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    disabled={isAccepting === invitation.id}
                  >
                    {isAccepting === invitation.id ? 'Joining...' : 'Accept & Join'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Family Files List */}
      {familyFiles.length === 0 && invitations.length === 0 ? (
        <EmptyState
          icon={FolderHeart}
          title="No Family Files Yet"
          description="Create your first Family File to start managing your co-parenting arrangement. You can invite your co-parent to join."
          action={{
            label: "Create Family File",
            onClick: () => router.push('/family-files/new')
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {familyFiles.map((file) => (
            <Card
              key={file.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/family-files/${file.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FolderHeart className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{file.title}</CardTitle>
                  </div>
                  {getStatusBadge(file.status, file.is_complete)}
                </div>
                <CardDescription>{file.family_file_number}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Parents */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {getRoleName(file.parent_a_role)}
                      {file.parent_b_id && (
                        <span className="text-muted-foreground"> & {getRoleName(file.parent_b_role)}</span>
                      )}
                      {!file.parent_b_id && file.parent_b_email && (
                        <span className="text-muted-foreground"> (Invitation pending)</span>
                      )}
                    </span>
                  </div>

                  {/* Location */}
                  {file.state && (
                    <div className="text-sm text-muted-foreground">
                      {file.county && `${file.county}, `}{file.state}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 pt-2 border-t">
                    {file.has_court_case && (
                      <div className="flex items-center gap-1 text-xs text-purple-600">
                        <Scale className="h-3 w-3" />
                        Court Case
                      </div>
                    )}
                    {file.can_create_shared_care_agreement && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        SharedCare
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      QuickAccord
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FamilyFilesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navigation />
        <PageContainer>
          <FamilyFilesContent />
        </PageContainer>
      </div>
    </ProtectedRoute>
  );
}
