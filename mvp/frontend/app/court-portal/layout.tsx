"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, LayoutDashboard, FolderOpen, Bot, LogOut, Shield, Clock, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Court professional context
interface CourtProfessional {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization?: string;
  title?: string;
  is_verified: boolean;
  mfa_enabled: boolean;
}

interface CourtAuthContextType {
  professional: CourtProfessional | null;
  activeGrant: any | null;
  isLoading: boolean;
  token: string | null;
  login: (email: string, accessCode: string) => Promise<void>;
  logout: () => void;
  setActiveGrant: (grant: any) => void;
}

const CourtAuthContext = createContext<CourtAuthContextType | null>(null);

export function useCourtAuth() {
  const context = useContext(CourtAuthContext);
  if (!context) {
    throw new Error("useCourtAuth must be used within CourtPortalLayout");
  }
  return context;
}

// Role display info
const ROLE_INFO: Record<string, { icon: React.ReactNode; label: string; variant: 'default' | 'secondary' | 'success' | 'warning' }> = {
  court_clerk: { icon: <FileCheck className="h-3.5 w-3.5" />, label: "Court Clerk", variant: "default" },
  gal: { icon: <Shield className="h-3.5 w-3.5" />, label: "Guardian ad Litem", variant: "secondary" },
  attorney_petitioner: { icon: <Scale className="h-3.5 w-3.5" />, label: "Attorney (Petitioner)", variant: "success" },
  attorney_respondent: { icon: <Scale className="h-3.5 w-3.5" />, label: "Attorney (Respondent)", variant: "success" },
  mediator: { icon: <Bot className="h-3.5 w-3.5" />, label: "Mediator", variant: "warning" },
  judge: { icon: <Scale className="h-3.5 w-3.5" />, label: "Judge", variant: "default" },
};

export default function CourtPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [professional, setProfessional] = useState<CourtProfessional | null>(null);
  const [activeGrant, setActiveGrant] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored session
    const storedToken = localStorage.getItem("court_token");
    const stored = localStorage.getItem("court_professional");
    if (storedToken && stored) {
      try {
        setToken(storedToken);
        setProfessional(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("court_professional");
        localStorage.removeItem("court_token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, accessCode: string) => {
    // Call the real backend API
    const response = await fetch(`${API_BASE}/court/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, access_code: accessCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    const data = await response.json();

    const prof: CourtProfessional = {
      id: data.professional.id,
      email: data.professional.email,
      full_name: data.professional.full_name,
      role: data.professional.role,
      organization: data.professional.organization,
      title: data.professional.title,
      is_verified: data.professional.is_verified,
      mfa_enabled: data.professional.mfa_enabled,
    };

    setToken(data.access_token);
    setProfessional(prof);
    localStorage.setItem("court_token", data.access_token);
    localStorage.setItem("court_professional", JSON.stringify(prof));
  };

  const logout = () => {
    setToken(null);
    setProfessional(null);
    setActiveGrant(null);
    localStorage.removeItem("court_token");
    localStorage.removeItem("court_professional");
    localStorage.removeItem("court_grant");
  };

  const isLoginPage = pathname === "/court-portal/login";
  const roleInfo = professional ? ROLE_INFO[professional.role] : null;

  return (
    <CourtAuthContext.Provider
      value={{ professional, activeGrant, isLoading, token, login, logout, setActiveGrant }}
    >
      <div className="min-h-screen bg-background">
        {/* Header - Professional indigo for court context */}
        <header className="bg-indigo-950 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/court-portal" className="flex items-center gap-3">
                  <div className="p-1.5 bg-indigo-800 rounded-lg">
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-lg font-bold tracking-tight">CommonGround</span>
                    <Badge variant="secondary" className="ml-2 text-xs bg-indigo-800 text-indigo-100 border-0">
                      Court Portal
                    </Badge>
                  </div>
                </Link>
              </div>

              {professional && !isLoginPage && (
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="font-medium text-sm">{professional.full_name}</div>
                    <div className="flex items-center justify-end gap-1.5 text-xs text-indigo-200">
                      {roleInfo?.icon}
                      <span>{roleInfo?.label}</span>
                    </div>
                  </div>
                  <Button
                    onClick={logout}
                    variant="ghost"
                    size="sm"
                    className="text-indigo-200 hover:text-white hover:bg-indigo-800"
                  >
                    <LogOut className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Navigation */}
        {professional && !isLoginPage && (
          <nav className="bg-card border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex gap-1 overflow-x-auto">
                <NavLink href="/court-portal/dashboard" current={pathname} icon={<LayoutDashboard className="h-4 w-4" />}>
                  Dashboard
                </NavLink>
                <NavLink href="/court-portal/cases" current={pathname} icon={<FolderOpen className="h-4 w-4" />}>
                  Cases
                </NavLink>
                <NavLink href="/court-portal/aria" current={pathname} icon={<Bot className="h-4 w-4" />}>
                  ARIA Assistant
                </NavLink>
              </div>
            </div>
          </nav>
        )}

        {/* Active Grant Banner */}
        {activeGrant && !isLoginPage && (
          <div className="bg-indigo-50 border-b border-indigo-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium text-indigo-900">
                    Active Case: {activeGrant.case_name || activeGrant.case_id}
                  </span>
                  {roleInfo && (
                    <Badge variant={roleInfo.variant} size="sm">
                      {roleInfo.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-indigo-600">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{activeGrant.days_remaining} days remaining</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-secondary/50 border-t border-border mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>CommonGround Court Access Mode</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cg-success" />
                  Read-only access
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cg-primary" />
                  All actions logged
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  SHA-256 verified
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </CourtAuthContext.Provider>
  );
}

function NavLink({
  href,
  current,
  icon,
  children,
}: {
  href: string;
  current: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const isActive = current.startsWith(href);

  return (
    <Link
      href={href}
      className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-smooth whitespace-nowrap ${
        isActive
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
