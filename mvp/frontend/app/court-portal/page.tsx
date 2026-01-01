"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCourtAuth } from "./layout";

export default function CourtPortalPage() {
  const router = useRouter();
  const { professional, isLoading } = useCourtAuth();

  useEffect(() => {
    if (!isLoading) {
      if (professional) {
        router.push("/court-portal/dashboard");
      } else {
        router.push("/court-portal/login");
      }
    }
  }, [professional, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-500">Redirecting...</div>
    </div>
  );
}
