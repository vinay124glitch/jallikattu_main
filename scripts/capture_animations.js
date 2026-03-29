import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const url = 'http://localhost:8080/';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => {
    const text = `[console.${msg.type()}] ${msg.text()}`;
    logs.push(text);
    // Also print to stdout so the runner sees live output
    console.log(text);
  });

  page.on('pageerror', err => {
    const text = `[pageerror] ${err.message}`;
    logs.push(text);
    console.error(text);
  });

  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Interact: start game by clicking start button if present
  try {
    const start = await page.$('text=Start Game');
    if (start) {
      await start.click();
      console.log('Clicked Start Game');
    }
  } catch (e) {
    console.warn('Start click failed', e.message);
  }

  // Give the scene some time to load models
  await page.waitForTimeout(1500);

  // Press keys to trigger actions and locomotion
  console.log('Pressing E (rig action)');
  await page.keyboard.press('e');
  await page.waitForTimeout(700);

  console.log('Pressing K (back kick)');
  await page.keyboard.press('k');
  await page.waitForTimeout(700);

  // Walk (Alt + w)
  console.log('Walking: hold Alt + press w');
  await page.keyboard.down('Alt');
  await page.keyboard.down('w');
  await page.waitForTimeout(800);
  await page.keyboard.up('w');
  await page.keyboard.up('Alt');
  await page.waitForTimeout(400);

  // Charge (Shift + w)
  console.log('Charging: hold Shift + press w');
  await page.keyboard.down('Shift');
  await page.keyboard.down('w');
  await page.waitForTimeout(800);
  await page.keyboard.up('w');
  await page.keyboard.up('Shift');
  await page.waitForTimeout(400);

  // Collect logs and save to file
  const out = logs.join('\n');
  fs.writeFileSync('capture_console_logs.txt', out, 'utf8');
  console.log('Saved logs to capture_console_logs.txt');

  await browser.close();
  process.exit(0);
})();
