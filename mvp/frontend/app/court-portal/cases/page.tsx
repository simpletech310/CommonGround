"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCourtAuth } from "../layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Mock data
const MOCK_CASES = [
  {
    id: "case-williams",
    case_name: "Williams v. Williams",
    case_number: "FC-2025-00847",
    state: "CA",
    county: "San Diego",
    grant: {
      role: "gal",
      status: "active",
      days_remaining: 92,
      access_count: 14,
    },
    quick_stats: {
      compliance_gap: 19, // difference between parents
      flagged_messages: 30,
      upcoming_events: 2,
    },
  },
  {
    id: "case-thomas-stacey",
    case_name: "Thomas v. Stacey",
    case_number: "FC-2025-01892",
    state: "CA",
    county: "San Diego",
    grant: {
      role: "mediator",
      status: "active",
      days_remaining: 58,
      access_count: 6,
    },
    quick_stats: {
      compliance_gap: 12,
      flagged_messages: 15,
      upcoming_events: 3,
    },
  },
];

export default function CasesListPage() {
  const router = useRouter();
  const { professional, setActiveGrant, isLoading } = useCourtAuth();
  const [cases] = useState(MOCK_CASES);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoading && !professional) {
      router.push("/court-portal/login");
    }
  }, [professional, isLoading, router]);

  if (isLoading || !professional) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  const filteredCases = cases.filter(
    (c) =>
      c.case_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleLabels: Record<string, string> = {
    gal: "Guardian ad Litem",
    attorney_petitioner: "Attorney (Petitioner)",
    attorney_respondent: "Attorney (Respondent)",
    mediator: "Mediator",
    court_clerk: "Court Clerk",
    judge: "Judge",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cases</h1>
          <p className="text-slate-600">Your active case access grants</p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Cases Grid */}
      <div className="grid gap-4">
        {filteredCases.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              No cases found
            </CardContent>
          </Card>
        ) : (
          filteredCases.map((caseItem) => (
            <Link key={caseItem.id} href={`/court-portal/cases/${caseItem.id}`}>
              <Card className="hover:bg-slate-50 transition cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-slate-900 text-lg">
                          {caseItem.case_name}
                        </h3>
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                          {caseItem.grant.status}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        Case #{caseItem.case_number} | {caseItem.county} County, {caseItem.state}
                      </div>
                      <div className="flex items-center space-x-4 mt-3">
                        <span className="text-sm text-slate-600">
                          Role: <strong>{roleLabels[caseItem.grant.role]}</strong>
                        </span>
                        <span className="text-sm text-slate-600">
                          Accessed: {caseItem.grant.access_count} times
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className={`text-sm font-medium ${
                        caseItem.grant.days_remaining <= 7 ? "text-orange-600" : "text-slate-600"
                      }`}>
                        {caseItem.grant.days_remaining} days remaining
                      </div>
                      <div className="flex space-x-3 text-xs text-slate-500">
                        {caseItem.quick_stats.compliance_gap > 10 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                            Compliance gap: {caseItem.quick_stats.compliance_gap}%
                          </span>
                        )}
                        {caseItem.quick_stats.flagged_messages > 20 && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                            {caseItem.quick_stats.flagged_messages} flags
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Access Info */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <span className="text-xl">ℹ️</span>
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-700">About Case Access</p>
              <p className="mt-1">
                You can only view cases where you have been granted access by case participants or court order.
                Access is time-limited based on your role and all actions are logged.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
