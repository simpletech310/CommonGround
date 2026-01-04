'use client';

import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, FileText, Calendar } from 'lucide-react';

/**
 * Terms of Service Page
 *
 * Design: Clean, readable legal document.
 * Philosophy: "Terms should be fair and understandable."
 */

export default function TermsOfServicePage() {
  const router = useRouter();
  const lastUpdated = 'January 1, 2025';

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-smooth"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-foreground">
              CommonGround
            </h1>
            <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <PageContainer narrow>
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex p-3 bg-cg-primary-subtle rounded-full mb-4">
            <FileText className="h-8 w-8 text-cg-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Terms of Service
          </h1>
          <p className="flex items-center justify-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="prose prose-gray dark:prose-invert max-w-none p-8">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Agreement to Terms
              </h2>
              <p className="text-muted-foreground mb-4">
                These Terms of Service ("Terms") govern your access to and use of
                CommonGround, a co-parenting coordination platform ("Service")
                operated by CommonGround, Inc. ("we," "us," or "our").
              </p>
              <p className="text-muted-foreground mb-4">
                By creating an account or using our Service, you agree to be bound
                by these Terms. If you do not agree to these Terms, you may not
                access or use the Service.
              </p>
              <p className="text-muted-foreground">
                If you are using the Service on behalf of a minor child, you
                represent that you have legal authority to do so.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Description of Service
              </h2>
              <p className="text-muted-foreground mb-4">
                CommonGround provides a platform for separated parents to
                coordinate co-parenting responsibilities, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>Secure messaging with AI-assisted moderation (ARIA)</li>
                <li>Custody agreement creation and management</li>
                <li>Shared scheduling and calendar coordination</li>
                <li>Exchange tracking and GPS verification</li>
                <li>Expense tracking and payment coordination</li>
                <li>Court-ready document generation and export</li>
                <li>Legal professional access management</li>
              </ul>
              <p className="text-muted-foreground">
                The Service is designed to reduce conflict and improve
                communication between co-parents while maintaining records that
                may be used in legal proceedings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                User Accounts
              </h2>

              <h3 className="text-lg font-medium text-foreground mb-2">
                Account Creation
              </h3>
              <p className="text-muted-foreground mb-4">
                To use the Service, you must create an account with accurate and
                complete information. You are responsible for maintaining the
                security of your account credentials and for all activities that
                occur under your account.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">
                Account Requirements
              </h3>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>You must be at least 18 years old</li>
                <li>You must provide accurate personal information</li>
                <li>You may only create one account per person</li>
                <li>You are responsible for keeping your password secure</li>
                <li>You must notify us immediately of any unauthorized access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Acceptable Use
              </h2>
              <p className="text-muted-foreground mb-4">
                You agree to use the Service only for its intended purpose of
                co-parenting coordination. You agree NOT to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>Use the Service to harass, threaten, or abuse others</li>
                <li>Send false, misleading, or fraudulent information</li>
                <li>Attempt to circumvent ARIA moderation features</li>
                <li>Share your account credentials with others</li>
                <li>Access accounts belonging to other users</li>
                <li>Upload malicious code or attempt to hack the Service</li>
                <li>Use the Service for any illegal purpose</li>
                <li>Violate any court orders or legal requirements</li>
                <li>Create false or misleading court records</li>
              </ul>
              <p className="text-muted-foreground">
                Violations of these rules may result in account suspension or
                termination and may be reported to relevant authorities.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Content and Communications
              </h2>

              <h3 className="text-lg font-medium text-foreground mb-2">
                Your Content
              </h3>
              <p className="text-muted-foreground mb-4">
                You retain ownership of any content you submit to the Service,
                including messages, documents, and files. By using the Service,
                you grant us a license to store, process, and transmit your
                content as necessary to provide the Service.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">
                ARIA Moderation
              </h3>
              <p className="text-muted-foreground mb-4">
                Messages sent through CommonGround are analyzed by our AI
                assistant (ARIA) to help reduce conflict. You acknowledge that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>ARIA may flag messages that contain hostile or inflammatory language</li>
                <li>ARIA may suggest alternative phrasings for your messages</li>
                <li>Your acceptance or rejection of suggestions is recorded</li>
                <li>ARIA moderation may be required by court order in some cases</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-2">
                Record Keeping
              </h3>
              <p className="text-muted-foreground mb-4">
                All communications and activities within the Service are logged
                and may be included in court-ready reports. By using the Service,
                you acknowledge that your communications may be used as evidence
                in legal proceedings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Fees and Payment
              </h2>
              <p className="text-muted-foreground mb-4">
                CommonGround offers both free and paid subscription tiers.
                Premium features require a paid subscription. By subscribing,
                you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>Pay all applicable fees as described at signup</li>
                <li>Provide accurate billing information</li>
                <li>Authorize automatic renewal unless you cancel</li>
                <li>Accept that fees are non-refundable except as required by law</li>
              </ul>
              <p className="text-muted-foreground">
                We may change our fees with 30 days notice. Continued use after
                a price change constitutes acceptance of the new pricing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Intellectual Property
              </h2>
              <p className="text-muted-foreground mb-4">
                The Service, including its design, features, and content
                (excluding user-submitted content), is owned by CommonGround
                and protected by copyright, trademark, and other intellectual
                property laws.
              </p>
              <p className="text-muted-foreground">
                You may not copy, modify, distribute, or create derivative works
                of the Service without our prior written consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Limitation of Liability
              </h2>
              <p className="text-muted-foreground mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>
                  The Service is provided "AS IS" without warranties of any kind
                </li>
                <li>
                  We do not guarantee uninterrupted or error-free operation
                </li>
                <li>
                  We are not liable for any indirect, incidental, special, or
                  consequential damages
                </li>
                <li>
                  Our total liability shall not exceed the fees you paid in the
                  12 months preceding the claim
                </li>
              </ul>
              <p className="text-muted-foreground">
                CommonGround is a technology platform, not a law firm. We do not
                provide legal advice. Agreements and documents generated through
                the Service should be reviewed by a qualified attorney.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Dispute Resolution
              </h2>
              <p className="text-muted-foreground mb-4">
                Any disputes arising from these Terms or your use of the Service
                shall be resolved through binding arbitration in accordance with
                the American Arbitration Association rules, except for claims
                that may be brought in small claims court.
              </p>
              <p className="text-muted-foreground">
                You agree to waive your right to a jury trial and to participate
                in class action lawsuits against CommonGround.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Account Termination
              </h2>
              <p className="text-muted-foreground mb-4">
                You may close your account at any time through your account
                settings. We may suspend or terminate your account if you violate
                these Terms or if required by law or court order.
              </p>
              <p className="text-muted-foreground mb-4">
                Upon termination:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>Your access to the Service will be revoked</li>
                <li>Some data may be retained as required by law</li>
                <li>You may request an export of your data before closure</li>
                <li>Outstanding fees remain due and payable</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Changes to Terms
              </h2>
              <p className="text-muted-foreground mb-4">
                We may modify these Terms at any time. We will notify you of
                material changes by email or through the Service. Your continued
                use after changes take effect constitutes acceptance of the
                revised Terms.
              </p>
              <p className="text-muted-foreground">
                If you do not agree to the revised Terms, you must stop using
                the Service and close your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Governing Law
              </h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by the laws of the State of
                California, without regard to conflict of law principles. Any
                legal action must be brought in the state or federal courts
                located in Los Angeles County, California.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Contact Information
              </h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <ul className="text-muted-foreground space-y-1">
                <li>
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:legal@commonground.app"
                    className="text-cg-primary hover:underline"
                  >
                    legal@commonground.app
                  </a>
                </li>
                <li>
                  <strong>Support:</strong>{' '}
                  <a
                    href="mailto:support@commonground.app"
                    className="text-cg-primary hover:underline"
                  >
                    support@commonground.app
                  </a>
                </li>
              </ul>
            </section>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 pb-8 text-center text-sm text-muted-foreground">
          <a
            href="/legal/privacy"
            className="hover:text-foreground transition-smooth"
          >
            Privacy Policy
          </a>
          <span className="mx-3">|</span>
          <a href="/help" className="hover:text-foreground transition-smooth">
            Help Center
          </a>
        </div>
      </PageContainer>
    </div>
  );
}
