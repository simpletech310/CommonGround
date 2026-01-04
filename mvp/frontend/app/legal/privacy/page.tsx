'use client';

import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Shield, Calendar } from 'lucide-react';

/**
 * Privacy Policy Page
 *
 * Design: Clean, readable legal document.
 * Philosophy: "Privacy should be transparent and understandable."
 */

export default function PrivacyPolicyPage() {
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
            <Shield className="h-8 w-8 text-cg-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Privacy Policy
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
                Introduction
              </h2>
              <p className="text-muted-foreground mb-4">
                CommonGround ("we," "our," or "us") is committed to protecting
                your privacy. This Privacy Policy explains how we collect, use,
                disclose, and safeguard your information when you use our
                co-parenting platform and related services.
              </p>
              <p className="text-muted-foreground">
                By using CommonGround, you consent to the data practices
                described in this policy. If you do not agree with the terms of
                this privacy policy, please do not access or use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Information We Collect
              </h2>

              <h3 className="text-lg font-medium text-foreground mb-2">
                Personal Information
              </h3>
              <p className="text-muted-foreground mb-4">
                We may collect personal information that you voluntarily provide
                when using our services, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>Name, email address, and phone number</li>
                <li>Physical address (for court documents and exchanges)</li>
                <li>Payment information (for premium features)</li>
                <li>Information about your children (names, ages, relevant details)</li>
                <li>Communications with your co-parent through our platform</li>
                <li>Schedule and exchange information</li>
                <li>Custody agreements and related documents</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-2">
                Automatically Collected Information
              </h3>
              <p className="text-muted-foreground mb-4">
                When you access our services, we may automatically collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>Device information (type, operating system, browser)</li>
                <li>IP address and location data (for GPS check-ins)</li>
                <li>Usage data (pages visited, features used)</li>
                <li>Timestamps and session information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                How We Use Your Information
              </h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>Provide and maintain our co-parenting platform</li>
                <li>Facilitate communication between co-parents</li>
                <li>Generate custody agreements and court-ready documents</li>
                <li>Track schedule compliance and exchange check-ins</li>
                <li>Provide AI-powered communication assistance (ARIA)</li>
                <li>Process payments for premium features</li>
                <li>Send notifications and reminders</li>
                <li>Improve our services and develop new features</li>
                <li>Respond to your inquiries and provide support</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Data Sharing and Disclosure
              </h2>
              <p className="text-muted-foreground mb-4">
                We may share your information in the following circumstances:
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">
                With Your Co-Parent
              </h3>
              <p className="text-muted-foreground mb-4">
                Information necessary for co-parenting coordination is shared
                between case participants, including messages, schedules, and
                agreement responses.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">
                With Legal Professionals
              </h3>
              <p className="text-muted-foreground mb-4">
                You may grant access to attorneys, guardians ad litem, mediators,
                or court personnel. They will only see information you explicitly
                authorize, and access is time-limited.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">
                Service Providers
              </h3>
              <p className="text-muted-foreground mb-4">
                We work with third-party service providers for hosting, payment
                processing, email delivery, and analytics. These providers are
                contractually obligated to protect your information.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-2">
                Legal Requirements
              </h3>
              <p className="text-muted-foreground mb-4">
                We may disclose information when required by law, court order,
                or to protect the rights, safety, or property of CommonGround
                or others.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Data Security
              </h2>
              <p className="text-muted-foreground mb-4">
                We implement industry-standard security measures to protect your
                information, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>Encryption in transit (TLS 1.3) and at rest</li>
                <li>Secure authentication with optional two-factor authentication</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and audit logging</li>
                <li>Employee training on data protection</li>
              </ul>
              <p className="text-muted-foreground">
                While we strive to protect your information, no method of
                transmission over the Internet is 100% secure. We cannot
                guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Children's Privacy
              </h2>
              <p className="text-muted-foreground mb-4">
                CommonGround is designed for adult co-parents. We collect
                information about children only as provided by their parents for
                the purpose of custody coordination. We do not knowingly collect
                personal information directly from children under 13.
              </p>
              <p className="text-muted-foreground">
                Parents can review, update, or request deletion of their
                children's information by contacting us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Your Rights
              </h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your information (subject to legal retention requirements)</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of certain data processing activities</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="text-muted-foreground">
                To exercise these rights, please contact us at{' '}
                <a
                  href="mailto:privacy@commonground.app"
                  className="text-cg-primary hover:underline"
                >
                  privacy@commonground.app
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Data Retention
              </h2>
              <p className="text-muted-foreground mb-4">
                We retain your information for as long as your account is active
                or as needed to provide services. Some data may be retained longer
                as required by law or for legitimate business purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                <li>Court records and agreements: Retained per applicable state law</li>
                <li>Communications: Retained for the duration of the case plus 7 years</li>
                <li>Payment records: Retained per financial regulations (typically 7 years)</li>
                <li>Audit logs: Retained for security and compliance purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Changes to This Policy
              </h2>
              <p className="text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new policy on this page
                and updating the "Last updated" date. For significant changes,
                we will notify you by email.
              </p>
              <p className="text-muted-foreground">
                Your continued use of CommonGround after any changes indicates
                your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Contact Us
              </h2>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or our data
                practices, please contact us:
              </p>
              <ul className="text-muted-foreground space-y-1">
                <li>
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:privacy@commonground.app"
                    className="text-cg-primary hover:underline"
                  >
                    privacy@commonground.app
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
            href="/legal/terms"
            className="hover:text-foreground transition-smooth"
          >
            Terms of Service
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
