/**
 * 全局错误处理
 * AppError 直接 inline（避免 @mrdi/shared 路径在 tsconfig 中的 module resolution 歧义）
 * 也处理 @mrdi/shared/errors 的 ForbiddenError / UnauthorizedError
 *
 * S4-2: ZodError 返回含 i18nKey 的结构化响应
 */
import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import type { FastifyPluginAsync, FastifyError } from 'fastify';
import { ForbiddenError, UnauthorizedError, zodIssuesToI18n, errorCodeToI18nKey } from '@mrdi/shared/errors';

class AppError extends Error {
  public readonly i18nKey: string;
  constructor(
    public code: string,
    message: string,
    public httpStatus: number = 400,
    public details?: Record<string, unknown>,
    i18nKey?: string,
  ) {
    super(message);
    this.name = 'AppError';
    this.i18nKey = i18nKey ?? errorCodeToI18nKey(code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', id ? `${resource} ${id} 不存在` : `${resource} 不存在`, 404);
  }
}

export const errorHandlerPlugin: FastifyPluginAsync = fp(async (app) => {
  app.setErrorHandler((err: Error, _req, reply) => {
    // @mrdi/shared/errors 的权限异常
    if (err instanceof ForbiddenError) {
      const code = (err as unknown as { code: string }).code ?? 'FORBIDDEN';
      return reply.code(403).send({
        error: { code, i18nKey: errorCodeToI18nKey(code), message: err.message },
      });
    }
    if (err instanceof UnauthorizedError) {
      const code = (err as unknown as { code: string }).code ?? 'UNAUTHORIZED';
      return reply.code(401).send({
        error: { code, i18nKey: errorCodeToI18nKey(code), message: err.message },
      });
    }

    if (err instanceof AppError) {
      return reply.code(err.httpStatus).send({
        error: { code: err.code, i18nKey: err.i18nKey, message: err.message, ...(err.details ? { details: err.details } : {}) },
      });
    }

    if (err instanceof ZodError) {
      const issues = zodIssuesToI18n(err.issues, 'mdm');
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          i18nKey: errorCodeToI18nKey('VALIDATION_ERROR'),
          message: '参数校验失败',
          issues,
        },
      });
    }

    if ('statusCode' in err) {
      const fastifyErr = err as FastifyError & { statusCode: number; code?: string };
      const code = fastifyErr.code ?? 'HTTP_ERROR';
      return reply.code(fastifyErr.statusCode).send({
        error: { code, i18nKey: errorCodeToI18nKey(code), message: fastifyErr.message },
      });
    }

    app.log.error({ err }, 'Unhandled error');
    return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', i18nKey: errorCodeToI18nKey('INTERNAL_ERROR'), message: 'Internal server error' } });
  });

  // 导出给路由用
  app.decorate('AppError', { AppError, NotFoundError });
});
