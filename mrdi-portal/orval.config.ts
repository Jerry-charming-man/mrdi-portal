/**
 * orval config — S4-6 OpenAPI types
 *
 * Strategy:
 *   - 各 API 使用手动编写的静态 openapi.yaml（@fastify/swagger v8 不生成 JSON）
 *   - orval 读取本地 YAML → 解析 $ref → 生成 TypeScript types + React Query hooks
 *   - Generated files → src/api/generated/{api}/{api}.ts + *.schemas.ts
 *   - 每个 API 独立子目录（避免 clean: true 互相覆盖）
 *
 * 生成命令（从 mrdi-portal 目录）：
 *   pnpm exec orval --config orval.config.ts
 */
import { defineConfig } from 'orval';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  mdm: {
    input: {
      target: path.resolve(__dirname, '../mdm-api/openapi.yaml'),
    },
    output: {
      target: 'src/api/generated/mdm/mdm.ts',
      schemas: 'src/api/generated/mdm/mdm.schemas.ts',
      client: 'react-query',
      mode: 'single',
      clean: true,
      override: {
        mutator: {
          path: 'src/api/mdm-instance.ts',
          name: 'mdmApiClient',
        },
        // orval v8: function signature is (operation, route, verb) => string
        operationName: (operation: { operationId?: string }) =>
          (operation.operationId ?? 'unnamed') as string,
      },
    },
  },
  cimrms: {
    input: {
      target: path.resolve(__dirname, '../cimrms-api/openapi.yaml'),
    },
    output: {
      target: 'src/api/generated/cimrms/cimrms.ts',
      schemas: 'src/api/generated/cimrms/cimrms.schemas.ts',
      client: 'react-query',
      mode: 'single',
      clean: true,
      override: {
        mutator: {
          path: 'src/api/cimrms-instance.ts',
          name: 'cimrmsApiClient',
        },
      },
    },
  },
  cimims: {
    input: {
      target: path.resolve(__dirname, '../cimims-api/openapi.yaml'),
    },
    output: {
      target: 'src/api/generated/cimims/cimims.ts',
      schemas: 'src/api/generated/cimims/cimims.schemas.ts',
      client: 'react-query',
      mode: 'single',
      clean: true,
      override: {
        mutator: {
          path: 'src/api/cimims-instance.ts',
          name: 'cimimsApiClient',
        },
      },
    },
  },
  cimperm: {
    input: {
      target: path.resolve(__dirname, '../cim-perm/openapi.yaml'),
    },
    output: {
      target: 'src/api/generated/cimperm/cimperm.ts',
      schemas: 'src/api/generated/cimperm/cimperm.schemas.ts',
      client: 'react-query',
      mode: 'single',
      clean: true,
      override: {
        mutator: {
          path: 'src/api/cimperm-instance.ts',
          name: 'cimpermApiClient',
        },
      },
    },
  },
});
