import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const errors = [];
const shotDir = "/tmp/gsl-guide-screens";

async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "grounded123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/home/, { timeout: 15000 });
}

async function main() {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on("pageerror", (e) => errors.push(`[pageerror] ${page.url()} :: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console] ${page.url()} :: ${msg.text()}`);
  });
  page.on("response", (res) => {
    if (res.status() >= 500) errors.push(`[http ${res.status()}] ${res.url()}`);
  });

  console.log("== Login as Devon (self-directed learner) ==");
  await login(page, "devon@groundedskillslab.demo");

  console.log("== Home (tour should auto-show) ==");
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${shotDir}/01-home-tour-open.png`, fullPage: false });

  const skip = page.locator('button:has-text("Skip tour")');
  if (await skip.count()) await skip.click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${shotDir}/02-home-after-skip.png`, fullPage: true });

  console.log("== Reopen tour manually and click through ==");
  const takeTour = page.locator('button:has-text("Take the tour")');
  if (await takeTour.count()) {
    await takeTour.click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${shotDir}/03-tour-step1.png`, fullPage: false });
    for (let i = 0; i < 3; i++) {
      const next = page.locator('button:has-text("Next")');
      if (await next.count()) {
        await next.click();
        await page.waitForTimeout(150);
      }
    }
    await page.screenshot({ path: `${shotDir}/04-tour-step-mid.png`, fullPage: false });
    const closeBtn = page.locator('button:has-text("Skip tour")');
    if (await closeBtn.count()) await closeBtn.click();
  }

  console.log("== Guide page ==");
  await page.goto(`${BASE}/guide`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${shotDir}/05-guide-page.png`, fullPage: true });

  console.log("== Nav shows Guide link, click Build a Program from guide ==");
  const buildBtn = page.locator('a:has-text("Build")').first();
  if (await buildBtn.count()) {
    await buildBtn.click();
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${shotDir}/06-guide-link-target.png`, fullPage: true });
  }

  await browser.close();

  console.log("\n=== Errors ===");
  if (errors.length === 0) console.log("None.");
  else errors.forEach((e) => console.log(e));
}

main();
