import {PrismaClient} from '@prisma/client';

const p = new PrismaClient({
  datasources: { db: { url: 'postgresql://mrdi:mrdi_dev@localhost:5432/mrdi?schema=cimims' } }
});

const slaConfigs = [
  // System incidents
  { type: 'system', urgency: 'P1', responseMinutes: 15, closeMinutes: 60 },
  { type: 'system', urgency: 'P2', responseMinutes: 60, closeMinutes: 480 },
  { type: 'system', urgency: 'P3', responseMinutes: 240, closeMinutes: 1440 },
  // Network incidents
  { type: 'network', urgency: 'P1', responseMinutes: 15, closeMinutes: 60 },
  { type: 'network', urgency: 'P2', responseMinutes: 60, closeMinutes: 480 },
  { type: 'network', urgency: 'P3', responseMinutes: 240, closeMinutes: 1440 },
  // Account incidents
  { type: 'account', urgency: 'P1', responseMinutes: 30, closeMinutes: 120 },
  { type: 'account', urgency: 'P2', responseMinutes: 120, closeMinutes: 480 },
  { type: 'account', urgency: 'P3', responseMinutes: 480, closeMinutes: 2880 },
  // Equipment incidents
  { type: 'equipment', urgency: 'P1', responseMinutes: 30, closeMinutes: 180 },
  { type: 'equipment', urgency: 'P2', responseMinutes: 120, closeMinutes: 720 },
  { type: 'equipment', urgency: 'P3', responseMinutes: 480, closeMinutes: 4320 },
  // Other
  { type: 'other', urgency: 'P1', responseMinutes: 60, closeMinutes: 240 },
  { type: 'other', urgency: 'P2', responseMinutes: 240, closeMinutes: 960 },
  { type: 'other', urgency: 'P3', responseMinutes: 960, closeMinutes: 4320 },
];

try {
  for (const cfg of slaConfigs) {
    await p.slaConfig.upsert({
      where: { type_urgency: { type: cfg.type, urgency: cfg.urgency } },
      create: {
        type: cfg.type,
        urgency: cfg.urgency,
        responseMinutes: cfg.responseMinutes,
        closeMinutes: cfg.closeMinutes,
      },
      update: {
        responseMinutes: cfg.responseMinutes,
        closeMinutes: cfg.closeMinutes,
      }
    });
    console.log(`Upserted ${cfg.type}/${cfg.urgency}`);
  }
  console.log('Done!');
} finally {
  await p.$disconnect();
}
