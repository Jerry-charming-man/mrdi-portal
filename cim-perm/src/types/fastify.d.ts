/**
 * Type declarations — cim-perm
 */
import type { FastifyRequest } from 'fastify';
import type { AuthUser } from './types/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    env: {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: number;
      LOG_LEVEL: string;
      DB_HOST: string;
      DB_PORT: number;
      DB_NAME: string;
      DB_USER: string;
      DB_PASSWORD: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      DEV_LOGIN_ENABLED: boolean;
      CORS_ORIGINS: string;
      MDM_API_BASE: string;
      MDM_API_KEY: string;
    };
    auth: (req: FastifyRequest) => AuthUser;
    AppError: typeof import('../plugins/errorHandler.js').AppError extends never ? any : never;
    pgPool: import('pg').Pool;
    query: <T = unknown>(text: string, params?: unknown[]) => Promise<T[]>;
    queryOne: <T = unknown>(text: string, params?: unknown[]) => Promise<T | null>;
  }

  interface FastifyRequest {
    currentUser: AuthUser | null;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { email?: string; upn?: string; name?: string; roles?: string[]; dept?: string };
    user: { email?: string; upn?: string; name?: string; roles?: string[]; dept?: string };
  }
}
