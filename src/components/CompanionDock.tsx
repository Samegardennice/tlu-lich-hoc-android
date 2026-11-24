import React, { useMemo, useState } from 'react';
import { Heart, MessageCircleHeart, Sparkles, X } from 'lucide-react';
import {
  buildCompanionContextMessage,
  CHIBI_ASSETS,
  getCompanionTapReaction,
  type CompanionPersonality,
  type CompanionPreferences,
  type CompanionSpeech,
} from '../utils/companionScript';
import type { DatedClassEvent, LiveClassStatus } from '../utils/tluSchedule';

interface CompanionDockProps {
  todayEvents: DatedClassEvent[];
  liveStatus: LiveClassStatus;
  nowMinutes: number;
  prefs: CompanionPreferences;
  onUpdatePrefs: (next: CompanionPreferences) => void;
}

export const CompanionDock: React.FC<CompanionDockProps> = ({
  todayEvents,
  liveStatus,
  nowMinutes,
  prefs,
  onUpdatePrefs,
}) => {
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [customSpeech, setCustomSpeech] = useState<CompanionSpeech | null>(null);
  const [bouncing, setBouncing] = useState(false);

  const contextSpeech = useMemo(
    () =>
      buildCompanionContextMessage({
        todayEvents,
        liveStatus,
        nowMinutes,
        prefs,
      }),
    [todayEvents, liveStatus, nowMinutes, prefs],
  );

  if (!prefs.showStickers) return null;

  const activeSpeech = customSpeech ?? contextSpeech;
  const activeChibiSrc = CHIBI_ASSETS[activeSpeech.mood];

  const triggerBounce = () => {
    setBouncing(true);
    window.setTimeout(() => setBouncing(false), 320);
  };

  const handleTapCompanion = () => {
    triggerBounce();
    if (!bubbleOpen) {
      setCustomSpeech(null);
      setBubbleOpen(true);
      return;
    }
    const nextTap = tapCount + 1;
    setTapCount(nextTap);
    setCustomSpeech(getCompanionTapReaction(nextTap, prefs));
    onUpdatePrefs({
      ...prefs,
      heartsCount: prefs.heartsCount + 1,
    });
  };

  const handleNextLine = () => {
    triggerBounce();
    const nextTap = tapCount + 1;
    setTapCount(nextTap);
    setCustomSpeech(getCompanionTapReaction(nextTap, prefs));
    onUpdatePrefs({
      ...prefs,
      heartsCount: prefs.heartsCount + 1,
    });
  };

  const handleTogglePersonality = (personality: CompanionPersonality) => {
    const updated = { ...prefs, personality };
    onUpdatePrefs(updated);
    setCustomSpeech(
      buildCompanionContextMessage({
        todayEvents,
        liveStatus,
        nowMinutes,
        prefs: updated,
      }),
    );
  };

  return (
    <>
      {/* Decorative Left Corner Chibi Sticker on Desktop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-4 left-4 z-30 hidden xl:block select-none"
      >
        <div className="kawaii-float-slow h-24 w-24 overflow-hidden rounded-full border-[3px] border-[#F4ABC9] dark:border-pink-300 bg-white shadow-[0_4px_0_#F6C3D8] dark:shadow-[0_5px_0_#831843]">
          <img
            src={CHIBI_ASSETS.cheer}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover scale-105"
          />
        </div>
      </div>

      {/* Interactive Right Corner Companion + Scripted Offline Speech Bubble */}
      <div className="fixed bottom-[calc(72px+var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px)))] right-3 md:bottom-5 md:right-5 z-40 flex flex-col items-end gap-2.5">
        {bubbleOpen && (
          <div
            role="dialog"
            aria-label={`Lời nhắn từ ${prefs.companionName}`}
            className="w-[min(310px,calc(100vw-24px))] rounded-[24px] border-2 border-[#F3A4C3] dark:border-pink-400 bg-white/98 dark:bg-[#231838]/98 p-4 shadow-[0_5px_0_#F6C1D7] dark:shadow-[0_6px_0_#831843] backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#E47FA9] dark:text-pink-300" aria-hidden="true" />
                <span className="font-display text-sm font-bold text-[#9A4C72] dark:text-pink-200 truncate">
                  {prefs.companionName}
                </span>
                <span className="text-xs text-[#B37594] dark:text-pink-300/70">·</span>
                <span className="text-xs font-semibold text-[#A26384] dark:text-teal-300 truncate">
                  {activeSpeech.tag}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBubbleOpen(false)}
                aria-label="Đóng bong bóng trò chuyện"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#A26384] hover:bg-[#FFF2F8] dark:text-pink-300 dark:hover:bg-pink-950/60"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-2.5 text-sm font-semibold leading-relaxed text-[#5C3349] dark:text-pink-50">
              {activeSpeech.text}
            </p>

            {/* Quick actions inside speech bubble */}
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-pink-100 dark:border-pink-900/60 pt-3">
              <div className="flex items-center gap-1 rounded-xl bg-[#FFF3F8] dark:bg-[#19102A] p-0.5">
                <button
                  type="button"
                  onClick={() => handleTogglePersonality('sweet')}
                  aria-pressed={prefs.personality === 'sweet'}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    prefs.personality === 'sweet'
                      ? 'bg-[#F799BE] text-white'
                      : 'text-[#9A4C72] dark:text-pink-300'
                  }`}
                >
                  Ngọt ngào
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePersonality('bestie')}
                  aria-pressed={prefs.personality === 'bestie'}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    prefs.personality === 'bestie'
                      ? 'bg-[#F799BE] text-white'
                      : 'text-[#9A4C72] dark:text-pink-300'
                  }`}
                >
                  Bạn thân
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextLine}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FFBED9] to-[#B8F6EE] border border-[#F19EC0] px-3 py-1 text-xs font-bold text-[#7A3B59] hover:brightness-105 active:scale-95 transition-transform"
              >
                <Heart className="h-3.5 w-3.5 fill-[#E67EA8] text-[#E67EA8]" aria-hidden="true" />
                <span>Nói tiếp ({prefs.heartsCount})</span>
              </button>
            </div>
          </div>
        )}

        {/* Tappable Chibi Companion Sticker Button */}
        <button
          type="button"
          onClick={handleTapCompanion}
          aria-label={`Trò chuyện với bé ${prefs.companionName}`}
          aria-expanded={bubbleOpen}
          className={`group relative flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F3A4C3] transition-transform duration-200 ${
            bouncing ? 'scale-110 -translate-y-1.5' : 'hover:scale-105 active:scale-95'
          }`}
        >
          {!bubbleOpen && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border-2 border-[#F3A4C3] dark:border-pink-400 bg-white/95 dark:bg-[#231838]/95 px-3 py-1 text-xs font-bold text-[#9A4C72] dark:text-pink-200 shadow-[0_3px_0_#F6C1D7] dark:shadow-[0_3px_0_#831843]">
              <MessageCircleHeart className="h-3.5 w-3.5 text-[#E47FA9] dark:text-pink-300" aria-hidden="true" />
              <span>{prefs.companionName}</span>
            </span>
          )}
          <div className="kawaii-float-slow h-16 w-16 md:h-20 md:w-20 overflow-hidden rounded-full border-[3px] border-[#F4ABC9] dark:border-pink-300 bg-white shadow-[0_4px_0_#F6C3D8] dark:shadow-[0_4px_0_#831843]">
            <img
              src={activeChibiSrc}
              alt={`Bé đồng hành ${prefs.companionName}`}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover scale-105"
            />
          </div>
        </button>
      </div>
    </>
  );
};
