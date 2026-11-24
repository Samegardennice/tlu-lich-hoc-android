import { Capacitor } from '@capacitor/core';
import {
  nativeFetchSemesterSchedule,
  nativeLoginTluPortal,
  nativeLogoutTluPortal,
} from './nativeTluClient';
import {
  normalizeTluSemester,
  type SemesterBundle,
  type TluRawRow,
  type TluSemesterMeta,
} from './tluSchedule';

export interface TluStudentProfile {
  displayName: string;
  studentCode: string;
  className?: string;
}

export interface TluSemesterChoice {
  id: number;
  name: string;
  code: string;
  schoolYearStart: number | string | null;
}

export interface TluLoginResponse {
  sessionToken: string;
  student: TluStudentProfile;
  semesters: TluSemesterChoice[];
  currentSemesterId: number | null;
}

async function parseApiJson<T>(res: Response): Promise<T> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response
  }
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Lỗi kết nối máy chủ (${res.status}).`;
    throw new Error(message);
  }
  return data as T;
}

export async function loginTluPortal(username: string, password: string): Promise<TluLoginResponse> {
  if (Capacitor.isNativePlatform()) {
    return nativeLoginTluPortal(username, password);
  }
  const res = await fetch('/api/tlu/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return parseApiJson<TluLoginResponse>(res);
}

export async function logoutTluPortal(sessionToken: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    nativeLogoutTluPortal(sessionToken);
    return;
  }
  try {
    await fetch('/api/tlu/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    });
  } catch {
    // Best-effort cleanup
  }
}

export async function downloadTluSemesterSchedule(
  sessionToken: string,
  semesterId: number,
): Promise<SemesterBundle> {
  if (Capacitor.isNativePlatform()) {
    const payload = await nativeFetchSemesterSchedule(sessionToken, semesterId);
    return normalizeTluSemester(payload.rawRows, payload.semester, {
      studentName: payload.student.displayName,
      studentCode: payload.student.studentCode,
      downloadedAt: payload.fetchedAt,
      isDemo: false,
    });
  }

  const res = await fetch(`/api/tlu/schedule/${encodeURIComponent(String(semesterId))}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });

  const payload = await parseApiJson<{
    student?: TluStudentProfile;
    semester: TluSemesterMeta;
    rawRows: TluRawRow[];
    fetchedAt: string;
  }>(res);

  return normalizeTluSemester(payload.rawRows, payload.semester, {
    studentName: payload.student?.displayName,
    studentCode: payload.student?.studentCode,
    downloadedAt: payload.fetchedAt,
    isDemo: false,
  });
}
