import React, { useState } from 'react';
import {
  CheckCircle2,
  CloudDownload,
  Eye,
  EyeOff,
  HardDrive,
  Heart,
  Loader2,
  LogOut,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  CHIBI_ASSETS,
  type CompanionPreferences,
} from '../utils/companionScript';
import {
  downloadTluSemesterSchedule,
  loginTluPortal,
  logoutTluPortal,
  type TluSemesterChoice,
  type TluStudentProfile,
} from '../utils/tluApi';
import {
  expandSemesterEvents,
  type SemesterBundle,
} from '../utils/tluSchedule';
import type { ThemePreference } from '../utils/offlineStorage';
import { PWAInstallButton } from './PWAInstallButton';

interface SyncViewProps {
  savedBundles: SemesterBundle[];
  activeSemesterId: string | null;
  onBundleDownloaded: (bundle: SemesterBundle) => Promise<void>;
  onSelectSavedBundle: (semesterId: string) => Promise<void>;
  onDeleteSavedBundle: (semesterId: string) => Promise<void>;
  onLoadDemo: () => Promise<void>;
  onGoToSchedule: () => void;
  theme: ThemePreference;
  onChangeTheme: (theme: ThemePreference) => void;
  companionPrefs: CompanionPreferences;
  onUpdateCompanionPrefs: (next: CompanionPreferences) => void;
}

function formatSyncTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export const SyncView: React.FC<SyncViewProps> = ({
  savedBundles,
  activeSemesterId,
  onBundleDownloaded,
  onSelectSavedBundle,
  onDeleteSavedBundle,
  onLoadDemo,
  onGoToSchedule,
  theme,
  onChangeTheme,
  companionPrefs,
  onUpdateCompanionPrefs,
}) => {
  const isOnline = useOnlineStatus();

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [student, setStudent] = useState<TluStudentProfile | null>(null);
  const [semesters, setSemesters] = useState<TluSemesterChoice[]>([]);
  const [selectedTluSemesterId, setSelectedTluSemesterId] = useState<string>('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isOnline) {
      setErrorMessage('Thiết bị đang không có mạng. Kết nối Wi-Fi/4G để đăng nhập và tải lịch mới.');
      return;
    }

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ mã sinh viên và mật khẩu cổng sinhvien1.tlu.edu.vn.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await loginTluPortal(trimmedUser, password);
      setSessionToken(result.sessionToken);
      setStudent(result.student);
      setSemesters(result.semesters);
      const defaultId =
        result.currentSemesterId != null
          ? String(result.currentSemesterId)
          : result.semesters[0]
            ? String(result.semesters[0].id)
            : '';
      setSelectedTluSemesterId(defaultId);
      setPassword('');
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.',
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDownloadSemester = async () => {
    if (!sessionToken || !selectedTluSemesterId) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isOnline) {
      setErrorMessage('Thiết bị đang ngoại tuyến. Hãy bật Wi-Fi/4G rồi bấm tải lại.');
      return;
    }

    setIsDownloading(true);
    try {
      const bundle = await downloadTluSemesterSchedule(
        sessionToken,
        Number(selectedTluSemesterId),
      );
      const totalEvents = expandSemesterEvents(bundle).length;
      await onBundleDownloaded(bundle);
      setSuccessMessage(
        `Đã tải trọn "${bundle.semesterName}" (${bundle.courses.length} môn, ${totalEvents} buổi học) vào bộ nhớ máy. Từ giờ tắt Wi-Fi vẫn xem đầy đủ.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không tải được thời khóa biểu.';
      setErrorMessage(msg);
      if (msg.includes('hết hạn')) {
        setSessionToken(null);
        setStudent(null);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDisconnectSession = async () => {
    if (sessionToken) {
      await logoutTluPortal(sessionToken);
    }
    setSessionToken(null);
    setStudent(null);
    setSemesters([]);
    setSelectedTluSemesterId('');
    setSuccessMessage('Đã ngắt phiên đăng nhập TLU. Các học kỳ đã tải vẫn được giữ lại để xem ngoại tuyến.');
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold text-[#9B6C85] dark:text-pink-200/75">
          Tải một lần khi có mạng · Xem trọn cả học kỳ không cần Wi-Fi
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#5C3349] dark:text-pink-50">
          Tải lịch học & Tùy chỉnh bé đồng hành
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Live TLU Sync + Companion Customization */}
        <div className="lg:col-span-7 space-y-5">
          <section
            aria-label="Kết nối cổng sinh viên TLU"
            className="rounded-[26px] border-2 border-[#F7C7DC] dark:border-pink-900/60 bg-white dark:bg-[#231838] p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#5C3349] dark:text-pink-50">
                  {sessionToken
                    ? 'Bước 2: Chọn học kỳ và tải trọn về máy'
                    : 'Đăng nhập cổng sinhvien1.tlu.edu.vn'}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#9B6C85] dark:text-pink-200/75">
                  {sessionToken
                    ? 'Chọn học kỳ bạn muốn lưu ngoại tuyến — ứng dụng sẽ tải toàn bộ môn học, phòng, giảng viên và lịch từng tuần trong một lượt.'
                    : 'Dùng tài khoản sinh viên Đại học Thủy lợi để tải trọn thời khóa biểu cả học kỳ về thiết bị.'}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFEFF6] dark:bg-pink-500/20 text-[#D66F9A] dark:text-pink-300">
                <CloudDownload className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mt-4 rounded-2xl border-2 border-rose-300 dark:border-rose-800/70 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs font-bold text-rose-800 dark:text-rose-200"
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="mt-4 rounded-2xl border-2 border-teal-300 dark:border-teal-800/70 bg-teal-50 dark:bg-teal-950/40 px-4 py-3 text-xs font-bold text-teal-900 dark:text-teal-200"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p>{successMessage}</p>
                    <button
                      type="button"
                      onClick={onGoToSchedule}
                      className="mt-2 font-extrabold underline underline-offset-2"
                    >
                      Mở xem lịch học ngay
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!sessionToken ? (
              <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="tlu-username"
                    className="block text-xs font-bold text-[#7A2048] dark:text-pink-200"
                  >
                    Mã sinh viên / Tài khoản TLU
                  </label>
                  <input
                    id="tlu-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: 2351060123"
                    className="mt-1.5 min-h-[46px] w-full rounded-2xl border-2 border-[#F7C7DC] dark:border-pink-800/70 bg-[#FFF9FB] dark:bg-[#19102A] px-3.5 text-sm font-semibold text-[#5C3349] dark:text-pink-50 placeholder:text-[#C28FA7] focus:border-[#F19EC0] dark:focus:border-pink-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tlu-password"
                    className="block text-xs font-bold text-[#8E4A6B] dark:text-pink-200"
                  >
                    Mật khẩu cổng sinh viên
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="tlu-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu đăng nhập sinhvien1.tlu.edu.vn"
                      className="min-h-[46px] w-full rounded-2xl border-2 border-[#F7C7DC] dark:border-pink-800/70 bg-[#FFF9FB] dark:bg-[#19102A] pl-3.5 pr-12 text-sm font-semibold text-[#5C3349] dark:text-pink-50 placeholder:text-[#C28FA7] focus:border-[#F19EC0] dark:focus:border-pink-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#9B6C85] hover:text-[#5C3349] dark:text-pink-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="kawaii-pill-cta inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl disabled:opacity-60 px-4 text-sm font-extrabold"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Đang kết nối cổng TLU...</span>
                    </>
                  ) : (
                    <span>Kết nối & Lấy danh sách học kỳ</span>
                  )}
                </button>

                <div className="flex items-start gap-2 pt-1 text-xs text-[#9B6C85] dark:text-pink-200/75">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#DF7BA4] dark:text-pink-300 mt-0.5" aria-hidden="true" />
                  <span>
                    Mật khẩu chỉ gửi trực tiếp tới sinhvien1.tlu.edu.vn để lấy lịch và bị xóa ngay sau khi xác thực, không qua máy chủ trung gian và không lưu trữ mật khẩu trên thiết bị.
                  </span>
                </div>

                <div className="border-t border-pink-100 dark:border-pink-900/50 pt-4">
                  <button
                    type="button"
                    onClick={onLoadDemo}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#F4B6D0] dark:border-pink-700/70 bg-[#FFF7FA] dark:bg-[#1B122E] px-4 text-xs font-extrabold text-[#9A4C72] dark:text-pink-200 hover:bg-[#FFEBF3] dark:hover:bg-[#2B1D44] transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-[#E484AC] dark:text-teal-300" aria-hidden="true" />
                    <span>Dùng thử lịch mẫu TLU (tải cả học kỳ mẫu để test ngoại tuyến)</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#FFF5F9] dark:bg-[#19102A] border border-pink-200 dark:border-pink-900/60 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#4A1D34] dark:text-pink-50 truncate">
                      {student?.displayName}
                    </p>
                    <p className="text-xs text-[#8C5A73] dark:text-pink-200/75 font-mono">
                      {student?.studentCode}
                      {student?.className ? ` · ${student.className}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnectSession}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border-2 border-[#F4B6D0] dark:border-pink-800/70 bg-white dark:bg-[#231838] px-3 text-xs font-bold text-[#881D4F] dark:text-pink-200 hover:bg-pink-50 whitespace-nowrap shrink-0"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Ngắt kết nối</span>
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="tlu-semester-picker"
                    className="block text-xs font-bold text-[#7A2048] dark:text-pink-200"
                  >
                    Chọn học kỳ cần tải trọn bộ về máy
                  </label>
                  <select
                    id="tlu-semester-picker"
                    value={selectedTluSemesterId}
                    onChange={(e) => setSelectedTluSemesterId(e.target.value)}
                    className="mt-1.5 min-h-[46px] w-full rounded-2xl border-2 border-[#F4B6D0] dark:border-pink-800/70 bg-[#FFF8FB] dark:bg-[#19102A] px-3.5 text-sm font-semibold text-[#4A1D34] dark:text-pink-50 focus:border-[#D94680] dark:focus:border-pink-400 focus:outline-none"
                  >
                    {semesters.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name}
                        {s.code ? ` (${s.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSemester}
                  disabled={isDownloading || !selectedTluSemesterId}
                  className="kawaii-pill-cta inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl disabled:opacity-60 px-4 text-sm font-extrabold"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Đang tải toàn bộ lịch học kỳ...</span>
                    </>
                  ) : (
                    <>
                      <CloudDownload className="h-4 w-4" aria-hidden="true" />
                      <span>Tải trọn học kỳ này về máy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* Offline Scripted Companion Customization Card */}
          <section
            aria-label="Tùy chỉnh bé đồng hành ngoại tuyến"
            className="rounded-[26px] border-2 border-[#F7C7DC] dark:border-pink-900/60 bg-gradient-to-br from-[#FFF6FA] via-white to-[#EEFCF9] dark:from-[#261A3C] dark:via-[#211939] dark:to-[#1C2A38] p-5 sm:p-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-[3px] border-[#F4ABC9] dark:border-pink-300 bg-white shadow-[0_3px_0_#F6C3D8]">
                <img
                  src={CHIBI_ASSETS.cheer}
                  alt={`Bé đồng hành ${companionPrefs.companionName}`}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover scale-105"
                />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-[#5C3349] dark:text-pink-50">
                  Bé đồng hành (100% ngoại tuyến)
                </h2>
                <p className="mt-0.5 text-xs text-[#9B6C85] dark:text-pink-200/75">
                  Tự đọc lịch học trên máy để nhắc phòng & cổ vũ — không dùng API trả phí ·{' '}
                  <span className="font-bold text-[#C95C8B] dark:text-pink-300 tabular-nums">
                    {companionPrefs.heartsCount} tim tương tác
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="companion-nickname"
                  className="block text-xs font-bold text-[#8E4A6B] dark:text-pink-200"
                >
                  Biệt danh của bạn
                </label>
                <input
                  id="companion-nickname"
                  type="text"
                  maxLength={24}
                  value={companionPrefs.nickname}
                  onChange={(e) =>
                    onUpdateCompanionPrefs({ ...companionPrefs, nickname: e.target.value })
                  }
                  placeholder="Ví dụ: Nhung"
                  className="mt-1 min-h-[42px] w-full rounded-xl border-2 border-[#F7C7DC] dark:border-pink-800/70 bg-white dark:bg-[#19102A] px-3 text-sm font-semibold text-[#5C3349] dark:text-pink-50 focus:border-[#F19EC0] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="companion-name"
                  className="block text-xs font-bold text-[#8E4A6B] dark:text-pink-200"
                >
                  Tên bé đồng hành
                </label>
                <input
                  id="companion-name"
                  type="text"
                  maxLength={24}
                  value={companionPrefs.companionName}
                  onChange={(e) =>
                    onUpdateCompanionPrefs({ ...companionPrefs, companionName: e.target.value })
                  }
                  placeholder="Ví dụ: Elysia"
                  className="mt-1 min-h-[42px] w-full rounded-xl border-2 border-[#F7C7DC] dark:border-pink-800/70 bg-white dark:bg-[#19102A] px-3 text-sm font-semibold text-[#5C3349] dark:text-pink-50 focus:border-[#F19EC0] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-pink-100 dark:border-pink-900/50 pt-4">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-[#E484AC] dark:text-pink-300" aria-hidden="true" />
                <span className="text-xs font-bold text-[#8E4A6B] dark:text-pink-200">
                  Giọng nói chuyện
                </span>
              </div>
              <div
                role="group"
                aria-label="Tính cách bé đồng hành"
                className="flex items-center gap-1 rounded-xl bg-[#FFF2F8] dark:bg-[#19102A] p-1"
              >
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCompanionPrefs({ ...companionPrefs, personality: 'sweet' })
                  }
                  aria-pressed={companionPrefs.personality === 'sweet'}
                  className={`min-h-[36px] rounded-lg px-3 text-xs font-bold transition-colors ${
                    companionPrefs.personality === 'sweet'
                      ? 'bg-[#F799BE] text-white'
                      : 'text-[#9A4C72] dark:text-pink-200'
                  }`}
                >
                  Ngọt ngào
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateCompanionPrefs({ ...companionPrefs, personality: 'bestie' })
                  }
                  aria-pressed={companionPrefs.personality === 'bestie'}
                  className={`min-h-[36px] rounded-lg px-3 text-xs font-bold transition-colors ${
                    companionPrefs.personality === 'bestie'
                      ? 'bg-[#F799BE] text-white'
                      : 'text-[#9A4C72] dark:text-pink-200'
                  }`}
                >
                  Lầy lội bạn thân
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#8E4A6B] dark:text-pink-200">
                Hiện sticker & bé đồng hành trên màn hình
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={companionPrefs.showStickers}
                onClick={() =>
                  onUpdateCompanionPrefs({
                    ...companionPrefs,
                    showStickers: !companionPrefs.showStickers,
                  })
                }
                className={`min-h-[36px] rounded-full border-2 px-3.5 text-xs font-extrabold transition-colors ${
                  companionPrefs.showStickers
                    ? 'border-[#F3A4C3] bg-[#FFEFF6] text-[#9A4C72] dark:bg-pink-500/30 dark:text-pink-100'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#19102A] text-slate-600 dark:text-slate-300'
                }`}
              >
                {companionPrefs.showStickers ? 'Đang bật' : 'Đang ẩn'}
              </button>
            </div>
          </section>
        </div>

        {/* Right 5 cols: Offline Saved Semesters + PWA Install + Theme */}
        <div className="lg:col-span-5 space-y-4">
          <section
            aria-label="Học kỳ đã lưu ngoại tuyến"
            className="rounded-[24px] border-2 border-[#F7C7DC] dark:border-pink-900/60 bg-white dark:bg-[#231838] p-5"
          >
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-[#DF7BA4] dark:text-pink-300" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-[#5C3349] dark:text-pink-50">
                Lịch đã lưu trên máy ({savedBundles.length})
              </h2>
            </div>

            {savedBundles.length === 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-[#8C5A73] dark:text-pink-200/75">
                Chưa có học kỳ nào được lưu ngoại tuyến. Hãy đăng nhập tài khoản TLU hoặc bấm tải lịch mẫu để lưu ngay vào bộ nhớ thiết bị.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-pink-100 dark:divide-pink-900/50">
                {savedBundles.map((b) => {
                  const isActive = b.semesterId === activeSemesterId;
                  const totalEvents = expandSemesterEvents(b).length;
                  return (
                    <div key={b.semesterId} className="py-3 first:pt-1 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#4A1D34] dark:text-pink-50 leading-snug">
                            {b.semesterName}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-[#8C5A73] dark:text-pink-200/75 tabular-nums">
                            {b.courses.length} môn · {totalEvents} buổi · Lưu lúc{' '}
                            {formatSyncTime(b.downloadedAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteSavedBundle(b.semesterId)}
                          aria-label={`Xóa lịch ngoại tuyến ${b.semesterName}`}
                          className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-xl text-[#B57B96] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        {isActive ? (
                          <span className="text-xs font-extrabold text-[#C95C8B] dark:text-teal-300">
                            Đang chọn hiển thị
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectSavedBundle(b.semesterId)}
                            className="text-xs font-bold text-[#8E5B75] dark:text-pink-200 underline underline-offset-2 hover:text-[#C95C8B]"
                          >
                            Chuyển sang xem kỳ này
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <PWAInstallButton variant="card" />

          {/* Theme Toggle */}
          <div className="rounded-[24px] border-2 border-[#F7C7DC] dark:border-pink-900/60 bg-white dark:bg-[#231838] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#5C3349] dark:text-pink-50">
                  Giao diện hiển thị
                </h3>
                <p className="mt-0.5 text-xs text-[#9B6C85] dark:text-pink-200/75">
                  Hồng phấn ban ngày hoặc tím sao ban đêm
                </p>
              </div>
              <div
                role="group"
                aria-label="Chế độ giao diện"
                className="flex items-center gap-1 rounded-xl bg-[#FFF2F8] dark:bg-[#19102A] p-1"
              >
                <button
                  type="button"
                  onClick={() => onChangeTheme('light')}
                  aria-pressed={theme === 'light'}
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                    theme === 'light'
                      ? 'bg-white text-[#9A4C72] shadow-xs'
                      : 'text-[#9B6C85] dark:text-pink-200/75'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sáng</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTheme('dark')}
                  aria-pressed={theme === 'dark'}
                  className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${
                    theme === 'dark'
                      ? 'bg-[#372456] text-pink-100 shadow-xs'
                      : 'text-[#9B6C85] dark:text-pink-200/75'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tối</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
