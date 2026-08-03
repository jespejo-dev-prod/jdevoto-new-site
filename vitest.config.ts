import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: [
        'src/modules/**',
        'src/lib/**',
        'src/validations/**',
      ],
      exclude: [
        'src/generated/**',
        'src/**/*.d.ts',
        'src/lib/client.ts',
        'src/lib/file-logger.ts',
      ],
    },
  },
});
