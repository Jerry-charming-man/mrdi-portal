/**
 * 业务异常类 — 4 个 API 服务统一使用
 * Fastify error handler 会捕获 AppError 并返回对应 HTTP status
 */
export declare class AppError extends Error {
    readonly code: string;
    readonly httpStatus: number;
    readonly details?: Record<string, unknown>;
    constructor(code: string, message: string, httpStatus?: number, details?: Record<string, unknown>);
    toJSON(): {
        error: {
            details?: Record<string, unknown> | undefined;
            code: string;
            message: string;
        };
    };
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, id?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(reason?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(reason?: string);
}
export declare class InvalidStateTransitionError extends AppError {
    constructor(from: string, to: string);
}
export declare class ValidationError extends AppError {
    constructor(details: Record<string, unknown>, message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, details?: Record<string, unknown>);
}
export declare class ExternalServiceError extends AppError {
    constructor(service: string, message: string, details?: Record<string, unknown>);
}
export declare class BusinessRuleError extends AppError {
    constructor(code: string, message: string, details?: Record<string, unknown>);
}
//# sourceMappingURL=index.d.ts.map