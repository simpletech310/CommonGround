'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { agreementsAPI, Agreement, AgreementSection, AgreementQuickSummary } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { FileText, Sparkles, CheckCircle, Pencil } from 'lucide-react';

// Map backend section types to wizard section indexes for editing
function getSectionEditIndex(sectionType: string, sectionNumber: string): number {
  // Map from backend section (type + number) to wizard section index
  const mappings: Record<string, number> = {
    'basic_info_1': 1,       // parent_info (also covers other_parent_info=2, children_info=3)
    'custody_2': 4,          // legal_custody
    'custody_3': 5,          // physical_custody
    'schedule_4': 6,         // parenting_schedule
    'schedule_5': 7,         // holiday_schedule
    'schedule_6': 15,        // travel (vacation time)
    'logistics_8': 8,        // exchange_logistics
    'decision_making_9': 18, // other_provisions
    'decision_making_10': 12, // education
    'decision_making_11': 11, // medical_healthcare
    'financial_14': 10,      // child_support
    'financial_15': 10,      // child_support (expense sharing)
    'communication_16': 13,  // parent_communication
    'legal_17': 17,          // dispute_resolution
    'legal_18': 16,          // relocation (modification process)
  };

  const key = `${sectionType}_${sectionNumber}`;
  return mappings[key] ?? -1;
}

