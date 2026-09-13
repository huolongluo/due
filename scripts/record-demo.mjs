import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const base = process.env.APP_URL || "http://127.0.0.1:3077";
const outDir = path.join(process.cwd(), "docs");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();

async function linger(ms) {
  await page.waitForTimeout(ms);
}

await page.goto(`${base}/open`, { waitUntil: "networkidle" });
await linger(3500);
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await linger(2500);
await page.goto(`${base}/how`, { waitUntil: "networkidle" });
await linger(3000);
await page.goto(`${base}/desk?play=1`, { waitUntil: "networkidle" });
await linger(9000);

await context.close();
await browser.close();
console.log("recorded", outDir);
