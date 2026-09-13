import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = "http://127.0.0.1:3077";
mkdirSync("docs", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.screenshot({ path: "docs/shot-home.png" });

await page.goto(`${base}/desk?play=1`, { waitUntil: "networkidle" });
await page.getByText("Replay refused", { timeout: 15000 }).waitFor();
await page.screenshot({ path: "docs/shot-desk.png" });

await page.goto(`file://${process.cwd()}/docs/deck.html`, { waitUntil: "networkidle" });
await page.pdf({ path: "docs/deck.pdf", landscape: true, printBackground: true, width: "1280px", height: "720px" });

await browser.close();
console.log("shots + deck.pdf");
