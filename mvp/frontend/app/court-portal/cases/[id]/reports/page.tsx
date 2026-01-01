"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCourtAuth } from "../../../layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Report {
  id: string;
  case_id: string;
  generated_by: string;
  report_number: string;
  report_type: string;
  title: string;
  date_range_start: string;
  date_range_end: string;
  sections_included: string[];
  page_count: number;
  content_hash: string;
  storage_key?: string;
  download_url?: string;
  download_count: number;
  purpose?: string;
  generated_at: string;
  expires_at?: string;
  is_expired: boolean;
}

const REPORT_TYPES = [
  {
    id: "communication_summary",
    label: "Communication Summary",
    icon: "💬",
    description: "Message volume, ARIA interventions, tone trends",
  },
  {
    id: "compliance_report",
    label: "Compliance Report",
    icon: "✅",
    description: "Exchange attendance, on-time rates, missed events",
  },
  {
    id: "financial_summary",
    label: "Financial Summary",
    icon: "💰",
    description: "Payments, expenses, outstanding balances",
  },
  {
    id: "timeline_export",
    label: "Timeline Export",
    icon: "📅",
    description: "Chronological event log for investigation",
  },
  {
    id: "full_court_package",
    label: "Full Court Package",
    icon: "📦",
    description: "Complete evidence package for hearings",
  },
];

export default function ReportsPage() {
  const params = useParams();
  const router = useRouter();
  const { professional, token, isLoading } = useCourtAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifyNumber, setVerifyNumber] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ is_valid: boolean; message: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const caseId = params.id as string;

  useEffect(() => {
    if (!isLoading && !professional) {
      router.push("/court-portal/login");
    }
  }, [professional, isLoading, router]);

  useEffect(() => {
    if (professional && caseId) {
      loadReports();
    }
  }, [professional, caseId]);

  const loadReports = async () => {
    try {
      setIsLoadingReports(true);
      setError(null);
      const response = await fetch(`${API_BASE}/court/reports/case/${caseId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to load reports");
      }
    } catch (err) {
      setError("Failed to load reports");
    } finally {
      setIsLoadingReports(false);
    }
  };

  if (isLoading || !professional) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!selectedType || !dateStart || !dateEnd) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/court/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          case_id: caseId,
          report_type: selectedType,
          title: REPORT_TYPES.find((t) => t.id === selectedType)?.label || "Report",
          date_range_start: dateStart,
          date_range_end: dateEnd,
          sections_included: ["agreement", "compliance", "schedule", "messages"],
          purpose: purpose || undefined,
        }),
      });

      if (response.ok) {
        const newReport = await response.json();
        setReports([newReport, ...reports]);
        setShowGenerator(false);
        setSelectedType("");
        setDateStart("");
        setDateEnd("");
        setPurpose("");
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to generate report");
      }
    } catch (err) {
      setError("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      // Record the download
      await fetch(`${API_BASE}/court/reports/${reportId}/download`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // Refresh reports to update download count
      loadReports();

      // In a real implementation, this would trigger the actual file download
      alert("Download initiated. In production, this would download the PDF file.");
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const handleVerify = async () => {
    if (!verifyNumber) return;

    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const response = await fetch(`${API_BASE}/court/reports/verify/${verifyNumber}`);
      if (response.ok) {
        const data = await response.json();
        setVerifyResult({
          is_valid: data.is_valid,
          message: data.is_valid
            ? `Report verified! Generated on ${new Date(data.generated_at).toLocaleDateString()} by ${data.generated_by}`
            : "Report could not be verified",
        });
      } else {
        setVerifyResult({ is_valid: false, message: "Report not found in system" });
      }
    } catch (err) {
      setVerifyResult({ is_valid: false, message: "Verification failed" });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/court-portal/cases/${params.id}`}
              className="text-slate-500 hover:text-slate-700"
            >
              ← Back to Case
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Investigation Reports</h1>
          <p className="text-slate-600">
            Generate court-ready evidence packages
          </p>
        </div>
        <Button onClick={() => setShowGenerator(true)}>
          Generate New Report
        </Button>
      </div>

      {/* Report Generator */}
      {showGenerator && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Select report type and date range
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Type */}
            <div className="space-y-3">
              <Label>Report Type</Label>
              <div className="grid md:grid-cols-2 gap-3">
                {REPORT_TYPES.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      selectedType === type.id
                        ? "border-blue-500 bg-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{type.icon}</span>
                      <span className="font-medium text-slate-900">{type.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-2">
              <Label>Purpose (optional)</Label>
              <Input
                placeholder="e.g., Prepared for hearing on January 15, 2026"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowGenerator(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!selectedType || !dateStart || !dateEnd || isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingReports ? (
            <div className="text-center py-8 text-slate-500">
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <span className="text-4xl">📄</span>
              <p className="mt-4">No reports generated yet</p>
              <p className="text-sm mt-2">Generate your first report to create court-ready evidence packages</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`border rounded-lg p-4 hover:bg-slate-50 transition ${report.is_expired ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {REPORT_TYPES.find((t) => t.id === report.report_type)?.icon || "📄"}
                        </span>
                        <h3 className="font-semibold text-slate-900">{report.title}</h3>
                        {report.is_expired && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Expired</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {report.report_number} | {report.date_range_start} to {report.date_range_end}
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                        <span>{report.page_count} pages</span>
                        <span>Downloaded {report.download_count} times</span>
                        <span>Generated {new Date(report.generated_at).toLocaleDateString()}</span>
                      </div>
                      {report.content_hash && (
                        <div className="mt-2 text-xs text-slate-400 font-mono">
                          SHA-256: {report.content_hash.slice(0, 16)}...
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setVerifyNumber(report.report_number);
                          handleVerify();
                        }}
                      >
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(report.id)}
                        disabled={report.is_expired}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify Report Section */}
      <Card>
        <CardHeader>
          <CardTitle>Verify Report</CardTitle>
          <CardDescription>Check authenticity of a report by its number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter report number (e.g., RPT-20251230-A7B2)"
              value={verifyNumber}
              onChange={(e) => setVerifyNumber(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleVerify} disabled={!verifyNumber || isVerifying}>
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </div>
          {verifyResult && (
            <div className={`mt-3 p-3 rounded ${verifyResult.is_valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <div className="flex items-center gap-2">
                <span>{verifyResult.is_valid ? '✅' : '❌'}</span>
                <span>{verifyResult.message}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Info */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <span>🔒</span>
              <div>
                <p className="font-medium text-slate-700">SHA-256 Verified</p>
                <p className="text-slate-500 text-xs">Each report includes integrity hash</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span>🏷️</span>
              <div>
                <p className="font-medium text-slate-700">Watermarked</p>
                <p className="text-slate-500 text-xs">Your identity on every page</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span>✅</span>
              <div>
                <p className="font-medium text-slate-700">Court-Ready</p>
                <p className="text-slate-500 text-xs">Formatted for legal proceedings</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
