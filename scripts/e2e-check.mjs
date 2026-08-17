import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const errors = [];
const shotDir = "/root/grounded-skills-lab/screenshots";

async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "grounded123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/home/, { timeout: 15000 });
}

async function main() {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on("pageerror", (e) => errors.push(`[pageerror] ${page.url()} :: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console] ${page.url()} :: ${msg.text()}`);
  });
  page.on("response", (res) => {
    if (res.status() >= 500) errors.push(`[http ${res.status()}] ${res.url()}`);
  });

  console.log("== Login as Priya (practitioner) ==");
  await login(page, "priya@groundedskillslab.demo");
  await page.screenshot({ path: `${shotDir}/01-home-practitioner.png`, fullPage: true });

  console.log("== People list ==");
  await page.goto(`${BASE}/people`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${shotDir}/02-people.png`, fullPage: true });

  console.log("== Open Riley Chen (BJJ) profile ==");
  await page.click('text=Riley Chen');
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${shotDir}/03-participant-profile.png`, fullPage: true });

  console.log("== Open Knee-Elbow Recovery program ==");
  await page.click('text=Knee-Elbow Recovery');
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${shotDir}/04-program-overview.png`, fullPage: true });

  for (const tabLabel of ["Task Analysis", "Measurement & Mastery", "Generalization", "Maintenance", "Coaching Fidelity", "Caregiver / Coach View", "Decision Log"]) {
    const tab = page.locator(`button:has-text("${tabLabel}")`).first();
    if (await tab.count()) {
      await tab.click();
      await page.waitForTimeout(200);
    }
  }
  await page.screenshot({ path: `${shotDir}/05-program-tabs-last.png`, fullPage: true });

  console.log("== Program analytics ==");
  await page.click('text=Analytics');
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${shotDir}/06-program-analytics.png`, fullPage: true });

  console.log("== Org-wide analytics review ==");
  await page.goto(`${BASE}/analytics`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${shotDir}/07-analytics-review.png`, fullPage: true });

  console.log("== Build a new program (Program Builder wizard) ==");
  await page.goto(`${BASE}/people`);
  await page.click('text=M.T.');
  await page.waitForLoadState("networkidle");
  const url = page.url();
  const participantId = url.split("/people/")[1];
  await page.goto(`${BASE}/people/${participantId}/programs/new`);
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="newDomainName"]', "");
  await page.selectOption('select[name="domainId"]', { index: 1 }).catch(() => {});
  await page.fill('input[name="newGoalTitle"]', "Independent Shoe Tying");
  await page.fill('input[name="broadGoal"]', "Independently tie shoes before school");
  await page.fill('input[name="name"]', "Shoe Tying Routine");
  await page.fill('textarea[name="operationalDefinition"]', "M.T. ties both shoes using the bunny-ear method within 2 minutes without physical assistance.");
  await page.fill('textarea[name="rationale"]', "Supports independent morning routine.");
  const steps = ["Cross laces", "Make first loop", "Wrap second lace", "Pull through", "Tighten"];
  for (let i = 0; i < steps.length; i++) {
    await page.fill(`input[name="stepText"] >> nth=${i}`, steps[i]);
  }
  await page.check('input[name="teachingProcedures"][value="Chaining"]');
  await page.check('input[name="teachingProcedures"][value="Prompting"]');
  await page.fill('textarea[name="caregiverSummary"]', "Let them try independently first, help only as needed.");
  await page.screenshot({ path: `${shotDir}/08-program-builder-wizard.png`, fullPage: true });
  await page.click('button:has-text("Create")');
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${shotDir}/09-new-program-created.png`, fullPage: true });
  const newProgramUrl = page.url();
  console.log("New program URL:", newProgramUrl);

  console.log("== Start a session and record trials ==");
  await page.goto(`${BASE}/sessions/new?participantId=${participantId}`);
  await page.waitForLoadState("networkidle");
  await page.selectOption('select[name="programId"]', { label: "Tooth Brushing Routine" }).catch(async () => {
    await page.selectOption('select[name="programId"]', { index: 1 });
  });
  await page.fill('input[name="contextTags"]', "Home, Clinic-Run");
  await page.click('button:has-text("Start")');
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${shotDir}/10-session-mode.png`, fullPage: true });

  // Click a few trial buttons if visible
  const indepBtn = page.locator('button:has-text("Independent")').first();
  if (await indepBtn.count()) {
    for (let i = 0; i < 3; i++) {
      await indepBtn.click().catch(() => {});
      await page.waitForTimeout(150);
    }
  }
  await page.screenshot({ path: `${shotDir}/11-session-mode-recorded.png`, fullPage: true });

  console.log("== Sign out, login as caregiver, check Practice Mode ==");
  await page.click('button:has-text("Sign out")');
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await login(page, "sam@groundedskillslab.demo");
  await page.screenshot({ path: `${shotDir}/12-home-caregiver.png`, fullPage: true });
  await page.goto(`${BASE}/practice`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${shotDir}/13-practice-mode-list.png`, fullPage: true });
  const logBtn = page.locator('a:has-text("Log")').first();
  if (await logBtn.count()) {
    await logBtn.click();
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${shotDir}/14-practice-log-screen.png`, fullPage: true });
  }

  console.log("== Login as athlete (Riley) ==");
  await page.goto(`${BASE}/login`);
  await login(page, "riley@groundedskillslab.demo");
  await page.screenshot({ path: `${shotDir}/15-home-athlete.png`, fullPage: true });

  console.log("== Login as org admin, check Organization page ==");
  await page.goto(`${BASE}/login`);
  await login(page, "dana@groundedskillslab.demo");
  await page.goto(`${BASE}/organization`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${shotDir}/16-organization.png`, fullPage: true });

  await page.goto(`${BASE}/library`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${shotDir}/17-library.png`, fullPage: true });

  await browser.close();

  console.log("\n=== ERRORS COLLECTED ===");
  if (errors.length === 0) {
    console.log("None 🎉");
  } else {
    for (const e of errors) console.log(e);
  }
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
