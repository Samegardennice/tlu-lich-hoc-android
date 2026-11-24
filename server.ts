import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { TluApiError, TluClient, type TluStudentSummary } from './server/tluClient.ts';

const PORT = Number(process.env.PORT || 3000);
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

interface ServerSession {
  client: TluClient;
  student: TluStudentSummary;
  createdAt: number;
}

const sessions = new Map<string, ServerSession>();

function pruneExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

function extractBearerToken(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.slice(7).trim();
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }
  return token;
}

function requireSession(req: express.Request): { token: string; session: ServerSession } {
  pruneExpiredSessions();
  const token = extractBearerToken(req);
  if (!token) {
    throw new TluApiError('Phiên đăng nhập không tồn tại. Vui lòng kết nối lại tài khoản TLU.', 401);
  }
  const session = sessions.get(token);
  if (!session) {
    throw new TluApiError('Phiên kết nối đã hết hạn. Vui lòng đăng nhập lại tài khoản TLU.', 401);
  }
  return { token, session };
}

function handleApiError(res: express.Response, err: unknown): void {
  if (err instanceof TluApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Không xử lý được yêu cầu. Vui lòng thử lại.' });
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  // Basic security headers (avoid X-Frame-Options so AI Studio preview iframe works smoothly)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Never cache authenticated API responses
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/tlu/login', async (req, res) => {
    try {
      pruneExpiredSessions();
      const body = req.body as { username?: unknown; password?: unknown };
      const username = typeof body?.username === 'string' ? body.username.trim() : '';
      const password = typeof body?.password === 'string' ? body.password : '';

      if (!username || !password) {
        res.status(400).json({ error: 'Vui lòng nhập đầy đủ mã sinh viên và mật khẩu.' });
        return;
      }
      if (username.length > 120 || password.length > 500) {
        res.status(400).json({ error: 'Thông tin đăng nhập vượt quá độ dài cho phép.' });
        return;
      }

      const client = new TluClient();
      await client.login(username, password);

      const [student, semesterPayload] = await Promise.all([
        client.getStudentProfile(username),
        client.getSemesters(),
      ]);

      const sessionToken = crypto.randomBytes(32).toString('hex');
      sessions.set(sessionToken, {
        client,
        student,
        createdAt: Date.now(),
      });

      res.json({
        sessionToken,
        student,
        semesters: semesterPayload.semesters.map((s) => ({
          id: s.id,
          name: s.semesterName || s.semesterCode || `Học kỳ ${s.id}`,
          code: s.semesterCode || '',
          schoolYearStart: s.schoolYear?.startDate ?? null,
        })),
        currentSemesterId: semesterPayload.currentSemesterId,
      });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.post('/api/tlu/logout', (req, res) => {
    const token = extractBearerToken(req);
    if (token) {
      sessions.delete(token);
    }
    res.json({ ok: true });
  });

  app.get('/api/tlu/semesters', async (req, res) => {
    try {
      const { session } = requireSession(req);
      const semesterPayload = await session.client.getSemesters();
      res.json({
        student: session.student,
        semesters: semesterPayload.semesters.map((s) => ({
          id: s.id,
          name: s.semesterName || s.semesterCode || `Học kỳ ${s.id}`,
          code: s.semesterCode || '',
          schoolYearStart: s.schoolYear?.startDate ?? null,
        })),
        currentSemesterId: semesterPayload.currentSemesterId,
      });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  app.get('/api/tlu/schedule/:semesterId', async (req, res) => {
    try {
      const { session } = requireSession(req);
      const rawId = req.params.semesterId;
      if (!/^\d{1,12}$/.test(rawId)) {
        res.status(400).json({ error: 'Mã học kỳ không hợp lệ.' });
        return;
      }
      const semesterId = Number(rawId);
      const result = await session.client.getSemesterSchedule(semesterId);
      res.json({
        student: session.student,
        semester: result.semester,
        rawRows: result.rawRows,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleApiError(res, err);
    }
  });

  const distDir = path.resolve(process.cwd(), 'dist');

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir, { index: false }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TLU Lịch Học server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
