/**
 * 业务异常类 — 4 个 API 服务统一使用
 * Fastify error handler 会捕获 AppError 并返回对应 HTTP status
 */
export class AppError extends Error {
    code;
    httpStatus;
    details;
    constructor(code, message, httpStatus = 400, details) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.httpStatus = httpStatus;
        this.details = details;
        // 保持 prototype chain（TypeScript ES2022 target 需要）
        Object.setPrototypeOf(this, new.target.prototype);
    }
    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                ...(this.details ? { details: this.details } : {}),
            },
        };
    }
}
export class NotFoundError extends AppError {
    constructor(resource, id) {
        super('NOT_FOUND', id ? `${resource} ${id} 不存在` : `${resource} 不存在`, 404);
    }
}
export class ForbiddenError extends AppError {
    constructor(reason = '权限不足') {
        super('FORBIDDEN', reason, 403);
    }
}
export class UnauthorizedError extends AppError {
    constructor(reason = '未登录或登录已过期') {
        super('UNAUTHORIZED', reason, 401);
    }
}
export class InvalidStateTransitionError extends AppError {
    constructor(from, to) {
        super('INVALID_STATE_TRANSITION', `不允许从 ${from} 转换到 ${to}`, 409, { from, to });
    }
}
export class ValidationError extends AppError {
    constructor(details, message = '参数校验失败') {
        super('VALIDATION_ERROR', message, 400, details);
    }
}
export class ConflictError extends AppError {
    constructor(message, details) {
        super('CONFLICT', message, 409, details);
    }
}
export class ExternalServiceError extends AppError {
    constructor(service, message, details) {
        super(`${service.toUpperCase()}_UNAVAILABLE`, `${service} 不可用: ${message}`, 503, details);
    }
}
export class BusinessRuleError extends AppError {
    constructor(code, message, details) {
        super(code, message, 422, details);
    }
}
//# sourceMappingURL=index.js.map