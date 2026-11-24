import { CapacitorHttp, type HttpResponse } from '@capacitor/core';
import type { TluRawRow, TluSemesterMeta } from './tluSchedule';

const TLU_BASE_URL = 'https://sinhvien1.tlu.edu.vn/education/';
const TLU_CLIENT_ID = 'education_client';
const TLU_CLIENT_SECRET = 'password';
const REQUEST_TIMEOUT_MS = 20_000;

interface TluTokenState {
  access: string;
  refresh?: string;
  expiresAt: number;
}

export interface NativeTluStudentProfile {
  displayName: string;
  studentCode: string;
  className?: string;
}

export interface NativeTluSemesterSummary extends TluSemesterMeta {
  id: number;
  semesterCode?: string;
  semesterName?: string;
  startDate?: number | string | null;
  endDate?: number | string | null;
  isCurrent?: boolean;
}

interface NativeSession {
  token: TluTokenState;
  student: NativeTluStudentProfile;
  cachedSemesters: NativeTluSemesterSummary[];
}

const nativeSessions = new Map<string, NativeSession>();

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `native-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseResponseData<T>(data: unknown): T | null {
  if (data == null || data === '') return null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
  return data as T;
}

async function nativeTluRequest<T>(
  relativePath: string,
  opts?: { form?: Record<string, string>; bearerToken?: string },
): Promise<T> {
  const normalizedPath = relativePath.replace(/^\/+/, '');
  const url = `${TLU_BASE_URL}${normalizedPath}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'TLU-Lich-Hoc-Android/1.0',
  };

  let body: string | undefined;
  if (opts?.form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    body = new URLSearchParams(opts.form).toString();
  }
  if (opts?.bearerToken) {
    headers.Authorization = `Bearer ${opts.bearerToken}`;
  }

  let res: HttpResponse;
  try {
    res = await CapacitorHttp.request({
      url,
      method: opts?.form ? 'POST' : 'GET',
      headers,
      data: body,
      connectTimeout: REQUEST_TIMEOUT_MS,
      readTimeout: REQUEST_TIMEOUT_MS,
      disableRedirects: true,
    });
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err ?? '');
    if (/timeout/i.test(rawMsg)) {
      throw new Error('Kết nối tới sinhvien1.tlu.edu.vn quá thời gian chờ. Vui lòng thử lại.');
    }
    if (/ssl|cert|trust|handshake/i.test(rawMsg)) {
      throw new Error(
        'Lỗi xác thực chứng chỉ SSL khi kết nối sinhvien1.tlu.edu.vn. Vui lòng cập nhật phiên bản ứng dụng mới nhất.',
      );
    }
    throw new Error(
      'Không kết nối được tới máy chủ sinhvien1.tlu.edu.vn. Kiểm tra Wi-Fi/4G và thử lại.',
    );
  }

  if (res.status >= 300 && res.status < 400) {
    throw new Error('Cổng sinh viên TLU trả về chuyển hướng bất thường.');
  }

  const parsed = parseResponseData<T>(res.data);

  if (res.status < 200 || res.status >= 300) {
    const errorDescription =
      parsed &&
      typeof parsed === 'object' &&
      'error_description' in parsed &&
      typeof (parsed as { error_description?: unknown }).error_description === 'string'
        ? (parsed as { error_description: string }).error_description
        : '';

    if (res.status === 400 || res.status === 401) {
      if (opts?.form?.grant_type === 'password') {
        if (errorDescription === 'User is disabled') {
          throw new Error('Tài khoản sinh viên đang bị khóa trên cổng TLU.');
        }
        throw new Error('Sai mã sinh viên hoặc mật khẩu cổng TLU. Vui lòng kiểm tra lại.');
      }
      throw new Error('Phiên kết nối cổng TLU đã hết hạn. Vui lòng đăng nhập lại.');
    }
    if (res.status === 403) {
      throw new Error('Tài khoản không có quyền truy cập dữ liệu này trên cổng TLU.');
    }
    if (res.status === 429) {
      throw new Error('Cổng TLU đang giới hạn lượt truy cập. Chờ vài giây rồi thử lại.');
    }
    throw new Error(`Máy chủ sinhvien1.tlu.edu.vn báo lỗi (${res.status}). Vui lòng thử lại sau.`);
  }

  if (parsed == null) {
    throw new Error('Dữ liệu trả về từ cổng TLU không đúng định dạng JSON.');
  }

  return parsed;
}

async function grantToken(fields: Record<string, string>): Promise<TluTokenState> {
  const result = await nativeTluRequest<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  }>('oauth/token', {
    form: {
      client_id: TLU_CLIENT_ID,
      client_secret: TLU_CLIENT_SECRET,
      ...fields,
    },
  });

  if (!result.access_token) {
    throw new Error('Cổng TLU không trả về phiên đăng nhập hợp lệ.');
  }

  return {
    access: result.access_token,
    refresh: result.refresh_token,
    expiresAt: Date.now() + Number(result.expires_in || 600) * 1000,
  };
}

