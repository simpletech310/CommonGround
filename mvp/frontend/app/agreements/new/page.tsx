'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { agreementsAPI, CreateAgreementRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProtectedRoute } from '@/components/protected-route';

function CreateAgreementContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case');

  const [title, setTitle] = useState('');
  const [agreementType, setAgreementType] = useState<'parenting_plan' | 'modification' | 'temporary'>('parenting_plan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!caseId) {
      setError('No case selected');
      return;
    }

    if (!title.trim()) {
      setError('Agreement title is required');
      return;
    }

    try {
      setIsSubmitting(true);

      const data: CreateAgreementRequest = {
        case_id: caseId,
        title,
        agreement_type: agreementType,
      };

      const newAgreement = await agreementsAPI.create(data);

      // Redirect to agreement builder wizard
      router.push(`/agreements/${newAgreement.id}/builder`);
    } catch (err: any) {
      console.error('Failed to create agreement:', err);
      setError(err.message || 'Failed to create agreement');
      setIsSubmitting(false);
    }
  };

  if (!caseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Case Selected</CardTitle>
            <CardDescription>Please select a case first</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/cases">
              <Button>Go to Cases</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
              CommonGround
            </Link>
            <Link href="/agreements">
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Agreements
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Agreement</h1>
          <p className="mt-2 text-gray-600">
            Start building a comprehensive custody agreement
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Agreement Details</CardTitle>
              <CardDescription>
                Provide basic information about this agreement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Agreement Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Custody Agreement 2026, Summer Parenting Plan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A descriptive name for this agreement
                </p>
              </div>

              <div>
                <Label htmlFor="type">Agreement Type *</Label>
                <select
                  id="type"
                  value={agreementType}
                  onChange={(e) => setAgreementType(e.target.value as any)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="parenting_plan">Parenting Plan</option>
                  <option value="modification">Modification</option>
                  <option value="temporary">Temporary Agreement</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the type of agreement you're creating
                </p>
              </div>

              <div className="pt-4">
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Agreement...
                    </>
                  ) : (
                    <>
                      Start Building Agreement
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* What's Next */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Complete 18 sections covering all aspects of custody</li>
                  <li>Review and edit your agreement</li>
                  <li>Both parents must approve the final agreement</li>
                  <li>Generate a court-ready PDF document</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Preview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Agreement Sections</CardTitle>
            <CardDescription>
              You'll complete these 18 sections in the wizard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                '1. Basic Information',
                '2. Legal Custody',
                '3. Physical Custody Schedule',
                '4. Holiday Schedule',
                '5. Vacation Time',
                '6. Decision Making Authority',
                '7. Communication Protocol',
                '8. Exchange Procedures',
                '9. Child Expenses',
                '10. Medical Decisions',
                '11. Education Decisions',
                '12. Religious Upbringing',
                '13. Extracurricular Activities',
                '14. Technology & Media',
                '15. Dispute Resolution',
                '16. Modifications',
                '17. Confidentiality',
                '18. Signature & Consent',
              ].map((section) => (
                <div key={section} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-700">{section}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function CreateAgreementPage() {
  return (
    <ProtectedRoute>
      <CreateAgreementContent />
    </ProtectedRoute>
  );
}
