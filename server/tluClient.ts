import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import tls from 'node:tls';

const TLU_HOST = 'sinhvien1.tlu.edu.vn';
const TLU_BASE_PATH = '/education/';
const REQUEST_TIMEOUT_MS = 20_000;

export class TluApiError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'TluApiError';
    this.status = status;
  }
}

interface TluTokenState {
  access: string;
  refresh?: string;
  expiresAt: number;
}

export interface TluSemesterSummary {
  id: number;
  semesterCode?: string;
  semesterName?: string;
  startDate?: number | string | null;
  endDate?: number | string | null;
  isCurrent?: boolean;
  schoolYear?: {
    id?: number;
    name?: string;
    startDate?: number | string | null;
    endDate?: number | string | null;
  } | null;
}

export interface TluStudentSummary {
  displayName: string;
  studentCode: string;
  className?: string;
}

function buildTlsCaBundle(): string[] {
  const roots = [...tls.rootCertificates];
  const certPath = path.resolve(process.cwd(), 'certs', 'sectigo-dv-ca.pem');
  if (fs.existsSync(certPath)) {
    roots.push(fs.readFileSync(certPath, 'utf8'));
  }
  return roots;
}

const tluHttpsAgent = new https.Agent({
  ca: buildTlsCaBundle(),
  rejectUnauthorized: true,
  keepAlive: true,
});

interface HttpResponseResult {
  status: number;
  body: string;
}

