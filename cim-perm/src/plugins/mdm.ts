/**
 * MDM Client plugin — 注入 MdmClient 到 app.mdm
 * 用于 auditEvent 写入 MDM 统一审计日志（S4-3）
 */
import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { MdmClient } from '@mrdi/shared/mdm-client';
import type { Env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    mdm: MdmClient;
  }
}

export const mdmPlugin: FastifyPluginAsync<{ env: Env }> = fp(async (app: FastifyInstance, opts: { env: Env }) => {
  const { MDM_BASE_URL, SERVICE_TOKEN } = opts.env;

  const client = new MdmClient({
    baseUrl: `${MDM_BASE_URL}/v1`,
    serviceToken: SERVICE_TOKEN,
    sourceSystem: 'cim-perm-api',
    timeoutMs: 5000,
  });

  app.decorate('mdm', client);
});
