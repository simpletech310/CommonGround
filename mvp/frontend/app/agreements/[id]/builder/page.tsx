'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { agreementsAPI, Agreement, AgreementSection } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';

// Import section components
import { IntroSection } from '@/components/agreements/sections/intro';
import { ParentInfoSection } from '@/components/agreements/sections/parent-info';
import { OtherParentInfoSection } from '@/components/agreements/sections/other-parent-info';
import { ChildrenInfoSection } from '@/components/agreements/sections/children-info';
import { LegalCustodySection } from '@/components/agreements/sections/legal-custody';
import { PhysicalCustodySection } from '@/components/agreements/sections/physical-custody';
import { ParentingScheduleSection } from '@/components/agreements/sections/parenting-schedule';
import { HolidayScheduleSection } from '@/components/agreements/sections/holiday-schedule';
import { ExchangeLogisticsSection } from '@/components/agreements/sections/exchange-logistics';
import { TransportationSection } from '@/components/agreements/sections/transportation';
import { ChildSupportSection } from '@/components/agreements/sections/child-support';
import { MedicalHealthcareSection } from '@/components/agreements/sections/medical-healthcare';
import { EducationSection } from '@/components/agreements/sections/education';
import { ParentCommunicationSection } from '@/components/agreements/sections/parent-communication';
import { ChildCommunicationSection } from '@/components/agreements/sections/child-communication';
import { TravelSection } from '@/components/agreements/sections/travel';
import { RelocationSection } from '@/components/agreements/sections/relocation';
import { DisputeResolutionSection } from '@/components/agreements/sections/dispute-resolution';
import { OtherProvisionsSection } from '@/components/agreements/sections/other-provisions';
import { ReviewSection } from '@/components/agreements/sections/review';

// Define section types
type SectionKey =
  | 'intro'
  | 'parent_info'
  | 'other_parent_info'
  | 'children_info'
  | 'legal_custody'
  | 'physical_custody'
  | 'parenting_schedule'
  | 'holiday_schedule'
  | 'exchange_logistics'
  | 'transportation'
  | 'child_support'
  | 'medical_healthcare'
  | 'education'
  | 'parent_communication'
  | 'child_communication'
  | 'travel'
  | 'relocation'
  | 'dispute_resolution'
  | 'other_provisions'
  | 'review';

interface SectionConfig {
  key: SectionKey;
  title: string;
  number: number;
  component: React.ComponentType<SectionProps>;
}

