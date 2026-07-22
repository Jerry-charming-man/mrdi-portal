/**
 * Teams Notify plugin — 注入 TeamsNotifyClient 到 app.teamsNotify
 *
 * 用法（requests.ts）：
 * ```ts
 * await app.teamsNotify.send({
 *   eventId:    `cimrms-${request.id}-approve`,
 *   recipients: { users: [mgr.email] },
 *   card:       templates.approvalCard({ ... }),
 * });
 * ```
 *
 * 设为 fire-and-forget：发送失败不阻塞主流程，错误只在 log 里记录。
 */
import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { TeamsNotifyClient, templates } from '@mrdi/teams-notify';
import type { Env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    teamsNotify: TeamsNotifyClient;
    teamsNotifyCallbackBase: string;
    teamsNotifyApproverEmails: string[];
  }
}

/** 静默发送：失败只 log，不抛异常 */
async function safeSend(client: TeamsNotifyClient, params: Parameters<TeamsNotifyClient['send']>[0]) {
  try {
    await client.send(params);
  } catch (err: unknown) {
    const e = err as Error;
    console.warn(`[teams-notify] send failed: ${e.message}`);
  }
}

export const teamsNotifyPlugin: FastifyPluginAsync<{ env: Env }> = fp(
  async (app: FastifyInstance, opts: { env: Env }) => {
    const {
      TEAMS_NOTIFY_ENABLED,
      TEAMS_NOTIFY_GATEWAY_URL,
      TEAMS_NOTIFY_SERVICE_TOKEN,
      TEAMS_NOTIFY_CALLBACK_BASE_URL,
      TEAMS_NOTIFY_APPROVER_EMAILS,
    } = opts.env;

    const callbackBase = TEAMS_NOTIFY_CALLBACK_BASE_URL.replace(/\/$/, '');
    const approverEmails = TEAMS_NOTIFY_APPROVER_EMAILS
      ? TEAMS_NOTIFY_APPROVER_EMAILS.split(',').map(e => e.trim()).filter(Boolean)
      : [];

    if (!TEAMS_NOTIFY_ENABLED || !TEAMS_NOTIFY_SERVICE_TOKEN) {
      app.decorate('teamsNotify', {
        send: async () => { /* noop */ },
        getStatus: async () => { throw new Error('Teams Notify not enabled'); },
      } as unknown as TeamsNotifyClient);
      app.decorate('teamsNotifyCallbackBase', callbackBase);
      app.decorate('teamsNotifyApproverEmails', approverEmails);
      app.log.info('[teams-notify] disabled (TEAMS_NOTIFY_ENABLED=false or no service token)');
      return;
    }

    const client = new TeamsNotifyClient({
      gatewayBaseUrl: TEAMS_NOTIFY_GATEWAY_URL,
      sourceSystem: 'cimrms',
      serviceToken: TEAMS_NOTIFY_SERVICE_TOKEN,
    });

    app.decorate('teamsNotify', client);
    app.decorate('teamsNotifyCallbackBase', callbackBase);
    app.decorate('teamsNotifyApproverEmails', approverEmails);
    app.log.info({ gateway: TEAMS_NOTIFY_GATEWAY_URL, callbackBase, approverCount: approverEmails.length }, '[teams-notify] enabled');
  }
);

// ─── 导出 templates（直接用，不需要 client 实例）────────────────────────
export { templates };
