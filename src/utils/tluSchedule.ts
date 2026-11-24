export const DAY_MS = 86_400_000;

export interface TluHourRef {
  name?: string;
  startString?: string;
  endString?: string;
  indexNumber?: number;
}

export interface TluTimetableRaw {
  id?: number | string;
  weekIndex?: number;
  startDate?: number | string | null;
  endDate?: number | string | null;
  fromWeek?: number | null;
  toWeek?: number | null;
  startHour?: TluHourRef | null;
  endHour?: TluHourRef | null;
  roomName?: string | null;
  room?: { name?: string | null } | null;
  teacherName?: string | null;
  teacher?: { displayName?: string | null } | null;
}

export interface TluRawRow {
  id?: number | string;
  subjectName?: string | null;
  subjectCode?: string | null;
  subjectStatus?: number | null;
  numberOfCredit?: number | null;
  courseSubject?: {
    id?: number | string;
    code?: string | null;
    displayName?: string | null;
    numberOfCredit?: number | null;
    semesterSubject?: {
      subject?: {
        subjectName?: string | null;
        subjectCode?: string | null;
        numberOfCredit?: number | null;
      } | null;
    } | null;
    timetables?: TluTimetableRaw[] | null;
  } | null;
}

export interface TluSemesterMeta {
  id: number | string;
  semesterName?: string | null;
  semesterCode?: string | null;
  schoolYear?: {
    startDate?: number | string | null;
    endDate?: number | string | null;
  } | null;
}

export interface NormalizedCourse {
  key: string;
  name: string;
  code: string;
  credits: number | null;
  slotCount: number;
}

export interface NormalizedScheduleSlot {
  key: string;
  courseKey: string;
  name: string;
  code: string;
  credits: number | null;
  day: number; // 2 = Monday ... 8 = Sunday (TLU convention)
  startDate: string; // YYYY-MM-DD (Asia/Ho_Chi_Minh)
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  periods: string; // e.g., "Tiết 1 – Tiết 3"
  room: string;
  teacher: string;
  fromWeek: number | null;
  toWeek: number | null;
}

export interface SemesterBundle {
  semesterId: string;
  semesterName: string;
  semesterCode: string;
  schoolYearStart: string | null;
  studentName?: string;
  studentCode?: string;
  isDemo?: boolean;
  downloadedAt: string;
  courses: NormalizedCourse[];
  slots: NormalizedScheduleSlot[];
  warnings: string[];
}

export interface DatedClassEvent extends NormalizedScheduleSlot {
  date: string; // YYYY-MM-DD
  eventId: string;
  weekNumber: number | null;
}

export interface SemesterWeekOption {
  monday: string;
  sunday: string;
  weekNumber: number | null;
  classCount: number;
}

export interface LiveClassStatus {
  current: DatedClassEvent | null;
  nextToday: DatedClassEvent | null;
  nextUpcoming: DatedClassEvent | null;
  minutesRemaining: number | null;
  minutesUntilNext: number | null;
}

/**
 * Converts a timestamp, ISO string, or YYYY-MM-DD string into a YYYY-MM-DD key
 * strictly in Asia/Ho_Chi_Minh (UTC+7), matching sinhvien1.tlu.edu.vn.
 */
