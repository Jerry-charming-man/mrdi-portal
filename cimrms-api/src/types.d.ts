/**
 * 全局类型声明 — cimrms-api
 */

import type { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    env: {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: number;
      LOG_LEVEL: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      DEV_LOGIN_ENABLED: boolean;
      CORS_ORIGINS: string;
    };
    auth: (req: FastifyRequest) => {
      email: string;
      name: string;
      role: string;
      department: string;
    };
    prisma: import('@prisma/client').PrismaClient;
  }

  interface FastifyRequest {
    currentUser: {
      email: string;
      name: string;
      role: string;
      department: string;
    } | null;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      email: string;
      name: string;
      role: string;
      department: string;
    };
    user: {
      email: string;
      name: string;
      role: string;
      department: string;
    };
  }
}
