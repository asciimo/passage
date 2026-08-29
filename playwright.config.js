import { defineConfig, devices } from '@playwright/test';

const PORT = 3100; // distinct from the default dev port so a running `npm run dev` is left alone
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
    testDir: 'test/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],
    webServer: {
        command: `node scripts/serve.js`,
        env: { PORT: String(PORT) },
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe'
    }
});
