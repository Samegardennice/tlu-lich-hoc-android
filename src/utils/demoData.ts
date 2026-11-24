import {
  addDays,
  getMondayOfWeek,
  getTodayVnDateKey,
  normalizeTluSemester,
  type SemesterBundle,
  type TluRawRow,
} from './tluSchedule';

/**
 * Generates a realistic, deterministic TLU semester schedule anchored around
 * the current week so users can test full-semester offline browsing immediately.
 */
export function createDemoTluSemester(anchorDateKey: string = getTodayVnDateKey()): SemesterBundle {
  const currentMonday = getMondayOfWeek(anchorDateKey);
  // Make the current week roughly Week 11 of a 16-week semester
  const schoolYearStart = addDays(currentMonday, -10 * 7);
  const semesterStart = addDays(schoolYearStart, 0);
  const semesterMid = addDays(schoolYearStart, 12 * 7 + 6);
  const semesterEnd = addDays(schoolYearStart, 15 * 7 + 6);
  const practiceStart = addDays(schoolYearStart, 8 * 7);

  const demoRows: TluRawRow[] = [
    {
      id: 1001,
      subjectName: 'Công nghệ Web',
      subjectCode: 'CSE485-65CNTT1',
      subjectStatus: 0,
      courseSubject: {
        id: 5001,
        displayName: 'CSE485-65CNTT1',
        numberOfCredit: 3,
        timetables: [
          {
            id: 9001,
            weekIndex: 2, // Thứ 2
            startDate: semesterStart,
            endDate: semesterEnd,
            fromWeek: 1,
            toWeek: 16,
            startHour: { name: 'Tiết 1', startString: '07:00' },
            endHour: { name: 'Tiết 3', endString: '09:35' },
            roomName: '301-A2',
            teacherName: 'TS. Trần Minh Hải',
          },
          {
            id: 9002,
            weekIndex: 4, // Thứ 4
            startDate: practiceStart,
            endDate: semesterEnd,
            fromWeek: 9,
            toWeek: 16,
            startHour: { name: 'Tiết 7', startString: '12:55' },
            endHour: { name: 'Tiết 9', endString: '15:30' },
            roomName: 'PM 402-C5',
            teacherName: 'ThS. Phạm Quang Dũng',
          },
        ],
      },
    },
    {
      id: 1002,
      subjectName: 'Hệ quản trị Cơ sở dữ liệu',
      subjectCode: 'CSE484-65CNTT1',
      subjectStatus: 0,
      courseSubject: {
        id: 5002,
        displayName: 'CSE484-65CNTT1',
        numberOfCredit: 3,
        timetables: [
          {
            id: 9003,
            weekIndex: 2, // Thứ 2
            startDate: semesterStart,
            endDate: semesterEnd,
            fromWeek: 1,
            toWeek: 16,
            startHour: { name: 'Tiết 7', startString: '12:55' },
            endHour: { name: 'Tiết 9', endString: '15:30' },
            roomName: '205-C1',
            teacherName: 'PGS.TS. Nguyễn Thu Hương',
          },
          {
            id: 9004,
            weekIndex: 5, // Thứ 5
            startDate: semesterStart,
            endDate: semesterMid,
            fromWeek: 1,
            toWeek: 13,
            startHour: { name: 'Tiết 4', startString: '09:45' },
            endHour: { name: 'Tiết 6', endString: '12:20' },
            roomName: 'PM 305-C5',
            teacherName: 'ThS. Vũ Đức Anh',
          },
        ],
      },
    },
    {
      id: 1003,
      subjectName: 'Lập trình hướng đối tượng Java',
      subjectCode: 'CSE381-65CNTT2',
      subjectStatus: 0,
      courseSubject: {
        id: 5003,
        displayName: 'CSE381-65CNTT2',
        numberOfCredit: 3,
        timetables: [
          {
            id: 9005,
            weekIndex: 3, // Thứ 3
            startDate: semesterStart,
            endDate: semesterEnd,
            fromWeek: 1,
            toWeek: 16,
            startHour: { name: 'Tiết 1', startString: '07:00' },
            endHour: { name: 'Tiết 3', endString: '09:35' },
            roomName: '404-B5',
            teacherName: 'TS. Lê Hoàng Nam',
          },
          {
            id: 9006,
            weekIndex: 6, // Thứ 6
            startDate: practiceStart,
            endDate: semesterEnd,
            fromWeek: 9,
            toWeek: 16,
            startHour: { name: 'Tiết 10', startString: '15:40' },
            endHour: { name: 'Tiết 12', endString: '18:15' },
            roomName: 'PM 201-C5',
            teacherName: 'TS. Lê Hoàng Nam',
          },
        ],
      },
    },
    {
      id: 1004,
      subjectName: 'Mạng máy tính',
      subjectCode: 'CSE489-65CNTT1',
      subjectStatus: 0,
      courseSubject: {
        id: 5004,
        displayName: 'CSE489-65CNTT1',
        numberOfCredit: 3,
        timetables: [
          {
            id: 9007,
            weekIndex: 4, // Thứ 4
            startDate: semesterStart,
            endDate: semesterEnd,
            fromWeek: 1,
            toWeek: 16,
            startHour: { name: 'Tiết 1', startString: '07:00' },
            endHour: { name: 'Tiết 3', endString: '09:35' },
            roomName: '308-A2',
            teacherName: 'ThS. Đỗ Văn Thành',
          },
        ],
      },
    },
    {
      id: 1005,
      subjectName: 'Xác suất thống kê',
      subjectCode: 'MATH254-65K65',
      subjectStatus: 0,
      courseSubject: {
        id: 5005,
        displayName: 'MATH254-65K65',
        numberOfCredit: 3,
        timetables: [
          {
            id: 9008,
            weekIndex: 5, // Thứ 5
            startDate: semesterStart,
            endDate: semesterEnd,
            fromWeek: 1,
            toWeek: 16,
            startHour: { name: 'Tiết 1', startString: '07:00' },
            endHour: { name: 'Tiết 3', endString: '09:35' },
            roomName: '104-B5',
            teacherName: 'TS. Bùi Thị Lan',
          },
        ],
      },
    },
    {
      id: 1006,
      subjectName: 'Tiếng Anh chuyên ngành CNTT',
      subjectCode: 'ENG302-65CNTT1',
      subjectStatus: 0,
      courseSubject: {
        id: 5006,
        displayName: 'ENG302-65CNTT1',
        numberOfCredit: 2,
        timetables: [
          {
            id: 9009,
            weekIndex: 7, // Thứ 7
            startDate: semesterStart,
            endDate: semesterMid,
            fromWeek: 1,
            toWeek: 13,
            startHour: { name: 'Tiết 4', startString: '09:45' },
            endHour: { name: 'Tiết 6', endString: '12:20' },
            roomName: '202-A2',
            teacherName: 'ThS. Nguyễn Mai Phương',
          },
        ],
      },
    },
  ];

  return normalizeTluSemester(
    demoRows,
    {
      id: 'demo-2026-1',
      semesterName: 'Học kỳ 1 năm học 2026–2027 (Lịch mẫu)',
      semesterCode: '2026_1_DEMO',
      schoolYear: {
        startDate: schoolYearStart,
        endDate: semesterEnd,
      },
    },
    {
      studentName: 'Nguyễn Minh Quân (Mẫu)',
      studentCode: '2351060888',
      isDemo: true,
    },
  );
}
