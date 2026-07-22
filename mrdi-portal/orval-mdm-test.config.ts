import { defineConfig } from 'orval';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  mdmt: {
    input: {
      target: path.resolve(__dirname, '../test-mdm-mini.yaml'),
    },
    output: {
      target: 'src/api/generated/mdm-test.ts',
      schemas: 'src/api/generated/mdm-test.schemas.ts',
      client: 'react-query',
      mode: 'single',
      clean: true,
      override: {
        mutator: {
          path: 'src/api/mdm-instance.ts',
          name: 'mdmApiClient',
        },
      },
    },
  },
});
