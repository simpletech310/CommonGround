'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { PageContainer, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageCircle,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Bug,
  Lightbulb,
  HelpCircle,
  CreditCard,
  Shield,
} from 'lucide-react';

/**
 * Contact Support Page
 *
 * Design: Simple contact form with category selection.
 * Philosophy: "Make it easy to ask for help."
 */

interface ContactCategory {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const categories: ContactCategory[] = [
  {
    value: 'general',
    label: 'General Question',
    icon: HelpCircle,
    description: 'Questions about using CommonGround',
  },
  {
    value: 'bug',
    label: 'Bug Report',
    icon: Bug,
    description: 'Something not working correctly',
  },
  {
    value: 'feature',
    label: 'Feature Request',
    icon: Lightbulb,
    description: 'Suggest a new feature or improvement',
  },
  {
    value: 'billing',
    label: 'Billing Issue',
    icon: CreditCard,
    description: 'Questions about payments or subscriptions',
  },
  {
    value: 'security',
    label: 'Security Concern',
    icon: Shield,
    description: 'Report a security issue',
  },
];

function ContactContent() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: 'general',
    subject: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    if (!formData.message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);

    try {
      // In production, this would call the support ticket API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Implement actual API call
      // await supportAPI.createTicket({
      //   category: formData.category,
      //   subject: formData.subject,
      //   message: formData.message,
      //   user_email: user?.email,
      // });

      setShowSuccess(true);
      setFormData({
        category: 'general',
        subject: '',
        message: '',
      });
    } catch (err) {
      setError('Failed to send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />

        <PageContainer narrow>
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <div className="p-4 bg-cg-success-subtle rounded-full inline-block mb-6">
                <CheckCircle className="h-12 w-12 text-cg-success" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Message Sent
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Thank you for contacting us. We typically respond within 24-48
                hours. You'll receive a response at <strong>{user?.email}</strong>.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSuccess(false)}
                >
                  Send Another Message
                </Button>
                <Button onClick={() => window.location.href = '/help'}>
                  Back to Help Center
                </Button>
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

      <PageContainer narrow>
        <PageHeader
          title="Contact Support"
          description="Get help from our team"
          icon={MessageCircle}
          backPath="/help"
          backLabel="Help Center"
        />

        {/* Response Time Info */}
        <Card className="mb-6 bg-cg-primary-subtle border-cg-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-cg-primary" />
              <div>
                <p className="font-medium text-foreground">
                  Typical response time: 24-48 hours
                </p>
                <p className="text-sm text-muted-foreground">
                  For urgent matters, please include "URGENT" in your subject line
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send Us a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Your Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll respond to this email address
                </p>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, category: cat.value }))
                        }
                        className={`
                          p-3 rounded-lg border text-left transition-smooth
                          ${
                            isSelected
                              ? 'border-cg-primary bg-cg-primary-subtle'
                              : 'border-border hover:border-muted-foreground'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`h-4 w-4 ${
                              isSelected ? 'text-cg-primary' : 'text-muted-foreground'
                            }`}
                          />
                          <span className="font-medium">{cat.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {cat.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Brief description of your issue"
                  maxLength={100}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please provide as much detail as possible..."
                  rows={6}
                  className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Include relevant details like case ID, error messages, or steps
                  to reproduce an issue
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Sending</span>
                      <span className="animate-spin">...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Alternative Contact */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            You can also reach us at{' '}
            <a
              href="mailto:support@commonground.app"
              className="text-cg-primary hover:underline"
            >
              support@commonground.app
            </a>
          </p>
        </div>
      </PageContainer>
    </div>
  );
}

export default function ContactPage() {
  return (
    <ProtectedRoute>
      <ContactContent />
    </ProtectedRoute>
  );
}
