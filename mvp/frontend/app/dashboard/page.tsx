'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.first_name}!
          </h2>
          <p className="mt-2 text-gray-600">
            Here's an overview of your co-parenting dashboard
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Cases Card */}
          <Card>
            <CardHeader>
              <CardTitle>My Cases</CardTitle>
              <CardDescription>
                Manage your co-parenting cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-blue-600">0</p>
                <p className="text-sm text-gray-500 mt-2">Active cases</p>
                <Button className="mt-4" size="sm" onClick={() => router.push('/cases/new')}>
                  Create new case
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Messages Card */}
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communicate with AI-powered moderation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-green-600">0</p>
                <p className="text-sm text-gray-500 mt-2">Unread messages</p>
                <Button className="mt-4" size="sm" variant="outline">
                  View messages
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Agreements Card */}
          <Card>
            <CardHeader>
              <CardTitle>Agreements</CardTitle>
              <CardDescription>
                Custody and parenting agreements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-purple-600">0</p>
                <p className="text-sm text-gray-500 mt-2">Active agreements</p>
                <Button className="mt-4" size="sm" variant="outline">
                  View agreements
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Set up your CommonGround account in a few simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Create a case</h4>
                  <p className="text-sm text-gray-500">
                    Start by creating a new co-parenting case and inviting the other parent
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push('/cases/new')}>
                    Create case
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Build your agreement</h4>
                  <p className="text-sm text-gray-500">
                    Use our guided interview to create a comprehensive custody agreement
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push('/agreements')}>
                    Build agreement
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Start communicating</h4>
                  <p className="text-sm text-gray-500">
                    Send messages with AI-powered moderation to reduce conflict
                  </p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => router.push('/messages')}>
                    Start communicating
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
