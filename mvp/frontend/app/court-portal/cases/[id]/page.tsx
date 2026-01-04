"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FileText, Settings, Calendar, MessageSquare, DollarSign, FileBarChart, Info, MapPin, Shield, MessageCircle, Bot, ChevronRight, Eye, AlertTriangle, Lock, Smartphone, Edit, Search, Package, Activity, TrendingUp, TrendingDown, Minus, Scale, ClipboardCheck, UserPlus } from "lucide-react";
import { useCourtAuth } from "../../layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface CategoryCompliance {
  status: string;
  score: number;
  metrics: Record<string, number>;
  issues: string[];
}

interface ComplianceSnapshot {
  case_id: string;
  generated_at: string;
  overall_status: string;
  overall_score: number;
  schedule_compliance: CategoryCompliance;
  communication_compliance: CategoryCompliance;
  financial_compliance: CategoryCompliance;
  item_compliance: CategoryCompliance;
  days_monitored: number;
  total_exchanges: number;
  on_time_rate: number;
  flagged_messages_count: number;
  overdue_obligations: number;
  disputed_items: number;
  trend?: string;
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { professional, token, activeGrant, isLoading } = useCourtAuth();
  const caseId = params.id as string;

  const [caseInfo, setCaseInfo] = useState<CourtCase | null>(null);
  const [settings, setSettings] = useState<CourtSettings | null>(null);
  const [compliance, setCompliance] = useState<ComplianceSnapshot | null>(null);
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

