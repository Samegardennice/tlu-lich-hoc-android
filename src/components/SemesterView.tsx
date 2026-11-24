import React, { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AlertTriangle, CalendarArrowUp, Search, X } from 'lucide-react';
import {
  buildIcsCalendar,
  formatDateVi,
  formatWeekdayVi,
  type DatedClassEvent,
  type NormalizedScheduleSlot,
  type SemesterBundle,
} from '../utils/tluSchedule';

interface SemesterViewProps {
  bundle: SemesterBundle;
  events: DatedClassEvent[];
}

export const SemesterView: React.FC<SemesterViewProps> = ({ bundle, events }) => {
  const [query, setQuery] = useState('');
  const [exportedNotice, setExportedNotice] = useState(false);

  const totalCredits = useMemo(
    () => bundle.courses.reduce((sum, c) => sum + (c.credits ?? 0), 0),
    [bundle.courses],
  );

  const slotsByCourse = useMemo(() => {
    const map = new Map<string, NormalizedScheduleSlot[]>();
    for (const slot of bundle.slots) {
      const list = map.get(slot.courseKey) ?? [];
      list.push(slot);
      map.set(slot.courseKey, list);
    }
    return map;
  }, [bundle.slots]);

  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bundle.courses;
    return bundle.courses.filter((course) => {
      if (course.name.toLowerCase().includes(q) || course.code.toLowerCase().includes(q)) {
        return true;
      }
      const courseSlots = slotsByCourse.get(course.key) ?? [];
      return courseSlots.some(
        (s) =>
          s.room.toLowerCase().includes(q) ||
          s.teacher.toLowerCase().includes(q) ||
          formatWeekdayVi(s.day).toLowerCase().includes(q),
      );
    });
  }, [bundle.courses, slotsByCourse, query]);

  const handleExportIcs = async () => {
    const icsContent = buildIcsCalendar(bundle, events);
    const safeName = (bundle.semesterCode || bundle.semesterId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `TLU_LichHoc_${safeName}.ics`;

    if (Capacitor.isNativePlatform()) {
      try {
        const saved = await Filesystem.writeFile({
          path: fileName,
          data: icsContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
        await Share.share({
          title: `Lịch học TLU — ${bundle.semesterName}`,
          text: `Lịch học cả học kỳ (${events.length} buổi) dùng để nhập vào Google Calendar.`,
          files: [saved.uri],
          dialogTitle: 'Mở bằng Google Calendar hoặc chia sẻ file .ics',
        });
        setExportedNotice(true);
        window.setTimeout(() => setExportedNotice(false), 3500);
        return;
      } catch (err) {
        if (err instanceof Error && /cancel/i.test(err.message)) {
          return;
        }
      }
    }

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportedNotice(true);
    window.setTimeout(() => setExportedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header + Export ICS */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#8C5A73] dark:text-pink-200/75">
            Toàn bộ môn học đã lưu ngoại tuyến
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#4A1D34] dark:text-pink-50">
            {bundle.semesterName}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleExportIcs}
          disabled={events.length === 0}
          className="kawaii-pill-cta inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full disabled:opacity-50 px-5 py-2.5 text-sm font-extrabold whitespace-nowrap"
        >
          <CalendarArrowUp className="h-4 w-4" aria-hidden="true" />
          <span>Xuất Google Calendar (.ics)</span>
        </button>
      </div>

      {exportedNotice && (
        <p role="status" className="text-xs font-bold text-teal-700 dark:text-teal-300">
          Đã tải file .ics chứa toàn bộ {events.length} buổi học — bạn có thể mở trực tiếp trên điện thoại để thêm vào Google Calendar.
        </p>
      )}

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-[22px] border-2 border-[#F7C7DC] dark:border-pink-900/60 bg-[#FFF6FA] dark:bg-[#231838] p-4">
          <p className="text-xs font-bold text-[#9B6C85] dark:text-pink-200/75">Số môn học</p>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#5C3349] dark:text-pink-50 tabular-nums">
            {bundle.courses.length}
          </p>
        </div>
        <div className="rounded-[22px] border-2 border-[#F7C7DC] dark:border-pink-900/60 bg-white dark:bg-[#231838] p-4">
          <p className="text-xs font-bold text-[#9B6C85] dark:text-pink-200/75">Tổng tín chỉ</p>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#5C3349] dark:text-pink-50 tabular-nums">
            {totalCredits > 0 ? totalCredits : '—'}
          </p>
        </div>
        <div className="rounded-[22px] border-2 border-[#BCEFE7] dark:border-teal-800/60 bg-[#EBFAF7] dark:bg-[#1B2C38] p-4">
          <p className="text-xs font-bold text-[#467D76] dark:text-teal-200/80">Tổng buổi cả kỳ</p>
          <p className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-[#C95C8B] dark:text-teal-300 tabular-nums">
            {events.length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <label htmlFor="semester-search-input" className="sr-only">
          Tìm môn học, mã học phần, phòng học hoặc giảng viên
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#DF7BA4] dark:text-pink-300"
          aria-hidden="true"
        />
        <input
          id="semester-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên môn, mã học phần, phòng (VD: 301-A2) hoặc giảng viên..."
          className="min-h-[48px] w-full rounded-2xl border-2 border-[#F7C7DC] dark:border-pink-800/70 bg-white dark:bg-[#231838] pl-10 pr-10 text-sm font-medium text-[#5C3349] dark:text-pink-50 placeholder:text-[#C28FA7] focus:border-[#F19EC0] dark:focus:border-pink-400 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Xóa từ khóa tìm kiếm"
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#8C5A73] hover:text-[#4A1D34] dark:text-pink-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Course Cards */}
      {filteredCourses.length === 0 ? (
        <div className="kawaii-card-blush rounded-[24px] px-6 py-10 text-center">
          <p className="text-sm font-bold text-[#4A1D34] dark:text-pink-100">
            Không tìm thấy môn học phù hợp với &ldquo;{query}&rdquo;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map((course, idx) => {
            const courseSlots = slotsByCourse.get(course.key) ?? [];
            return (
              <article
                key={course.key}
                className={`${idx % 2 === 1 ? 'kawaii-card-mint' : 'kawaii-card-blush'} rounded-[24px] p-5`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#4A1D34] dark:text-pink-50 leading-snug">
                      {course.name}
                    </h2>
                    <p className="mt-1 font-mono text-xs font-semibold text-[#8C5A73] dark:text-pink-200/75">
                      {course.code}
                      {course.credits != null ? ` · ${course.credits} tín chỉ` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-4 divide-y divide-pink-200/70 dark:divide-pink-900/50 border-t border-pink-200/70 dark:border-pink-900/50">
                  {courseSlots.length === 0 ? (
                    <p className="pt-3 text-xs text-[#8C5A73] dark:text-pink-200/75">
                      Chưa có lịch phòng học cụ thể trên cổng trường.
                    </p>
                  ) : (
                    courseSlots.map((slot) => (
                      <div key={slot.key} className="py-3 first:pt-3 last:pb-0 text-xs">
                        <p className="font-bold text-[#4A1D34] dark:text-pink-100 tabular-nums">
                          {formatWeekdayVi(slot.day)} · {slot.periods}
                          {slot.startTime && slot.endTime
                            ? ` (${slot.startTime}–${slot.endTime})`
                            : ''}
                        </p>
                        <p className="mt-1 font-semibold text-[#8E5B75] dark:text-pink-200/80">
                          <span className="font-extrabold text-[#C95C8B] dark:text-teal-300">
                            Phòng {slot.room}
                          </span>
                          <span className="mx-1.5" aria-hidden="true">
                            ·
                          </span>
                          <span>{slot.teacher}</span>
                        </p>
                        <p className="mt-1 text-[#9D6682] dark:text-pink-300/70 tabular-nums">
                          {formatDateVi(slot.startDate, true)} – {formatDateVi(slot.endDate, true)}
                          {slot.fromWeek != null && slot.toWeek != null
                            ? ` · Tuần ${slot.fromWeek}–${slot.toWeek}`
                            : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Warnings Disclosure */}
      {bundle.warnings.length > 0 && (
        <section
          aria-label="Lưu ý dữ liệu từ cổng trường"
          className="rounded-[22px] border-2 border-amber-300 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/30 p-4"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Lưu ý từ dữ liệu cổng trường ({bundle.warnings.length})</span>
          </div>
          <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-200/90 list-disc pl-5">
            {bundle.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