// Helper to format structured data into human-readable summary
function formatSectionSummary(section: AgreementSection): string | null {
  // If content exists and is not JSON, use it directly
  if (section.content && !section.content.startsWith('{')) {
    return section.content;
  }

  // Try to parse and format structured_data
  const data = section.structured_data;
  if (!data) return null;

  try {
    // Handle different section types
    const sectionData = typeof data === 'string' ? JSON.parse(data) : data;

    switch (section.section_type) {
      case 'physical_custody':
      case 'custody': {
        const pc = sectionData.physical_custody || sectionData;
        const parts = [];
        if (pc.arrangement_type) parts.push(pc.arrangement_type);
        if (pc.percentage_split) parts.push(`${pc.percentage_split} split`);
        if (pc.primary_residential_parent) parts.push(`Primary: ${pc.primary_residential_parent}`);
        if (pc.time_split) parts.push(`${pc.time_split} time split`);
        if (pc.schedule_type) parts.push(pc.schedule_type.replace(/_/g, ' '));
        return parts.length > 0 ? parts.join(' • ') : null;
      }

      case 'parenting_schedule':
      case 'schedule': {
        const ps = sectionData.parenting_schedule || sectionData.regular_schedule || sectionData;
        const parts = [];
        if (ps.weekly_pattern) parts.push(ps.weekly_pattern);
        if (ps.type) parts.push(ps.type.replace(/_/g, ' '));
        if (ps.exchange_day) parts.push(`Exchange: ${ps.exchange_day}`);
        if (ps.exchange_time) parts.push(`at ${ps.exchange_time}`);
        return parts.length > 0 ? parts.join(' • ') : null;
      }

      case 'holiday_schedule': {
        const hs = sectionData.holiday_schedule || sectionData.holidays || sectionData;
        const holidays = Object.entries(hs)
          .filter(([_, v]) => v && typeof v === 'string' && v !== '')
          .slice(0, 4)
          .map(([k, _]) => k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        return holidays.length > 0 ? `Holidays covered: ${holidays.join(', ')}` : 'Holiday schedule configured';
      }

      case 'education': {
        const ed = sectionData.education || sectionData;
        const parts = [];
        if (ed.current_school) parts.push(ed.current_school);
        if (ed.school_district) parts.push(ed.school_district);
        if (ed.school_choice) parts.push(`School decisions: ${ed.school_choice}`);
        if (ed.conferences === 'Yes') parts.push('Both attend conferences');
        return parts.length > 0 ? parts.join(' • ') : 'Education provisions configured';
      }

      case 'healthcare':
      case 'medical_healthcare': {
        const hc = sectionData.medical_healthcare || sectionData;
        const parts = [];
        if (hc.insurance_provider) parts.push(`Insurance: ${hc.insurance_provider}`);
        if (hc.primary_pediatrician) parts.push(hc.primary_pediatrician);
        if (hc.medical_records_access === 'Yes') parts.push('Shared medical records access');
        if (hc.cost_sharing) parts.push(`Costs: ${hc.cost_sharing}`);
        return parts.length > 0 ? parts.join(' • ') : 'Healthcare provisions configured';
      }

      case 'child_support':
      case 'financial': {
        const cs = sectionData.child_support || sectionData;
        const parts = [];
        if (cs.monthly_amount) parts.push(`$${cs.monthly_amount}/month`);
        if (cs.paying_parent) parts.push(`Paid by ${cs.paying_parent.split(' ')[0]}`);
        if (cs.has_support === 'Yes') parts.push('Child support established');
        if (cs.payment_method) parts.push(`via ${cs.payment_method}`);
        return parts.length > 0 ? parts.join(' • ') : 'Financial provisions configured';
      }

      case 'expenses': {
        const exp = sectionData.shared_expenses || sectionData;
        const shared = Object.entries(exp)
          .filter(([_, v]) => v === '50/50')
          .map(([k, _]) => k.replace(/_/g, ' '));
        return shared.length > 0 ? `50/50 split: ${shared.slice(0, 3).join(', ')}` : 'Expense sharing configured';
      }

      case 'dispute_resolution': {
        const dr = sectionData.dispute_resolution || sectionData;
        const parts = [];
        if (dr.first_step) parts.push(`First: ${dr.first_step}`);
        if (dr.mediation_required === 'Yes') parts.push('Mediation required');
        if (dr.steps) parts.push(dr.steps.map((s: any) => s.method || s).join(' → '));
        return parts.length > 0 ? parts.join(' • ') : 'Dispute resolution process defined';
      }

      case 'communication': {
        const comm = sectionData.parent_communication || sectionData;
        const parts = [];
        if (comm.primary_method) parts.push(`Via ${comm.primary_method}`);
        if (comm.response_time_hours) parts.push(`${comm.response_time_hours}h response time`);
        return parts.length > 0 ? parts.join(' • ') : 'Communication guidelines set';
      }

      case 'activities':
      case 'extracurricular': {
        const act = sectionData.current_activities || sectionData;
        if (Array.isArray(act) && act.length > 0) {
          const activities = act.map((a: any) => a.activity || a.name).filter(Boolean);
          return activities.length > 0 ? `Activities: ${activities.join(', ')}` : null;
        }
        return 'Extracurricular activities configured';
      }

      case 'transportation':
      case 'logistics': {
        const tr = sectionData.exchange_location || sectionData;
        const parts = [];
        if (tr.primary) parts.push(`Exchange at: ${tr.primary}`);
        if (sectionData.costs) parts.push(`Costs: ${sectionData.costs}`);
        if (sectionData.transportation_costs) parts.push(`Costs: ${sectionData.transportation_costs}`);
        return parts.length > 0 ? parts.join(' • ') : 'Transportation logistics configured';
      }

      case 'basic_info': {
        const bi = sectionData;
        const parts = [];
        if (bi.parent_a?.name) parts.push(bi.parent_a.name);
        if (bi.parent_b?.name) parts.push(bi.parent_b.name);
        if (bi.children?.length) parts.push(`${bi.children.length} child${bi.children.length > 1 ? 'ren' : ''}`);
        return parts.length > 0 ? parts.join(' & ') : null;
      }

      case 'legal':
      case 'legal_custody': {
        const lc = sectionData;
        const parts = [];
        if (lc.custody_type) parts.push(lc.custody_type.replace(/_/g, ' '));
        if (lc.tie_breaker) parts.push(`Tie-breaker: ${lc.tie_breaker}`);
        return parts.length > 0 ? parts.join(' • ') : 'Legal custody defined';
      }

      case 'decision_making': {
        const dm = sectionData.major_decisions || sectionData;
        if (dm.requires_agreement) {
          return `Joint decisions: ${dm.requires_agreement.slice(0, 3).join(', ')}`;
        }
        return 'Decision-making authority defined';
      }

      case 'religious': {
        const rel = sectionData.religious || sectionData;
        const parts = [];
        if (rel.religious_upbringing || rel.upbringing) parts.push(rel.religious_upbringing || rel.upbringing);
        if (rel.religious_education || rel.formal_education) parts.push(`Education: ${rel.religious_education || rel.formal_education}`);
        return parts.length > 0 ? parts.join(' • ') : 'Religious provisions defined';
      }

      case 'modifications': {
        const mod = sectionData.minor_modifications || sectionData;
        if (mod.relocation_notice_days) {
          return `${mod.relocation_notice_days} days relocation notice required`;
        }
        return 'Modification process defined';
      }

      case 'vacation_schedule':
      case 'vacation': {
        const vs = sectionData.summer_vacation || sectionData;
        const parts = [];
        if (vs.weeks_each) parts.push(`${vs.weeks_each} weeks each parent`);
        if (vs.notice_required_days) parts.push(`${vs.notice_required_days} days notice`);
        return parts.length > 0 ? parts.join(' • ') : 'Vacation schedule configured';
      }

      case 'school_breaks': {
        const sb = sectionData.school_breaks || sectionData;
        const breaks = Object.entries(sb)
          .filter(([_, v]) => v && v !== '')
          .map(([k, _]) => k.replace(/_/g, ' '));
        return breaks.length > 0 ? `Covers: ${breaks.slice(0, 3).join(', ')}` : 'School breaks scheduled';
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}

function AgreementDetailsContent() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const agreementId = params.id as string;

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [sections, setSections] = useState<AgreementSection[]>([]);
  const [summary, setSummary] = useState<AgreementQuickSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgreement();
  }, [agreementId]);

  const loadAgreement = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await agreementsAPI.get(agreementId);

      setAgreement(data.agreement);
      setSections(data.sections);

      // Load AI summary
      try {
        const summaryData = await agreementsAPI.getQuickSummary(agreementId);
        setSummary(summaryData);
      } catch {
        // Summary may fail if AI is unavailable
      }
    } catch (err: any) {
      console.error('Failed to load agreement:', err);
      setError(err.message || 'Failed to load agreement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsApproving(true); // Reuse the same loading state
      setError(null);

      const data = await agreementsAPI.submit(agreementId);
      setAgreement(data.agreement);
      setSections(data.sections);
    } catch (err: any) {
      console.error('Failed to submit agreement:', err);
      setError(err.message || 'Failed to submit agreement');
    } finally {
      setIsApproving(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError(null);

      const data = await agreementsAPI.approve(agreementId);
      setAgreement(data.agreement);
      setSections(data.sections);
    } catch (err: any) {
      console.error('Failed to approve agreement:', err);
      setError(err.message || 'Failed to approve agreement');
    } finally {
      setIsApproving(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      setError(null);

      const pdfBlob = await agreementsAPI.generatePDF(agreementId);

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${agreement?.title || 'agreement'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to generate PDF:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleActivate = async () => {
    try {
      setIsActivating(true);
      setError(null);

      const data = await agreementsAPI.activate(agreementId);
      setAgreement(data.agreement);
      setSections(data.sections);
    } catch (err: any) {
      console.error('Failed to activate agreement:', err);
      setError(err.message || 'Failed to activate agreement');
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this agreement?')) {
      return;
    }

    try {
      setIsActivating(true);
      setError(null);

      const data = await agreementsAPI.deactivate(agreementId);
      setAgreement(data.agreement);
      setSections(data.sections);
    } catch (err: any) {
      console.error('Failed to deactivate agreement:', err);
      setError(err.message || 'Failed to deactivate agreement');
    } finally {
      setIsActivating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft agreement? This cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      await agreementsAPI.delete(agreementId);

      // Navigate back to case details
      if (agreement?.case_id) {
        router.push(`/cases/${agreement.case_id}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Failed to delete agreement:', err);
      setError(err.message || 'Failed to delete agreement');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'approved':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'pending_approval':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'draft':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'inactive':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      case 'rejected':
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const hasUserApproved = () => {
    if (!agreement || !user) return false;
    return agreement.approved_by_a === user.id || agreement.approved_by_b === user.id;
  };

  const canApprove = () => {
    if (!agreement || !user) return false;
    if (agreement.status !== 'pending_approval' && agreement.status !== 'draft') return false;
    return !hasUserApproved();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/agreements">
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Agreements
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading agreement...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4" onClick={loadAgreement}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Agreement Details */}
        {!isLoading && agreement && (
          <div className="space-y-6">
            {/* Header Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{agreement.title}</CardTitle>
                    <CardDescription className="mt-2">
                      Version {agreement.version}
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(agreement.status)}`}>
                    {getStatusLabel(agreement.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium">{new Date(agreement.created_at).toLocaleDateString()}</p>
                  </div>
                  {agreement.effective_date && (
                    <div>
                      <p className="text-gray-500">Effective Date</p>
                      <p className="font-medium">{new Date(agreement.effective_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {/* Approval Status */}
                {agreement.status === 'pending_approval' && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Approval Status:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {agreement.approved_by_a ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <span className="text-sm text-gray-600">
                          Parent A {agreement.approved_by_a ? 'approved' : 'pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {agreement.approved_by_b ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <span className="text-sm text-gray-600">
                          Parent B {agreement.approved_by_b ? 'approved' : 'pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Summary Card */}
            {summary && summary.completion_percentage > 0 && (
              <Card className="border-cg-primary/20 bg-cg-primary-subtle/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cg-primary" />
                    <CardTitle className="text-lg">Agreement Summary</CardTitle>
                  </div>
                  <CardDescription>
                    AI-generated overview of your parenting agreement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Completion</span>
                      <span>{summary.completion_percentage}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cg-primary rounded-full transition-all duration-500"
                        style={{ width: `${summary.completion_percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Summary Text */}
                  <p className="text-foreground leading-relaxed">
                    {summary.summary}
                  </p>

                  {/* Key Points */}
                  {summary.key_points && summary.key_points.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm font-medium text-foreground mb-2">Key Terms:</p>
                      <ul className="space-y-1.5">
                        {summary.key_points.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-cg-success flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canApprove() && (
                  <Button
                    className="w-full"
                    onClick={handleApprove}
                    disabled={isApproving}
                  >
                    {isApproving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approve Agreement
                      </>
                    )}
                  </Button>
                )}

                {hasUserApproved() && agreement.status === 'pending_approval' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-900">
                      You've approved this agreement. Waiting for the other parent's approval.
                    </p>
                  </div>
                )}

                {agreement.status === 'approved' && (
                  <>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleActivate}
                      disabled={isActivating}
                    >
                      {isActivating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Activating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Activate Agreement
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGeneratePDF}
                      disabled={isGeneratingPDF}
                    >
                      {isGeneratingPDF ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF
                        </>
                      )}
                    </Button>
                  </>
                )}

                {agreement.status === 'active' && (
                  <>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm font-medium text-green-900">This agreement is currently active!</p>
                      {agreement.effective_date && (
                        <p className="text-xs text-green-700 mt-1">
                          Effective since {new Date(agreement.effective_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={handleDeactivate}
                      disabled={isActivating}
                    >
                      {isActivating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                          Deactivating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Deactivate Agreement
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleGeneratePDF}
                      disabled={isGeneratingPDF}
                    >
                      {isGeneratingPDF ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF
                        </>
                      )}
                    </Button>
                  </>
                )}

                {agreement.status === 'draft' && (
                  <>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleSubmit}
                      disabled={isApproving}
                    >
                      {isApproving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Submit for Approval
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/agreements/${agreementId}/builder`)}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Continue Editing
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-300 text-red-700 hover:bg-red-50"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Draft
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Sections */}
            <Card>
              <CardHeader>
                <CardTitle>Agreement Sections</CardTitle>
                <CardDescription>
                  {sections.filter(s => s.is_completed).length} of {sections.length} sections completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sections.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No sections completed yet</p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push(`/agreements/${agreementId}/builder`)}
                    >
                      Start Building
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section) => {
                      const editIndex = getSectionEditIndex(section.section_type, section.section_number);
                      const canEdit = agreement.status === 'draft' && editIndex >= 0;

                      return (
                        <div
                          key={section.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            section.is_completed
                              ? 'bg-cg-success/5 border-cg-success/20'
                              : 'bg-secondary/50 border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {section.is_completed ? (
                                  <CheckCircle className="h-4 w-4 text-cg-success flex-shrink-0" />
                                ) : (
                                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                                )}
                                <h4 className="font-medium text-foreground">{section.section_title}</h4>
                              </div>
                              {(section.content || section.structured_data) && (
                                <p className="text-sm text-muted-foreground mt-2 ml-6 line-clamp-2">
                                  {formatSectionSummary(section) || 'Section configured'}
                                </p>
                              )}
                              {!section.content && !section.structured_data && !section.is_completed && (
                                <p className="text-sm text-muted-foreground/60 mt-2 ml-6 italic">
                                  Not yet completed
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {section.is_required && (
                                <Badge variant="secondary" size="sm">
                                  Required
                                </Badge>
                              )}
                              {section.is_completed && (
                                <Badge variant="success" size="sm">
                                  Complete
                                </Badge>
                              )}
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/agreements/${agreementId}/builder?section=${editIndex}`)}
                                  className="ml-2"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AgreementDetailsPage() {
  return (
    <ProtectedRoute>
      <AgreementDetailsContent />
    </ProtectedRoute>
  );
}
