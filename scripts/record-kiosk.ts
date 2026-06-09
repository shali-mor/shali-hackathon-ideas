// Records a clean MP4 of /screen for kiosk USB-drive playback.
//   npx tsx scripts/record-kiosk.ts [url] [seconds]
// Defaults: production URL, 90 seconds, 1920x1080. Output: recordings/kiosk-<ts>.mp4

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const URL = process.argv[2] ?? "https://shali-hackathon-ideas.vercel.app/screen";
const SECONDS = Number(process.argv[3] ?? 90);
const VIEWPORT = { width: 1920, height: 1080 };

const outDir = path.resolve("recordings");
const tmpDir = path.join(outDir, ".tmp");
fs.mkdirSync(tmpDir, { recursive: true });

(async () => {
  console.log(`Launching headless Chromium ...`);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: { dir: tmpDir, size: VIEWPORT },
  });
  const page = await ctx.newPage();

  console.log(`Loading ${URL} ...`);
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60_000 });
  // Settle frame: countdown ticks + Three.js canvas warmup
  await page.waitForTimeout(2000);

  console.log(`Recording ${SECONDS}s ...`);
  await page.waitForTimeout(SECONDS * 1000);

  await ctx.close();
  await browser.close();

  const webm = fs.readdirSync(tmpDir).find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error("No .webm produced by Playwright");
  const webmPath = path.join(tmpDir, webm);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const mp4Path = path.join(outDir, `kiosk-${stamp}.mp4`);
  console.log(`Encoding ${mp4Path} ...`);
  const r = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i", webmPath,
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-crf", "22",
      "-preset", "medium",
      "-movflags", "+faststart",
      mp4Path,
    ],
    { stdio: "inherit" },
  );
  if (r.status !== 0) throw new Error(`ffmpeg exited with ${r.status}`);

  fs.rmSync(tmpDir, { recursive: true, force: true });
  const sizeMb = (fs.statSync(mp4Path).size / 1024 / 1024).toFixed(1);
  console.log(`\n✅ ${mp4Path} (${sizeMb} MB)`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
