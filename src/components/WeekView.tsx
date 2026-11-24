import React, { useMemo } from 'react';
import {
  addDays,
  computeWeekNumber,
  formatDateVi,
  formatWeekdayVi,
  getEventsForDate,
  getEventsForWeek,
  getMondayOfWeek,
  getSemesterWeeks,
  getTluDayNumber,
  getTodayVnDateKey,
  type DatedClassEvent,
  type SemesterBundle,
} from '../utils/tluSchedule';
import { KawaiiHeartNavButton, KawaiiStarNavButton } from './KawaiiDecor';

interface WeekViewProps {
  bundle: SemesterBundle;
  events: DatedClassEvent[];
  weekMonday: string;
  onChangeWeekMonday: (mondayKey: string) => void;
  onSelectEvent: (event: DatedClassEvent) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  bundle,
  events,
  weekMonday,
  onChangeWeekMonday,
  onSelectEvent,
}) => {
  const todayKey = useMemo(() => getTodayVnDateKey(), []);
  const currentWeekMonday = useMemo(() => getMondayOfWeek(todayKey), [todayKey]);
  const semesterWeeks = useMemo(() => getSemesterWeeks(bundle, events), [bundle, events]);

  const weekEvents = useMemo(
    () => getEventsForWeek(events, weekMonday),
    [events, weekMonday],
  );

  const weekSunday = addDays(weekMonday, 6);
  const weekNumber = computeWeekNumber(weekMonday, bundle.schoolYearStart);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekMonday, i);
      return {
        date,
        tluDay: getTluDayNumber(date),
        isToday: date === todayKey,
        isMintTint: i === 2 || i === 4,
        items: getEventsForDate(weekEvents, date),
      };
    });
  }, [weekMonday, todayKey, weekEvents]);

  return (
    <div className="space-y-6">
      {/* Week Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8C5A73] dark:text-pink-200/75">
            {bundle.semesterName}
          </p>
          <h1 className="mt-1 flex flex-wrap items-baseline gap-2 tabular-nums">
            <span className="kawaii-date-text text-3xl sm:text-4xl leading-none">
              {weekNumber != null ? `Tuần ${weekNumber}` : 'Lịch tuần'}
            </span>
            <span className="font-display text-lg sm:text-2xl font-bold text-[#7A3B59] dark:text-pink-200">
              · {formatDateVi(weekMonday)} – {formatDateVi(weekSunday)}
            </span>
          </h1>
          <p className="mt-1 text-xs font-bold text-[#8C5A73] dark:text-pink-200/75 tabular-nums">
            {weekEvents.length} buổi học trong tuần này
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {weekMonday !== currentWeekMonday && (
            <button
              type="button"
              onClick={() => onChangeWeekMonday(currentWeekMonday)}
              className="min-h-[44px] rounded-full border-2 border-[#F3A4C3] dark:border-pink-400 bg-white dark:bg-[#231838] px-3.5 text-xs font-extrabold text-[#9A4C72] dark:text-pink-200 shadow-[0_3px_0_#F6BDD4] dark:shadow-[0_3px_0_#831843] hover:bg-[#FFF5F9] transition-colors whitespace-nowrap"
            >
              Tuần này
            </button>
          )}

          {semesterWeeks.length > 0 && (
            <>
              <label className="sr-only" htmlFor="semester-week-select">
                Chọn nhanh tuần trong học kỳ
              </label>
              <select
                id="semester-week-select"
                value={
                  semesterWeeks.some((w) => w.monday === weekMonday) ? weekMonday : ''
                }
                onChange={(e) => {
                  if (e.target.value) onChangeWeekMonday(e.target.value);
                }}
                className="min-h-[44px] rounded-2xl border-2 border-[#F4B6D0] dark:border-pink-800/70 bg-white dark:bg-[#231838] px-3 text-xs font-bold text-[#5C3349] dark:text-pink-100 focus:border-[#F19EC0] dark:focus:border-pink-400 focus:outline-none tabular-nums"
              >
                {!semesterWeeks.some((w) => w.monday === weekMonday) && (
                  <option value="">
                    {formatDateVi(weekMonday)} – {formatDateVi(weekSunday)}
                  </option>
                )}
                {semesterWeeks.map((w) => (
                  <option key={w.monday} value={w.monday}>
                    {w.weekNumber != null ? `Tuần ${w.weekNumber}` : 'Tuần'} ({formatDateVi(w.monday)} –{' '}
                    {formatDateVi(w.sunday)}) · {w.classCount} buổi
                  </option>
                ))}
              </select>
            </>
          )}

          <KawaiiHeartNavButton
            onClick={() => onChangeWeekMonday(addDays(weekMonday, -7))}
            ariaLabel="Chuyển về tuần trước"
          />
          <KawaiiStarNavButton
            onClick={() => onChangeWeekMonday(addDays(weekMonday, 7))}
            ariaLabel="Chuyển sang tuần sau"
          />
        </div>
      </div>

      {/* Desktop 7-Column Timetable Grid */}
      <div className="hidden lg:grid lg:grid-cols-7 gap-3">
        {days.map((day) => (
          <div
            key={day.date}
            className={`flex flex-col rounded-[22px] border-2 min-h-[340px] ${
              day.isToday
                ? 'border-[#F3A4C3] dark:border-pink-400 bg-white dark:bg-[#24193A] shadow-[0_4px_0_#F6BDD4] dark:shadow-[0_4px_0_#831843]'
                : 'border-[#F7C7DC] dark:border-pink-900/60 bg-white dark:bg-[#231838]'
            }`}
          >
            <div
              className={`border-b-2 px-3 py-3 text-center rounded-t-[20px] ${
                day.isToday
                  ? 'border-[#F7C7DC] dark:border-pink-800/70 bg-gradient-to-br from-[#FFC0DB]/70 via-[#FFE8F2] to-[#BDF7EE]/70 dark:from-[#E15B97]/40 dark:via-[#36204E] dark:to-[#2DD4BF]/30'
                  : day.isMintTint
                    ? 'border-[#E6FAF7] dark:border-teal-900/50 bg-[#EAFBF8] dark:bg-[#1A2B36]'
                    : 'border-[#FFEBF3] dark:border-pink-900/40 bg-[#FFF6FA] dark:bg-[#2A1D42]'
              }`}
            >
              <p
                className={`text-xs font-extrabold ${
                  day.isToday
                    ? 'text-[#9A4C72] dark:text-pink-100'
                    : 'text-[#9B6C85] dark:text-pink-200/80'
                }`}
              >
                {formatWeekdayVi(day.tluDay)}
              </p>
              <p className="mt-0.5 font-display text-base font-extrabold text-[#5C3349] dark:text-pink-50 tabular-nums">
                {formatDateVi(day.date)}
              </p>
            </div>

            <div className="flex-1 divide-y divide-pink-100 dark:divide-pink-900/50 p-2">
              {day.items.length === 0 ? (
                <p className="py-8 text-center text-xs font-semibold text-[#C59BB0] dark:text-pink-200/40">
                  Trống
                </p>
              ) : (
                day.items.map((ev) => (
                  <button
                    key={ev.eventId}
                    type="button"
                    onClick={() => onSelectEvent(ev)}
                    className="w-full text-left py-2.5 px-2 rounded-xl hover:bg-[#FFF4F8] dark:hover:bg-pink-950/50 transition-colors focus-visible:outline-2 focus-visible:outline-[#F3A4C3]"
                  >
                    <p className="font-mono text-[11px] font-bold text-[#C95C8B] dark:text-teal-300 tabular-nums">
                      {ev.startTime}–{ev.endTime}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#5C3349] dark:text-pink-50 leading-snug line-clamp-2">
                      {ev.name}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-[#8E5B75] dark:text-pink-200 leading-tight">
                      {ev.room}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#A5748E] dark:text-pink-300/75 tabular-nums leading-tight">
                      {ev.periods}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile & Tablet Grouped Vertical Week List */}
      <div className="lg:hidden space-y-3">
        {days.map((day) => (
          <section
            key={day.date}
            className={`rounded-[22px] border-2 bg-white dark:bg-[#231838] overflow-hidden ${
              day.isToday
                ? 'border-[#F3A4C3] dark:border-pink-400 shadow-[0_3px_0_#F6BDD4]'
                : 'border-[#F7C7DC] dark:border-pink-900/60'
            }`}
          >
            <div
              className={`flex items-center justify-between border-b border-pink-100 dark:border-pink-900/50 px-4 py-3 ${
                day.isToday
                  ? 'bg-gradient-to-r from-[#FFE8F2] to-[#E8FBF8] dark:from-pink-950/60 dark:to-teal-950/40'
                  : 'bg-[#FFF8FB] dark:bg-[#291D40]'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <h2 className="font-display text-base font-bold text-[#9A4C72] dark:text-pink-100">
                  {formatWeekdayVi(day.tluDay)}
                </h2>
                <span className="text-xs font-semibold text-[#9B6C85] dark:text-pink-200/75 tabular-nums">
                  {formatDateVi(day.date)}
                  {day.isToday ? ' · Hôm nay' : ''}
                </span>
              </div>
              <span className="text-xs font-bold text-[#B85985] dark:text-pink-300 tabular-nums">
                {day.items.length > 0 ? `${day.items.length} buổi` : 'Nghỉ'}
              </span>
            </div>

            {day.items.length > 0 && (
              <div className="divide-y divide-pink-100 dark:divide-pink-900/50">
                {day.items.map((ev) => (
                  <button
                    key={ev.eventId}
                    type="button"
                    onClick={() => onSelectEvent(ev)}
                    className="flex w-full items-start gap-3.5 px-4 py-3.5 text-left hover:bg-[#FFF6FA] dark:hover:bg-pink-950/40 transition-colors"
                  >
                    <div className="w-[56px] shrink-0 font-mono text-xs font-bold text-[#5C3349] dark:text-pink-100 tabular-nums pt-0.5">
                      <div>{ev.startTime || '--:--'}</div>
                      <div className="mt-0.5 font-normal text-[#A5748E] dark:text-pink-300/70">
                        {ev.endTime || '--:--'}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#5C3349] dark:text-pink-50 leading-snug">
                        {ev.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#8E5B75] dark:text-pink-200">
                        <span className="font-extrabold text-[#C95C8B] dark:text-teal-300">
                          Phòng {ev.room}
                        </span>
                        <span className="mx-1.5 text-pink-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="tabular-nums">{ev.periods}</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};
