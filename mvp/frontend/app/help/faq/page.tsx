'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { PageContainer, PageHeader } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Wallet,
  Shield,
  Gavel,
  Settings,
} from 'lucide-react';

/**
 * FAQ Page
 *
 * Design: Searchable, categorized accordion FAQ.
 * Philosophy: "Answer questions before they're asked."
 */

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How do I create a new case?',
    answer:
      'To create a case, go to Cases from the main navigation and click "New Case". You\'ll enter your information, add your children, and invite your co-parent via email. Once they accept the invitation, you can start using all CommonGround features together.',
  },
  {
    category: 'Getting Started',
    question: 'How do I invite my co-parent?',
    answer:
      'When you create a new case, you\'ll be prompted to enter your co-parent\'s email address. They\'ll receive an invitation email with a link to join. They\'ll need to create an account (or sign in) to accept the invitation and join the case.',
  },
  {
    category: 'Getting Started',
    question: 'What happens after my co-parent accepts the invitation?',
    answer:
      'Once your co-parent accepts, the case becomes "active" and you can both access all features: messaging, agreements, schedule, and payments. You\'ll also be able to see each other\'s responses in the agreement builder.',
  },
  // Agreements
  {
    category: 'Agreements',
    question: 'How do I create a custody agreement?',
    answer:
      'Go to your case details and click "Build Agreement". You\'ll be guided through a comprehensive interview covering custody arrangements, schedules, communication rules, and more. Both parents must complete and approve the agreement for it to be finalized.',
  },
  {
    category: 'Agreements',
    question: 'How does dual approval work?',
    answer:
      'Both parents must review and approve the agreement before it becomes active. You\'ll each see the complete agreement and can approve it independently. Once both have approved, the agreement is locked and can be exported as a PDF for court.',
  },
  {
    category: 'Agreements',
    question: 'Can I modify an existing agreement?',
    answer:
      'Yes, you can create a modification by starting a new agreement that references the original. Both parents must approve any changes. The modification will include the date it takes effect and what sections changed.',
  },
  // TimeBridge & Exchanges
  {
    category: 'TimeBridge & Exchanges',
    question: 'How do I add events to TimeBridge?',
    answer:
      'Go to TimeBridge and click "Add Event". You can create one-time or recurring events, specify the parent responsible, add location details, and set up reminders. Events sync across both parents\' calendars automatically.',
  },
  {
    category: 'TimeBridge & Exchanges',
    question: 'How does Silent Handoff GPS check-in work?',
    answer:
      'When you arrive for an exchange, you can check in through Silent Handoff. If GPS verification is enabled, the app will confirm you\'re at the designated location. This creates a timestamped record that can be included in court reports via CaseExport.',
  },
  {
    category: 'TimeBridge & Exchanges',
    question: 'What is the grace period?',
    answer:
      'The grace period (default 15 minutes) allows for slight delays without marking you as late. If you check in within the grace period, you\'re still counted as on-time. This can be customized in your SharedCare agreement.',
  },
  // Messages & ARIA
  {
    category: 'Messages & ARIA',
    question: 'What is ARIA moderation?',
    answer:
      'ARIA is our AI-powered communication assistant that helps reduce conflict in messages. It analyzes messages for hostile language and suggests calmer alternatives before sending. ARIA helps you communicate more effectively with your co-parent.',
  },
  {
    category: 'Messages & ARIA',
    question: 'Why was my message flagged?',
    answer:
      'ARIA flags messages that contain language that might escalate conflict, such as hostile tones, blame, or profanity. You\'ll see a suggestion for how to rephrase the message. You can accept the suggestion, modify it, or send the original.',
  },
  {
    category: 'Messages & ARIA',
    question: 'Can I turn off ARIA suggestions?',
    answer:
      'ARIA suggestions are designed to help reduce conflict. In some cases, courts may require ARIA moderation to stay enabled. Check your notification settings to customize how you receive ARIA suggestions, but the core moderation cannot be disabled.',
  },
  // ClearFund
  {
    category: 'ClearFund',
    question: 'How do I log an expense?',
    answer:
      'Go to ClearFund and click "Add Expense". Enter the expense details, category, amount, and upload a receipt if you have one. Your co-parent will be notified and can approve or dispute the expense based on your SharedCare agreement terms.',
  },
  {
    category: 'ClearFund',
    question: 'How are expenses split?',
    answer:
      'Expense splits are determined by your SharedCare agreement. Common splits include 50/50 or income-proportional. When you log an expense, ClearFund automatically calculates each parent\'s share based on your agreed-upon percentages.',
  },
  // Account & Security
  {
    category: 'Account & Security',
    question: 'How do I change my password?',
    answer:
      'Go to Settings > Security. Enter your current password, then enter and confirm your new password. For security, we recommend using a strong password with at least 8 characters, including letters and numbers.',
  },
  {
    category: 'Account & Security',
    question: 'Is my information secure?',
    answer:
      'Yes. CommonGround uses bank-level encryption for all data. Your information is never shared with third parties. We comply with privacy regulations and provide audit logs for all account access.',
  },
  // Court & Legal
  {
    category: 'Court & Legal',
    question: 'How do I export records for court?',
    answer:
      'Go to your case and click "CaseExport". You can select a date range and choose which sections to include (messages, schedule compliance, payments). CaseExport generates a PDF with integrity verification that courts can validate.',
  },
  {
    category: 'Court & Legal',
    question: 'Can my attorney access my case?',
    answer:
      'Yes. You can grant your attorney, GAL, or mediator access through MediatorMode. They\'ll receive time-limited access to view case records. You control what they can see and can revoke access at any time.',
  },
];

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Getting Started': Users,
  'Agreements': FileText,
  'TimeBridge & Exchanges': Calendar,
  'Messages & ARIA': MessageSquare,
  'ClearFund': Wallet,
  'Account & Security': Shield,
  'Court & Legal': Gavel,
};

