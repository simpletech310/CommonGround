"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
const ROLE_INFO: Record<string, { icon: string; label: string; color: string }> = {
  court_clerk: { icon: "📋", label: "Court Clerk", color: "bg-blue-100 text-blue-800" },
  gal: { icon: "👤", label: "Guardian ad Litem", color: "bg-purple-100 text-purple-800" },
  attorney_petitioner: { icon: "⚖️", label: "Attorney (Petitioner)", color: "bg-green-100 text-green-800" },
  attorney_respondent: { icon: "⚖️", label: "Attorney (Respondent)", color: "bg-teal-100 text-teal-800" },
  mediator: { icon: "🤝", label: "Mediator", color: "bg-orange-100 text-orange-800" },
  judge: { icon: "🏛️", label: "Judge", color: "bg-gray-100 text-gray-800" },
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
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-slate-800 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/court-portal" className="flex items-center space-x-2">
                  <span className="text-xl font-bold">CommonGround</span>
                  <span className="text-sm bg-slate-700 px-2 py-0.5 rounded">
                    Court Portal
                  </span>
                </Link>
              </div>

              {professional && !isLoginPage && (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">{professional.full_name}</div>
                    <div className="flex items-center space-x-2 text-sm text-slate-300">
                      <span>{roleInfo?.icon}</span>
                      <span>{roleInfo?.label}</span>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 rounded transition"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Navigation */}
        {professional && !isLoginPage && (
          <nav className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex space-x-1">
                <NavLink href="/court-portal/dashboard" current={pathname}>
                  Dashboard
                </NavLink>
                <NavLink href="/court-portal/cases" current={pathname}>
                  Cases
                </NavLink>
                <NavLink href="/court-portal/aria" current={pathname}>
                  ARIA Assistant
                </NavLink>
              </div>
            </div>
          </nav>
        )}

        {/* Active Grant Banner */}
        {activeGrant && !isLoginPage && (
          <div className="bg-blue-50 border-b border-blue-200">
            <div className="max-w-7xl mx-auto px-4 py-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-blue-800">
                    Active Case: {activeGrant.case_name || activeGrant.case_id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${roleInfo?.color}`}>
                    {roleInfo?.label}
                  </span>
                </div>
                <div className="text-blue-600">
                  {activeGrant.days_remaining} days remaining
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-slate-100 border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <div>
                CommonGround Court Access Mode
              </div>
              <div className="flex items-center space-x-4">
                <span>Read-only access</span>
                <span>All actions logged</span>
                <span>SHA-256 verified</span>
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
  children,
}: {
  href: string;
  current: string;
  children: React.ReactNode;
}) {
  const isActive = current.startsWith(href);

  return (
    <Link
      href={href}
      className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
        isActive
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
      }`}
    >
      {children}
    </Link>
  );
}
