/**
 * 业务编号生成器 — 3 个业务系统各自一套
 *   - CIM-RMS: NC-YYYY-NNNN
 *   - CIM-IMS: INC-YYYY-NNNN
 *   - CIM-PERM: PRM-YYYY-NNNN
 *
 * 实际生产用 DB sequence；这里提供格式化函数。
 * 序列号生成在每个 service 的 prisma schema 中定义，service 启动时 init。
 */
export type RequestNoPrefix = 'NC' | 'INC' | 'PRM';
export declare function formatRequestNo(prefix: RequestNoPrefix, year: number, seq: number): string;
export declare function parseRequestNo(no: string): {
    prefix: RequestNoPrefix;
    year: number;
    seq: number;
} | null;
export declare function currentYear(): number;
//# sourceMappingURL=index.d.ts.map