const categories = [...new Set(faqs.map((faq) => faq.category))];

function FAQContent() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter FAQs based on search and category
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === null || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedFaqs = categories.reduce(
    (acc, category) => {
      const categoryFaqs = filteredFaqs.filter((faq) => faq.category === category);
      if (categoryFaqs.length > 0) {
        acc[category] = categoryFaqs;
      }
      return acc;
    },
    {} as Record<string, FAQ[]>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <PageContainer>
        <PageHeader
          title="Frequently Asked Questions"
          description="Find answers to common questions about CommonGround"
          icon={HelpCircle}
          backPath="/help"
          backLabel="Help Center"
        />

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map((category) => {
              const Icon = categoryIcons[category] || HelpCircle;
              return (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {category}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* FAQs by Category */}
        {Object.keys(groupedFaqs).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No matching questions found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or{' '}
                <button
                  onClick={() => router.push('/help/contact')}
                  className="text-cg-primary hover:underline"
                >
                  contact support
                </button>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => {
              const Icon = categoryIcons[category] || HelpCircle;
              return (
                <section key={category}>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    {category}
                  </h2>
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {categoryFaqs.map((faq, idx) => {
                          const globalIndex = faqs.indexOf(faq);
                          const isExpanded = expandedIndex === globalIndex;
                          return (
                            <div key={globalIndex}>
                              <button
                                onClick={() =>
                                  setExpandedIndex(isExpanded ? null : globalIndex)
                                }
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-smooth"
                              >
                                <span className="font-medium text-foreground pr-4">
                                  {faq.question}
                                </span>
                                <ChevronDown
                                  className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                              {isExpanded && (
                                <div className="px-4 pb-4 text-muted-foreground">
                                  {faq.answer}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </section>
              );
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
}

export default function FAQPage() {
  return (
    <ProtectedRoute>
      <FAQContent />
    </ProtectedRoute>
  );
}
