/**
 * duration utils — 跨服务统一的时长解析、计算、格式化
 * 格式: '30d' | '48h' | '1d' | '1h' (后续可扩展 '15m')
 */
export type DurationUnit = 'h' | 'd';
export interface ParsedDuration {
    value: number;
    unit: DurationUnit;
    totalMs: number;
}
export declare function parseDuration(input: string): ParsedDuration;
export declare function addDuration(base: Date, duration: string): Date;
export declare function diffDuration(a: Date, b: Date): string;
export declare function formatCountdown(expiresAt: string | Date): {
    text: string;
    hoursLeft: number;
    severity: 'critical' | 'warning' | 'normal' | 'expired';
};
export interface DurationLimits {
    min: string;
    max: string;
    default: string;
}
/** CIM-PERM 5 类权限的有效期范围（与前端 duration.ts 保持一致） */
export declare const PERM_DURATION_LIMITS: Record<string, DurationLimits>;
export declare function getDurationLimits(type: string): DurationLimits;
export declare function isWithinLimits(duration: string, type: string): boolean;
//# sourceMappingURL=index.d.ts.map