'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { casesAPI, clearfundAPI, Case, ObligationCategory, CreateObligationRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';

const categories: { value: ObligationCategory; label: string; description: string }[] = [
  { value: 'medical', label: 'Medical', description: 'Doctor visits, medications, therapy' },
  { value: 'education', label: 'Education', description: 'Tuition, supplies, tutoring' },
  { value: 'sports', label: 'Sports', description: 'Equipment, fees, uniforms' },
  { value: 'extracurricular', label: 'Extracurricular', description: 'Music lessons, clubs, activities' },
  { value: 'device', label: 'Device', description: 'Phone, tablet, computer' },
  { value: 'camp', label: 'Camp', description: 'Summer camp, day camp' },
  { value: 'clothing', label: 'Clothing', description: 'School clothes, seasonal items' },
  { value: 'transportation', label: 'Transportation', description: 'Travel costs, gas reimbursement' },
  { value: 'childcare', label: 'Childcare', description: 'Daycare, babysitting' },
  { value: 'child_support', label: 'Child Support', description: 'Regular support payments' },
  { value: 'other', label: 'Other', description: 'Other child-related expenses' },
];

function NewExpenseContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ObligationCategory>('medical');
  const [totalAmount, setTotalAmount] = useState('');
  const [petitionerPercentage, setPetitionerPercentage] = useState(50);
  const [dueDate, setDueDate] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(true);
  const [receiptRequired, setReceiptRequired] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      const data = await casesAPI.list();
      setCases(data.filter(c => c.status === 'active'));

      if (data.length > 0) {
        const activeCase = data.find(c => c.status === 'active');
        if (activeCase) {
          setSelectedCaseId(activeCase.id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCaseId) {
      setError('Please select a case');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const data: CreateObligationRequest = {
        case_id: selectedCaseId,
        source_type: 'request',
        purpose_category: category,
        title: title.trim(),
        description: description.trim() || undefined,
        total_amount: amount.toFixed(2),  // Send as string with 2 decimal places
        petitioner_percentage: petitionerPercentage,
        due_date: dueDate || undefined,
        verification_required: verificationRequired,
        receipt_required: receiptRequired,
        notes: notes.trim() || undefined,
      };

      const obligation = await clearfundAPI.createObligation(data);
      router.push(`/payments/${obligation.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto p-8">
          <Card className="p-8 text-center">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Active Cases</h2>
            <p className="text-gray-600 mb-4">
              You need an active case to create expense requests.
            </p>
            <Button onClick={() => router.push('/cases')}>
              Go to Cases
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const respondentPercentage = 100 - petitionerPercentage;
  const amount = parseFloat(totalAmount) || 0;
  const petitionerShare = (amount * petitionerPercentage) / 100;
  const respondentShare = amount - petitionerShare;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/payments')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Payments
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-green-600" />
            New Expense Request
          </h1>
          <p className="text-gray-600 mt-1">
            Create a purpose-locked financial obligation
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="p-6">
            <div className="space-y-6">
              {/* Case Selection */}
              {cases.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Case
                  </label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>{c.case_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Emma's Dental Visit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  maxLength={200}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        category === cat.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-sm">{cat.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              {/* Split Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Split
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={petitionerPercentage}
                      onChange={(e) => setPetitionerPercentage(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Petitioner: {petitionerPercentage}%</span>
                      <span>Respondent: {respondentPercentage}%</span>
                    </div>
                  </div>
                </div>
                {amount > 0 && (
                  <div className="flex justify-between text-sm mt-2 p-2 bg-gray-50 rounded">
                    <span>Petitioner: ${petitionerShare.toFixed(2)}</span>
                    <span>Respondent: ${respondentShare.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about this expense..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                  maxLength={2000}
                />
              </div>

              {/* Requirements */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Requirements
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={verificationRequired}
                    onChange={(e) => setVerificationRequired(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Require verification (proof of payment)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={receiptRequired}
                    onChange={(e) => setReceiptRequired(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Require receipt upload</span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                  maxLength={2000}
                />
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/payments')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewExpensePage() {
  return (
    <ProtectedRoute>
      <NewExpenseContent />
    </ProtectedRoute>
  );
}