export function toVnDateKey(value: number | string | Date | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getTodayVnDateKey(now: Date = new Date()): string {
  return toVnDateKey(now) || '2026-11-23';
}

export function getCurrentVnMinutes(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

export function addDays(dateKey: string, delta: number): string {
  const ms = Date.parse(`${dateKey}T00:00:00Z`) + delta * DAY_MS;
  return new Date(ms).toISOString().slice(0, 10);
}

export function getMondayOfWeek(dateKey: string): string {
  const jsDay = new Date(`${dateKey}T00:00:00Z`).getUTCDay(); // 0=Sun, 1=Mon
  const diff = -((jsDay + 6) % 7);
  return addDays(dateKey, diff);
}

export function getTluDayNumber(dateKey: string): number {
  const jsDay = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return jsDay === 0 ? 8 : jsDay + 1;
}

export function formatWeekdayVi(tluDay: number, short = false): string {
  if (tluDay === 8) return short ? 'CN' : 'Chủ nhật';
  return short ? `T${tluDay}` : `Thứ ${tluDay}`;
}

export function formatDateVi(dateKey: string, includeYear = false): string {
  const [y, m, d] = dateKey.split('-');
  if (!y || !m || !d) return dateKey;
  return includeYear ? `${d}/${m}/${y}` : `${d}/${m}`;
}

export function parseTimeToMinutes(timeStr: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(timeStr.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function computeWeekNumber(dateKey: string, schoolYearStart: string | null): number | null {
  if (!schoolYearStart) return null;
  const diffMs = Date.parse(`${dateKey}T00:00:00Z`) - Date.parse(`${schoolYearStart}T00:00:00Z`);
  if (!Number.isFinite(diffMs)) return null;
  const week = Math.floor(diffMs / (7 * DAY_MS)) + 1;
  return week >= 1 ? week : null;
}

function cleanPeriodLabel(startName?: string, endName?: string): string {
  const s = (startName || '').trim();
  const e = (endName || '').trim();
  if (!s && !e) return 'Chưa rõ tiết';
  if (s && e && s === e) return s;
  const sNum = s.replace(/^Tiết\s*/i, '');
  const eNum = e.replace(/^Tiết\s*/i, '');
  if (/^\d+$/.test(sNum) && /^\d+$/.test(eNum)) {
    return `Tiết ${sNum}–${eNum}`;
  }
  return `${s || '?'} – ${e || '?'}`;
}

/**
 * Normalizes raw StudentCourseSubject rows from sinhvien1.tlu.edu.vn
 * into a compact, offline-ready SemesterBundle.
 */
export function normalizeTluSemester(
  rows: TluRawRow[],
  semester: TluSemesterMeta,
  meta?: { studentName?: string; studentCode?: string; isDemo?: boolean; downloadedAt?: string },
): SemesterBundle {
  if (!Array.isArray(rows)) {
    throw new Error('Dữ liệu thời khóa biểu không đúng định dạng danh sách.');
  }

  const coursesMap = new Map<string, NormalizedCourse>();
  const slots: NormalizedScheduleSlot[] = [];
  const warningsSet = new Set<string>();
  const seenSlots = new Set<string>();
  const schoolYearStart = toVnDateKey(semester.schoolYear?.startDate);

  for (const row of rows) {
    if (!row) continue;
    // Matches ProfileController.js: subjectStatus == -4 means cancelled course
    if (Number(row.subjectStatus) === -4) continue;

    const cs = row.courseSubject || {};
    const subjectRef = cs.semesterSubject?.subject || {};
    const name =
      (row.subjectName || subjectRef.subjectName || cs.displayName || 'Môn chưa rõ tên').trim();
    const code = (cs.displayName || row.subjectCode || cs.code || subjectRef.subjectCode || name).trim();
    const rawCredits = cs.numberOfCredit ?? row.numberOfCredit ?? subjectRef.numberOfCredit ?? null;
    const credits = rawCredits != null && Number.isFinite(Number(rawCredits)) ? Number(rawCredits) : null;
    const courseKey = String(cs.id ?? row.id ?? code);

    if (!coursesMap.has(courseKey)) {
      coursesMap.set(courseKey, {
        key: courseKey,
        name,
        code,
        credits,
        slotCount: 0,
      });
    }

    const timetables = Array.isArray(cs.timetables) ? cs.timetables : [];
    if (timetables.length === 0) {
      warningsSet.add(`${name}: chưa có lịch phòng/giờ cụ thể trên cổng trường.`);
      continue;
    }

    for (const t of timetables) {
      if (!t) continue;
      const startDate = toVnDateKey(t.startDate);
      const endDate = toVnDateKey(t.endDate);
      const day = Number(t.weekIndex);

      if (!startDate || !endDate || endDate < startDate || !Number.isInteger(day) || day < 2 || day > 8) {
        warningsSet.add(`${name}: có buổi thiếu ngày hoặc thứ hợp lệ, đã bỏ qua khỏi lịch tuần.`);
        continue;
      }

      const spanDays = (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / DAY_MS;
      if (spanDays > 400) {
        warningsSet.add(`${name}: khoảng thời gian học kéo dài bất thường, vui lòng kiểm tra lại trên cổng trường.`);
        continue;
      }

      const room = (t.roomName || t.room?.name || 'Chưa cập nhật phòng').trim();
      const teacher = (t.teacherName || t.teacher?.displayName || 'Chưa phân công GV').trim();
      const startTime = (t.startHour?.startString || '').trim();
      const endTime = (t.endHour?.endString || '').trim();
      const periods = cleanPeriodLabel(t.startHour?.name, t.endHour?.name);

      const dedupeKey = `${courseKey}:${t.id ?? [day, startDate, endDate, periods, room].join('|')}`;
      if (seenSlots.has(dedupeKey)) continue;
      seenSlots.add(dedupeKey);

      slots.push({
        key: dedupeKey,
        courseKey,
        name,
        code,
        credits,
        day,
        startDate,
        endDate,
        startTime,
        endTime,
        periods,
        room,
        teacher,
        fromWeek: t.fromWeek != null && Number.isFinite(Number(t.fromWeek)) ? Number(t.fromWeek) : null,
        toWeek: t.toWeek != null && Number.isFinite(Number(t.toWeek)) ? Number(t.toWeek) : null,
      });

      const course = coursesMap.get(courseKey);
      if (course) {
        course.slotCount += 1;
      }
    }
  }

  return {
    semesterId: String(semester.id),
    semesterName: (semester.semesterName || semester.semesterCode || `Học kỳ ${semester.id}`).trim(),
    semesterCode: (semester.semesterCode || '').trim(),
    schoolYearStart,
    studentName: meta?.studentName,
    studentCode: meta?.studentCode,
    isDemo: meta?.isDemo,
    downloadedAt: meta?.downloadedAt || new Date().toISOString(),
    courses: Array.from(coursesMap.values()),
    slots,
    warnings: Array.from(warningsSet),
  };
}

/**
 * Expands every recurring slot in a SemesterBundle into concrete dated class events
 * across the entire semester, strictly honoring TLU date ranges and week bounds.
 */
export function expandSemesterEvents(bundle: SemesterBundle): DatedClassEvent[] {
  const output: DatedClassEvent[] = [];

  for (const slot of bundle.slots) {
    const spanDays =
      (Date.parse(`${slot.endDate}T00:00:00Z`) - Date.parse(`${slot.startDate}T00:00:00Z`)) / DAY_MS;
    if (!Number.isFinite(spanDays) || spanDays < 0 || spanDays > 400) continue;

    for (let date = slot.startDate; date <= slot.endDate; date = addDays(date, 1)) {
      if (getTluDayNumber(date) !== slot.day) continue;

      const weekNumber = computeWeekNumber(date, bundle.schoolYearStart);
      if (weekNumber != null && slot.fromWeek != null && slot.toWeek != null) {
        if (weekNumber < slot.fromWeek || weekNumber > slot.toWeek) continue;
      }

      output.push({
        ...slot,
        date,
        eventId: `${slot.key}@${date}`,
        weekNumber,
      });
    }
  }

  return output.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    const startA = parseTimeToMinutes(a.startTime) ?? 9999;
    const startB = parseTimeToMinutes(b.startTime) ?? 9999;
    if (startA !== startB) return startA - startB;
    return a.name.localeCompare(b.name, 'vi');
  });
}

export function getEventsForDate(events: DatedClassEvent[], dateKey: string): DatedClassEvent[] {
  return events.filter((e) => e.date === dateKey);
}

export function getEventsForWeek(events: DatedClassEvent[], mondayDateKey: string): DatedClassEvent[] {
  const sunday = addDays(mondayDateKey, 6);
  return events.filter((e) => e.date >= mondayDateKey && e.date <= sunday);
}

export function getSemesterWeeks(
  bundle: SemesterBundle,
  events: DatedClassEvent[],
): SemesterWeekOption[] {
  if (events.length === 0) return [];

  const firstMonday = getMondayOfWeek(events[0].date);
  const lastMonday = getMondayOfWeek(events[events.length - 1].date);

  const countByMonday = new Map<string, number>();
  for (const ev of events) {
    const m = getMondayOfWeek(ev.date);
    countByMonday.set(m, (countByMonday.get(m) ?? 0) + 1);
  }

  const weeks: SemesterWeekOption[] = [];
  for (let m = firstMonday; m <= lastMonday; m = addDays(m, 7)) {
    weeks.push({
      monday: m,
      sunday: addDays(m, 6),
      weekNumber: computeWeekNumber(m, bundle.schoolYearStart),
      classCount: countByMonday.get(m) ?? 0,
    });
  }
  return weeks;
}

export function findLiveClassStatus(
  events: DatedClassEvent[],
  todayDateKey: string,
  nowMinutes: number,
): LiveClassStatus {
  const todayEvents = getEventsForDate(events, todayDateKey);
  let current: DatedClassEvent | null = null;
  let nextToday: DatedClassEvent | null = null;
  let minutesRemaining: number | null = null;
  let minutesUntilNext: number | null = null;

  for (const ev of todayEvents) {
    const startMin = parseTimeToMinutes(ev.startTime);
    const endMin = parseTimeToMinutes(ev.endTime);
    if (startMin == null || endMin == null) continue;

    if (nowMinutes >= startMin && nowMinutes < endMin) {
      current = ev;
      minutesRemaining = endMin - nowMinutes;
    } else if (nowMinutes < startMin && !nextToday) {
      nextToday = ev;
      minutesUntilNext = startMin - nowMinutes;
    }
  }

  const nextUpcoming =
    nextToday ?? events.find((ev) => ev.date > todayDateKey) ?? null;

  return {
    current,
    nextToday,
    nextUpcoming,
    minutesRemaining,
    minutesUntilNext,
  };
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatIcsLocalDateTime(dateKey: string, timeStr: string, fallback: string): string {
  const cleanDate = dateKey.replace(/-/g, '');
  const match = /^(\d{1,2}):(\d{2})/.exec(timeStr.trim());
  if (!match) {
    return `${cleanDate}T${fallback}`;
  }
  const hh = match[1].padStart(2, '0');
  const mm = match[2].padStart(2, '0');
  return `${cleanDate}T${hh}${mm}00`;
}

/**
 * Generates an RFC 5545 .ics calendar string for the entire semester
 * so students can import it into Google Calendar or Android Calendar offline.
 */
export function buildIcsCalendar(bundle: SemesterBundle, events: DatedClassEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TLU Lich Hoc//Offline Timetable//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(`Lịch học TLU — ${bundle.semesterName}`)}`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
  ];

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

  for (const ev of events) {
    const dtStart = formatIcsLocalDateTime(ev.date, ev.startTime, '070000');
    const dtEnd = formatIcsLocalDateTime(ev.date, ev.endTime, '093500');
    const uid = `${ev.eventId.replace(/[^a-zA-Z0-9@._-]/g, '_')}@tlu-lich-hoc.local`;
    const description = [
      `Lớp học phần: ${ev.code}`,
      `Ca học: ${ev.periods}`,
      `Phòng: ${ev.room}`,
      `Giảng viên: ${ev.teacher}`,
    ].join('\n');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}`,
      `DTEND;TZID=Asia/Ho_Chi_Minh:${dtEnd}`,
      `SUMMARY:${escapeIcsText(ev.name)}`,
      `LOCATION:${escapeIcsText(ev.room)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
