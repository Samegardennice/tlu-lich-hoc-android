import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  buildIcsCalendar,
  computeWeekNumber,
  expandSemesterEvents,
  findLiveClassStatus,
  getMondayOfWeek,
  normalizeTluSemester,
  toVnDateKey,
  type TluRawRow,
} from './tluSchedule';

test('toVnDateKey converts UTC timestamps strictly into Asia/Ho_Chi_Minh dates', () => {
  // 2026-11-22T18:30:00Z is 2026-11-23 01:30 in UTC+7
  const utcEvening = Date.parse('2026-11-22T18:30:00Z');
  assert.equal(toVnDateKey(utcEvening), '2026-11-23');
  assert.equal(toVnDateKey('2026-11-23'), '2026-11-23');
  assert.equal(toVnDateKey(null), null);
});

test('getMondayOfWeek and addDays handle Monday and Sunday boundaries accurately', () => {
  assert.equal(getMondayOfWeek('2026-11-23'), '2026-11-23'); // Monday
  assert.equal(getMondayOfWeek('2026-11-29'), '2026-11-23'); // Sunday belongs to same week
  assert.equal(addDays('2026-11-23', 6), '2026-11-29');
});

test('normalizeTluSemester skips cancelled courses (-4), deduplicates slots, and preserves fallbacks', () => {
  const rows: TluRawRow[] = [
    {
      id: 1,
      subjectName: 'Môn đã hủy',
      subjectStatus: -4,
      courseSubject: {
        id: 10,
        timetables: [
          {
            id: 100,
            weekIndex: 2,
            startDate: '2026-11-02',
            endDate: '2026-11-30',
          },
        ],
      },
    },
    {
      id: 2,
      subjectName: 'Công nghệ Web',
      subjectCode: 'CSE485-65CNTT1',
      subjectStatus: 0,
      courseSubject: {
        id: 20,
        displayName: 'CSE485-65CNTT1',
        numberOfCredit: 3,
        timetables: [
          {
            id: 201,
            weekIndex: 2,
            startDate: '2026-11-02',
            endDate: '2026-11-23',
            fromWeek: 10,
            toWeek: 13,
            startHour: { name: 'Tiết 1', startString: '07:00' },
            endHour: { name: 'Tiết 3', endString: '09:35' },
            room: { name: '301-A2' },
            teacher: { displayName: 'TS. Trần Minh Hải' },
          },
          // Duplicate slot ID should be ignored
          {
            id: 201,
            weekIndex: 2,
            startDate: '2026-11-02',
            endDate: '2026-11-23',
            fromWeek: 10,
            toWeek: 13,
            startHour: { name: 'Tiết 1', startString: '07:00' },
            endHour: { name: 'Tiết 3', endString: '09:35' },
            room: { name: '301-A2' },
            teacher: { displayName: 'TS. Trần Minh Hải' },
          },
        ],
      },
    },
    {
      id: 3,
      subjectName: 'Đồ án chuyên ngành',
      courseSubject: {
        id: 30,
        displayName: 'CSE490',
        timetables: [],
      },
    },
  ];

  const bundle = normalizeTluSemester(rows, {
    id: 42,
    semesterName: 'Học kỳ 1 2026-2027',
    semesterCode: '2026_1',
    schoolYear: { startDate: '2026-08-31' },
  });

  assert.equal(bundle.courses.length, 2);
  assert.equal(bundle.slots.length, 1);
  assert.equal(bundle.slots[0].room, '301-A2');
  assert.equal(bundle.slots[0].teacher, 'TS. Trần Minh Hải');
  assert.equal(bundle.slots[0].periods, 'Tiết 1–3');
  assert.equal(bundle.warnings.length, 1);

  const events = expandSemesterEvents(bundle);
  // 2026-08-31 is Week 1. Nov 2 = Week 10, Nov 9 = Week 11, Nov 16 = Week 12, Nov 23 = Week 13
  assert.equal(computeWeekNumber('2026-11-02', '2026-08-31'), 10);
  assert.deepEqual(
    events.map((e) => e.date),
    ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23'],
  );
});

test('findLiveClassStatus identifies active class, remaining minutes, and next class accurately', () => {
  const bundle = normalizeTluSemester(
    [
      {
        id: 10,
        subjectName: 'Cơ sở dữ liệu',
        courseSubject: {
          id: 100,
          displayName: 'CSE484',
          timetables: [
            {
              id: 1,
              weekIndex: 2,
              startDate: '2026-11-23',
              endDate: '2026-11-23',
              startHour: { name: 'Tiết 1', startString: '07:00' },
              endHour: { name: 'Tiết 3', endString: '09:35' },
              roomName: '205-C1',
              teacherName: 'ThS. Lê Anh',
            },
            {
              id: 2,
              weekIndex: 2,
              startDate: '2026-11-23',
              endDate: '2026-11-23',
              startHour: { name: 'Tiết 7', startString: '12:55' },
              endHour: { name: 'Tiết 9', endString: '15:30' },
              roomName: 'Lab 402-B5',
              teacherName: 'ThS. Lê Anh',
            },
          ],
        },
      },
    ],
    { id: 1, semesterName: 'HK1' },
  );

  const events = expandSemesterEvents(bundle);
  const statusAt8am = findLiveClassStatus(events, '2026-11-23', 8 * 60);
  assert.equal(statusAt8am.current?.room, '205-C1');
  assert.equal(statusAt8am.minutesRemaining, 95);
  assert.equal(statusAt8am.nextToday?.room, 'Lab 402-B5');
  assert.equal(statusAt8am.minutesUntilNext, 295);
});

test('buildIcsCalendar emits valid RFC 5545 VCALENDAR with Asia/Ho_Chi_Minh timezone', () => {
  const bundle = normalizeTluSemester(
    [
      {
        id: 11,
        subjectName: 'Lập trình Java, Nâng cao',
        courseSubject: {
          id: 111,
          displayName: 'CSE381',
          timetables: [
            {
              id: 9,
              weekIndex: 2,
              startDate: '2026-11-23',
              endDate: '2026-11-23',
              startHour: { name: 'Tiết 1', startString: '07:00' },
              endHour: { name: 'Tiết 3', endString: '09:35' },
              roomName: '305-B5',
              teacherName: 'TS. Nguyễn Hòa',
            },
          ],
        },
      },
    ],
    { id: 99, semesterName: 'HK1 2026-2027' },
  );
  const events = expandSemesterEvents(bundle);
  const ics = buildIcsCalendar(bundle, events);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.includes('DTSTART;TZID=Asia/Ho_Chi_Minh:20261123T070000'));
  assert.ok(ics.includes('SUMMARY:Lập trình Java\\, Nâng cao'));
  assert.ok(ics.includes('LOCATION:305-B5'));
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
});
