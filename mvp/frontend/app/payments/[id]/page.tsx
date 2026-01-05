'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  FileText,
  User,
  Calendar,
  Shield,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  clearfundAPI,
  Obligation,
  FundingStatus,
  Attestation,
  VerificationArtifact,
  LedgerEntry
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import FundingProgress from '@/components/clearfund/funding-progress';

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

const statusColors: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800',
  partially_funded: 'bg-yellow-100 text-yellow-800',
  funded: 'bg-blue-100 text-blue-800',
  pending_verification: 'bg-purple-100 text-purple-800',
  verified: 'bg-green-100 text-green-800',
  completed: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

function ObligationDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [obligation, setObligation] = useState<Obligation | null>(null);
  const [fundingStatus, setFundingStatus] = useState<FundingStatus | null>(null);
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [artifacts, setArtifacts] = useState<VerificationArtifact[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [fundingAmount, setFundingAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);

  const obligationId = params.id as string;

  useEffect(() => {
    if (obligationId) {
      loadObligationData();
    }
  }, [obligationId]);

  const loadObligationData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [obligationRes, fundingRes, attestationRes, artifactsRes] = await Promise.all([
        clearfundAPI.getObligation(obligationId),
        clearfundAPI.getFundingStatus(obligationId),
        clearfundAPI.getAttestation(obligationId).catch(() => null),
        clearfundAPI.listArtifacts(obligationId),
      ]);

      setObligation(obligationRes);
      setFundingStatus(fundingRes);
      setAttestation(attestationRes);
      setArtifacts(artifactsRes);

      // Fetch ledger entries for this obligation
      if (obligationRes.case_id) {
        try {
          const ledgerRes = await clearfundAPI.getLedger(obligationRes.case_id, 1, 100);
          // Filter to only entries for this obligation
          const obligationLedger = ledgerRes.items.filter(
            entry => entry.obligation_id === obligationId
          );
          setLedgerEntries(obligationLedger);
        } catch {
          // Ledger might not exist yet, that's ok
          setLedgerEntries([]);
        }
      }
    } catch (err: any) {
      console.error('Error loading obligation:', err);
      setError(err.message || 'Failed to load obligation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFund = async () => {
    if (!fundingAmount || parseFloat(fundingAmount) <= 0) return;

    try {
      setIsFunding(true);
      await clearfundAPI.recordFunding(obligationId, {
        amount: parseFloat(fundingAmount)
      });
      setShowFundingModal(false);
      setFundingAmount('');
      await loadObligationData();
    } catch (err: any) {
      setError(err.message || 'Failed to record funding');
    } finally {
      setIsFunding(false);
    }
  };

  const handleComplete = async () => {
    try {
      await clearfundAPI.completeObligation(obligationId);
      await loadObligationData();
    } catch (err: any) {
      setError(err.message || 'Failed to complete obligation');
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason || reason.length < 10) {
      alert('Reason must be at least 10 characters');
      return;
    }

    try {
      await clearfundAPI.cancelObligation(obligationId, reason);
      await loadObligationData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel obligation');
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading obligation...</div>
      </div>
    );
  }

  if (!obligation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto p-8">
          <Card className="p-8 text-center">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Obligation Not Found</h2>
            <p className="text-gray-600 mb-4">
              This obligation may have been deleted or you don't have access.
            </p>
            <Button onClick={() => router.push('/payments')}>
              Back to Payments
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const needsFunding = ['open', 'partially_funded'].includes(obligation.status);
  const needsVerification = ['funded', 'pending_verification'].includes(obligation.status) && obligation.verification_required;
  const canComplete = obligation.status === 'verified' || (obligation.status === 'funded' && !obligation.verification_required);
  const canCancel = ['open', 'partially_funded'].includes(obligation.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/payments')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Payments
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{obligation.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[obligation.status]}`}>
                  {capitalizeFirst(obligation.status)}
                </span>
              </div>
              <p className="text-gray-600 mt-1">
                {capitalizeFirst(obligation.purpose_category)} &bull; {obligation.petitioner_percentage}/{100 - obligation.petitioner_percentage} split
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(obligation.total_amount)}
              </p>
              {obligation.is_overdue && (
                <span className="inline-flex items-center gap-1 text-red-600 text-sm mt-1">
                  <AlertTriangle className="h-4 w-4" />
                  Overdue
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {/* Funding Status */}
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Funding Status
            </h2>

            <FundingProgress
              funded={parseFloat(obligation.amount_funded)}
              total={parseFloat(obligation.total_amount)}
              size="lg"
              className="mb-4"
            />

            {fundingStatus && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Petitioner Share</p>
                  <p className="text-lg font-semibold">{formatCurrency(obligation.petitioner_share)}</p>
                  {fundingStatus.petitioner_funding && (
                    <p className={`text-sm ${fundingStatus.petitioner_funding.is_fully_funded ? 'text-green-600' : 'text-amber-600'}`}>
                      {fundingStatus.petitioner_funding.is_fully_funded
                        ? 'Fully funded'
                        : `${formatCurrency(fundingStatus.petitioner_funding.amount_funded)} funded`}
                    </p>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Respondent Share</p>
                  <p className="text-lg font-semibold">{formatCurrency(obligation.respondent_share)}</p>
                  {fundingStatus.respondent_funding && (
                    <p className={`text-sm ${fundingStatus.respondent_funding.is_fully_funded ? 'text-green-600' : 'text-amber-600'}`}>
                      {fundingStatus.respondent_funding.is_fully_funded
                        ? 'Fully funded'
                        : `${formatCurrency(fundingStatus.respondent_funding.amount_funded)} funded`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {needsFunding && (
              <div className="mt-4">
                {showFundingModal ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      placeholder="Amount to fund"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <Button onClick={handleFund} disabled={isFunding}>
                      {isFunding ? 'Processing...' : 'Confirm'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowFundingModal(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setShowFundingModal(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Fund My Share
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Transaction Ledger */}
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600" />
              Transaction Ledger
            </h2>

            {ledgerEntries.length > 0 ? (
              <div className="space-y-3">
                {ledgerEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className={`p-2 rounded-full ${
                      entry.entry_type === 'funding' || entry.entry_type === 'payment'
                        ? 'bg-green-100'
                        : 'bg-blue-100'
                    }`}>
                      {entry.entry_type === 'funding' || entry.entry_type === 'payment' ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{entry.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(entry.effective_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        entry.entry_type === 'funding' || entry.entry_type === 'payment'
                          ? 'text-green-600'
                          : 'text-gray-900'
                      }`}>
                        {entry.entry_type === 'funding' || entry.entry_type === 'payment' ? '+' : ''}
                        {formatCurrency(entry.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Balance: {formatCurrency(entry.running_balance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Transactions will appear here when payments are made</p>
              </div>
            )}

            {/* Funding History from FundingStatus */}
            {fundingStatus && (fundingStatus.petitioner_funding?.funded_at || fundingStatus.respondent_funding?.funded_at) && ledgerEntries.length === 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Funding Activity</p>
                <div className="space-y-2">
                  {fundingStatus.petitioner_funding?.funded_at && parseFloat(fundingStatus.petitioner_funding.amount_funded) > 0 && (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">Petitioner funded</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-green-600">
                          +{formatCurrency(fundingStatus.petitioner_funding.amount_funded)}
                        </span>
                        <p className="text-xs text-gray-500">
                          {formatDate(fundingStatus.petitioner_funding.funded_at)}
                        </p>
                      </div>
                    </div>
                  )}
                  {fundingStatus.respondent_funding?.funded_at && parseFloat(fundingStatus.respondent_funding.amount_funded) > 0 && (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">Respondent funded</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-green-600">
                          +{formatCurrency(fundingStatus.respondent_funding.amount_funded)}
                        </span>
                        <p className="text-xs text-gray-500">
                          {formatDate(fundingStatus.respondent_funding.funded_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Details */}
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Details
            </h2>

            <div className="space-y-4">
              {obligation.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900">{obligation.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="text-gray-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(obligation.due_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-gray-900">{formatDate(obligation.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Source</p>
                  <p className="text-gray-900">{capitalizeFirst(obligation.source_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requirements</p>
                  <p className="text-gray-900">
                    {obligation.verification_required ? 'Verification required' : 'No verification needed'}
                    {obligation.receipt_required && ' • Receipt required'}
                  </p>
                </div>
              </div>

              {obligation.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-gray-900">{obligation.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Attestation */}
          {attestation && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Attestation
              </h2>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-800 font-medium mb-2">Sworn Statement</p>
                <p className="text-purple-900">{attestation.attestation_text}</p>
                <p className="text-sm text-purple-600 mt-2">
                  Attested on {formatDate(attestation.attested_at)}
                </p>
              </div>
            </Card>
          )}

          {/* Verification Artifacts */}
          {artifacts.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Verification Artifacts
              </h2>

              <div className="space-y-3">
                {artifacts.map(artifact => (
                  <div key={artifact.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded">
                      {artifact.artifact_type === 'receipt' ? (
                        <Upload className="h-4 w-4 text-gray-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{capitalizeFirst(artifact.artifact_type)}</p>
                      {artifact.vendor_name && (
                        <p className="text-sm text-gray-600">{artifact.vendor_name}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {formatCurrency(artifact.amount_verified)} verified on {formatDate(artifact.verified_at)}
                      </p>
                    </div>
                    {artifact.receipt_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={artifact.receipt_url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {needsVerification && (
              <Button onClick={() => router.push(`/payments/${obligationId}/verify`)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Receipt
              </Button>
            )}
            {canComplete && (
              <Button onClick={handleComplete}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={handleCancel} className="text-red-600 border-red-300 hover:bg-red-50">
                Cancel Obligation
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ObligationDetailPage() {
  return (
    <ProtectedRoute>
      <ObligationDetailContent />
    </ProtectedRoute>
  );
}
