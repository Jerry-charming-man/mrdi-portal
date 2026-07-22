/**
 * SPC routes
 * GET /v1/spc/trend?area=Etch&equipment=E04&param=CD  → 最近 30 个数据点 + 控制限
 */
import { z } from 'zod';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

const TrendQuerySchema = z.object({
  area:      z.enum(['Photo', 'Etch', 'Diffusion', 'CMP', 'WireBond']).default('Etch'),
  equipment: z.string().default('E04'),
  param:     z.enum(['CD', 'Thickness', 'Resistance', 'Voltage', 'Current']).default('CD'),
  points:    z.coerce.number().int().min(10).max(200).default(30),
});

export const spcRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {

  const auth = (async (req: Parameters<typeof app.auth>[0]) => {
    app.auth(req);
  }) as Parameters<typeof app.get>[1]['onRequest'];

  app.get<{ Querystring: z.infer<typeof TrendQuerySchema> }>(
    '/trend',
    { onRequest: auth },
    async (req) => {
      const { area, equipment, param, points } = TrendQuerySchema.parse(req.query);

      // Control limits per area+param (real limits would come from MES/PMS)
      const limits: Record<string, { ucl: number; cl: number; lcl: number }> = {
        'Photo-CD':        { ucl: 108, cl: 100, lcl: 92 },
        'Photo-Thickness': { ucl: 1050, cl: 1000, lcl: 950 },
        'Etch-CD':         { ucl: 110, cl: 100, lcl: 88 },
        'Etch-Thickness':  { ucl: 4200, cl: 4000, lcl: 3800 },
        'Diffusion-Temp':  { ucl: 1055, cl: 1000, lcl: 945 },
        'CMP-Thickness':   { ucl: 1550, cl: 1500, lcl: 1450 },
        'WireBond-Pull':   { ucl: 9.5, cl: 8.0, lcl: 6.5 },
      };

      const key = `${area}-${param}`;
      const { ucl, cl, lcl } = limits[key] ?? { ucl: 108, cl: 100, lcl: 92 };

      // Generate semi-realistic data with controlled drift and occasional violations
      const data: Array<{
        time: string;
        value: number;
        ucl: number;
        cl: number;
        lcl: number;
        ruleViolations: string[];
      }> = [];

      let base = cl + (Math.random() - 0.5) * 4; // start near CL
      const now = new Date();

      // Violation patterns: inject at specific indices for demo
      const violations: Record<number, 'rule1' | 'rule2' | 'rule3'> = {
        // index: type
      };
      // Inject Rule-1 (single point outside limits) at index 22
      violations[22] = 'rule1';
      // Inject Rule-3 (6 consecutive increasing) at indices 15-20
      for (let i = 15; i <= 20; i++) violations[i] = 'rule3';

      for (let i = 0; i < points; i++) {
        const t = new Date(now.getTime() - (points - i - 1) * 5 * 60 * 1000); // 5-min intervals
        const timeStr = `${String(t.getMonth() + 1).padStart(2, '0')}/${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;

        let value: number;
        const violationType = violations[i];

        if (violationType === 'rule1') {
          // Single point: clearly above UCL
          value = ucl + 3 + Math.random() * 2;
        } else if (violationType === 'rule2') {
          // 9 consecutive below CL (Rule 2)
          value = cl - 4 - Math.random() * 2;
        } else if (violationType === 'rule3') {
          // 6 consecutive increasing
          const drift = (i - 14) * 1.2;
          value = base + drift + (Math.random() - 0.5) * 2;
        } else {
          // Normal noise
          value = base + (Math.random() - 0.48) * (ucl - cl) * 0.3;
        }

        value = Math.round(value * 100) / 100;

        // Detect rule violations
        const ruleViolations: string[] = [];
        if (value > ucl || value < lcl) ruleViolations.push('Rule-1');
        // (Full rule engine is client-side; backend just flags Rule-1 here)

        data.push({ time: timeStr, value, ucl, cl, lcl, ruleViolations });

        // Random walk
        base = value * 0.7 + cl * 0.3 + (Math.random() - 0.5) * 2;
      }

      return {
        ok: true,
        area,
        equipment,
        param,
        limits: { ucl, cl, lcl },
        total: data.length,
        data,
      };
    },
  );
};