interface SectionProps {
  data: any;
  onSave: (data: any) => Promise<void>;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const SECTIONS: SectionConfig[] = [
  { key: 'intro', title: 'Welcome', number: 0, component: IntroSection },
  { key: 'parent_info', title: 'Your Information', number: 1, component: ParentInfoSection },
  { key: 'other_parent_info', title: "Other Parent's Information", number: 2, component: OtherParentInfoSection },
  { key: 'children_info', title: 'Children Information', number: 3, component: ChildrenInfoSection },
  { key: 'legal_custody', title: 'Legal Custody', number: 4, component: LegalCustodySection },
  { key: 'physical_custody', title: 'Physical Custody', number: 5, component: PhysicalCustodySection },
  { key: 'parenting_schedule', title: 'Parenting Schedule', number: 6, component: ParentingScheduleSection },
  { key: 'holiday_schedule', title: 'Holiday Schedule', number: 7, component: HolidayScheduleSection },
  { key: 'exchange_logistics', title: 'Exchange Logistics', number: 8, component: ExchangeLogisticsSection },
  { key: 'transportation', title: 'Transportation', number: 9, component: TransportationSection },
  { key: 'child_support', title: 'Child Support', number: 10, component: ChildSupportSection },
  { key: 'medical_healthcare', title: 'Medical & Healthcare', number: 11, component: MedicalHealthcareSection },
  { key: 'education', title: 'Education', number: 12, component: EducationSection },
  { key: 'parent_communication', title: 'Parent Communication', number: 13, component: ParentCommunicationSection },
  { key: 'child_communication', title: 'Child Communication', number: 14, component: ChildCommunicationSection },
  { key: 'travel', title: 'Travel', number: 15, component: TravelSection },
  { key: 'relocation', title: 'Relocation', number: 16, component: RelocationSection },
  { key: 'dispute_resolution', title: 'Dispute Resolution', number: 17, component: DisputeResolutionSection },
  { key: 'other_provisions', title: 'Other Provisions', number: 18, component: OtherProvisionsSection },
  { key: 'review', title: 'Review & Finalize', number: 19, component: ReviewSection },
];

function AgreementBuilderContent() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const agreementId = params.id as string;

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [sections, setSections] = useState<AgreementSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAgreement();
  }, [agreementId]);

  const loadAgreement = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [agreementData, sectionsData] = await Promise.all([
        agreementsAPI.get(agreementId),
        agreementsAPI.getSections(agreementId),
      ]);

      setAgreement(agreementData);
      setSections(sectionsData);

      // Load existing section data into state
      const dataMap: Record<string, any> = {};
      sectionsData.forEach((section) => {
        dataMap[section.section_type] = section.content;
      });
      setSectionData(dataMap);
    } catch (err: any) {
      console.error('Failed to load agreement:', err);
      setError(err.message || 'Failed to load agreement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSection = async (data: any) => {
    try {
      setIsSaving(true);
      setError(null);

      const currentSection = SECTIONS[currentSectionIndex];
      const sectionKey = currentSection.key;

      // Find or create section
      const existingSection = sections.find((s) => s.section_type === sectionKey);

      if (existingSection) {
        // Update existing section
        await agreementsAPI.updateSection(agreementId, existingSection.id, {
          content: data,
        });
      } else {
        // Create new section (this would need a new API endpoint)
        // For now, we'll just save to local state
        console.log('Would create new section:', sectionKey, data);
      }

      // Update local state
      setSectionData((prev) => ({
        ...prev,
        [sectionKey]: data,
      }));
    } catch (err: any) {
      console.error('Failed to save section:', err);
      setError(err.message || 'Failed to save section');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (currentSectionIndex < SECTIONS.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getProgressPercentage = () => {
    return Math.round((currentSectionIndex / SECTIONS.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agreement builder...</p>
        </div>
      </div>
    );
  }

  if (error && !agreement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={() => router.push('/agreements')}>
              Back to Agreements
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSection = SECTIONS[currentSectionIndex];
  const SectionComponent = currentSection.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Agreement Builder</h1>
              <p className="text-sm text-gray-500">{agreement?.title}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/agreements/${agreementId}`)}
            >
              Save & Exit
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Section {currentSection.number + 1} of {SECTIONS.length}
            </span>
            <span className="text-sm text-gray-500">
              {getProgressPercentage()}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section Navigation Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm overflow-x-auto">
            {SECTIONS.map((section, index) => (
              <div key={section.key} className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setCurrentSectionIndex(index)}
                  className={`px-2 py-1 rounded transition-colors ${
                    index === currentSectionIndex
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : index < currentSectionIndex
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400'
                  }`}
                  disabled={index > currentSectionIndex + 1}
                >
                  {index === currentSectionIndex && '▶ '}
                  {section.number > 0 ? `${section.number}.` : ''} {section.title}
                  {index < currentSectionIndex && ' ✓'}
                </button>
                {index < SECTIONS.length - 1 && (
                  <span className="text-gray-300">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <SectionComponent
          data={sectionData[currentSection.key] || {}}
          onSave={handleSaveSection}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirst={currentSectionIndex === 0}
          isLast={currentSectionIndex === SECTIONS.length - 1}
        />
      </main>
    </div>
  );
}

export default function AgreementBuilderPage() {
  return (
    <ProtectedRoute>
      <AgreementBuilderContent />
    </ProtectedRoute>
  );
}
