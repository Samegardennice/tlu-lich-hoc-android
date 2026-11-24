import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineBannerProps {
  hasSavedSchedule: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ hasSavedSchedule }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b-2 border-[#F7C7DC] dark:border-amber-800/60 bg-[#FFF5F9] dark:bg-amber-950/60 px-4 py-2 text-xs font-bold text-[#9A4C72] dark:text-amber-200"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          {hasSavedSchedule
            ? 'Không có kết nối mạng · Đang hiển thị lịch học đã tải về máy.'
            : 'Không có kết nối mạng · Kết nối Wi-Fi/4G một lần để tải lịch học cả học kỳ về máy.'}
        </span>
      </div>
    </div>
  );
};
