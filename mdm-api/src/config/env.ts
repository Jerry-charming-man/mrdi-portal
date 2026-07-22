/**
 * 环境变量加载 + Zod 校验
 */
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('8h'),
  DEV_LOGIN_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  // ADMIN_KEY: 保护 dev_login 的额外密钥（T2 · ADR-0006）；未设置则允许无条件 dev_login（向后兼容）
  ADMIN_KEY: z.string().optional(),
  // M365 OAuth mock（T3 · ADR-0006）；NODE_ENV=development 时默认 true
  M365_MOCK_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),
  CORS_ORIGINS: z.string().default('http://localhost:8089,http://localhost:5173'),
  // Service token for system-to-system notification sending (cimrms/cimims/perm)
  SERVICE_TOKEN: z.string().default('mrdi-dev-service-token-2024'),
  // Redis URL for BullMQ notification queue (S3-1b)
  REDIS_URL: z.string().default('redis://mrdi-redis:6379'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  // 手动构建 object 以便精确定位错误
  const raw = {
    NODE_ENV: process.env['NODE_ENV'] ?? 'development',
    PORT: process.env['PORT'] ?? '3000',
    LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'info',
    DATABASE_URL: process.env['DATABASE_URL'] ?? '',
    JWT_SECRET: process.env['JWT_SECRET'] ?? '',
    JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '8h',
    DEV_LOGIN_ENABLED: process.env['DEV_LOGIN_ENABLED'] ?? 'true',
    ADMIN_KEY: process.env['ADMIN_KEY'],
    M365_MOCK_ENABLED: process.env['M365_MOCK_ENABLED'] ?? 'true',
    CORS_ORIGINS: process.env['CORS_ORIGINS'] ?? 'http://localhost:8089,http://localhost:5173',
    SERVICE_TOKEN: process.env['SERVICE_TOKEN'] ?? 'mrdi-dev-service-token-2024',
    REDIS_URL: process.env['REDIS_URL'] ?? 'redis://mrdi-redis:6379',
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
