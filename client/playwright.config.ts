import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 * 用於 E2E 測試
 */
export default defineConfig({
    testDir: './e2e',

    // 測試超時時間（增加到 60 秒）
    timeout: 60 * 1000,

    // 測試結果輸出目錄
    outputDir: './e2e/test-results',

    // 每個測試的重試次數
    retries: process.env.CI ? 2 : 0,

    // 並行執行的 worker 數量
    workers: process.env.CI ? 1 : undefined,

    // 測試報告
    reporter: [
        ['html', { outputFolder: './e2e/playwright-report' }],
        ['list']
    ],

    use: {
        // 基礎 URL
        baseURL: 'http://localhost:5173',

        // 設置瀏覽器語系為中文
        locale: 'zh-TW',

        // 截圖設置
        screenshot: 'only-on-failure',

        // 錄影設置
        video: 'retain-on-failure',

        // 追蹤設置
        trace: 'on-first-retry',
    },

    // 配置測試項目
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // 自動啟動開發服務器（可選）
    // webServer: {
    //   command: 'npm run dev',
    //   url: 'http://localhost:5173',
    //   reuseExistingServer: !process.env.CI,
    //   timeout: 120 * 1000,
    // },
});
