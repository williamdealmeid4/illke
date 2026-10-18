import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',timeout:60000,expect:{timeout:10000},workers:1,
  retries:process.env.CI?1:0,reporter:'list',
  use:{baseURL:'http://127.0.0.1:5186',headless:true,channel:process.platform==='win32'&&!process.env.CI?'msedge':undefined,trace:'retain-on-failure'},
  webServer:{command:'npm run dev',url:'http://127.0.0.1:5186',reuseExistingServer:!process.env.CI,timeout:120000},
});
