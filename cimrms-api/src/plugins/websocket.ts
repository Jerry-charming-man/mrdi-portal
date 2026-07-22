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

// 用 fp({ skipOverride: true })：
// - skipOverride:true → 不创建新 scope，plugin 逻辑在 root 上下文运行
//   → app.decorate('ws') 可被 root 路由看见 ✓
//   → /v1/ws route 在 root 注册，@fastify/websocket 的 onRoute/onUpgrade hooks 能拦截 ✓
// 别用 fp() 默认值（skipOverride:false）→ 会创建新 scope → root 路由看不到 app.ws ✗
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

  // GET /ws — WebSocket upgrade with JWT auth (prefix /v1 added at registration)
  app.get('/ws', { websocket: true }, (socket, req) => {
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
    socket.on('message', (msg: Buffer) => {
      try {
        const parsed = JSON.parse(msg.toString());
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

    socket.on('error', (err: Error) => {
      app.log.error({ err, email: user.email }, 'WebSocket error');
    });
  });

  // ── KPI 5s push（S3-5）──────────────────────────────────────────────
  // Runs after server is fully ready; broadcasts KPI snapshot every 5s
  app.addHook('onReady', async () => {
    const pushKpi = async () => {
      try {
        // Only push if there are active WS clients
        if (clients.size === 0) return;

        const [totalActive, inProgress, pendingUat, pendingAcceptance, closed, newToday] = await Promise.all([
          app.prisma.request.count({ where: { deletedAt: null, status: { not: 'closed' } } }),
          app.prisma.request.count({ where: { deletedAt: null, status: { in: ['scheduled', 'in_development'] } } }),
          app.prisma.request.count({ where: { deletedAt: null, status: 'pending_uat' } }),
          app.prisma.request.count({ where: { deletedAt: null, status: 'pending_acceptance' } }),
          app.prisma.request.count({ where: { status: 'closed' } }),
          app.prisma.request.count({
            where: {
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
              deletedAt: null,
            },
          }),
        ]);

        const payload = {
          totalActive,
          inProgress,
          pendingUat,
          pendingAcceptance,
          closed,
          newToday,
          ts: new Date().toISOString(),
        };

        broadcast('kpi:rms:update', payload);
      } catch (err) {
        app.log.error({ err }, '[ws:kpi] failed to push KPI');
      }
    };

    // Push immediately on start, then every 5s
    await pushKpi();
    const interval = setInterval(pushKpi, 5_000);

    app.addHook('onClose', () => clearInterval(interval));
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
}, { fastify: '4.x', name: 'ws-plugin' });

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
