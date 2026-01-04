'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { PageContainer, PageHeader } from '@/components/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Wallet,
  Download,
  Clock,
  ChevronRight,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

/**
 * Guides Page
 *
 * Design: Step-by-step tutorials for common tasks.
 * Philosophy: "Show, don't just tell."
 */

interface Guide {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  readTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  steps: GuideStep[];
}

interface GuideStep {
  title: string;
  description: string;
}

const guides: Guide[] = [
  {
    id: 'create-case',
    title: 'Creating Your First Case',
    description:
      'Learn how to set up a co-parenting case and invite your co-parent to join.',
    icon: Users,
    readTime: '5 min',
    difficulty: 'Beginner',
    steps: [
      {
        title: 'Go to Cases',
        description:
          'From the dashboard, click "Cases" in the navigation bar, then click "New Case".',
      },
      {
        title: 'Enter Your Information',
        description:
          'Fill in your role (petitioner or respondent), your name as it appears on court documents, and your contact information.',
      },
      {
        title: 'Add Your Children',
        description:
          "Enter each child's name, date of birth, and any important information like allergies or special needs.",
      },
      {
        title: 'Invite Your Co-Parent',
        description:
          "Enter your co-parent's email address. They'll receive an invitation to join the case.",
      },
      {
        title: 'Wait for Acceptance',
        description:
          "Your case will be in 'pending' status until your co-parent accepts the invitation. Once they do, you can start building your agreement.",
      },
    ],
  },
  {
    id: 'build-agreement',
    title: 'Building a Custody Agreement',
    description:
      'Use our guided interview to create a comprehensive custody agreement that covers all important areas.',
    icon: FileText,
    readTime: '15 min',
    difficulty: 'Intermediate',
    steps: [
      {
        title: 'Start the Agreement Builder',
        description:
          'Go to your case details and click "Build Agreement" to start the guided interview.',
      },
      {
        title: 'Complete Each Section',
        description:
          'Answer questions about custody type, parenting schedule, holidays, and more. You can save your progress and return later.',
      },
      {
        title: 'Review Your Answers',
        description:
          'Before submitting, review all sections to make sure everything is accurate and complete.',
      },
      {
        title: 'Submit for Co-Parent Review',
        description:
          'Once you submit, your co-parent will be notified to review and complete their portions.',
      },
      {
        title: 'Approve the Agreement',
        description:
          'Both parents must approve the final agreement. Once both approve, it becomes active and can be exported as a PDF.',
      },
    ],
  },
  {
    id: 'aria-messaging',
    title: 'Using ARIA for Better Communication',
    description:
      'Learn how our AI assistant helps you communicate more effectively with your co-parent.',
    icon: MessageSquare,
    readTime: '7 min',
    difficulty: 'Beginner',
    steps: [
      {
        title: 'Compose Your Message',
        description:
          'Go to Messages and select your case. Type your message in the compose area as you normally would.',
      },
      {
        title: 'Review ARIA Suggestions',
        description:
          "If ARIA detects language that might escalate conflict, you'll see a suggestion for a calmer alternative.",
      },
      {
        title: 'Choose Your Action',
        description:
          'You can accept the suggestion, modify it, or send your original message. ARIA tracks these choices to help improve your communication score.',
      },
      {
        title: 'Build Good Faith',
        description:
          'Consistently accepting helpful suggestions improves your Good Faith score, which can be included in court reports.',
      },
    ],
  },
  {
    id: 'schedule-management',
    title: 'Managing Your Schedule',
    description:
      'Keep track of parenting time, exchanges, and important dates with the shared calendar.',
    icon: Calendar,
    readTime: '8 min',
    difficulty: 'Beginner',
    steps: [
      {
        title: 'View Your Calendar',
        description:
          'Go to Schedule to see all upcoming events. Use the month/week toggle to change your view.',
      },
      {
        title: 'Add Events',
        description:
          "Click 'Add Event' to create appointments, activities, or reminders. Set the responsible parent and add location details.",
      },
      {
        title: 'Set Up Recurring Events',
        description:
          "For regular parenting time, create recurring events that repeat weekly or bi-weekly according to your agreement.",
      },
      {
        title: 'Check In for Exchanges',
        description:
          'When arriving for an exchange, use the check-in feature to log your arrival time and location.',
      },
      {
        title: 'Track Compliance',
        description:
          'The compliance dashboard shows on-time percentages and any late arrivals for both parents.',
      },
    ],
  },
  {
    id: 'expense-tracking',
    title: 'Tracking Expenses',
    description:
      'Log child-related expenses, request reimbursements, and keep a clear financial record.',
    icon: Wallet,
    readTime: '6 min',
    difficulty: 'Intermediate',
    steps: [
      {
        title: 'Log an Expense',
        description:
          "Go to Payments and click 'Add Expense'. Enter the amount, category, and description.",
      },
      {
        title: 'Upload Receipt',
        description:
          "Take a photo of your receipt or upload an existing image. This provides proof for your co-parent and court records.",
      },
      {
        title: 'Request Reimbursement',
        description:
          "Based on your agreement's expense split, submit the expense for your co-parent's approval.",
      },
      {
        title: 'Approve or Dispute',
        description:
          "When you receive an expense request, review it and either approve or dispute with a reason.",
      },
      {
        title: 'Track Your Balance',
        description:
          'The payment ledger shows all expenses and payments, with running balances for each parent.',
      },
    ],
  },
  {
    id: 'court-export',
    title: 'Exporting Records for Court',
    description:
      'Generate professional court-ready reports with verified records and integrity hashes.',
    icon: Download,
    readTime: '5 min',
    difficulty: 'Advanced',
    steps: [
      {
        title: 'Go to Case Export',
        description:
          "From your case details, click 'Export Records' to start the export wizard.",
      },
      {
        title: 'Select Date Range',
        description:
          'Choose the start and end dates for the records you want to include.',
      },
      {
        title: 'Choose Sections',
        description:
          'Select which types of records to include: messages, schedule compliance, agreements, or payments.',
      },
      {
        title: 'Generate Report',
        description:
          'Click Generate and wait for your PDF to be created. This may take a few moments for large date ranges.',
      },
      {
        title: 'Download and Verify',
        description:
          'Download your report. It includes a SHA-256 hash that courts can use to verify the document has not been altered.',
      },
    ],
  },
];

