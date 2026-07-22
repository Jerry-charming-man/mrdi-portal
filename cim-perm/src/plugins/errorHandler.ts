/**
 * 全局错误处理
 * 使用 duck typing 捕获 AppError（因为 Dockerfile 导致 @mrdi/shared 被复制两次，
 * instanceof 可能跨模块边界失效）
 *
 * S4-2: ZodError 返回含 i18nKey 的结构化响应
 */
import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import type { FastifyPluginAsync, FastifyError } from 'fastify';
import { zodIssuesToI18n, errorCodeToI18nKey } from '@mrdi/shared/errors';

export const errorHandlerPlugin: FastifyPluginAsync = fp(async (app) => {
  app.setErrorHandler((err: Error, _req, reply) => {
    // Duck typing: 任何带 httpStatus + code 的对象都是 AppError
    // 这能跨 Dockerfile 复制的模块边界工作
    const errObj = err as unknown as Record<string, unknown>;
    if (typeof errObj['httpStatus'] === 'number' && typeof errObj['code'] === 'string') {
      const code = errObj['code'] as string;
      const explicitKey = errObj['i18nKey'];
      return reply.code(errObj['httpStatus'] as number).send({
        error: {
          code,
          i18nKey: typeof explicitKey === 'string' ? explicitKey : errorCodeToI18nKey(code),
          message: errObj['message'] as string,
          ...(errObj['details'] ? { details: errObj['details'] } : {}),
        },
      });
    }
    // Fallback: 明确处理 403 Forbidden（permission guard 抛出的 ForbiddenError）
    if ((errObj['statusCode'] === 403 || errObj['statusCode'] === '403') &&
        typeof errObj['message'] === 'string') {
      return reply.code(403).send({
        error: { code: 'FORBIDDEN', i18nKey: errorCodeToI18nKey('FORBIDDEN'), message: errObj['message'] as string },
      });
    }
    // Debug: 打印未识别的错误
    app.log.error({ errType: err.constructor.name, errKeys: Object.keys(errObj), errHttpStatus: errObj['httpStatus'], errStatusCode: errObj['statusCode'] }, 'Unhandled error in errorHandler');
    if (err instanceof ZodError) {
      const issues = zodIssuesToI18n(err.issues, 'cim-perm');
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
});
