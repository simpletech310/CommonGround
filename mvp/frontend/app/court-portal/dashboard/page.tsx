"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCourtAuth } from "../layout";
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
        <div className="text-slate-500">Loading...</div>
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
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {professional.full_name}
        </h1>
        <p className="text-slate-600">
          Court Access Portal - Read-only case access
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Active Cases" value={stats.active_cases} icon="📁" />
        <StatCard label="Pending Approvals" value={stats.pending_approvals} icon="⏳" />
        <StatCard label="Upcoming Events" value={stats.upcoming_events} icon="📅" />
        <StatCard label="Recent Reports" value={stats.recent_reports} icon="📄" />
        <StatCard
          label="Expiring Soon"
          value={stats.access_expiring_soon}
          icon="⚠️"
          warning={stats.access_expiring_soon > 0}
        />
      </div>

      {/* Active Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Your Active Cases</CardTitle>
          <CardDescription>
            Cases you have access to view
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCases ? (
            <div className="text-center py-8 text-slate-500">
              Loading cases...
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No active cases found</p>
              <p className="text-sm mt-2">
                Cases will appear here once they are created in the system
              </p>
            </div>
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
            <CardTitle className="text-lg">ARIA Assistant</CardTitle>
            <CardDescription>
              Ask questions about case facts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              ARIA can answer factual questions about schedules, exchanges,
              compliance, and communication patterns.
            </p>
            <Button asChild variant="outline" className="w-full">
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
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">📋</span>
                <span>All access is read-only and logged</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🔒</span>
                <span>Exports are watermarked with your identity</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⏱️</span>
                <span>Access expires based on your role</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🚫</span>
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
  icon: string;
  warning?: boolean;
}) {
  return (
    <Card className={warning ? "border-orange-300 bg-orange-50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className={`text-2xl font-bold ${warning ? "text-orange-600" : "text-slate-900"}`}>
              {value}
            </div>
            <div className="text-xs text-slate-500">{label}</div>
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

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    closed: "bg-gray-100 text-gray-800",
  };

  return (
    <div
      className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-slate-900">{caseData.case_name}</h3>
            <span className={`px-2 py-0.5 rounded text-xs ${statusColors[caseData.status] || statusColors.active}`}>
              {caseData.status}
            </span>
          </div>
          {caseData.case_number && (
            <div className="text-sm text-slate-500 mt-1">
              Case #{caseData.case_number}
            </div>
          )}
          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
            <span>Role: {roleLabels[role] || role}</span>
            <span>{caseData.county && `${caseData.county}, `}{caseData.state}</span>
          </div>
        </div>
        <div className="text-right">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            View Case
          </Button>
        </div>
      </div>
    </div>
  );
}
