import { defineConfig } from '@playwright/test';

const port = 4384;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  use: { baseURL },
  webServer: {
    command: `pnpm preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
