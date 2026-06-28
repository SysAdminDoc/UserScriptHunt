const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3217',
    headless: true,
  },
  webServer: {
    command: 'node tests/static-server.js 3217 .',
    port: 3217,
    reuseExistingServer: false,
    timeout: 15000,
  },
});
