"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCourtAuth } from "../../layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CourtCase {
  id: string;
  case_name: string;
  case_number?: string;
  state: string;
  county?: string;
  status: string;
}

interface CourtSettings {
  gps_checkins_required: boolean;
  supervised_exchange_required: boolean;
  in_app_communication_only: boolean;
  aria_enforcement_locked: boolean;
  agreement_edits_locked: boolean;
  investigation_mode: boolean;
  disable_delete_messages: boolean;
  require_read_receipts: boolean;
}

interface CaseData {
  id: string;
  case_name: string;
  case_number?: string;
  state: string;
  county?: string;
  children: Array<{ name: string; age: number }>;
  court_settings: CourtSettings;
  stats: {
    total_exchanges: number;
    completed_on_time: number;
    total_messages: number;
    flagged_messages: number;
    upcoming_events: number;
  };
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { professional, token, activeGrant, isLoading } = useCourtAuth();
  const caseId = params.id as string;

  const [caseInfo, setCaseInfo] = useState<CourtCase | null>(null);
  const [settings, setSettings] = useState<CourtSettings | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !professional) {
      router.push("/court-portal/login");
    }
  }, [professional, isLoading, router]);

  useEffect(() => {
    if (professional && caseId) {
      loadCaseData();
    }
  }, [professional, caseId]);

  const loadCaseData = async () => {
    try {
      setIsLoadingData(true);
      setError(null);

      // Load case info and settings in parallel
      const [casesResponse, settingsResponse] = await Promise.all([
        fetch(`${API_BASE}/court/cases`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_BASE}/court/settings/case/${caseId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      if (casesResponse.ok) {
        const cases = await casesResponse.json();
        const foundCase = cases.find((c: CourtCase) => c.id === caseId);
        if (foundCase) {
          setCaseInfo(foundCase);
        }
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      }
    } catch (err) {
      console.error("Failed to load case data:", err);
      setError("Failed to load case data");
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading || !professional) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading case data...</div>
      </div>
    );
  }

  // Use activeGrant or caseInfo for display
  const displayName = caseInfo?.case_name || activeGrant?.case_name || "Case";
  const displayNumber = caseInfo?.case_number || activeGrant?.case_number;
  const displayState = caseInfo?.state || "CA";
  const displayCounty = caseInfo?.county || "";

  // Default settings if not loaded
  const courtSettings = settings || {
    gps_checkins_required: false,
    supervised_exchange_required: false,
    in_app_communication_only: false,
    aria_enforcement_locked: false,
    agreement_edits_locked: false,
    investigation_mode: false,
    disable_delete_messages: false,
    require_read_receipts: false,
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Case Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
            {displayNumber && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                Case #{displayNumber}
              </span>
            )}
          </div>
          <p className="text-slate-600 mt-1">
            {displayCounty && `${displayCounty} County, `}{displayState}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/court-portal/cases/${params.id}/reports`}>
              Generate Report
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="flex space-x-2 border-b pb-4">
        <NavButton href={`/court-portal/cases/${params.id}`} active>Overview</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/settings`}>Court Settings</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/events`}>Court Events</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/messages`}>Court Messages</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/payments`}>Payments</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/reports`}>Reports</NavButton>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">
              {courtSettings.investigation_mode ? "Active" : "Normal"}
            </div>
            <div className="text-xs text-slate-500">Monitoring Mode</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">
              {[
                courtSettings.gps_checkins_required,
                courtSettings.supervised_exchange_required,
                courtSettings.in_app_communication_only,
                courtSettings.aria_enforcement_locked,
                courtSettings.agreement_edits_locked,
              ].filter(Boolean).length}
            </div>
            <div className="text-xs text-slate-500">Active Controls</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${courtSettings.aria_enforcement_locked ? "text-green-600" : "text-slate-900"}`}>
              {courtSettings.aria_enforcement_locked ? "Locked" : "Optional"}
            </div>
            <div className="text-xs text-slate-500">ARIA Status</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${courtSettings.in_app_communication_only ? "text-blue-600" : "text-slate-900"}`}>
              {courtSettings.in_app_communication_only ? "Required" : "Optional"}
            </div>
            <div className="text-xs text-slate-500">In-App Messaging</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Access Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>
            <div>
              <p className="font-medium text-blue-900">Detailed Metrics Available</p>
              <p className="text-sm text-blue-700 mt-1">
                View detailed compliance metrics, message history, and ARIA analytics by navigating to the specific sections above.
                Generate a comprehensive report for full statistics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Court Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Court-Controlled Settings</CardTitle>
          <CardDescription>
            Settings that cannot be overridden by parents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <SettingRow
              label="GPS Check-ins Required"
              enabled={courtSettings.gps_checkins_required}
            />
            <SettingRow
              label="Supervised Exchanges"
              enabled={courtSettings.supervised_exchange_required}
            />
            <SettingRow
              label="ARIA Enforcement Locked"
              enabled={courtSettings.aria_enforcement_locked}
            />
            <SettingRow
              label="In-App Communication Only"
              enabled={courtSettings.in_app_communication_only}
            />
            <SettingRow
              label="Agreement Edits Locked"
              enabled={courtSettings.agreement_edits_locked}
            />
            <SettingRow
              label="Investigation Mode"
              enabled={courtSettings.investigation_mode}
              highlight
            />
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href={`/court-portal/cases/${params.id}/settings`}>
                Manage Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <ActionCard
          title="View Communication Log"
          description="Review all messages between parents"
          href={`/court-portal/cases/${params.id}/messages`}
          icon="💬"
        />
        <ActionCard
          title="Generate Court Packet"
          description="Create court-ready evidence package"
          href={`/court-portal/cases/${params.id}/reports`}
          icon="📄"
        />
        <ActionCard
          title="Ask ARIA"
          description="Query case facts and statistics"
          href="/court-portal/aria"
          icon="🤖"
        />
      </div>
    </div>
  );
}

function NavButton({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </Link>
  );
}

function SettingRow({
  label,
  enabled,
  highlight,
}: {
  label: string;
  enabled: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      highlight ? "bg-orange-50 border border-orange-200" : "bg-slate-50"
    }`}>
      <span className="text-sm text-slate-700">{label}</span>
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        enabled
          ? highlight
            ? "bg-orange-500 text-white"
            : "bg-green-500 text-white"
          : "bg-slate-300 text-slate-600"
      }`}>
        {enabled ? "ACTIVE" : "OFF"}
      </span>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-slate-50 transition cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="font-medium text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