function httpsJsonRequest(
  relativePath: string,
  options: {
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    body?: string;
  },
): Promise<HttpResponseResult> {
  const normalizedPath = relativePath.replace(/^\/+/, '');
  const fullPath = `${TLU_BASE_PATH}${normalizedPath}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: TLU_HOST,
        port: 443,
        path: fullPath,
        method: options.method,
        headers: options.headers,
        agent: tluHttpsAgent,
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          res.resume();
          reject(new TluApiError('Cổng sinh viên TLU trả về chuyển hướng bất thường.', 502));
          return;
        }
        const chunks: Buffer[] = [];
        let totalBytes = 0;
        const MAX_BYTES = 5 * 1024 * 1024;
        res.on('data', (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_BYTES) {
            req.destroy();
            reject(new TluApiError('Phản hồi từ cổng TLU vượt quá dung lượng cho phép.', 502));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          resolve({
            status,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new TluApiError('Kết nối tới sinhvien1.tlu.edu.vn quá thời gian chờ. Vui lòng thử lại.', 504));
    });

    req.on('error', () => {
      reject(new TluApiError('Không kết nối được tới máy chủ sinhvien1.tlu.edu.vn. Kiểm tra mạng và thử lại.', 502));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

export class TluClient {
  private token: TluTokenState | null = null;
  private cachedSemesters: TluSemesterSummary[] = [];

  private get clientId(): string {
    return process.env.TLU_CLIENT_ID || 'education_client';
  }

  private get clientSecret(): string {
    return process.env.TLU_CLIENT_SECRET || 'password';
  }

  private async requestJson<T>(
    relativePath: string,
    opts?: { form?: Record<string, string>; bearerToken?: string },
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'TLU-Lich-Hoc-PWA/1.0',
    };
    let payload: string | undefined;

    if (opts?.form) {
      payload = new URLSearchParams(opts.form).toString();
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      headers['Content-Length'] = String(Buffer.byteLength(payload));
    }
    if (opts?.bearerToken) {
      headers.Authorization = `Bearer ${opts.bearerToken}`;
    }

    const res = await httpsJsonRequest(relativePath, {
      method: opts?.form ? 'POST' : 'GET',
      headers,
      body: payload,
    });

    if (res.status < 200 || res.status >= 300) {
      let errorDescription = '';
      try {
        const parsed = JSON.parse(res.body) as { error_description?: string };
        errorDescription = parsed.error_description || '';
      } catch {
        // Ignore non-JSON error body
      }

      if (res.status === 400 || res.status === 401) {
        if (opts?.form?.grant_type === 'password') {
          if (errorDescription === 'User is disabled') {
            throw new TluApiError('Tài khoản sinh viên đang bị khóa trên cổng TLU.', 401);
          }
          throw new TluApiError('Sai mã sinh viên hoặc mật khẩu cổng TLU. Vui lòng kiểm tra lại.', 401);
        }
        throw new TluApiError('Phiên kết nối cổng TLU đã hết hạn. Vui lòng đăng nhập lại.', 401);
      }
      if (res.status === 403) {
        throw new TluApiError('Tài khoản không có quyền truy cập dữ liệu này trên cổng TLU.', 403);
      }
      if (res.status === 429) {
        throw new TluApiError('Cổng TLU đang giới hạn lượt truy cập. Chờ vài giây rồi thử lại.', 429);
      }
      throw new TluApiError(`Máy chủ sinhvien1.tlu.edu.vn báo lỗi (${res.status}). Vui lòng thử lại sau.`, 502);
    }

    try {
      return JSON.parse(res.body) as T;
    } catch {
      throw new TluApiError('Dữ liệu trả về từ cổng TLU không đúng định dạng JSON.', 502);
    }
  }

  private async grant(fields: Record<string, string>): Promise<void> {
    const result = await this.requestJson<{
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    }>('oauth/token', {
      form: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        ...fields,
      },
    });

    if (!result.access_token) {
      throw new TluApiError('Cổng TLU không trả về phiên đăng nhập hợp lệ.', 502);
    }

    this.token = {
      access: result.access_token,
      refresh: result.refresh_token,
      expiresAt: Date.now() + Number(result.expires_in || 600) * 1000,
    };
  }

  async login(username: string, password: string): Promise<void> {
    await this.grant({
      grant_type: 'password',
      username,
      password,
    });
  }

  async get<T>(relativePath: string): Promise<T> {
    if (!this.token) {
      throw new TluApiError('Vui lòng đăng nhập tài khoản TLU trước.', 401);
    }

    if (Date.now() >= this.token.expiresAt - 30_000 && this.token.refresh) {
      await this.grant({
        grant_type: 'refresh_token',
        refresh_token: this.token.refresh,
      });
    }

    try {
      return await this.requestJson<T>(relativePath, {
        bearerToken: this.token.access,
      });
    } catch (err) {
      if (err instanceof TluApiError && err.status === 401 && this.token.refresh) {
        await this.grant({
          grant_type: 'refresh_token',
          refresh_token: this.token.refresh,
        });
        return this.requestJson<T>(relativePath, {
          bearerToken: this.token.access,
        });
      }
      throw err;
    }
  }

  async getStudentProfile(fallbackUsername: string): Promise<TluStudentSummary> {
    try {
      const student = await this.get<{
        displayName?: string;
        studentCode?: string;
        enrollmentClass?: { className?: string };
      }>('api/student/getstudentbylogin');

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
      const user = await this.get<{
        displayName?: string;
        username?: string;
      }>('api/users/getCurrentUser');
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

  async getSemesters(): Promise<{
    semesters: TluSemesterSummary[];
    currentSemesterId: number | null;
  }> {
    const list: TluSemesterSummary[] = [];
    for (let page = 1; page <= 15; page++) {
      const pageData = await this.get<{
        content?: TluSemesterSummary[];
        last?: boolean;
        totalPages?: number;
      }>(`api/semester/${page}/100`);

      if (!Array.isArray(pageData?.content)) {
        throw new TluApiError('Danh sách học kỳ từ cổng TLU không đúng định dạng.', 502);
      }

      list.push(...pageData.content);
      if (pageData.last !== false && !(Number(pageData.totalPages) > page)) {
        break;
      }
    }

    let currentSemesterId: number | null = null;
    try {
      const info = await this.get<{ id?: number }>('api/semester/semester_info');
      if (info && typeof info.id === 'number') {
        currentSemesterId = info.id;
      }
    } catch (err) {
      if (err instanceof TluApiError && err.status === 401) {
        throw err;
      }
    }

    // Sort newest semesters first so the student sees recent terms immediately
    const sorted = [...list].sort((a, b) => Number(b.id) - Number(a.id));
    this.cachedSemesters = sorted;
    return {
      semesters: sorted,
      currentSemesterId: currentSemesterId ?? sorted.find((s) => s.isCurrent)?.id ?? sorted[0]?.id ?? null,
    };
  }

  async getSemesterSchedule(semesterId: number): Promise<{
    rawRows: unknown[];
    semester: TluSemesterSummary;
  }> {
    let semester = this.cachedSemesters.find((s) => Number(s.id) === semesterId);
    if (!semester) {
      const refreshed = await this.getSemesters();
      semester = refreshed.semesters.find((s) => Number(s.id) === semesterId);
    }
    if (!semester) {
      throw new TluApiError('Không tìm thấy học kỳ đã chọn trong danh sách của trường.', 404);
    }

    const rawRows = await this.get<unknown[]>(`api/StudentCourseSubject/studentLoginUser/${semesterId}`);
    if (!Array.isArray(rawRows)) {
      throw new TluApiError('Dữ liệu thời khóa biểu từ cổng TLU không đúng định dạng.', 502);
    }

    return {
      rawRows,
      semester,
    };
  }
}
