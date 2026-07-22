/**
 * 业务异常类 — 4 个 API 服务统一使用
 * Fastify error handler 会捕获 AppError 并返回对应 HTTP status
 *
 * S4-2: ZodValidationError 统一结构
 * 每个 issue 含 i18nKey，前端可直接映射到 i18n key
 * 格式: {system}.validation.{entity}.{field}.{issueType}
 */

import { z } from 'zod';

/** Zod issue → i18n key 映射 */
export function zodIssueToI18nKey(
  issue: z.ZodIssue,
  systemPrefix: string,
): string {
  const path = issue.path.length > 0
    ? issue.path.join('_')
    : 'root';
  const issueType = issue.code; // 'required' | 'invalid_string' | 'too_small' | ...
  return `${systemPrefix}.validation.${path}.${issueType}`;
}

/** 将 Zod issues 数组转为含 i18nKey 的标准化结构 */
export interface I18nZodIssue {
  path: string;         // dot-joined path, e.g. "title"
  message: string;      // Zod 原始 message
  code: string;         // Zod issue code
  i18nKey: string;      // e.g. "cimrms.validation.title.required"
  received?: unknown;   // for invalid_type
  minimum?: number;     // for too_small
  maximum?: number;     // for too_big
}

export function zodIssuesToI18n(
  issues: z.ZodIssue[],
  systemPrefix: string,
): I18nZodIssue[] {
  return issues.map((issue) => {
    const base = {
      path: issue.path.join('.') || 'root',
      message: issue.message,
      code: issue.code,
      i18nKey: zodIssueToI18nKey(issue, systemPrefix),
    };
    if (issue.code === 'too_small') {
      return { ...base, minimum: Number((issue as { minimum: number | bigint }).minimum) } as I18nZodIssue;
    }
    if (issue.code === 'too_big') {
      return { ...base, maximum: Number((issue as { maximum: number | bigint }).maximum) } as I18nZodIssue;
    }
    return base as I18nZodIssue;
  });
}

/** Error code → 标准 i18n key 映射（S4-2） */
const ERROR_CODE_I18N_KEY_MAP: Record<string, string> = {
  NOT_FOUND: 'error.not_found',
  FORBIDDEN: 'error.forbidden',
  UNAUTHORIZED: 'error.unauthorized',
  VALIDATION_ERROR: 'error.validation',
  INVALID_STATE_TRANSITION: 'error.invalid_state_transition',
  CONFLICT: 'error.conflict',
  INTERNAL_ERROR: 'error.internal',
  HTTP_ERROR: 'error.http_error',
};

/** 将业务错误 code 转为 i18n key；未知 code 走 fallback `error.<code_lower>` */
export function errorCodeToI18nKey(code: string): string {
  return ERROR_CODE_I18N_KEY_MAP[code] ?? `error.${code.toLowerCase()}`;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly details?: Record<string, unknown>;
  public readonly i18nKey: string;

  constructor(
    code: string,
    message: string,
    httpStatus: number = 400,
    details?: Record<string, unknown>,
    i18nKey?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    this.i18nKey = i18nKey ?? errorCodeToI18nKey(code);
    // 保持 prototype chain（TypeScript ES2022 target 需要）
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        i18nKey: this.i18nKey,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'NOT_FOUND',
      id ? `${resource} ${id} 不存在` : `${resource} 不存在`,
      404,
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(reason: string = '权限不足') {
    super('FORBIDDEN', reason, 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(reason: string = '未登录或登录已过期') {
    super('UNAUTHORIZED', reason, 401);
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(
      'INVALID_STATE_TRANSITION',
      `不允许从 ${from} 转换到 ${to}`,
      409,
      { from, to },
    );
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, unknown>, message: string = '参数校验失败') {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', message, 409, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: Record<string, unknown>) {
    super(
      `${service.toUpperCase()}_UNAVAILABLE`,
      `${service} 不可用: ${message}`,
      503,
      details,
    );
  }
}

export class BusinessRuleError extends AppError {
  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(code, message, 422, details);
  }
}
