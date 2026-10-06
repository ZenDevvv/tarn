import { useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { StageRing } from '@/features/applications/components/application-status-badge';
import { useAuth } from '@/features/auth/context/auth-context';
import { useTheme } from '@/app/providers';
import {
  Home,
  Briefcase,
  Bookmark,
  Building2,
  Users,
  Calendar,
  FileText,
  BarChart2,
  Settings,
  Plus,
  Moon,
  Sun,
  LogOut,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  count?: number | string;
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isKanban =
    location.pathname === '/applications' && searchParams.get('view') === 'pipeline';

  // Global '/' key focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        const searchInput = document.getElementById('q') as HTMLInputElement | null;
        if (searchInput) searchInput.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data: analytics } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => apiClient.get<any>('/analytics/dashboard'),
    staleTime: 30000,
  });

  const { data: companies } = useQuery({
    queryKey: ['companies-count'],
    queryFn: () => apiClient.get<any[]>('/companies'),
    staleTime: 30000,
  });

  const { data: contacts } = useQuery({
    queryKey: ['contacts-count'],
    queryFn: () => apiClient.get<any[]>('/contacts'),
    staleTime: 30000,
  });

  const { data: resumes } = useQuery({
    queryKey: ['resumes-count'],
    queryFn: () => apiClient.get<any[]>('/resumes'),
    staleTime: 30000,
  });

  const savedCount = analytics?.pipeline?.SAVED ?? 0;
  const activeCount = analytics?.summary?.activeApplications ?? 0;
  const interviewsCount = analytics?.summary?.interviewCount ?? 0;
  const companiesCount = companies?.length ?? 0;
  const contactsCount = contacts?.length ?? 0;
  const resumesCount = resumes?.length ?? 0;

  const navItems: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home size={16} strokeWidth={1.5} /> },
    { to: '/applications', label: 'Applications', icon: <Briefcase size={16} strokeWidth={1.5} />, count: activeCount > 0 ? activeCount : undefined },
    { to: '/saved-jobs', label: 'Saved jobs', icon: <Bookmark size={16} strokeWidth={1.5} />, count: savedCount > 0 ? savedCount : undefined },
    { to: '/companies', label: 'Companies', icon: <Building2 size={16} strokeWidth={1.5} />, count: companiesCount > 0 ? companiesCount : undefined },
    { to: '/contacts', label: 'Contacts', icon: <Users size={16} strokeWidth={1.5} />, count: contactsCount > 0 ? contactsCount : undefined },
    { to: '/interviews', label: 'Interviews', icon: <Calendar size={16} strokeWidth={1.5} />, count: interviewsCount > 0 ? interviewsCount : undefined },
    { to: '/resumes', label: 'Resumes', icon: <FileText size={16} strokeWidth={1.5} />, count: resumesCount > 0 ? resumesCount : undefined },
    { to: '/analytics', label: 'Analytics', icon: <BarChart2 size={16} strokeWidth={1.5} /> },
    { to: '/settings', label: 'Settings', icon: <Settings size={16} strokeWidth={1.5} /> },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="grid grid-cols-[232px_minmax(0,1fr)] max-[1023px]:grid-cols-[64px_minmax(0,1fr)] max-[719px]:grid-cols-1 min-h-[100dvh] bg-background text-foreground font-sans">
      {/* Sidebar (Desktop & Tablet) */}
      <aside className="sticky top-0 h-[100dvh] border-r border-border p-4 px-3 flex flex-col gap-4 max-[719px]:hidden max-[1023px]:items-center max-[1023px]:px-2">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 px-2 py-1 font-display font-semibold text-subheading text-foreground tracking-tight no-underline"
        >
          <StageRing status="OFFER" size={22} />
          <span className="max-[1023px]:hidden">Tarn</span>
        </Link>

        {/* Global Primary Action Button */}
        <Link
          to="/applications/new"
          className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-body no-underline transition-colors max-[1023px]:w-10 max-[1023px]:p-0 max-[1023px]:rounded-md"
        >
          <Plus size={16} strokeWidth={1.5} />
          <span className="max-[1023px]:hidden">Add application</span>
        </Link>

        {/* Primary Nav Links */}
        <nav className="flex flex-col gap-0.5 w-full mt-1" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-small font-medium text-muted-foreground hover:bg-secondary hover:text-foreground no-underline transition-colors max-[1023px]:justify-center max-[1023px]:p-2',
                  isActive && 'bg-secondary text-foreground font-semibold [&_svg]:text-primary'
                )
              }
              title={item.label}
            >
              {item.icon}
              <span className="max-[1023px]:hidden">{item.label}</span>
              {item.count && (
                <span className="ml-auto text-caption text-muted-foreground max-[1023px]:hidden">
                  {item.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* User Badge & Theme Toggle */}
        <div className="pt-3 border-t border-border w-full flex items-center justify-between gap-2 max-[1023px]:flex-col">
          <Link
            to="/settings?tab=profile"
            className="flex items-center gap-2.5 min-w-0 flex-1 p-1.5 -ml-1 rounded-md hover:bg-secondary transition-colors no-underline group cursor-pointer max-[1023px]:ml-0 max-[1023px]:p-1 max-[1023px]:flex-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title="Profile settings"
            aria-label="Profile settings"
          >
            <div className="w-[30px] h-[30px] rounded-full bg-success-tint text-success font-semibold text-[13px] grid place-items-center shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
              {userInitial}
            </div>
            <div className="min-w-0 max-[1023px]:hidden">
              <span className="block font-medium text-[13px] leading-[18px] text-foreground truncate group-hover:text-primary transition-colors">
                {user?.name || 'Candidate'}
              </span>
              <span className="block text-caption text-muted-foreground truncate">
                {user?.email || ''}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-md hover:bg-secondary grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-8 h-8 rounded-md hover:bg-secondary grid place-items-center text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Log out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="w-full flex-1 min-w-0 p-8 max-[1023px]:px-6 max-[719px]:px-4 max-[719px]:pb-28">
        <div
          className={cn(
            'w-full mx-auto flex flex-col gap-10 transition-[max-width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
            isKanban ? 'max-w-full' : 'max-w-[1040px]'
          )}
        >
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="hidden max-[719px]:grid grid-cols-5 fixed left-0 right-0 bottom-0 z-30 bg-card border-t border-border py-2 px-1 text-center text-[11px] text-muted-foreground"
        style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
        aria-label="Mobile Navigation"
      >
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-1 no-underline text-muted-foreground', isActive && 'text-foreground font-semibold [&_svg]:text-primary')
          }
        >
          <Home size={20} strokeWidth={1.5} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/applications"
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-1 no-underline text-muted-foreground', isActive && 'text-foreground font-semibold [&_svg]:text-primary')
          }
        >
          <Briefcase size={20} strokeWidth={1.5} />
          <span>Applications</span>
        </NavLink>

        <Link
          to="/applications/new"
          className="flex flex-col items-center no-underline"
          aria-label="Add application"
        >
          <span className="w-[46px] h-[46px] rounded-full bg-primary text-primary-foreground grid place-items-center -mt-5 border-[3px] border-background shadow-xs">
            <Plus size={22} strokeWidth={2} />
          </span>
        </Link>

        <NavLink
          to="/interviews"
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-1 no-underline text-muted-foreground', isActive && 'text-foreground font-semibold [&_svg]:text-primary')
          }
        >
          <Calendar size={20} strokeWidth={1.5} />
          <span>Interviews</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-1 no-underline text-muted-foreground', isActive && 'text-foreground font-semibold [&_svg]:text-primary')
          }
        >
          <MoreHorizontal size={20} strokeWidth={1.5} />
          <span>More</span>
        </NavLink>
      </nav>
    </div>
  );
}
