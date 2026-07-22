/**
 * 全局类型声明 — mdm-api
 *
 * 注意：@mrdi/shared 的源码通过 tsconfig include 直接引入，
 * 这样 TypeScript 可以看到原始类型定义，不需要单独 .d.ts
 */

// ============================================================
// Fastify 实例装饰器
// ============================================================
import type { FastifyInstance, FastifyRequest, FastifyError } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    // env 注入
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
    // 鉴权
    requireAuth: (req: FastifyRequest) => Promise<{
      email: string;
      name: string;
      role: string;
      department: string;
    }>;
    // Prisma
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

// ============================================================
// @fastify/jwt payload
// ============================================================
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
