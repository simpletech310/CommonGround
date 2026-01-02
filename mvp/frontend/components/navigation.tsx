'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  Home,
  Briefcase,
  MessageSquare,
  FileText,
  Calendar,
  Wallet,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

/**
 * CommonGround Navigation Component
 *
 * Design: Clean, minimal, mobile-first.
 * Philosophy: "Navigation should fade into the background - content is what matters"
 */

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Cases', path: '/cases', icon: Briefcase },
  { name: 'Messages', path: '/messages', icon: MessageSquare },
  { name: 'Agreements', path: '/agreements', icon: FileText },
  { name: 'Schedule', path: '/schedule', icon: Calendar },
  { name: 'Payments', path: '/payments', icon: Wallet },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            className="flex-shrink-0 cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              CommonGround
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Where co-parents find common ground
            </p>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.path || pathname?.startsWith(`${item.path}/`);
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-smooth
                    ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* User Info - Hidden on small screens */}
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign out
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-smooth"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Slide down */}
        {mobileMenuOpen && (
          <nav className="lg:hidden pb-4 pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.path ||
                  pathname?.startsWith(`${item.path}/`);
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium
                      transition-smooth
                      ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </button>
                );
              })}
            </div>

            {/* User info on mobile */}
            <div className="mt-4 pt-4 border-t border-border md:hidden">
              <p className="text-sm font-medium text-foreground">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
