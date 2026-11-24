import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Save, User, X } from 'lucide-react';
import {
  formatDateVi,
  formatWeekdayVi,
  type DatedClassEvent,
} from '../utils/tluSchedule';

interface EventDetailSheetProps {
  event: DatedClassEvent | null;
  note: string;
  onSaveNote: (courseKey: string, note: string) => Promise<void>;
  onClose: () => void;
}

export const EventDetailSheet: React.FC<EventDetailSheetProps> = ({
  event,
  note,
  onSaveNote,
  onClose,
}) => {
  const [draftNote, setDraftNote] = useState(note);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraftNote(note);
    setSavedNotice(false);
  }, [note, event?.eventId]);

  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [event, onClose]);

  if (!event) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveNote(event.courseKey, draftNote);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2A1020]/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-[32px] sm:rounded-[28px] bg-white dark:bg-[#231838] border-t-2 sm:border-2 border-[#F4B6D0] dark:border-pink-400/60 p-5 sm:p-6 shadow-xl">
        <div className="sm:hidden mx-auto mb-4 h-1.5 w-10 rounded-full bg-pink-200 dark:bg-pink-800" />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold text-[#A86284] dark:text-pink-300">
              {event.code}
              {event.credits != null ? ` · ${event.credits} tín chỉ` : ''}
            </p>
            <h2
              id="event-detail-title"
              className="mt-1 font-display text-xl font-bold text-[#5C3349] dark:text-pink-50 leading-snug"
            >
              {event.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết buổi học"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-[#9B6C85] hover:bg-[#FFF4F8] dark:text-pink-200 dark:hover:bg-pink-950/60"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <dl className="mt-5 divide-y divide-pink-100 dark:divide-pink-900/50 border-y border-pink-100 dark:border-pink-900/50 text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="flex items-center gap-2 text-[#9B6C85] dark:text-pink-200/75">
              <Clock className="h-4 w-4 shrink-0 text-[#E484AC] dark:text-pink-400" aria-hidden="true" />
              <span>Thời gian</span>
            </dt>
            <dd className="text-right font-bold text-[#5C3349] dark:text-pink-50 tabular-nums">
              {event.startTime && event.endTime
                ? `${event.startTime} – ${event.endTime}`
                : 'Chưa rõ giờ'}{' '}
              <span className="text-pink-300">·</span> {event.periods}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="flex items-center gap-2 text-[#9B6C85] dark:text-pink-200/75">
              <MapPin className="h-4 w-4 shrink-0 text-[#E484AC] dark:text-pink-400" aria-hidden="true" />
              <span>Phòng học</span>
            </dt>
            <dd className="text-right font-extrabold text-[#C95C8B] dark:text-teal-300">
              {event.room}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="flex items-center gap-2 text-[#9B6C85] dark:text-pink-200/75">
              <User className="h-4 w-4 shrink-0 text-[#E484AC] dark:text-pink-400" aria-hidden="true" />
              <span>Giảng viên</span>
            </dt>
            <dd className="text-right font-bold text-[#5C3349] dark:text-pink-50">
              {event.teacher}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="flex items-center gap-2 text-[#9B6C85] dark:text-pink-200/75">
              <Calendar className="h-4 w-4 shrink-0 text-[#E484AC] dark:text-pink-400" aria-hidden="true" />
              <span>Lịch học phần</span>
            </dt>
            <dd className="text-right font-bold text-[#5C3349] dark:text-pink-50 tabular-nums">
              {formatWeekdayVi(event.day)} · {formatDateVi(event.date, true)}
              {event.fromWeek != null && event.toWeek != null
                ? ` · Tuần ${event.fromWeek}–${event.toWeek}`
                : ''}
            </dd>
          </div>
        </dl>

        <form onSubmit={handleSave} className="mt-5">
          <label
            htmlFor="course-note-input"
            className="block text-xs font-bold text-[#8E4A6B] dark:text-pink-200"
          >
            Ghi chú cá nhân cho môn học (lưu ngoại tuyến trên máy)
          </label>
          <textarea
            id="course-note-input"
            rows={3}
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Ví dụ: Mang laptop thực hành, hạn nộp bài tập lớn thứ 6..."
            className="mt-2 w-full rounded-2xl border-2 border-[#F7C7DC] dark:border-pink-800/70 bg-[#FFF9FB] dark:bg-[#19102A] px-3.5 py-2.5 text-sm text-[#5C3349] dark:text-pink-50 placeholder:text-[#C28FA7] focus:border-[#F19EC0] dark:focus:border-pink-400 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300" role="status">
              {savedNotice ? 'Đã lưu ghi chú ngoại tuyến.' : ''}
            </span>
            <button
              type="submit"
              className="kawaii-pill-cta inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-5 py-2 text-sm font-extrabold"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>Lưu ghi chú</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
