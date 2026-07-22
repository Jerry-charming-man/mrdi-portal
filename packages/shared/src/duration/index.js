/**
 * duration utils — 跨服务统一的时长解析、计算、格式化
 * 格式: '30d' | '48h' | '1d' | '1h' (后续可扩展 '15m')
 */
const DURATION_REGEX = /^(\d+)([hd])$/;
export function parseDuration(input) {
    const match = DURATION_REGEX.exec(input.trim());
    if (!match) {
        throw new Error(`Invalid duration format: "${input}", expected e.g. "30d" / "48h"`);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (value <= 0) {
        throw new Error(`Duration must be positive: "${input}"`);
    }
    const totalMs = unit === 'd' ? value * 24 * 3600 * 1000 : value * 3600 * 1000;
    return { value, unit, totalMs };
}
export function addDuration(base, duration) {
    const { totalMs } = parseDuration(duration);
    return new Date(base.getTime() + totalMs);
}
export function diffDuration(a, b) {
    const ms = Math.abs(a.getTime() - b.getTime());
    const hours = Math.floor(ms / 3600000);
    if (hours < 24)
        return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours === 0 ? `${days}d` : `${days}d ${remHours}h`;
}
export function formatCountdown(expiresAt) {
    const msLeft = new Date(expiresAt).getTime() - Date.now();
    const hoursLeft = msLeft / 3600000;
    if (hoursLeft <= 0) {
        return { text: '已过期', hoursLeft: 0, severity: 'expired' };
    }
    if (hoursLeft < 8) {
        return { text: `${Math.floor(hoursLeft)}h`, hoursLeft, severity: 'critical' };
    }
    if (hoursLeft < 24) {
        return { text: `${Math.floor(hoursLeft)}h`, hoursLeft, severity: 'warning' };
    }
    const days = Math.floor(hoursLeft / 24);
    const remHours = Math.floor(hoursLeft % 24);
    return {
        text: days > 0 ? `${days}d ${remHours}h` : `${remHours}h`,
        hoursLeft,
        severity: 'normal',
    };
}
/** CIM-PERM 5 类权限的有效期范围（与前端 duration.ts 保持一致） */
export const PERM_DURATION_LIMITS = {
    system_access: { min: '30d', max: '730d', default: '365d' },
    functional: { min: '1d', max: '90d', default: '30d' },
    data_export: { min: '1d', max: '30d', default: '7d' },
    temporary: { min: '1h', max: '48h', default: '48h' },
    batch: { min: '1d', max: '365d', default: '30d' },
};
export function getDurationLimits(type) {
    const limits = PERM_DURATION_LIMITS[type];
    if (!limits) {
        throw new Error(`Unknown permission type: ${type}`);
    }
    return limits;
}
export function isWithinLimits(duration, type) {
    const { value, totalMs } = parseDuration(duration);
    const { min, max } = getDurationLimits(type);
    const minMs = parseDuration(min).totalMs;
    const maxMs = parseDuration(max).totalMs;
    return value > 0 && totalMs >= minMs && totalMs <= maxMs;
}
//# sourceMappingURL=index.js.map