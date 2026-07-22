/**
 * BullMQ Worker Plugin — notification queue
 *
 * S3-1b: Async notification processing via BullMQ + Redis
 * - Queue name: "notifications"
 * - Worker processes jobs: writes to DB (+ future: email/WebSocket push)
 * - Server gracefully shuts down the worker on SIGTERM
 */
import fp from 'fastify-plugin';
import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import type { FastifyInstance } from 'fastify';
import type { Env } from '../config/env.js';

export const QUEUE_NAME = 'notifications';

// Module-level singleton (survives Fastify restarts in dev HMR)
let _queue: Queue | null = null;
let _worker: Worker | null = null;
let _redis: IORedis | null = null;

export async function getNotificationQueue(): Promise<Queue> {
  if (!_queue) throw new Error('BullMQ queue not initialized');
  return _queue;
}

export function isQueueHealthy(): boolean {
  return _worker !== null && !_worker.isPaused();
}

async function buildRedis(env: Env): Promise<IORedis> {
  // Parse redis://host:port → host + port (IORedis URL parsing is unreliable on Docker service names)
  const url = new URL(env.REDIS_URL);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new IORedis({
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    maxRetriesPerRequest: null, // BullMQ requirement
    retryStrategy(times: number) {
      if (times > 5) return null;
      return Math.min(times * 200, 3000);
    },
  } as any);
}

export const bullmqPlugin = fp(async (app: FastifyInstance) => {
  const env = app.env as Env;

  const redis = await buildRedis(env);
  _redis = redis;

  // ── Queue ──────────────────────────────────────────────────────────────────
  const redisOpts = {
    host: (new URL(env.REDIS_URL)).hostname,
    port: parseInt((new URL(env.REDIS_URL)).port || '6379', 10),
    maxRetriesPerRequest: null, // BullMQ requirement
  };
  _queue = new Queue(QUEUE_NAME, {
    connection: redisOpts,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  });

  // ── Worker ─────────────────────────────────────────────────────────────────
  _worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      app.log.info(`[bullmq] processing job ${job.id} name=${job.name}`);

      const { notifications } = job.data as { notifications: Array<{
        recipientEmail: string;
        type: string;
        title: string;
        body?: string;
        metadata?: Record<string, unknown>;
      }> };

      // Write each notification to DB
      const prisma = app.prisma;
      await prisma.notification.createMany({
        data: notifications.map(n => ({
          recipient_email: n.recipientEmail,
          type: n.type as import('@prisma/client').NotificationType,
          title: n.title,
          body: n.body ?? null,
          metadata: n.metadata as object ?? undefined,
        })),
      });

      app.log.info(`[bullmq] job ${job.id} — ${notifications.length} notifications written`);
    },
    {
      connection: redisOpts,
      concurrency: 5,
    },
  );

  _worker.on('completed', (job) => {
    app.log.debug(`[bullmq] job ${job.id} completed`);
  });

  _worker.on('failed', (job, err) => {
    app.log.error(`[bullmq] job ${job?.id} failed: ${err.message}`);
  });

  _worker.on('error', (err) => {
    app.log.error(`[bullmq] worker error: ${err.message}`);
  });

  // ── Queue events (for health monitoring) ──────────────────────────────────
  const events = new QueueEvents(QUEUE_NAME, {
    connection: redisOpts,
  });
  events.on('error', (err) => {
    app.log.error(`[bullmq] queue events error: ${err.message}`);
  });

  app.log.info('[bullmq] notification worker started');

  // Graceful shutdown
  const close = async () => {
    app.log.info('[bullmq] shutting down...');
    await _worker?.close();
    await _queue?.close();
    await events.close();
    await redis.quit();
    _queue = null;
    _worker = null;
    _redis = null;
  };

  app.addHook('onClose', close);

  // Expose for health endpoint
  app.decorate('notificationQueue', _queue);
}, {
  name: 'bullmq',
  dependencies: ['prisma'],
});
