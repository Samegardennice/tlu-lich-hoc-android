import React from 'react';
import { BookOpen, Calendar, CalendarDays, Download, RefreshCw } from 'lucide-react';

export type AppTab = 'today' | 'week' | 'semester' | 'sync';

interface AppHeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  hasSchedule: boolean;
}

const NAV_ITEMS: Array<{
  id: AppTab;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}> = [
  { id: 'today', label: 'Hôm nay', icon: Calendar },
  { id: 'week', label: 'Tuần học', icon: CalendarDays },
  { id: 'semester', label: 'Cả học kỳ', icon: BookOpen },
  { id: 'sync', label: 'Tải lịch', icon: Download },
];

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  onSelectTab,
  hasSchedule,
}) => {
  return (
    <header className="sticky top-0 z-30 pt-safe border-b-2 border-[#FCE0EC] dark:border-pink-900/60 bg-white/92 dark:bg-[#211735]/92 backdrop-blur-md md:rounded-t-[30px]">
      <div className="mx-auto flex h-[56px] md:h-[68px] max-w-6xl items-center justify-between gap-4 md:gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-element Outlined Bubbly Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('today')}
          className="kawaii-logo-text text-xl md:text-2xl tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F3A4C3]"
        >
          TLU Lịch Học
        </button>

        {/* Zone 2: Desktop Navigation Links (4 single-line links matching mockup) */}
        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative inline-flex min-h-[40px] items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-bold transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#FFEFF6] dark:bg-pink-500/20 text-[#9A4C72] dark:text-pink-200'
                    : 'text-[#7D4E66] dark:text-pink-200/70 hover:bg-[#FFF6FA] dark:hover:bg-pink-500/10 hover:text-[#9A4C72] dark:hover:text-pink-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden={true} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-[15px] h-[3px] rounded-full bg-[#F3A4C3] dark:bg-pink-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action Pill Button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('sync')}
            className="kawaii-pill-cta inline-flex min-h-[38px] md:min-h-[42px] items-center gap-2 rounded-full px-4 md:px-5 py-1.5 text-xs md:text-sm font-extrabold whitespace-nowrap shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
            <span>{hasSchedule ? 'Đồng bộ' : 'Kết nối TLU'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
