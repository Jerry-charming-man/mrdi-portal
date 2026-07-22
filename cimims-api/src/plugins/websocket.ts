/**
 * WebSocket Plugin — 全局实时推送
 *
 * - JWT 鉴权后升级为 WebSocket 连接
 * - 维护 userEmail → Set<WebSocket> 映射
 * - broadcast(event, data) — 推送事件给所有在线用户
 * - sendTo(userEmail, event, data) — 推送给指定用户
 *
 * 路由: GET /ws (需 JWT Bearer token)
 */
import fp from 'fastify-plugin';
import fastifyWebsocket from '@fastify/websocket';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { WebSocket } from '@fastify/websocket';

interface WsClient {
  socket: WebSocket;
  userEmail: string;
  userRole: string;
}

// 用 fp({ skipOverride: true }) 确保 decorator 暴露到 root scope
export const wsPlugin: FastifyPluginAsync = fp(async (app: FastifyInstance) => {
  // Register @fastify/websocket — required before any { websocket: true } route
  await app.register(fastifyWebsocket, { options: { maxPayload: 1048576 } });

  // userEmail → Set of active connections (one user may have multiple tabs/devices)
  const clients = new Map<string, Set<WsClient>>();

  function broadcast(event: string, data: unknown) {
    const msg = JSON.stringify({ event, data, ts: new Date().toISOString() });
    for (const [, wsSet] of clients) {
      for (const client of wsSet) {
        if (client.socket.readyState === 1 /* OPEN */) {
          client.socket.send(msg);
        }
      }
    }
  }

  function sendTo(userEmail: string, event: string, data: unknown) {
    const wsSet = clients.get(userEmail);
    if (!wsSet) return;
    const msg = JSON.stringify({ event, data, ts: new Date().toISOString() });
    for (const client of wsSet) {
      if (client.socket.readyState === 1) {
        client.socket.send(msg);
      }
    }
  }

  function sendToRole(role: string, event: string, data: unknown) {
    const msg = JSON.stringify({ event, data, ts: new Date().toISOString() });
    for (const [, wsSet] of clients) {
      for (const client of wsSet) {
        if (client.userRole === role && client.socket.readyState === 1) {
          client.socket.send(msg);
        }
      }
    }
  }

  // Heartbeat: ping every 25s, close stale connections
  const heartbeat = setInterval(() => {
    for (const [email, wsSet] of clients) {
      for (const client of wsSet) {
        if (client.socket.readyState !== 1) {
          wsSet.delete(client);
          client.socket.terminate();
        }
      }
      if (wsSet.size === 0) {
        clients.delete(email);
      }
    }
  }, 25_000);

  app.addHook('onClose', () => {
    clearInterval(heartbeat);
    for (const [, wsSet] of clients) {
      for (const client of wsSet) {
        client.socket.close();
      }
    }
    clients.clear();
  });

  // GET /v1/ws — WebSocket upgrade with JWT auth (path is root-level; prefix handled at registration)
  app.get('/v1/ws', { websocket: true }, (socket, req) => {
    // Extract token from query string: /ws?token=xxx
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      socket.send(JSON.stringify({ event: 'error', data: { code: 'UNAUTHORIZED', message: 'Missing token' } }));
      socket.close(4001, 'Missing token');
      return;
    }

    // Verify JWT
    let user: { email: string; name: string; role: string };
    try {
      const decoded = app.jwt.verify(token) as { email: string; name: string; role: string };
      user = { email: decoded.email, name: decoded.name ?? '', role: decoded.role };
    } catch {
      socket.send(JSON.stringify({ event: 'error', data: { code: 'UNAUTHORIZED', message: 'Invalid token' } }));
      socket.close(4001, 'Invalid token');
      return;
    }

    // Register client
    const client: WsClient = { socket, userEmail: user.email, userRole: user.role };
    if (!clients.has(user.email)) {
      clients.set(user.email, new Set());
    }
    clients.get(user.email)!.add(client);

    app.log.info({ email: user.email, role: user.role }, 'WebSocket client connected');

    // Send welcome
    socket.send(JSON.stringify({
      event: 'connected',
      data: { email: user.email, role: user.role, ts: new Date().toISOString() },
    }));

    // Handle incoming messages (heartbeat pong, etc.)
    socket.on('message', (msg: unknown) => {
      const raw = typeof msg === 'string' ? msg : msg instanceof Buffer ? msg.toString() : String(msg);
      try {
        const parsed = JSON.parse(raw);
        if (parsed.type === 'ping') {
          socket.send(JSON.stringify({ event: 'pong', data: { ts: new Date().toISOString() } }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    socket.on('close', () => {
      const wsSet = clients.get(user.email);
      if (wsSet) {
        wsSet.delete(client);
        if (wsSet.size === 0) clients.delete(user.email);
      }
      app.log.info({ email: user.email }, 'WebSocket client disconnected');
    });

    socket.on('error', (err: unknown) => {
      app.log.error({ err, email: user.email }, 'WebSocket error');
    });
  });

  // ── KPI 5s push（S3-5）──────────────────────────────────────────────
  app.addHook('onReady', async () => {
    const pushKpi = async () => {
      if (clients.size === 0) return;
      try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const [newToday, openTotal, slaWarn, slaBreach, processing] = await Promise.all([
          app.prisma.incident.count({ where: { createdAt: { gte: today } } }),
          app.prisma.incident.count({ where: { status: { not: 'closed' } } }),
          app.prisma.incident.count({ where: { slaWarnedAt: { not: null }, status: { not: 'closed' } } }),
          app.prisma.incident.count({ where: { slaCloseBreached: true, status: { not: 'closed' } } }),
          app.prisma.incident.count({ where: { status: 'processing' } }),
        ]);
        broadcast('kpi:ims:update', {
          newToday, openTotal, slaWarn, slaBreach, processing,
          ts: new Date().toISOString(),
        });
      } catch (err) {
        app.log.error({ err }, '[ws:kpi:ims] failed');
      }
    };
    await pushKpi();
    const kpiInterval = setInterval(pushKpi, 5_000);
    app.addHook('onClose', () => clearInterval(kpiInterval));
  });

  // ── Alarm 1s push（S3-6）──────────────────────────────────────────────
  // Poll for new P1/P2 incidents every second; broadcast to duty+ users
  app.addHook('onReady', async () => {
    let lastAlarmCheck = new Date();
    const pushAlarms = async () => {
      if (clients.size === 0) return;
      try {
        // Fetch incidents created since last check with P1/P2 urgency
        const since = lastAlarmCheck;
        lastAlarmCheck = new Date();
        const newAlarms = await app.prisma.incident.findMany({
          where: {
            createdAt: { gte: since },
            urgency: { in: ['P1', 'P2'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true, incidentNo: true, title: true, urgency: true,
            status: true, createdAt: true, relatedSystem: true,
          },
        });
        if (newAlarms.length === 0) return;
        sendToRole('duty', 'alarm:ims:new', { alarms: newAlarms, count: newAlarms.length });
        // Also notify admins
        sendToRole('admin', 'alarm:ims:new', { alarms: newAlarms, count: newAlarms.length });
      } catch (err) {
        app.log.error({ err }, '[ws:alarm:ims] failed');
      }
    };
    const alarmInterval = setInterval(pushAlarms, 1_000);
    app.addHook('onClose', () => clearInterval(alarmInterval));
  });

  // Decorate app for use in routes
  app.decorate('ws', {
    broadcast,
    sendTo,
    sendToRole,
    getOnlineUsers: () => [...clients.keys()],
    getClientCount: () => {
      let n = 0;
      for (const [, wsSet] of clients) n += wsSet.size;
      return n;
    },
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    ws: {
      broadcast(event: string, data: unknown): void;
      sendTo(userEmail: string, event: string, data: unknown): void;
      sendToRole(role: string, event: string, data: unknown): void;
      getOnlineUsers(): string[];
      getClientCount(): number;
    };
  }
}
