'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { familyFilesAPI, quickAccordsAPI, agreementsAPI, FamilyFileDetail, QuickAccord, Agreement } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { PageContainer } from '@/components/layout';
import {
  ArrowLeft,
  FolderHeart,
  Users,
  Baby,
  FileText,
  Zap,
  Scale,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  Plus,
  Settings,
  MessageSquare,
  DollarSign,
  CalendarPlus,
  Send,
  Video,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IncomingCallBanner } from "@/components/kidcoms/incoming-call-banner";

function FamilyFileDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [familyFile, setFamilyFile] = useState<FamilyFileDetail | null>(null);
  const [quickAccords, setQuickAccords] = useState<QuickAccord[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // Invitation State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [fileData, accordsData, agreementsData] = await Promise.all([
        familyFilesAPI.get(id),
        quickAccordsAPI.list(id),
        agreementsAPI.listForFamilyFile(id),
      ]);
      setFamilyFile(fileData);
      setQuickAccords(accordsData.items);
      setAgreements(agreementsData.items || []);
    } catch (err: any) {
      console.error('Failed to load family file:', err);
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        router.push('/login');
        return;
      }
      setError(err.message || 'Failed to load family file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      setInviteError('Please enter an email address');
      return;
    }

    try {
      setIsInviting(true);
      setInviteError(null);
      setInviteSuccess(null);

      await familyFilesAPI.inviteParentB(id, inviteEmail);

      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');

      // Reload data to update UI
      await loadData();

      // Close dialog after a delay
      setTimeout(() => {
        setIsInviteOpen(false);
        setInviteSuccess(null);
      }, 2000);

    } catch (err: any) {
      console.error('Failed to invite parent:', err);
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700">Completed</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>;
      case 'revoked':
        return <Badge className="bg-red-100 text-red-700">Revoked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'travel': return '✈️';
      case 'schedule_swap': return '🔄';
      case 'special_event': return '🎉';
      case 'overnight': return '🌙';
      case 'expense': return '💰';
      default: return '📋';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !familyFile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Family File not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isParentA = familyFile.parent_a_id === user?.id;

  return (
    <div className="space-y-6">
      {/* Incoming Call Banner - polls for active sessions */}
      <IncomingCallBanner familyFileId={id} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/family-files')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <FolderHeart className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{familyFile.title}</h1>
              {familyFile.has_court_case && (
                <Badge className="bg-purple-100 text-purple-700">
                  <Scale className="h-3 w-3 mr-1" />
                  Court Linked
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">{familyFile.family_file_number}</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Status Alert */}
      {!familyFile.is_complete && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {familyFile.parent_b_email ? (
              <>Waiting for {familyFile.parent_b_email} to accept the invitation.</>
            ) : (
              <>Invite your co-parent to complete this Family File.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="h-auto py-4 justify-start"
                  onClick={() => router.push(`/payments/new?familyFileId=${id}`)}
                >
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium">ClearFund Request</div>
                      <div className="text-xs text-muted-foreground">
                        Request expense reimbursement
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 justify-start"
                  onClick={() => router.push(`/schedule?familyFileId=${id}&action=new-event`)}
                >
                  <div className="flex items-start gap-3">
                    <CalendarPlus className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium">New Event</div>
                      <div className="text-xs text-muted-foreground">
                        Add to shared calendar
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 justify-start"
                  onClick={() => router.push(`/messages?familyFileId=${id}`)}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium">Messages</div>
                      <div className="text-xs text-muted-foreground">
                        Chat with your co-parent
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 justify-start"
                  onClick={() => router.push(`/family-files/${id}/kidcoms`)}
                >
                  <div className="flex items-start gap-3">
                    <Video className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium">KidComs</div>
                      <div className="text-xs text-muted-foreground">
                        Video calls for kids
                      </div>
                    </div>
                  </div>
                </Button>

                {!familyFile.parent_b_id && (
                  <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-auto py-4 justify-start"
                      >
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-cg-sage mt-0.5" />
                          <div className="text-left">
                            <div className="font-medium">Invite Co-Parent</div>
                            <div className="text-xs text-muted-foreground">
                              Send invitation email
                            </div>
                          </div>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Co-Parent</DialogTitle>
                        <DialogDescription>
                          Send an email invitation to the other parent to join this Family File.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            placeholder="name@example.com"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        {inviteError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{inviteError}</AlertDescription>
                          </Alert>
                        )}
                        {inviteSuccess && (
                          <Alert className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-700" />
                            <AlertDescription>{inviteSuccess}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleInvite} disabled={isInviting || !!inviteSuccess}>
                          {isInviting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Invite
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QuickAccords */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  QuickAccords
                </CardTitle>
                <CardDescription>Situational agreements</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => router.push(`/family-files/${id}/quick-accord/new`)}
              >
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </CardHeader>
            <CardContent>
              {quickAccords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No QuickAccords yet</p>
                  <p className="text-sm">Create one for schedule swaps, trips, or events</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quickAccords.slice(0, 3).map((accord) => (
                    <div
                      key={accord.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer"
                      onClick={() => router.push(`/family-files/${id}/quick-accord/${accord.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getCategoryIcon(accord.purpose_category)}</span>
                        <div>
                          <div className="font-medium">{accord.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {accord.accord_number}
                            {accord.event_date && ` - ${new Date(accord.event_date).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(accord.status)}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => router.push(`/family-files/${id}/quick-accords`)}
                  >
                    View All QuickAccords ({quickAccords.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SharedCare Agreements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  SharedCare Agreements
                </CardTitle>
                <CardDescription>Comprehensive co-parenting agreements</CardDescription>
              </div>
              {familyFile.can_create_shared_care_agreement && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/agreements/new?familyFileId=${id}`)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {agreements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No SharedCare Agreements yet</p>
                  {familyFile.can_create_shared_care_agreement ? (
                    <p className="text-sm mt-2">Create a comprehensive co-parenting agreement</p>
                  ) : (
                    <p className="text-sm mt-2">
                      New agreements require court approval when a Court Case is linked
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {agreements.slice(0, 3).map((agreement) => (
                    <div
                      key={agreement.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer"
                      onClick={() => router.push(`/agreements/${agreement.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <div className="font-medium">{agreement.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(agreement.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(agreement.status)}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                    onClick={() => router.push(`/agreements?familyFileId=${id}`)}
                  >
                    View All Agreements ({agreements.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Parents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Parents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Parent A */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {isParentA ? 'You' : 'A'}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{getRoleName(familyFile.parent_a_role)}</div>
                  <div className="text-sm text-muted-foreground">
                    {isParentA ? 'You' : 'Co-parent'}
                  </div>
                </div>
                {isParentA && <Badge variant="outline">You</Badge>}
              </div>

              {/* Parent B */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  {familyFile.parent_b_id ? (
                    <span className="font-medium">
                      {!isParentA ? 'You' : 'B'}
                    </span>
                  ) : (
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-medium">
                    {familyFile.parent_b_id
                      ? getRoleName(familyFile.parent_b_role)
                      : 'Pending Invitation'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {familyFile.parent_b_email || 'Not invited'}
                  </div>
                </div>
                {familyFile.parent_b_id && !isParentA && (
                  <Badge variant="outline">You</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Children */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Baby className="h-5 w-5" />
                Children
              </CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {familyFile.children.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Baby className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No children added</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {familyFile.children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/family-files/${id}/children/${child.id}`)}
                    >
                      <div className="h-8 w-8 rounded-full bg-cg-sage/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-cg-sage">
                          {child.first_name[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {child.preferred_name || child.first_name} {child.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(child.date_of_birth).toLocaleDateString()}
                        </div>
                      </div>
                      {child.status !== 'active' && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {child.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {familyFile.state && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>{familyFile.county && `${familyFile.county}, `}{familyFile.state}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">ARIA</span>
                <span>{familyFile.aria_enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(familyFile.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function FamilyFileDetailPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navigation />
        <PageContainer>
          <FamilyFileDetailContent />
        </PageContainer>
      </div>
    </ProtectedRoute>
  );
}
