'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Plus, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { casesAPI, clearfundAPI, Case, Obligation, BalanceSummary, ObligationMetrics } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectOption } from '@/components/ui/select';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { PageContainer, EmptyState } from '@/components/layout';
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

      // Load data individually to handle partial failures
      let obligationsRes = null;
      let balanceRes = null;
      let metricsRes = null;

      try {
        obligationsRes = await clearfundAPI.listObligations(selectedCase.id);
        setObligations(obligationsRes.items);
      } catch (err: any) {
        console.error('Failed to load obligations:', err);
        setObligations([]);
        if (err.status === 401) {
          setError('Authentication error loading obligations. Please try logging out and back in.');
        } else if (err.status === 403) {
          setError('You do not have access to this case.');
        }
      }

      try {
        balanceRes = await clearfundAPI.getBalance(selectedCase.id);
        setBalanceSummary(balanceRes);
      } catch (err: any) {
        console.error('Failed to load balance:', err);
        setBalanceSummary(null);
      }

      try {
        metricsRes = await clearfundAPI.getMetrics(selectedCase.id);
        setMetrics(metricsRes);
      } catch (err: any) {
        console.error('Failed to load metrics:', err);
        setMetrics(null);
      }
    } catch (err: any) {
      console.error('ClearFund data load error:', err);
      setError(err.message || 'Failed to load payment data');
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
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageContainer>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading payments...</p>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!selectedCase) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageContainer>
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={DollarSign}
                title="No Cases Found"
                description="You need to create or join a case to access ClearFund payments."
                action={{
                  label: 'Go to Cases',
                  onClick: () => router.push('/cases'),
                }}
              />
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  const filteredObligations = getFilteredObligations();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <div className="border-b border-border bg-card">
        <PageContainer className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-cg-success" />
                ClearFund
              </h1>
              <p className="text-muted-foreground mt-1">Purpose-locked financial obligations for {selectedCase.case_name}</p>
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
            <div className="mt-4 max-w-xs">
              <Select
                value={selectedCase.id}
                onChange={(e) => {
                  const case_ = cases.find(c => c.id === e.target.value);
                  if (case_) setSelectedCase(case_);
                }}
              >
                {cases.map(case_ => (
                  <SelectOption key={case_.id} value={case_.id}>{case_.case_name}</SelectOption>
                ))}
              </Select>
            </div>
          )}
        </PageContainer>
      </div>

      <PageContainer className="py-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
        <div className="mt-8 mb-6 border-b border-border overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-smooth ${
                activeTab === 'pending'
                  ? 'border-cg-warning text-cg-warning'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="h-5 w-5" />
              Pending
              {metrics && metrics.total_pending_funding > 0 && (
                <Badge variant="warning" size="sm">{metrics.total_pending_funding}</Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-smooth ${
                activeTab === 'active'
                  ? 'border-cg-primary text-cg-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              Active
              {metrics && metrics.total_funded > 0 && (
                <Badge variant="default" size="sm">{metrics.total_funded}</Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-smooth ${
                activeTab === 'completed'
                  ? 'border-cg-success text-cg-success'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              Completed
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-smooth ${
                activeTab === 'ledger'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
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
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading obligations...</p>
              </div>
            ) : filteredObligations.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={DollarSign}
                    title={`No ${activeTab} obligations`}
                    description={
                      activeTab === 'pending'
                        ? 'Create a new expense to get started.'
                        : activeTab === 'active'
                        ? 'No obligations are currently being processed.'
                        : 'No completed obligations yet.'
                    }
                    action={activeTab === 'pending' ? {
                      label: 'Create Expense',
                      onClick: () => router.push('/payments/new'),
                    } : undefined}
                  />
                </CardContent>
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
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={FileText}
                title="Transaction Ledger"
                description="View the complete financial history for this case."
                action={{
                  label: 'View Full Ledger',
                  onClick: () => router.push(`/payments/ledger?case_id=${selectedCase.id}`),
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Overdue Warning */}
        {metrics && metrics.total_overdue > 0 && (
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">
                {metrics.total_overdue} Overdue Obligation{metrics.total_overdue > 1 ? 's' : ''}
              </span>
              <span className="block text-sm mt-1">
                Please address overdue obligations to maintain compliance.
              </span>
            </AlertDescription>
          </Alert>
        )}
      </PageContainer>
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
