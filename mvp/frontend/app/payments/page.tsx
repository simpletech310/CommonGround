'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, ArrowLeft, Plus, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { casesAPI, clearfundAPI, Case, Obligation, BalanceSummary, ObligationMetrics } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import ObligationCard from '@/components/clearfund/obligation-card';
import BalanceSummaryCard from '@/components/clearfund/balance-summary';
import MetricsCards from '@/components/clearfund/metrics-cards';

type TabType = 'pending' | 'active' | 'completed' | 'ledger';

function PaymentsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [metrics, setMetrics] = useState<ObligationMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCases();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCase) {
      loadClearFundData();
    }
  }, [selectedCase]);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await casesAPI.list();
      setCases(data);

      const activeCase = data.find(c => c.status === 'active');
      if (activeCase) {
        setSelectedCase(activeCase);
      } else if (data.length > 0) {
        setSelectedCase(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClearFundData = async () => {
    if (!selectedCase) return;

    try {
      setIsLoading(true);
      setError(null);

      const [obligationsRes, balanceRes, metricsRes] = await Promise.all([
        clearfundAPI.listObligations(selectedCase.id),
        clearfundAPI.getBalance(selectedCase.id),
        clearfundAPI.getMetrics(selectedCase.id),
      ]);

      setObligations(obligationsRes.items);
      setBalanceSummary(balanceRes);
      setMetrics(metricsRes);
    } catch (err: any) {
      console.error('ClearFund data load error:', err);
      // Set empty defaults if no data exists yet
      setObligations([]);
      setBalanceSummary(null);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredObligations = (): Obligation[] => {
    switch (activeTab) {
      case 'pending':
        return obligations.filter(o => ['open', 'partially_funded'].includes(o.status));
      case 'active':
        return obligations.filter(o => ['funded', 'pending_verification', 'verified'].includes(o.status));
      case 'completed':
        return obligations.filter(o => ['completed', 'cancelled', 'expired'].includes(o.status));
      default:
        return obligations;
    }
  };

  const handleObligationClick = (obligation: Obligation) => {
    router.push(`/payments/${obligation.id}`);
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (isLoading && !selectedCase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading payments...</div>
      </div>
    );
  }

  if (!selectedCase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto p-8">
          <Card className="p-8 text-center">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Cases Found</h2>
            <p className="text-gray-600 mb-4">
              You need to create or join a case to access ClearFund payments.
            </p>
            <Button onClick={() => router.push('/cases')}>
              Go to Cases
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const filteredObligations = getFilteredObligations();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-green-600" />
                ClearFund
              </h1>
              <p className="text-gray-600 mt-1">Purpose-locked financial obligations for {selectedCase.case_name}</p>
            </div>
            <Button
              onClick={() => router.push('/payments/new')}
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              New Expense
            </Button>
          </div>

          {cases.length > 1 && (
            <div className="mt-4">
              <select
                value={selectedCase.id}
                onChange={(e) => {
                  const case_ = cases.find(c => c.id === e.target.value);
                  if (case_) setSelectedCase(case_);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                {cases.map(case_ => (
                  <option key={case_.id} value={case_.id}>{case_.case_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Metrics Cards */}
        <MetricsCards
          metrics={metrics}
          balanceSummary={balanceSummary}
          isLoading={isLoading}
        />

        {/* Balance Summary */}
        {balanceSummary && (
          <BalanceSummaryCard balance={balanceSummary} className="mt-6" />
        )}

        {/* Tabs */}
        <div className="mt-8 mb-6 border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="h-5 w-5" />
              Pending
              {metrics && metrics.total_pending_funding > 0 && (
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs">
                  {metrics.total_pending_funding}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              Active
              {metrics && metrics.total_funded > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {metrics.total_funded}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'completed'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              Completed
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'ledger'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-5 w-5" />
              Ledger
            </button>
          </nav>
        </div>

        {/* Obligations List */}
        {activeTab !== 'ledger' ? (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-gray-500">Loading obligations...</div>
            ) : filteredObligations.length === 0 ? (
              <Card className="p-8 text-center">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} obligations
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'pending'
                    ? 'Create a new expense to get started.'
                    : activeTab === 'active'
                    ? 'No obligations are currently being processed.'
                    : 'No completed obligations yet.'}
                </p>
                {activeTab === 'pending' && (
                  <Button onClick={() => router.push('/payments/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Expense
                  </Button>
                )}
              </Card>
            ) : (
              filteredObligations.map(obligation => (
                <ObligationCard
                  key={obligation.id}
                  obligation={obligation}
                  onClick={() => handleObligationClick(obligation)}
                />
              ))
            )}
          </div>
        ) : (
          /* Ledger Tab */
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Transaction Ledger
            </h3>
            <p className="text-gray-600 mb-4">
              View the complete financial history for this case.
            </p>
            <Button onClick={() => router.push(`/payments/ledger?case_id=${selectedCase.id}`)}>
              View Full Ledger
            </Button>
          </Card>
        )}

        {/* Overdue Warning */}
        {metrics && metrics.total_overdue > 0 && (
          <Card className="mt-6 p-4 bg-red-50 border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">
                  {metrics.total_overdue} Overdue Obligation{metrics.total_overdue > 1 ? 's' : ''}
                </h4>
                <p className="text-sm text-red-600 mt-1">
                  Please address overdue obligations to maintain compliance.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <ProtectedRoute>
      <PaymentsContent />
    </ProtectedRoute>
  );
}
