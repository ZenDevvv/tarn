import React from 'react';
import { User, Sliders, Shield, Database, GitBranch, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SettingsTab = 'profile' | 'career' | 'preferences' | 'stages' | 'security' | 'data';

interface SettingsNavProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const TABS: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
  { id: 'profile', label: 'User Account', icon: <User size={16} strokeWidth={1.5} /> },
  { id: 'career', label: 'Career Fact Bank', icon: <Sparkles size={16} strokeWidth={1.5} /> },
  { id: 'preferences', label: 'Preferences', icon: <Sliders size={16} strokeWidth={1.5} /> },
  { id: 'stages', label: 'Pipeline & Stages', icon: <GitBranch size={16} strokeWidth={1.5} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} strokeWidth={1.5} /> },
  { id: 'data', label: 'Data & Account', icon: <Database size={16} strokeWidth={1.5} /> },
];

export function SettingsNav({ activeTab, onTabChange }: SettingsNavProps) {
  return (
    <div className="w-full border-b border-border overflow-x-auto scrollbar-none">
      <nav className="flex items-center gap-2 min-w-max pb-px" aria-label="Settings sections">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-body font-medium transition-colors relative',
                isActive
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
