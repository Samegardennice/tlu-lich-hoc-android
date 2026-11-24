import React, { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  HardDrive,
  Hourglass,
  NotebookPen,
  Pencil,
  Users,
} from 'lucide-react';
import { HEADER_BUST_ASSET } from '../utils/companionScript';
import {
  addDays,
  computeWeekNumber,
  findLiveClassStatus,
  formatDateVi,
  formatWeekdayVi,
  getCurrentVnMinutes,
  getEventsForDate,
  getMondayOfWeek,
  getTluDayNumber,
  getTodayVnDateKey,
  type DatedClassEvent,
  type SemesterBundle,
} from '../utils/tluSchedule';
import {
  KawaiiBow,
  KawaiiHeartNavButton,
  KawaiiMiniStar,
  KawaiiPolaroid,
  KawaiiSparkle,
  KawaiiStarNavButton,
} from './KawaiiDecor';

interface TodayViewProps {
  bundle: SemesterBundle;
  events: DatedClassEvent[];
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  onSelectEvent: (event: DatedClassEvent) => void;
  onOpenSync: () => void;
  onOpenWeek: () => void;
  notes: Record<string, string>;
  showStickers: boolean;
}

function formatDownloadedAt(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(d);
}

function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

export const TodayView: React.FC<TodayViewProps> = ({
  bundle,
  events,
  selectedDate,
  onSelectDate,
  onSelectEvent,
  onOpenSync,
  onOpenWeek,
  notes,
  showStickers,
}) => {
  const todayKey = useMemo(() => getTodayVnDateKey(), []);
  const nowMinutes = useMemo(() => getCurrentVnMinutes(), []);
  const mondayKey = useMemo(() => getMondayOfWeek(selectedDate), [selectedDate]);
  const weekNumber = useMemo(
    () => computeWeekNumber(selectedDate, bundle.schoolYearStart),
    [selectedDate, bundle.schoolYearStart],
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(mondayKey, i);
      const count = getEventsForDate(events, date).length;
      return {
        date,
        dayOfMonth: date.slice(8, 10),
        tluDay: getTluDayNumber(date),
        count,
        isToday: date === todayKey,
        isSelected: date === selectedDate,
        isMintTint: i === 2 || i === 4,
      };
    });
  }, [mondayKey, events, todayKey, selectedDate]);

  const dayEvents = useMemo(
    () => getEventsForDate(events, selectedDate),
    [events, selectedDate],
  );

  const liveStatus = useMemo(
    () => findLiveClassStatus(events, todayKey, nowMinutes),
    [events, todayKey, nowMinutes],
  );

  const selectedWeekdayLabel = formatWeekdayVi(getTluDayNumber(selectedDate));
  const isViewingToday = selectedDate === todayKey;

  return (
    <div className="space-y-6">
      {/* Kawaii Hero Band: Clean 2-Row Mobile Layout (Zero Text Collision) + Peeking Companion + Soft Baby-Pink Palette */}
      <section
        aria-label="Chọn ngày trong tuần"
        className="relative overflow-visible rounded-[28px] bg-gradient-to-b from-[#FFF4F8] via-[#FFF8FB] to-transparent dark:from-[#2A1B42] dark:via-[#231838]/70 dark:to-transparent px-3 pt-3.5 pb-2 sm:px-5 sm:pt-5"
      >
        {/* Row 1: Semester metadata + Mobile "Về hôm nay" pill (separated from date so it NEVER overlaps) */}
        <div className="relative z-10 flex items-center justify-between gap-2 min-h-[26px]">
          <p className="text-xs sm:text-sm font-bold text-[#94607B] dark:text-pink-200/80 truncate">
            {bundle.semesterCode || bundle.semesterName}
            {weekNumber != null ? ` · Tuần ${weekNumber}` : ''}
          </p>
          {!isViewingToday && (
            <button
              type="button"
              onClick={() => onSelectDate(todayKey)}
              className="sm:hidden inline-flex min-h-[32px] shrink-0 items-center rounded-full border-2 border-[#F3A4C3] dark:border-pink-400 bg-white dark:bg-[#231838] px-3 text-xs font-extrabold text-[#9A4C72] dark:text-pink-200 shadow-[0_2px_0_#F6BDD4] dark:shadow-[0_2px_0_#831843] active:translate-y-[1px] transition-all whitespace-nowrap"
            >
              Về hôm nay
            </button>
          )}
        </div>

        {/* Row 2: Giant Pastel Outlined Date + Peeking Anime Portrait (md+) + Heart/Star Nav */}
        <div className="relative mt-1 flex items-center justify-between gap-2 min-h-[46px] sm:min-h-[82px]">
          <div className="relative z-10 min-w-0 flex-1">
            <h1 className="kawaii-date-text text-[20px] min-[375px]:text-[22px] sm:text-[40px] leading-[1.16] tracking-tight tabular-nums truncate">
              {selectedWeekdayLabel}, {formatDateVi(selectedDate, true)}
            </h1>
          </div>

          {/* Center-Right: Anime Companion Portrait peeking cleanly behind the 7-day cards */}
          {showStickers && (
            <div
              aria-hidden="true"
              className={`pointer-events-none hidden md:block absolute -bottom-7 z-0 h-[156px] w-[206px] select-none overflow-hidden transition-all ${
                isViewingToday ? 'right-[132px]' : 'right-[224px]'
              }`}
            >
              <img
                src={HEADER_BUST_ASSET}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain object-bottom mix-blend-multiply dark:mix-blend-normal dark:rounded-full dark:border-2 dark:border-pink-300/60 dark:object-cover dark:h-32 dark:w-32 dark:mx-auto dark:mt-3"
                style={{
                  maskImage: 'radial-gradient(ellipse 80% 82% at 50% 48%, black 64%, transparent 99%)',
                  WebkitMaskImage:
                    'radial-gradient(ellipse 80% 82% at 50% 48%, black 64%, transparent 99%)',
                }}
              />
            </div>
          )}

          {/* Far Right: Desktop "Hôm nay" pill + Heart (<) & Star (>) Week Navigation Buttons */}
          <div className="relative z-10 flex items-center gap-1 sm:gap-2 shrink-0">
            {!isViewingToday && (
              <button
                type="button"
                onClick={() => onSelectDate(todayKey)}
                className="hidden sm:inline-flex min-h-[40px] items-center rounded-full border-2 border-[#F3A4C3] dark:border-pink-400 bg-white dark:bg-[#231838] px-3.5 text-xs font-extrabold text-[#9A4C72] dark:text-pink-200 shadow-[0_3px_0_#F6BDD4] dark:shadow-[0_3px_0_#831843] hover:bg-[#FFF5F9] dark:hover:bg-pink-950/50 active:translate-y-[1px] transition-all whitespace-nowrap"
              >
                Hôm nay
              </button>
            )}
            <KawaiiHeartNavButton
              onClick={() => onSelectDate(addDays(selectedDate, -7))}
              ariaLabel="Tuần trước"
            />
            <KawaiiStarNavButton
              onClick={() => onSelectDate(addDays(selectedDate, 7))}
              ariaLabel="Tuần sau"
            />
          </div>
        </div>

        {/* 7-Day Tactile Soft Baby-Pink Bordered Cards (T2–CN) */}
        <div className="relative z-10 mt-3.5 sm:mt-4 grid grid-cols-7 gap-1.5 sm:gap-3">
          {weekDays.map((d, idx) => (
            <div key={d.date} className="relative">
              {/* Cute perched ribbon bow on T6 matching reference */}
              {showStickers && idx === 4 && (
                <KawaiiBow className="pointer-events-none hidden sm:block absolute -top-4 -left-4 z-20 h-7 w-9 -rotate-12" />
              )}
              {showStickers && d.isSelected && (
                <KawaiiMiniStar
                  fill="#BDF7EE"
                  className="pointer-events-none hidden sm:block absolute -top-2 -right-1.5 z-20 h-4 w-4"
                />
              )}
              {showStickers && d.isSelected && (
                <KawaiiMiniStar
                  fill="#FFC2DC"
                  className="pointer-events-none hidden sm:block absolute -bottom-1.5 -left-1.5 z-20 h-4 w-4"
                />
              )}

              <button
                type="button"
                onClick={() => onSelectDate(d.date)}
                aria-label={`${formatWeekdayVi(d.tluDay)}, ngày ${formatDateVi(d.date)}, ${d.count} buổi học`}
                aria-pressed={d.isSelected}
                className={`kawaii-day-card flex min-h-[66px] sm:min-h-[82px] w-full flex-col items-center justify-center rounded-[18px] sm:rounded-[22px] px-1 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3A4C3] ${
                  d.isSelected
                    ? 'bg-gradient-to-br from-[#FFC0DB] via-[#FFE5F1] to-[#B6F6EE] dark:from-[#E15B97] dark:via-[#A855F7] dark:to-[#2DD4BF] text-[#5C3349] dark:text-white'
                    : d.isMintTint
                      ? 'bg-[#EAFBF8] dark:bg-[#1B2C38] text-[#5C3349] dark:text-teal-100 hover:bg-[#DDF8F3] dark:hover:bg-[#223948]'
                      : d.isToday
                        ? 'bg-[#FFF0F6] dark:bg-[#361E46] text-[#9A4C72] dark:text-pink-100 hover:bg-[#FFE6F1]'
                        : 'bg-white dark:bg-[#24193A] text-[#5C3349] dark:text-pink-100 hover:bg-[#FFF7FA] dark:hover:bg-[#2E2049]'
                }`}
              >
                <span
                  className={`text-[11px] sm:text-xs font-bold leading-none ${
                    d.isSelected
                      ? 'text-[#8C4568] dark:text-white/95'
                      : 'text-[#9B6C85] dark:text-pink-200/75'
                  }`}
                >
                  {formatWeekdayVi(d.tluDay, true)}
                </span>
                <span
                  className={`mt-1 font-display text-lg sm:text-2xl font-extrabold tabular-nums leading-none ${
                    d.isSelected
                      ? 'kawaii-day-number-active'
                      : 'text-[#5C3349] dark:text-pink-50'
                  }`}
                >
                  {d.dayOfMonth}
                </span>
                <span
                  className={`mt-1 text-[10px] sm:text-xs font-bold tabular-nums leading-none ${
                    d.isSelected
                      ? 'text-[#7A3B59] dark:text-white/95'
                      : d.count > 0
                        ? 'text-[#A25C80] dark:text-pink-300'
                        : 'text-[#C29CB0] dark:text-pink-200/40'
                  }`}
                >
                  {d.count > 0 ? `${d.count} ca` : '—'}
                </span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content Area: Day Schedule Cards + Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Dashed Kawaii Stationery Class Cards */}
        <section aria-label="Lịch học trong ngày" className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <h2 className="flex items-center gap-2 font-display text-lg sm:text-xl font-bold text-[#5C3349] dark:text-pink-50">
              <span>Lịch học ngày {formatDateVi(selectedDate)}</span>
              <Calendar className="h-4 w-4 text-[#DF7BA4] dark:text-pink-300" aria-hidden="true" />
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#8E5B75] dark:text-pink-200 tabular-nums">
              <Users className="h-4 w-4 text-[#DF7BA4] dark:text-pink-300" aria-hidden="true" />
              <span>{dayEvents.length} buổi học</span>
            </span>
          </div>

          {dayEvents.length === 0 ? (
            <div className="kawaii-card-blush rounded-[24px] px-6 py-10 text-center">
              <p className="font-display text-lg font-bold text-[#5C3349] dark:text-pink-50">
                Hôm nay trống lịch học rồi nè!
              </p>
              <p className="mt-1.5 text-sm text-[#8E5B75] dark:text-pink-200/80">
                {liveStatus.nextUpcoming && liveStatus.nextUpcoming.date > selectedDate
                  ? `Buổi học tiếp theo: ${liveStatus.nextUpcoming.name} vào ${formatWeekdayVi(liveStatus.nextUpcoming.day)}, ${formatDateVi(liveStatus.nextUpcoming.date)}.`
                  : 'Bạn có thể chuyển sang ngày khác hoặc xem toàn bộ lịch tuần.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {liveStatus.nextUpcoming && liveStatus.nextUpcoming.date !== selectedDate && (
                  <button
                    type="button"
                    onClick={() => onSelectDate(liveStatus.nextUpcoming!.date)}
                    className="kawaii-pill-cta inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2 text-sm font-extrabold"
                  >
                    <span>Tới buổi học tiếp theo</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenWeek}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border-2 border-[#F3A4C3] dark:border-pink-400/60 bg-white dark:bg-[#231838] px-4 py-2 text-sm font-bold text-[#9A4C72] dark:text-pink-200 hover:bg-[#FFF5F9] dark:hover:bg-pink-950/40 transition-colors"
                >
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  <span>Xem cả tuần</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {dayEvents.map((ev, index) => {
                const isLive = isViewingToday && liveStatus.current?.eventId === ev.eventId;
                const hasNote = Boolean(notes[ev.courseKey]);
                const cardStyleClass =
                  index % 2 === 1 ? 'kawaii-card-mint' : 'kawaii-card-blush';

                return (
                  <div key={ev.eventId} className="relative">
                    {/* Tilted Polaroid miniature sticker on first card matching reference */}
                    {showStickers && index === 0 && (
                      <KawaiiPolaroid className="hidden xl:block absolute -right-5 top-1/2 -translate-y-1/2 rotate-6 z-10" />
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectEvent(ev)}
                      className={`${cardStyleClass} w-full text-left rounded-[24px] p-4 sm:p-5 transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3A4C3] ${
                        isLive
                          ? 'ring-2 ring-[#F19EC0] dark:ring-teal-300 ring-offset-2 ring-offset-white dark:ring-offset-[#211735]'
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3.5 sm:gap-5 pr-0 xl:pr-14">
                        {/* Tabular Time Column */}
                        <div className="w-[58px] sm:w-[68px] shrink-0 pt-0.5 font-mono tabular-nums">
                          <p className="text-base sm:text-lg font-bold text-[#5C3349] dark:text-pink-50 leading-none">
                            {ev.startTime || '--:--'}
                          </p>
                          <p className="mt-1.5 text-xs sm:text-sm font-medium text-[#9B6C85] dark:text-pink-200/75 leading-none">
                            {ev.endTime || '--:--'}
                          </p>
                        </div>

                        {/* Class Details with Stationery Icons */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="flex items-center gap-2 font-display text-base sm:text-lg font-bold text-[#5C3349] dark:text-pink-50 leading-snug">
                              <Hourglass
                                className="h-4 w-4 shrink-0 text-[#E684AC] dark:text-pink-300"
                                aria-hidden="true"
                              />
                              <span className="truncate">{ev.name}</span>
                            </h3>
                            {isLive && (
                              <span className="shrink-0 text-xs font-extrabold text-[#C95C8B] dark:text-teal-300">
                                Đang học
                              </span>
                            )}
                          </div>

                          <p className="flex items-center gap-2 text-sm font-bold text-[#6E3D57] dark:text-pink-100">
                            <BookOpen
                              className="h-4 w-4 shrink-0 text-[#6FA0E2] dark:text-teal-300"
                              aria-hidden="true"
                            />
                            <span>
                              Phòng {ev.room}
                              <span className="mx-2 text-[#E684AC]/65 dark:text-pink-400/60" aria-hidden="true">
                                ·
                              </span>
                              <span className="tabular-nums">{ev.periods}</span>
                            </span>
                          </p>

                          <p className="flex items-center gap-2 text-xs sm:text-sm text-[#8E5B75] dark:text-pink-200/80">
                            <Pencil
                              className="h-3.5 w-3.5 shrink-0 text-[#E89176] dark:text-amber-300"
                              aria-hidden="true"
                            />
                            <span className="truncate">
                              {ev.teacher} — <span className="font-mono">{ev.code}</span>
                            </span>
                          </p>

                          {hasNote && (
                            <p className="pt-1 flex items-center gap-1.5 text-xs font-bold text-[#B85985] dark:text-teal-300">
                              <NotebookPen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span className="truncate">{notes[ev.courseKey]}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right 4 Cols: Next Class Spotlight + Offline Storage Status */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Spotlight Card */}
          <div className="relative rounded-[24px] border-2 border-[#F7C7DC] dark:border-pink-900/60 bg-gradient-to-br from-[#FFF6FA] via-white to-[#EEFCF9] dark:from-[#291B40] dark:via-[#231B3B] dark:to-[#1E2B3A] p-5">
            {showStickers && (
              <KawaiiSparkle
                color="mint"
                className="pointer-events-none absolute -top-2.5 right-4 h-5 w-5"
              />
            )}
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#B85985] dark:text-pink-300">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>
                {liveStatus.current
                  ? 'Đang diễn ra'
                  : liveStatus.nextToday
                    ? 'Ca học tiếp theo hôm nay'
                    : 'Buổi học sắp tới'}
              </span>
            </div>

            {liveStatus.current ? (
              <div className="mt-3">
                <p className="font-display text-base font-bold text-[#5C3349] dark:text-pink-50">
                  {liveStatus.current.name}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#8E5B75] dark:text-pink-200 tabular-nums">
                  Phòng {liveStatus.current.room} · Còn{' '}
                  {formatDurationMinutes(liveStatus.minutesRemaining ?? 0)}
                </p>
                <button
                  type="button"
                  onClick={() => onSelectEvent(liveStatus.current!)}
                  className="mt-3 text-xs font-extrabold text-[#C95C8B] dark:text-teal-300 hover:underline"
                >
                  Xem chi tiết ca học
                </button>
              </div>
            ) : liveStatus.nextUpcoming ? (
              <div className="mt-3">
                <p className="font-display text-base font-bold text-[#5C3349] dark:text-pink-50">
                  {liveStatus.nextUpcoming.name}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#8E5B75] dark:text-pink-200 tabular-nums">
                  {liveStatus.nextToday && liveStatus.minutesUntilNext != null
                    ? `Bắt đầu sau ${formatDurationMinutes(liveStatus.minutesUntilNext)} · ${liveStatus.nextToday.startTime}`
                    : `${formatWeekdayVi(liveStatus.nextUpcoming.day)}, ${formatDateVi(liveStatus.nextUpcoming.date)} · ${liveStatus.nextUpcoming.startTime}`}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#9B6C85] dark:text-pink-200/75">
                  Phòng {liveStatus.nextUpcoming.room} · {liveStatus.nextUpcoming.periods}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#8E5B75] dark:text-pink-200/80">
                Đã hoàn thành tất cả các buổi học trong học kỳ này.
              </p>
            )}
          </div>

          {/* Offline Bundle Info Card */}
          <div className="rounded-[24px] border-2 border-[#F7C7DC] dark:border-pink-900/60 bg-white dark:bg-[#231838] p-5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#B85985] dark:text-pink-300">
              <HardDrive className="h-4 w-4" aria-hidden="true" />
              <span>Bộ nhớ ngoại tuyến trên máy</span>
            </div>
            <p className="mt-2.5 text-sm font-bold text-[#5C3349] dark:text-pink-50">
              {bundle.semesterName}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#9B6C85] dark:text-pink-200/75 tabular-nums">
              {bundle.courses.length} môn · {events.length} buổi đã lưu sẵn
              {bundle.downloadedAt ? ` · Cập nhật ${formatDownloadedAt(bundle.downloadedAt)}` : ''}
            </p>
            {bundle.studentName && (
              <p className="mt-1 text-xs text-[#9B6C85] dark:text-pink-200/75">
                Sinh viên: {bundle.studentName}
                {bundle.studentCode ? ` (${bundle.studentCode})` : ''}
              </p>
            )}
            <button
              type="button"
              onClick={onOpenSync}
              className="mt-4 min-h-[44px] w-full rounded-2xl border-2 border-[#F7C7DC] dark:border-pink-800/70 bg-[#FFF6FA] dark:bg-[#1A112C] px-3.5 text-xs font-extrabold text-[#9A4C72] dark:text-pink-200 hover:bg-[#FFEBF3] dark:hover:bg-[#2E1E48] transition-colors"
            >
              {bundle.isDemo ? 'Đăng nhập TLU để tải lịch thật' : 'Đổi học kỳ hoặc tải lại lịch mới'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