      // Load case info, settings, and compliance in parallel
      const [casesResponse, settingsResponse, complianceResponse] = await Promise.all([
        fetch(`${API_BASE}/court/cases`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_BASE}/court/settings/case/${caseId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`${API_BASE}/court/compliance/snapshot/${caseId}?days=30`, {
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

      if (complianceResponse.ok) {
        const complianceData = await complianceResponse.json();
        setCompliance(complianceData);
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading case data...</p>
        </div>
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

  const activeControlsCount = [
    courtSettings.gps_checkins_required,
    courtSettings.supervised_exchange_required,
    courtSettings.in_app_communication_only,
    courtSettings.aria_enforcement_locked,
    courtSettings.agreement_edits_locked,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Case Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            {displayNumber && (
              <Badge variant="default" className="bg-indigo-100 text-indigo-800 border-0">
                Case #{displayNumber}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {displayCounty && `${displayCounty} County, `}{displayState}
          </p>
        </div>
        <Button variant="outline" asChild className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
          <Link href={`/court-portal/cases/${params.id}/reports`}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Link>
        </Button>
      </div>

      {/* Quick Nav */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
        <NavButton href={`/court-portal/cases/${params.id}`} active icon={<Eye className="h-4 w-4" />}>Overview</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/settings`} icon={<Settings className="h-4 w-4" />}>Settings</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/forms`} icon={<Scale className="h-4 w-4" />}>Court Forms</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/events`} icon={<Calendar className="h-4 w-4" />}>Events</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/exchanges`} icon={<MapPin className="h-4 w-4" />}>Exchanges</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/messages`} icon={<MessageSquare className="h-4 w-4" />}>Messages</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/payments`} icon={<DollarSign className="h-4 w-4" />}>Payments</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/items`} icon={<Package className="h-4 w-4" />}>Items</NavButton>
        <NavButton href={`/court-portal/cases/${params.id}/reports`} icon={<FileBarChart className="h-4 w-4" />}>Reports</NavButton>
      </div>

      {/* Compliance Snapshot */}
      {compliance && (
        <Card className={`border-2 ${
          compliance.overall_status === "green" ? "border-green-200 bg-green-50/50" :
          compliance.overall_status === "amber" ? "border-amber-200 bg-amber-50/50" :
          "border-red-200 bg-red-50/50"
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  compliance.overall_status === "green" ? "bg-green-100" :
                  compliance.overall_status === "amber" ? "bg-amber-100" :
                  "bg-red-100"
                }`}>
                  <Activity className={`h-5 w-5 ${
                    compliance.overall_status === "green" ? "text-green-600" :
                    compliance.overall_status === "amber" ? "text-amber-600" :
                    "text-red-600"
                  }`} />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Compliance Snapshot
                    <ComplianceStatusBadge status={compliance.overall_status} />
                  </CardTitle>
                  <CardDescription>
                    Last {compliance.days_monitored} days • Score: {compliance.overall_score.toFixed(0)}/100
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {compliance.overall_status === "green" ? "🟢" :
                   compliance.overall_status === "amber" ? "🟡" : "🔴"}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ComplianceCategoryCard
                title="Schedule"
                status={compliance.schedule_compliance.status}
                score={compliance.schedule_compliance.score}
                metric={`${compliance.on_time_rate.toFixed(0)}% on-time`}
                issues={compliance.schedule_compliance.issues}
                icon={<Calendar className="h-4 w-4" />}
              />
              <ComplianceCategoryCard
                title="Communication"
                status={compliance.communication_compliance.status}
                score={compliance.communication_compliance.score}
                metric={`${compliance.flagged_messages_count} flagged`}
                issues={compliance.communication_compliance.issues}
                icon={<MessageSquare className="h-4 w-4" />}
              />
              <ComplianceCategoryCard
                title="Financial"
                status={compliance.financial_compliance.status}
                score={compliance.financial_compliance.score}
                metric={`${compliance.overdue_obligations} overdue`}
                issues={compliance.financial_compliance.issues}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <ComplianceCategoryCard
                title="Items"
                status={compliance.item_compliance.status}
                score={compliance.item_compliance.score}
                metric={`${compliance.disputed_items} disputed`}
                issues={compliance.item_compliance.issues}
                icon={<Package className="h-4 w-4" />}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={courtSettings.investigation_mode ? "border-cg-warning/30 bg-cg-warning/5" : ""}>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${courtSettings.investigation_mode ? "text-cg-warning" : "text-foreground"}`}>
              {courtSettings.investigation_mode ? "Active" : "Normal"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Search className="h-3.5 w-3.5" />
              Monitoring Mode
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{activeControlsCount}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Shield className="h-3.5 w-3.5" />
              Active Controls
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${courtSettings.aria_enforcement_locked ? "text-cg-success" : "text-foreground"}`}>
              {courtSettings.aria_enforcement_locked ? "Locked" : "Optional"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Bot className="h-3.5 w-3.5" />
              ARIA Status
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${courtSettings.in_app_communication_only ? "text-indigo-600" : "text-foreground"}`}>
              {courtSettings.in_app_communication_only ? "Required" : "Optional"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Smartphone className="h-3.5 w-3.5" />
              In-App Messaging
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Access Notice */}
      <Alert className="bg-indigo-50 border-indigo-200">
        <Info className="h-4 w-4 text-indigo-600" />
        <AlertDescription className="text-indigo-900">
          <span className="font-medium">Detailed Metrics Available:</span>{" "}
          <span className="text-indigo-700">
            View detailed compliance metrics, message history, and ARIA analytics by navigating to the specific sections above.
            Generate a comprehensive report for full statistics.
          </span>
        </AlertDescription>
      </Alert>

      {/* Court Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            Court-Controlled Settings
          </CardTitle>
          <CardDescription>
            Settings that cannot be overridden by parents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            <SettingRow label="GPS Check-ins Required" enabled={courtSettings.gps_checkins_required} icon={<MapPin className="h-4 w-4" />} />
            <SettingRow label="Supervised Exchanges" enabled={courtSettings.supervised_exchange_required} icon={<Eye className="h-4 w-4" />} />
            <SettingRow label="ARIA Enforcement Locked" enabled={courtSettings.aria_enforcement_locked} icon={<Bot className="h-4 w-4" />} />
            <SettingRow label="In-App Communication Only" enabled={courtSettings.in_app_communication_only} icon={<Smartphone className="h-4 w-4" />} />
            <SettingRow label="Agreement Edits Locked" enabled={courtSettings.agreement_edits_locked} icon={<Lock className="h-4 w-4" />} />
            <SettingRow label="Investigation Mode" enabled={courtSettings.investigation_mode} icon={<Search className="h-4 w-4" />} highlight />
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href={`/court-portal/cases/${params.id}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Manage Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <ActionCard
          title="ARIA Paralegal"
          description="Send legal intake request to parent"
          href={`/court-portal/cases/${params.id}/intake`}
          icon={<UserPlus className="h-6 w-6" />}
        />
        <ActionCard
          title="Court Form Workflow"
          description="Review FL-300, FL-311, FL-320, enter orders"
          href={`/court-portal/cases/${params.id}/forms`}
          icon={<Scale className="h-6 w-6" />}
        />
        <ActionCard
          title="View Communication Log"
          description="Review all messages between parents"
          href={`/court-portal/cases/${params.id}/messages`}
          icon={<MessageCircle className="h-6 w-6" />}
        />
        <ActionCard
          title="Generate Court Packet"
          description="Create court-ready evidence package"
          href={`/court-portal/cases/${params.id}/reports`}
          icon={<FileText className="h-6 w-6" />}
        />
      </div>
    </div>
  );
}

function NavButton({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-smooth ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function SettingRow({
  label,
  enabled,
  icon,
  highlight,
}: {
  label: string;
  enabled: boolean;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${
      highlight ? "bg-cg-warning/10 border border-cg-warning/20" : "bg-secondary/50"
    }`}>
      <span className="text-sm text-foreground flex items-center gap-2">
        <span className={highlight ? "text-cg-warning" : "text-muted-foreground"}>{icon}</span>
        {label}
      </span>
      <Badge
        variant={enabled ? (highlight ? "warning" : "success") : "secondary"}
        size="sm"
      >
        {enabled ? "ACTIVE" : "OFF"}
      </Badge>
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
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-secondary/50 transition-smooth cursor-pointer h-full group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-200 transition-colors">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ComplianceStatusBadge({ status }: { status: string }) {
  const config = {
    green: { label: "Good Standing", bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
    amber: { label: "Needs Attention", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    red: { label: "Issues Found", bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  }[status] || { label: "Unknown", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text} ${config.border} border`}>
      {config.label}
    </span>
  );
}

function ComplianceCategoryCard({
  title,
  status,
  score,
  metric,
  issues,
  icon,
}: {
  title: string;
  status: string;
  score: number;
  metric: string;
  issues: string[];
  icon: React.ReactNode;
}) {
  const statusColors = {
    green: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-600", text: "text-green-700" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", text: "text-amber-700" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600", text: "text-red-700" },
  }[status] || { bg: "bg-gray-50", border: "border-gray-200", icon: "text-gray-600", text: "text-gray-700" };

  return (
    <div className={`p-3 rounded-xl border ${statusColors.bg} ${statusColors.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={statusColors.icon}>{icon}</span>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <span className="text-lg">
          {status === "green" ? "🟢" : status === "amber" ? "🟡" : "🔴"}
        </span>
      </div>
      <div className="text-xl font-bold text-foreground mb-1">{score.toFixed(0)}</div>
      <div className="text-xs text-muted-foreground">{metric}</div>
      {issues.length > 0 && (
        <div className="mt-2 pt-2 border-t border-current/10">
          {issues.map((issue, idx) => (
            <p key={idx} className={`text-xs ${statusColors.text}`}>
              • {issue}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
