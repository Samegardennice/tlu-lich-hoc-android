/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { AppHeader, type AppTab } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import { CompanionDock } from './components/CompanionDock';
import { EventDetailSheet } from './components/EventDetailSheet';
import { KawaiiBow, KawaiiSparkle } from './components/KawaiiDecor';
import { OfflineBanner } from './components/OfflineBanner';
import { SemesterView } from './components/SemesterView';
import { SyncView } from './components/SyncView';
import { TodayView } from './components/TodayView';
import { WeekView } from './components/WeekView';
import type { CompanionPreferences } from './utils/companionScript';
import { createDemoTluSemester } from './utils/demoData';
import {
  deleteOfflineSemester,
  loadCompanionPreferences,
  loadOfflineSemesters,
  loadThemePreference,
  saveCompanionPreferences,
  saveCourseNote,
  saveOfflineSemester,
  saveThemePreference,
  setActiveOfflineSemester,
  type ThemePreference,
} from './utils/offlineStorage';
import {
  expandSemesterEvents,
  findLiveClassStatus,
  getCurrentVnMinutes,
  getEventsForDate,
  getMondayOfWeek,
  getTodayVnDateKey,
  type DatedClassEvent,
  type SemesterBundle,
} from './utils/tluSchedule';

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [savedBundles, setSavedBundles] = useState<SemesterBundle[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [theme, setTheme] = useState<ThemePreference>(() => loadThemePreference());
  const [companionPrefs, setCompanionPrefs] = useState<CompanionPreferences>(() =>
    loadCompanionPreferences(),
  );

  const todayKey = useMemo(() => getTodayVnDateKey(), []);
  const nowMinutes = useMemo(() => getCurrentVnMinutes(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [weekMonday, setWeekMonday] = useState<string>(() => getMondayOfWeek(todayKey));
  const [selectedEvent, setSelectedEvent] = useState<DatedClassEvent | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemePreference(theme);

    if (Capacitor.isNativePlatform()) {
      void SystemBars.setStyle({
        style: theme === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      }).catch(() => {});
      void StatusBar.setStyle({
        style: theme === 'dark' ? Style.Dark : Style.Light,
      }).catch(() => {});
      void StatusBar.setBackgroundColor({
        color: theme === 'dark' ? '#161026' : '#FFF0F6',
      }).catch(() => {});
    }
  }, [theme]);

  const handleUpdateCompanionPrefs = (next: CompanionPreferences) => {
    setCompanionPrefs(next);
    saveCompanionPreferences(next);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadOfflineSemesters();
      if (!active) return;

      const params = new URLSearchParams(window.location.search);
      const wantsAutostart = params.get('autostart') === '1';

      if (stored.bundles.length > 0) {
        setSavedBundles(stored.bundles);
        setActiveSemesterId(stored.activeSemesterId ?? stored.bundles[0].semesterId);
        setNotes(stored.notes);
        setActiveTab('today');
      } else if (wantsAutostart) {
        const demo = createDemoTluSemester(todayKey);
        await saveOfflineSemester(demo);
        if (!active) return;
        setSavedBundles([demo]);
        setActiveSemesterId(demo.semesterId);
        setNotes(stored.notes);
        setActiveTab('today');
      } else {
        setSavedBundles([]);
        setActiveSemesterId(null);
        setNotes(stored.notes);
        setActiveTab('sync');
      }

      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, [todayKey]);

  const activeBundle = useMemo(() => {
    if (!activeSemesterId) return savedBundles[0] ?? null;
    return savedBundles.find((b) => b.semesterId === activeSemesterId) ?? savedBundles[0] ?? null;
  }, [savedBundles, activeSemesterId]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    let handle: { remove: () => Promise<void> } | null = null;

    void CapApp.addListener('backButton', () => {
      if (selectedEvent) {
        setSelectedEvent(null);
        return;
      }
      if (activeTab !== 'today' && activeBundle) {
        setActiveTab('today');
        return;
      }
      void CapApp.exitApp();
    }).then((listener) => {
      if (active) {
        handle = listener;
      } else {
        void listener.remove();
      }
    });

    return () => {
      active = false;
      void handle?.remove();
    };
  }, [selectedEvent, activeTab, activeBundle]);

  const semesterEvents = useMemo(
    () => (activeBundle ? expandSemesterEvents(activeBundle) : []),
    [activeBundle],
  );

  const todayEvents = useMemo(
    () => getEventsForDate(semesterEvents, todayKey),
    [semesterEvents, todayKey],
  );

  const liveStatus = useMemo(
    () => findLiveClassStatus(semesterEvents, todayKey, nowMinutes),
    [semesterEvents, todayKey, nowMinutes],
  );

  const handleBundleDownloaded = async (bundle: SemesterBundle) => {
    await saveOfflineSemester(bundle);
    setSavedBundles((prev) => [bundle, ...prev.filter((b) => b.semesterId !== bundle.semesterId)]);
    setActiveSemesterId(bundle.semesterId);
    setSelectedDate(todayKey);
    setWeekMonday(getMondayOfWeek(todayKey));
  };

  const handleLoadDemo = async () => {
    const demo = createDemoTluSemester(todayKey);
    await handleBundleDownloaded(demo);
    setActiveTab('today');
  };

  const handleSelectSavedBundle = async (semesterId: string) => {
    await setActiveOfflineSemester(semesterId);
    setActiveSemesterId(semesterId);
    setActiveTab('today');
  };

  const handleDeleteSavedBundle = async (semesterId: string) => {
    await deleteOfflineSemester(semesterId);
    setSavedBundles((prev) => {
      const remaining = prev.filter((b) => b.semesterId !== semesterId);
      if (activeSemesterId === semesterId) {
        const nextId = remaining[0]?.semesterId ?? null;
        setActiveSemesterId(nextId);
        void setActiveOfflineSemester(nextId);
      }
      return remaining;
    });
  };

  const handleSaveNote = async (courseKey: string, noteText: string) => {
    const updated = await saveCourseNote(courseKey, noteText);
    setNotes(updated);
  };

  const handleSelectTab = (tab: AppTab) => {
    if (!activeBundle && tab !== 'sync') {
      setActiveTab('sync');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="kawaii-canvas relative min-h-screen flex flex-col text-[#5C3349] dark:text-[#FCE7F3] md:px-6 md:py-6">
      {/* Subtle outer corner kawaii ornaments on large viewports */}
      {companionPrefs.showStickers && (
        <>
          <KawaiiSparkle
            color="white"
            className="pointer-events-none fixed top-8 left-6 hidden xl:block h-7 w-7 opacity-85"
          />
          <KawaiiBow className="pointer-events-none fixed top-24 right-5 hidden xl:block h-9 w-12 rotate-12 opacity-90" />
          <KawaiiSparkle
            color="mint"
            className="pointer-events-none fixed bottom-10 left-36 hidden xl:block h-6 w-6 opacity-90"
          />
        </>
      )}

      {/* Main Scrapbook Framed Card Shell on Desktop, Edge-to-Edge on Mobile */}
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col bg-white/95 dark:bg-[#1E1531]/95 md:rounded-[32px] md:border-[3px] md:border-[#F5B7D0] dark:md:border-pink-400/50 md:shadow-[0_14px_40px_rgba(243,164,195,0.22)]">
        <AppHeader
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          hasSchedule={Boolean(activeBundle)}
        />

        <OfflineBanner hasSavedSchedule={Boolean(activeBundle)} />

        <main className="mx-auto w-full flex-1 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-28 md:pb-12">
          {!hydrated ? (
            <div className="py-16 text-center text-sm font-semibold text-[#8C5A73] dark:text-pink-200/75">
              Đang mở dữ liệu lịch học trên máy...
            </div>
          ) : activeTab === 'sync' || !activeBundle ? (
            <SyncView
              savedBundles={savedBundles}
              activeSemesterId={activeBundle?.semesterId ?? null}
              onBundleDownloaded={handleBundleDownloaded}
              onSelectSavedBundle={handleSelectSavedBundle}
              onDeleteSavedBundle={handleDeleteSavedBundle}
              onLoadDemo={handleLoadDemo}
              onGoToSchedule={() => setActiveTab('today')}
              theme={theme}
              onChangeTheme={setTheme}
              companionPrefs={companionPrefs}
              onUpdateCompanionPrefs={handleUpdateCompanionPrefs}
            />
          ) : activeTab === 'today' ? (
            <TodayView
              bundle={activeBundle}
              events={semesterEvents}
              selectedDate={selectedDate}
              onSelectDate={(dateKey) => {
                setSelectedDate(dateKey);
                setWeekMonday(getMondayOfWeek(dateKey));
              }}
              onSelectEvent={setSelectedEvent}
              onOpenSync={() => setActiveTab('sync')}
              onOpenWeek={() => setActiveTab('week')}
              notes={notes}
              showStickers={companionPrefs.showStickers}
            />
          ) : activeTab === 'week' ? (
            <WeekView
              bundle={activeBundle}
              events={semesterEvents}
              weekMonday={weekMonday}
              onChangeWeekMonday={setWeekMonday}
              onSelectEvent={setSelectedEvent}
            />
          ) : (
            <SemesterView bundle={activeBundle} events={semesterEvents} />
          )}
        </main>
      </div>

      <BottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />

      <CompanionDock
        todayEvents={todayEvents}
        liveStatus={liveStatus}
        nowMinutes={nowMinutes}
        prefs={companionPrefs}
        onUpdatePrefs={handleUpdateCompanionPrefs}
      />

      <EventDetailSheet
        event={selectedEvent}
        note={selectedEvent ? notes[selectedEvent.courseKey] ?? '' : ''}
        onSaveNote={handleSaveNote}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
