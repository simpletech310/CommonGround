"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Clock, Calendar, FileText, AlertTriangle, Bot, Lock, Stamp, ShieldOff, ChevronRight, MapPin, FileSearch, UserPlus } from "lucide-react";
import { useCourtAuth } from "../layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/layout";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CourtCase {
  id: string;
  case_name: string;
  case_number?: string;
  state: string;
  county?: string;
  status: string;
}

interface DashboardStats {
  active_cases: number;
  pending_approvals: number;
  upcoming_events: number;
  recent_reports: number;
  access_expiring_soon: number;
}

export default function CourtDashboardPage() {
  const router = useRouter();
  const { professional, token, setActiveGrant, isLoading } = useCourtAuth();
  const [cases, setCases] = useState<CourtCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    active_cases: 0,
    pending_approvals: 0,
    upcoming_events: 0,
    recent_reports: 0,
    access_expiring_soon: 0,
  });

  useEffect(() => {
    if (!isLoading && !professional) {
      router.push("/court-portal/login");
    }
  }, [professional, isLoading, router]);

  useEffect(() => {
    if (professional) {
      loadCases();
    }
  }, [professional]);

  const loadCases = async () => {
    try {
      setIsLoadingCases(true);
      const response = await fetch(`${API_BASE}/court/cases`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setCases(data);
        setStats((prev) => ({
          ...prev,
          active_cases: data.length,
        }));
      }
    } catch (err) {
      console.error("Failed to load cases:", err);
    } finally {
      setIsLoadingCases(false);
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

  const handleSelectCase = (caseItem: CourtCase) => {
    setActiveGrant({
      case_id: caseItem.id,
      case_name: caseItem.case_name,
      case_number: caseItem.case_number,
      role: professional.role,
      status: "active",
      days_remaining: 90,
    });
    router.push(`/court-portal/cases/${caseItem.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {professional.full_name}
        </h1>
        <p className="text-muted-foreground">
          Court Access Portal - Read-only case access
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Active Cases" value={stats.active_cases} icon={<FolderOpen className="h-5 w-5" />} />
        <StatCard label="Pending Approvals" value={stats.pending_approvals} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Upcoming Events" value={stats.upcoming_events} icon={<Calendar className="h-5 w-5" />} />
        <StatCard label="Recent Reports" value={stats.recent_reports} icon={<FileText className="h-5 w-5" />} />
        <StatCard
          label="Expiring Soon"
          value={stats.access_expiring_soon}
          icon={<AlertTriangle className="h-5 w-5" />}
          warning={stats.access_expiring_soon > 0}
        />
      </div>

      {/* Active Cases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Active Cases</CardTitle>
              <CardDescription>
                Cases you have access to view
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/court-portal/request-access">
                <FileSearch className="h-4 w-4 mr-2" />
                Request Access
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingCases ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto" />
              <p className="mt-3 text-muted-foreground text-sm">Loading cases...</p>
            </div>
          ) : cases.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No active cases"
              description="Cases will appear here once they are created in the system"
            />
          ) : (
            <div className="space-y-3">
              {cases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  caseData={caseItem}
                  role={professional.role}
                  onSelect={() => handleSelectCase(caseItem)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              ARIA Assistant
            </CardTitle>
            <CardDescription>
              Ask questions about case facts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              ARIA can answer factual questions about schedules, exchanges,
              compliance, and communication patterns.
            </p>
            <Button asChild variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Link href="/court-portal/aria">
                Open ARIA Assistant
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Access Guidelines</CardTitle>
            <CardDescription>
              Important information about your access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2.5">
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                <span>All access is read-only and logged</span>
              </li>
              <li className="flex items-center gap-2">
                <Stamp className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                <span>Exports are watermarked with your identity</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                <span>Access expires based on your role</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldOff className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                <span>Do not share access credentials</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  warning,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <Card className={warning ? "border-cg-warning/30 bg-cg-warning/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${warning ? "bg-cg-warning/10 text-cg-warning" : "bg-indigo-100 text-indigo-600"}`}>
            {icon}
          </div>
          <div>
            <div className={`text-2xl font-bold ${warning ? "text-cg-warning" : "text-foreground"}`}>
              {value}
            </div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CaseCard({
  caseData,
  role,
  onSelect,
}: {
  caseData: CourtCase;
  role: string;
  onSelect: () => void;
}) {
  const roleLabels: Record<string, string> = {
    gal: "Guardian ad Litem",
    attorney_petitioner: "Attorney (Petitioner)",
    attorney_respondent: "Attorney (Respondent)",
    mediator: "Mediator",
    court_clerk: "Court Clerk",
    judge: "Judge",
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'secondary' => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div
      className="border border-border rounded-xl p-4 hover:bg-secondary/50 cursor-pointer transition-smooth group"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{caseData.case_name}</h3>
            <Badge variant={getStatusVariant(caseData.status)} size="sm">
              {caseData.status}
            </Badge>
          </div>
          {caseData.case_number && (
            <div className="text-sm text-muted-foreground mt-1">
              Case #{caseData.case_number}
            </div>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>Role: {roleLabels[role] || role}</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {caseData.county && `${caseData.county}, `}{caseData.state}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            View Case
          </Button>
          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}