async function sessionGet<T>(session: NativeSession, relativePath: string): Promise<T> {
  if (Date.now() >= session.token.expiresAt - 30_000 && session.token.refresh) {
    session.token = await grantToken({
      grant_type: 'refresh_token',
      refresh_token: session.token.refresh,
    });
  }

  try {
    return await nativeTluRequest<T>(relativePath, {
      bearerToken: session.token.access,
    });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes('hết hạn') &&
      session.token.refresh
    ) {
      session.token = await grantToken({
        grant_type: 'refresh_token',
        refresh_token: session.token.refresh,
      });
      return nativeTluRequest<T>(relativePath, {
        bearerToken: session.token.access,
      });
    }
    throw err;
  }
}

async function fetchStudentProfile(
  session: NativeSession,
  fallbackUsername: string,
): Promise<NativeTluStudentProfile> {
  try {
    const student = await sessionGet<{
      displayName?: string;
      studentCode?: string;
      enrollmentClass?: { className?: string };
    }>(session, 'api/student/getstudentbylogin');

    if (student && (student.displayName || student.studentCode)) {
      return {
        displayName: student.displayName || fallbackUsername,
        studentCode: student.studentCode || fallbackUsername,
        className: student.enrollmentClass?.className,
      };
    }
  } catch {
    // Fallback to getCurrentUser if student endpoint is unavailable
  }

  try {
    const user = await sessionGet<{
      displayName?: string;
      username?: string;
    }>(session, 'api/users/getCurrentUser');
    return {
      displayName: user?.displayName || fallbackUsername,
      studentCode: user?.username || fallbackUsername,
    };
  } catch {
    return {
      displayName: fallbackUsername,
      studentCode: fallbackUsername,
    };
  }
}

async function fetchSemesters(session: NativeSession): Promise<{
  semesters: NativeTluSemesterSummary[];
  currentSemesterId: number | null;
}> {
  const list: NativeTluSemesterSummary[] = [];
  for (let page = 1; page <= 15; page++) {
    const pageData = await sessionGet<{
      content?: NativeTluSemesterSummary[];
      last?: boolean;
      totalPages?: number;
    }>(session, `api/semester/${page}/100`);

    if (!Array.isArray(pageData?.content)) {
      throw new Error('Danh sách học kỳ từ cổng TLU không đúng định dạng.');
    }

    list.push(...pageData.content);
    if (pageData.last !== false && !(Number(pageData.totalPages) > page)) {
      break;
    }
  }

  let currentSemesterId: number | null = null;
  try {
    const info = await sessionGet<{ id?: number }>(session, 'api/semester/semester_info');
    if (info && typeof info.id === 'number') {
      currentSemesterId = info.id;
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('hết hạn')) {
      throw err;
    }
  }

  const sorted = [...list].sort((a, b) => Number(b.id) - Number(a.id));
  session.cachedSemesters = sorted;
  return {
    semesters: sorted,
    currentSemesterId:
      currentSemesterId ?? sorted.find((s) => s.isCurrent)?.id ?? sorted[0]?.id ?? null,
  };
}

export async function nativeLoginTluPortal(username: string, password: string) {
  const trimmedUser = username.trim();
  if (!trimmedUser || !password) {
    throw new Error('Vui lòng nhập đầy đủ mã sinh viên và mật khẩu.');
  }

  const token = await grantToken({
    grant_type: 'password',
    username: trimmedUser,
    password,
  });

  const session: NativeSession = {
    token,
    student: {
      displayName: trimmedUser,
      studentCode: trimmedUser,
    },
    cachedSemesters: [],
  };

  const [student, semesterPayload] = await Promise.all([
    fetchStudentProfile(session, trimmedUser),
    fetchSemesters(session),
  ]);

  session.student = student;
  const sessionToken = generateSessionId();
  nativeSessions.set(sessionToken, session);

  return {
    sessionToken,
    student,
    semesters: semesterPayload.semesters.map((s) => ({
      id: s.id,
      name: s.semesterName || s.semesterCode || `Học kỳ ${s.id}`,
      code: s.semesterCode || '',
      schoolYearStart: s.schoolYear?.startDate ?? null,
    })),
    currentSemesterId: semesterPayload.currentSemesterId,
  };
}

export function nativeLogoutTluPortal(sessionToken: string): void {
  nativeSessions.delete(sessionToken);
}

export async function nativeFetchSemesterSchedule(
  sessionToken: string,
  semesterId: number,
): Promise<{
  student: NativeTluStudentProfile;
  semester: NativeTluSemesterSummary;
  rawRows: TluRawRow[];
  fetchedAt: string;
}> {
  const session = nativeSessions.get(sessionToken);
  if (!session) {
    throw new Error('Phiên kết nối đã hết hạn. Vui lòng đăng nhập lại tài khoản TLU.');
  }

  let semester = session.cachedSemesters.find((s) => Number(s.id) === semesterId);
  if (!semester) {
    const refreshed = await fetchSemesters(session);
    semester = refreshed.semesters.find((s) => Number(s.id) === semesterId);
  }
  if (!semester) {
    throw new Error('Không tìm thấy học kỳ đã chọn trong danh sách của trường.');
  }

  const rawRows = await sessionGet<TluRawRow[]>(
    session,
    `api/StudentCourseSubject/studentLoginUser/${semesterId}`,
  );
  if (!Array.isArray(rawRows)) {
    throw new Error('Dữ liệu thời khóa biểu từ cổng TLU không đúng định dạng.');
  }

  return {
    student: session.student,
    semester,
    rawRows,
    fetchedAt: new Date().toISOString(),
  };
}
