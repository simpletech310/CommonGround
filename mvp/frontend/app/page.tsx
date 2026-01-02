'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  FileText,
  Calendar,
  Shield,
  Users,
  Wallet,
  Gavel,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

/**
 * CommonGround Landing Page
 *
 * Design: Clean, professional, court-credible.
 * Philosophy: "Quietly modern. Emotionally safe. Court-credible."
 */

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-foreground">CommonGround</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="default" className="mb-6">
              AI-Powered Co-Parenting Platform
            </Badge>
            <h1 className="text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
              Where co-parents find{' '}
              <span className="text-primary">common ground</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
              Reduce conflict, communicate effectively, and focus on what matters most:
              your children. Built with AI to help families navigate co-parenting with care.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/court-portal">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Gavel className="mr-2 h-4 w-4" />
                  Court Portal
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-cg-success" />
                Court-ready documentation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-cg-success" />
                Secure & private
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-cg-success" />
                Free to start
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Everything you need for peaceful co-parenting
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              One platform to manage communication, schedules, finances, and agreements
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={MessageSquare}
              title="ARIA Messaging"
              description="AI-powered communication that analyzes messages in real-time, reducing conflict and suggesting healthier ways to communicate."
              highlight
            />
            <FeatureCard
              icon={FileText}
              title="Agreement Builder"
              description="Create comprehensive custody agreements with guided interviews. Generate court-ready PDFs that both parents can approve."
            />
            <FeatureCard
              icon={Calendar}
              title="Schedule Management"
              description="Track parenting time, custody exchanges, and special events. Automatic compliance tracking and check-in verification."
            />
            <FeatureCard
              icon={Wallet}
              title="ClearFund Payments"
              description="Track child-related expenses, manage reimbursements, and maintain transparent financial records for court."
            />
            <FeatureCard
              icon={Shield}
              title="Court Documentation"
              description="Export verified evidence packages with hash-verified integrity. Timeline reports, communication logs, and compliance summaries."
            />
            <FeatureCard
              icon={Gavel}
              title="Court Portal"
              description="Separate access for judges, GALs, and attorneys. View-only dashboards with case summaries and compliance metrics."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Get started in minutes
            </h2>
            <p className="mt-3 text-muted-foreground">
              Simple setup, powerful results
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <StepCard
              number={1}
              title="Create your case"
              description="Set up your co-parenting case and invite the other parent to join."
            />
            <StepCard
              number={2}
              title="Build your agreement"
              description="Use our guided interview to create a comprehensive custody agreement."
            />
            <StepCard
              number={3}
              title="Start communicating"
              description="Send messages with AI assistance to maintain healthy communication."
            />
          </div>

          <div className="mt-12 text-center">
            <Link href="/register">
              <Button size="lg">
                Create your free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 bg-cg-primary-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Users className="h-12 w-12 text-cg-primary mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Every child deserves parents who can communicate effectively, even when they can't
              be together. CommonGround uses technology and AI to reduce conflict in separated
              families, making co-parenting easier, more transparent, and focused on what
              matters most: the children.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-foreground mb-2">CommonGround</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Reducing conflict in separated families through technology, transparency,
                and AI-powered communication.
              </p>
              <p className="text-sm text-muted-foreground">
                &copy; 2025 CommonGround. All rights reserved.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-medium text-foreground mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/register" className="hover:text-foreground transition-smooth">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-smooth">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/court-portal" className="hover:text-foreground transition-smooth">
                    Court Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-smooth">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-smooth">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon: Icon,
  title,
  description,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-primary/30 bg-accent/30' : ''}>
      <CardContent className="p-6">
        <div
          className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${
            highlight ? 'bg-cg-primary-subtle' : 'bg-secondary'
          }`}
        >
          <Icon className={`h-6 w-6 ${highlight ? 'text-cg-primary' : 'text-muted-foreground'}`} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

// Step Card Component
function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="h-12 w-12 rounded-full bg-cg-primary-subtle text-cg-primary flex items-center justify-center mx-auto mb-4 text-lg font-semibold">
        {number}
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
