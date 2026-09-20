import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import { AuthUser, Role } from '../types';

export interface UserSession {
  sessionId: string;
  userId: string;
  email: string;
  name: string;
  username?: string;
  role: Role;
  balance: number;
  createdAt: number;
  lastActive: number;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
}

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days sliding session
const DATA_DIR = path.join(process.cwd(), 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions_db.json');

class SessionManager {
  private sessions = new Map<string, UserSession>();
  private isLoaded = false;

  constructor() {
    this.loadSessions();
  }

  private loadSessions(): void {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(SESSIONS_FILE)) {
        const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          for (const s of parsed) {
            // Keep valid, unexpired sessions
            if (s && s.sessionId && s.userId && s.expiresAt > now) {
              this.sessions.set(s.sessionId, s);
            }
          }
        }
      }
      this.isLoaded = true;
    } catch (err) {
      console.warn('[SessionManager] Could not read sessions_db.json:', err);
      this.isLoaded = true;
    }
  }

  private persistSessions(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const now = Date.now();
      const list = Array.from(this.sessions.values()).filter(s => s.expiresAt > now);
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[SessionManager] Could not write sessions_db.json:', err);
    }
  }

  public createSession(user: Partial<AuthUser> & { id: string; email?: string; name?: string; role?: Role; balance?: number }, req?: Request): UserSession {
    this.loadSessions();
    const sessionId = 'kalam_sess_' + crypto.randomBytes(24).toString('hex');
    const now = Date.now();
    const expiresAt = now + SESSION_DURATION_MS;

    const email = user.email || (user.id.includes('@') ? user.id : `${user.id}@kalam.shop`);
    const name = user.name || user.username || 'User';
    const role = (user.role as Role) || (email.toLowerCase().includes('admin') || user.id.toLowerCase().includes('admin') ? 'ADMIN' : 'USER');
    const balance = typeof user.balance === 'number' ? user.balance : 0;

    const session: UserSession = {
      sessionId,
      userId: user.id,
      email,
      name,
      username: user.username,
      role,
      balance,
      createdAt: now,
      lastActive: now,
      expiresAt,
      ipAddress: req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1',
      userAgent: req ? (req.headers['user-agent'] as string || '') : ''
    };

    this.sessions.set(sessionId, session);
    this.persistSessions();
    return session;
  }

  public getSession(sessionId: string): UserSession | null {
    if (!sessionId) return null;
    this.loadSessions();
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const now = Date.now();
    if (session.expiresAt < now) {
      this.sessions.delete(sessionId);
      this.persistSessions();
      return null;
    }

    // Touch session (extend expiration sliding window)
    session.lastActive = now;
    session.expiresAt = now + SESSION_DURATION_MS;
    return session;
  }

  public touchSession(sessionId: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;
    session.lastActive = Date.now();
    session.expiresAt = Date.now() + SESSION_DURATION_MS;
    this.persistSessions();
    return true;
  }

  public updateSessionBalance(userId: string, newBalance: number): void {
    this.loadSessions();
    let updated = false;
    for (const session of this.sessions.values()) {
      if (session.userId === userId || session.email === userId) {
        session.balance = newBalance;
        updated = true;
      }
    }
    if (updated) {
      this.persistSessions();
    }
  }

  public deleteSession(sessionId: string): boolean {
    this.loadSessions();
    const res = this.sessions.delete(sessionId);
    if (res) this.persistSessions();
    return res;
  }

  public parseCookies(req: Request): Record<string, string> {
    const list: Record<string, string> = {};
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return list;

    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx < 0) continue;
      const key = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      if (key) {
        try {
          list[key] = decodeURIComponent(val);
        } catch {
          list[key] = val;
        }
      }
    }
    return list;
  }

  public resolveUserFromRequest(req: Request): { user: UserSession | null; source: 'cookie' | 'header' | 'token' | null } {
    this.loadSessions();
    const cookies = this.parseCookies(req);

    // 1. Direct Session Token in Cookie
    const sessionToken = cookies['kalam_session_token'] || cookies['session_token'];
    if (sessionToken) {
      const session = this.getSession(sessionToken);
      if (session) return { user: session, source: 'cookie' };
    }

    // 2. Encoded Auth User in Cookie
    const authCookie = cookies['kalam_auth_session'] || cookies['kalam_auth_user'];
    if (authCookie) {
      try {
        const parsed = JSON.parse(authCookie);
        if (parsed && (parsed.id || parsed.userId)) {
          const userSession: UserSession = {
            sessionId: parsed.sessionId || 'cookie_derived_' + (parsed.id || parsed.userId),
            userId: parsed.id || parsed.userId,
            email: parsed.email || `${parsed.id || parsed.userId}@kalam.shop`,
            name: parsed.name || parsed.username || 'User',
            username: parsed.username,
            role: parsed.role || 'USER',
            balance: typeof parsed.balance === 'number' ? parsed.balance : 0,
            createdAt: parsed.createdAt || Date.now(),
            lastActive: Date.now(),
            expiresAt: Date.now() + SESSION_DURATION_MS
          };
          return { user: userSession, source: 'cookie' };
        }
      } catch {}
    }

    // 3. Authorization Bearer Token or Custom Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const session = this.getSession(token);
      if (session) return { user: session, source: 'header' };
    }

    const customToken = (req.headers['x-session-token'] || req.headers['x-auth-token']) as string;
    if (customToken) {
      const session = this.getSession(customToken);
      if (session) return { user: session, source: 'token' };
    }

    return { user: null, source: null };
  }

  public setSessionCookie(res: Response, session: UserSession): void {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieMaxAgeSec = Math.floor(SESSION_DURATION_MS / 1000);

    const cookieFlags = [
      `Path=/`,
      `Max-Age=${cookieMaxAgeSec}`,
      `SameSite=Lax`,
      isProd ? `Secure` : ''
    ].filter(Boolean).join('; ');

    // Set Session Token cookie
    res.setHeader('Set-Cookie', [
      `kalam_session_token=${encodeURIComponent(session.sessionId)}; ${cookieFlags}`,
      `kalam_auth_session=${encodeURIComponent(JSON.stringify({
        id: session.userId,
        email: session.email,
        name: session.name,
        username: session.username,
        role: session.role,
        balance: session.balance
      }))}; ${cookieFlags}`
    ]);
  }

  public clearSessionCookies(res: Response): void {
    const clearFlags = 'Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    res.setHeader('Set-Cookie', [
      `kalam_session_token=; ${clearFlags}`,
      `kalam_auth_session=; ${clearFlags}`,
      `kalam_auth_user=; ${clearFlags}`
    ]);
  }
}

export const sessionManager = new SessionManager();
