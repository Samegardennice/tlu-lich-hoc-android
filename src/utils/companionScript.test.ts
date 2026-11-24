import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCompanionContextMessage,
  DEFAULT_COMPANION_PREFS,
  getCompanionTapReaction,
} from './companionScript';
import type { DatedClassEvent } from './tluSchedule';

const SAMPLE_EVENT: DatedClassEvent = {
  key: 'slot-1',
  courseKey: 'course-1',
  name: 'Công nghệ Web',
  code: 'CSE485',
  credits: 3,
  day: 2,
  startDate: '2026-11-23',
  endDate: '2026-11-23',
  startTime: '07:00',
  endTime: '08:45',
  periods: 'Tiết 1–2',
  room: '129-A2',
  teacher: 'Nguyễn Tu Trung',
  fromWeek: 13,
  toWeek: 13,
  date: '2026-11-23',
  eventId: 'slot-1@2026-11-23',
  weekNumber: 13,
};

test('buildCompanionContextMessage reacts to an active class with real room and remaining time', () => {
  const msg = buildCompanionContextMessage({
    todayEvents: [SAMPLE_EVENT],
    liveStatus: {
      current: SAMPLE_EVENT,
      nextToday: null,
      nextUpcoming: null,
      minutesRemaining: 35,
      minutesUntilNext: null,
    },
    nowMinutes: 8 * 60 + 10,
    prefs: { ...DEFAULT_COMPANION_PREFS, nickname: 'Nhung', personality: 'sweet' },
  });

  assert.equal(msg.mood, 'study');
  assert.ok(msg.text.includes('Nhung'));
  assert.ok(msg.text.includes('Công nghệ Web'));
  assert.ok(msg.text.includes('129-A2'));
  assert.ok(msg.text.includes('35 phút'));
});

test('buildCompanionContextMessage switches to chill mood on a free day', () => {
  const msg = buildCompanionContextMessage({
    todayEvents: [],
    liveStatus: {
      current: null,
      nextToday: null,
      nextUpcoming: null,
      minutesRemaining: null,
      minutesUntilNext: null,
    },
    nowMinutes: 10 * 60,
    prefs: { ...DEFAULT_COMPANION_PREFS, nickname: 'Nhung', personality: 'bestie' },
  });

  assert.equal(msg.mood, 'chill');
  assert.ok(msg.text.includes('trống lịch'));
});

test('getCompanionTapReaction cycles deterministically across personalities', () => {
  const r0 = getCompanionTapReaction(0, { ...DEFAULT_COMPANION_PREFS, nickname: 'Nhung', personality: 'sweet' });
  const r1 = getCompanionTapReaction(1, { ...DEFAULT_COMPANION_PREFS, nickname: 'Nhung', personality: 'sweet' });
  const b0 = getCompanionTapReaction(0, { ...DEFAULT_COMPANION_PREFS, nickname: 'Nhung', personality: 'bestie' });

  assert.notEqual(r0.text, r1.text);
  assert.notEqual(r0.text, b0.text);
  assert.ok(r0.text.includes('Nhung'));
  assert.ok(b0.text.includes('Nhung'));
});
