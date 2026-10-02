import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/auth-context';
import { useTheme } from '@/app/providers';
import { Search, Sun, Moon, Plus } from 'lucide-react';
import { useState } from 'react';

export function DashboardHeader() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const now = new Date();
  const hour = now.getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/applications?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 flex-wrap">
      <div>
        <div className="text-[13px] text-muted-foreground mb-1 font-sans">
          {formattedDate}
        </div>
        <h1 className="font-display font-semibold text-[32px] sm:text-[40px] leading-[1.1] tracking-tight text-foreground">
          {timeGreeting}, {firstName}
        </h1>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-[280px]">
          <Search
            size={16}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            id="q"
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search everything"
            aria-label="Search everything"
            className="w-full h-9 pl-9 pr-10 rounded-md bg-card border border-input text-body text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary transition-colors"
          />
          <span
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] leading-[18px] px-1.5 rounded-[4px] border border-border bg-background text-muted-foreground font-mono select-none"
            aria-hidden="true"
          >
            /
          </span>
        </form>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          className="w-9 h-9 rounded-md border border-border bg-card hover:bg-secondary grid place-items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={17} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
        </button>

        {/* Primary Add Button (desktop/tablet) */}
        <Link
          to="/applications/new"
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-body no-underline transition-colors"
        >
          <Plus size={16} strokeWidth={1.5} />
          <span>Add application</span>
        </Link>
      </div>
    </header>
  );
}
