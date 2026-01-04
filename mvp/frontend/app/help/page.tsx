'use client';

import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { PageContainer } from '@/components/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  Search,
  ChevronRight,
  FileText,
  Calendar,
  MessageSquare,
  Wallet,
  Shield,
  Users,
} from 'lucide-react';

/**
 * Help Center Hub Page
 *
 * Design: Central hub for all help resources.
 * Philosophy: "Help should be easy to find when you need it."
 */

interface QuickLink {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const quickLinks: QuickLink[] = [
  {
    title: 'FAQs',
    description: 'Answers to common questions',
    icon: HelpCircle,
    href: '/help/faq',
  },
  {
    title: 'Guides',
    description: 'Step-by-step tutorials',
    icon: BookOpen,
    href: '/help/guides',
  },
  {
    title: 'Contact Support',
    description: 'Get personalized help',
    icon: MessageCircle,
    href: '/help/contact',
  },
];

interface PopularTopic {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  questions: string[];
}

const popularTopics: PopularTopic[] = [
  {
    title: 'Getting Started',
    icon: Users,
    questions: [
      'How do I create a case?',
      'How do I invite my co-parent?',
      'What happens after they accept?',
    ],
  },
  {
    title: 'SharedCare Agreements',
    icon: FileText,
    questions: [
      'How do I create a custody agreement?',
      'How does dual approval work?',
      'Can I modify an agreement?',
    ],
  },
  {
    title: 'TimeBridge & Exchanges',
    icon: Calendar,
    questions: [
      'How do I add events to TimeBridge?',
      'How does Silent Handoff GPS check-in work?',
      'What is the grace period?',
    ],
  },
  {
    title: 'Messages & ARIA',
    icon: MessageSquare,
    questions: [
      'What is ARIA moderation?',
      'Why was my message flagged?',
      'Can I turn off ARIA suggestions?',
    ],
  },
];

function HelpContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <PageContainer>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            How can we help?
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Search our help center or browse popular topics below
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for help..."
              className="pl-12 h-12 text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // In production, this would search the help content
                  router.push('/help/faq');
                }
              }}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-3 mb-12">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.href}
                className="cursor-pointer hover:border-cg-primary/50 transition-smooth"
                onClick={() => router.push(link.href)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-cg-primary-subtle rounded-lg">
                    <Icon className="h-6 w-6 text-cg-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {link.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Popular Topics */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Popular Topics
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {popularTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <Card key={topic.title}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      {topic.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {topic.questions.map((question, idx) => (
                        <li key={idx}>
                          <button
                            onClick={() => router.push('/help/faq')}
                            className="text-sm text-muted-foreground hover:text-cg-primary transition-colors text-left w-full"
                          >
                            {question}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Contact Support CTA */}
        <section className="mt-12">
          <Card className="bg-gradient-to-r from-cg-primary-subtle to-cg-secondary-subtle border-0">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-cg-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Still need help?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Our support team is here to help you with any questions about
                CommonGround.
              </p>
              <Button onClick={() => router.push('/help/contact')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </section>
      </PageContainer>
    </div>
  );
}

export default function HelpPage() {
  return (
    <ProtectedRoute>
      <HelpContent />
    </ProtectedRoute>
  );
}
