import React from 'react';
import { BookOpen, CalendarDays, Clock, CloudDownload } from 'lucide-react';
import type { AppTab } from './AppHeader';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const TABS: Array<{
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}> = [
  { id: 'today', label: 'Hôm nay', icon: Clock },
  { id: 'week', label: 'Tuần học', icon: CalendarDays },
  { id: 'semester', label: 'Học kỳ', icon: BookOpen },
  { id: 'sync', label: 'Tải lịch', icon: CloudDownload },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      aria-label="Điều hướng di động"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t-2 border-[#FCE0EC] dark:border-pink-900/70 bg-white/95 dark:bg-[#211735]/95 backdrop-blur-md pb-safe"
    >
      <div className="grid h-[60px] grid-cols-4 items-center px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl transition-colors ${
                isActive
                  ? 'text-[#D66F9A] dark:text-pink-300'
                  : 'text-[#9B6C85] dark:text-pink-200/60 active:text-[#9A4C72] dark:active:text-pink-200'
              }`}
            >
              <Icon className="h-[21px] w-[21px]" aria-hidden={true} />
              <span className="text-[11px] font-bold tracking-tight leading-none whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
