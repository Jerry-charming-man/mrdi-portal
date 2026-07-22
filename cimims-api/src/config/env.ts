/**
 * 环境变量加载 + Zod 校验
 */
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3002),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('8h'),
  DEV_LOGIN_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  CORS_ORIGINS: z.string().default('http://localhost:8089,http://localhost:5173'),
  // MDM integration (for notifications)
  MDM_BASE_URL: z.string().default('http://mdm-api:3000/v1'),
  SERVICE_TOKEN: z.string().default('mrdi-dev-service-token-2024'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const raw = {
    NODE_ENV: process.env['NODE_ENV'] ?? 'development',
    PORT: process.env['PORT'] ?? '3002',
    LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'info',
    DATABASE_URL: process.env['DATABASE_URL'] ?? '',
    JWT_SECRET: process.env['JWT_SECRET'] ?? '',
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '8h',
    DEV_LOGIN_ENABLED: process.env['DEV_LOGIN_ENABLED'] ?? 'true',
    CORS_ORIGINS: process.env['CORS_ORIGINS'] ?? 'http://localhost:8089,http://localhost:5173',
    MDM_BASE_URL: process.env['MDM_BASE_URL'] ?? 'http://mdm-api:3000/v1',
    SERVICE_TOKEN: process.env['SERVICE_TOKEN'] ?? 'mrdi-dev-service-token-2024',
  };

  const result = EnvSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`[env] Invalid environment:\n${issues}`);
    process.exit(1);
  }

  return result.data;
}