function GuidesContent() {
  const router = useRouter();
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  const difficultyColors = {
    Beginner: 'bg-cg-success-subtle text-cg-success',
    Intermediate: 'bg-cg-warning-subtle text-cg-warning',
    Advanced: 'bg-cg-primary-subtle text-cg-primary',
  };

  if (selectedGuide) {
    const IconComponent = selectedGuide.icon;
    return (
      <div className="min-h-screen bg-background">
        <Navigation />

        <PageContainer>
          <PageHeader
            title={selectedGuide.title}
            description={selectedGuide.description}
            icon={IconComponent as any}
            backPath="/help/guides"
            backLabel="All Guides"
          />

          {/* Guide Meta */}
          <div className="flex items-center gap-4 mb-8">
            <Badge className={difficultyColors[selectedGuide.difficulty]}>
              {selectedGuide.difficulty}
            </Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {selectedGuide.readTime} read
            </span>
          </div>

          {/* Steps */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-8">
                {selectedGuide.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    {/* Step Number */}
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-cg-primary flex items-center justify-center text-white font-semibold">
                        {idx + 1}
                      </div>
                      {idx < selectedGuide.steps.length - 1 && (
                        <div className="w-0.5 h-full bg-border ml-4 mt-2" />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="pb-8">
                      <h3 className="font-semibold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completion */}
              <div className="mt-8 pt-8 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-cg-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">You're ready to go!</span>
                </div>
                <button
                  onClick={() => setSelectedGuide(null)}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  View more guides
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <PageContainer>
        <PageHeader
          title="Guides & Tutorials"
          description="Step-by-step instructions for getting the most out of CommonGround"
          icon={BookOpen}
          backPath="/help"
          backLabel="Help Center"
        />

        {/* Guides Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <Card
                key={guide.id}
                className="cursor-pointer hover:border-cg-primary/50 transition-smooth"
                onClick={() => setSelectedGuide(guide)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-cg-primary-subtle rounded-lg">
                      <Icon className="h-5 w-5 text-cg-primary" />
                    </div>
                    <Badge className={difficultyColors[guide.difficulty]}>
                      {guide.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {guide.readTime}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {guide.steps.length} steps
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PageContainer>
    </div>
  );
}

export default function GuidesPage() {
  return (
    <ProtectedRoute>
      <GuidesContent />
    </ProtectedRoute>
  );
}
