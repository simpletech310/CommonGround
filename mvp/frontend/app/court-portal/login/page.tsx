"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCourtAuth } from "../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CourtLoginPage() {
  const router = useRouter();
  const { login } = useCourtAuth();
  const [step, setStep] = useState<"email" | "verify" | "mfa">("email");
  const [email, setEmail] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate verification
    await new Promise((r) => setTimeout(r, 1000));

    if (email.includes("@")) {
      setStep("verify");
    } else {
      setError("Please enter a valid email address");
    }
    setIsLoading(false);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate access code verification
    await new Promise((r) => setTimeout(r, 1000));

    if (accessCode.length >= 6) {
      setStep("mfa");
    } else {
      setError("Invalid access code");
    }
    setIsLoading(false);
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (mfaCode.length !== 6) {
      setError("Invalid MFA code - enter 6 digits");
      setIsLoading(false);
      return;
    }

    try {
      await login(email, accessCode);
      router.push("/court-portal/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Make sure access code is 123456");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">⚖️</span>
          </div>
          <CardTitle className="text-2xl">Court Access Portal</CardTitle>
          <CardDescription>
            Secure access for legal professionals
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-6">
            <StepIndicator step={1} current={step === "email"} complete={step !== "email"} label="Email" />
            <div className="w-8 h-0.5 bg-slate-200" />
            <StepIndicator step={2} current={step === "verify"} complete={step === "mfa"} label="Verify" />
            <div className="w-8 h-0.5 bg-slate-200" />
            <StepIndicator step={3} current={step === "mfa"} complete={false} label="MFA" />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Professional Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@court.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-500">
                  Use your verified court or law firm email
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Continue"}
              </Button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="text-center text-sm text-slate-600 mb-4">
                Enter the access code from your invitation link or email
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessCode">Access Code</Label>
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="text-center text-lg tracking-wider"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("email")}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>
          )}

          {step === "mfa" && (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="text-center text-sm text-slate-600 mb-4">
                Enter the 6-digit code from your authenticator app
              </div>
              <div className="space-y-2">
                <Label htmlFor="mfaCode">Authentication Code</Label>
                <Input
                  id="mfaCode"
                  type="text"
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-slate-500 text-center">
                  For demo: enter any 6 digits
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("verify")}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Sign In"}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="text-xs text-slate-500 space-y-1">
              <p className="flex items-center">
                <span className="mr-2">🔒</span>
                All access is logged and audited
              </p>
              <p className="flex items-center">
                <span className="mr-2">⏱️</span>
                Access is time-limited based on your role
              </p>
              <p className="flex items-center">
                <span className="mr-2">📋</span>
                Read-only access to case materials
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepIndicator({
  step,
  current,
  complete,
  label,
}: {
  step: number;
  current: boolean;
  complete: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          complete
            ? "bg-green-500 text-white"
            : current
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        {complete ? "✓" : step}
      </div>
      <span className="text-xs mt-1 text-slate-500">{label}</span>
    </div>
  );
}
