import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'card' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'card' }) => {
  const isNative = Capacitor.isNativePlatform();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isNative) {
    if (variant === 'compact') return null;
    return (
      <div className="rounded-[24px] border-2 border-[#F4B6D0] dark:border-pink-900/60 bg-white dark:bg-[#231838] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#4A1D34] dark:text-pink-100">
              Ứng dụng Android độc lập
            </p>
            <p className="text-xs leading-relaxed text-[#8C5A73] dark:text-pink-200/75">
              Kết nối trực tiếp từ điện thoại tới cổng sinhvien1.tlu.edu.vn không qua máy chủ trung gian và xem trọn lịch học ngoại tuyến.
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFEFF6] dark:bg-pink-500/20 text-[#D66F9A] dark:text-pink-300">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </div>
    );
  }

  if (isInstalled) {
    if (variant === 'compact') return null;
    return (
      <div className="rounded-[24px] border-2 border-[#F4B6D0] dark:border-pink-900/60 bg-white dark:bg-[#231838] p-5">
        <p className="text-sm font-bold text-[#4A1D34] dark:text-pink-100">
          Đã cài đặt ứng dụng trên thiết bị
        </p>
        <p className="mt-1 text-xs text-[#8C5A73] dark:text-pink-200/75">
          Bạn đang mở TLU Lịch Học ở chế độ ứng dụng độc lập và có thể xem lịch ngay cả khi mất mạng.
        </p>
      </div>
    );
  }

  const handlePrimaryClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  if (variant === 'compact') {
    if (!isInstallable && !isIOS) return null;
    return (
      <>
        <button
          type="button"
          onClick={handlePrimaryClick}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-full border-2 border-[#E879A9] bg-white dark:bg-[#231838] px-3.5 py-2 text-xs font-bold text-[#881D4F] dark:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="h-4 w-4 text-[#D94680] dark:text-pink-300" aria-hidden="true" />
          <span>Cài lên máy</span>
        </button>
        {showGuide && <InstallGuideDialog isIOS={isIOS} onClose={() => setShowGuide(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="rounded-[24px] border-2 border-[#F7C7DC] dark:border-pink-900/60 bg-white dark:bg-[#231838] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#5C3349] dark:text-pink-100">
              Cài lên màn hình chính điện thoại
            </h3>
            <p className="text-xs leading-relaxed text-[#9B6C85] dark:text-pink-200/75">
              Mở toàn màn hình như app Android thật và xem toàn bộ lịch học đã tải ngay cả khi tắt Wi-Fi / 4G.
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFEFF6] dark:bg-pink-500/20 text-[#D66F9A] dark:text-pink-300">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrimaryClick}
          className="kawaii-pill-cta mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>{isInstallable ? 'Cài đặt ứng dụng ngay' : 'Xem hướng dẫn cài đặt trên điện thoại'}</span>
        </button>
      </div>

      {showGuide && <InstallGuideDialog isIOS={isIOS} onClose={() => setShowGuide(false)} />}
    </>
  );
};

const InstallGuideDialog: React.FC<{ isIOS: boolean; onClose: () => void }> = ({ isIOS, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2A1020]/50 backdrop-blur-xs p-0 sm:p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="install-guide-title"
  >
    <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-[28px] bg-white dark:bg-[#231838] border-2 border-[#F4B6D0] dark:border-pink-400/60 p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <h3 id="install-guide-title" className="font-display text-lg font-bold text-[#9A4C72] dark:text-pink-200">
          {isIOS ? 'Cài đặt trên iPhone / iPad' : 'Cài đặt trên điện thoại Android'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hướng dẫn cài đặt"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#8C5A73] hover:bg-pink-50 dark:text-pink-200 dark:hover:bg-pink-950/60"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {isIOS ? (
        <ol className="mt-4 space-y-3 text-sm text-[#5C2B44] dark:text-pink-100/90 list-decimal pl-5">
          <li>Mở ứng dụng này bằng trình duyệt <strong>Safari</strong>.</li>
          <li>Chạm vào biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng.</li>
          <li>Chọn <strong>Thêm vào màn hình chính (Add to Home Screen)</strong> rồi bấm Thêm.</li>
        </ol>
      ) : (
        <ol className="mt-4 space-y-3 text-sm text-[#5C2B44] dark:text-pink-100/90 list-decimal pl-5">
          <li>Mở đường link ứng dụng này bằng trình duyệt <strong>Google Chrome</strong> trên điện thoại Android.</li>
          <li>Chạm vào biểu tượng <strong>ba chấm (⋮)</strong> ở góc trên bên phải.</li>
          <li>Chọn <strong>Cài đặt ứng dụng</strong> (hoặc <strong>Thêm vào màn hình chính</strong>).</li>
          <li>Sau khi cài xong, bấm tải lịch học 1 lần khi có mạng — từ đó mở không cần Wi-Fi vẫn xem đầy đủ cả học kỳ.</li>
        </ol>
      )}

      <button
        type="button"
        onClick={onClose}
        className="kawaii-pill-cta mt-6 min-h-[44px] w-full rounded-2xl text-sm font-extrabold"
      >
        Đã hiểu
      </button>
    </div>
  </div>
);
