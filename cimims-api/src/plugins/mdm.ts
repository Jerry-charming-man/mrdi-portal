/**
 * MDM Client plugin — 注入 MdmClient 到 app.mdm
 * 用于发送通知到 MDM 通知系统
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
    baseUrl: MDM_BASE_URL,
    serviceToken: SERVICE_TOKEN,
    sourceSystem: 'cimims-api',
    timeoutMs: 5000,
  });

  app.decorate('mdm', client);
});
