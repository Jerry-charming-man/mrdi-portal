/**
 * 业务编号生成器 — 3 个业务系统各自一套
 *   - CIM-RMS: NC-YYYY-NNNN
 *   - CIM-IMS: INC-YYYY-NNNN
 *   - CIM-PERM: PRM-YYYY-NNNN
 *
 * 实际生产用 DB sequence；这里提供格式化函数。
 * 序列号生成在每个 service 的 prisma schema 中定义，service 启动时 init。
 */
export function formatRequestNo(prefix, year, seq) {
    return `${prefix}-${year}-${seq.toString().padStart(4, '0')}`;
}
export function parseRequestNo(no) {
    const match = /^(NC|INC|PRM)-(\d{4})-(\d{4,})$/.exec(no);
    if (!match)
        return null;
    return {
        prefix: match[1],
        year: parseInt(match[2], 10),
        seq: parseInt(match[3], 10),
    };
}
export function currentYear() {
    return new Date().getUTCFullYear();
}
//# sourceMappingURL=index.js.map