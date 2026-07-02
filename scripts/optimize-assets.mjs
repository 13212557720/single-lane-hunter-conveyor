import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const rootDir = dirname(fileURLToPath(import.meta.url)).replace(/\/scripts$/, "");
const sourceDir = join(rootDir, "单路猎人_P0_可用图片素材");
const sourceManifestPath = join(sourceDir, "manifest.json");
const outputDir = join(rootDir, "public", "assets", "p0-runtime");
const tempDir = join(outputDir, ".tmp");

const sizeByGroup = {
  bg: 512,
  character: 192,
  enemy: 160,
  chest: 160,
  boss: 512,
  pickup: 96,
  item: 128,
  material: 96,
  skill: 128,
  vfx: 256,
  ui: 256,
};

const overrides = {
  BG_001: { width: 1280, height: 720, mode: "cover", quality: 76 },
  BG_002: { width: 1280, height: 720, mode: "cover", quality: 78 },
  BG_003: { max: 256, quality: 78 },
  BG_004: { max: 384, quality: 78 },
  BOSS_001: { max: 512, quality: 82 },
  BOSS_002: { max: 512, quality: 82 },
  BOSS_008: { max: 512, quality: 82 },
  BOSS_009: { max: 256, quality: 82 },
  UI_005: { width: 768, height: 128, mode: "contain", quality: 82 },
  UI_006: { width: 768, height: 64, mode: "contain", quality: 82 },
  UI_007: { width: 256, height: 342, mode: "contain", quality: 84 },
  UI_008: { width: 256, height: 342, mode: "contain", quality: 84 },
  VFX_003: { width: 512, height: 128, mode: "contain", quality: 78 },
};

const p0Manifest = JSON.parse(await readFile(sourceManifestPath, "utf8"));
const p0Assets = p0Manifest.assets.filter((asset) => !asset.asset_id.startsWith("EXTRA_"));

await rm(outputDir, { recursive: true, force: true });
await mkdir(tempDir, { recursive: true });

const outputAssets = [];

for (const asset of p0Assets) {
  const source = join(sourceDir, asset.path);
  const key = `p0_${asset.asset_id.toLowerCase()}`;
  const filename = `${asset.asset_id.toLowerCase()}.webp`;
  const outputPath = join(outputDir, filename);
  const tempPath = join(tempDir, `${asset.asset_id.toLowerCase()}.png`);
  const target = targetFor(asset);

  await convertToPng(source, tempPath, target);
  await execFile("cwebp", ["-quiet", "-q", String(target.quality), tempPath, "-o", outputPath]);
  const outputStat = await stat(outputPath);

  outputAssets.push({
    asset_id: asset.asset_id,
    key,
    url: `/assets/p0-runtime/${filename}`,
    source_path: asset.path,
    category: asset.category,
    usage: asset.usage,
    width: target.width,
    height: target.height,
    quality: target.quality,
    bytes: outputStat.size,
  });
}

await rm(tempDir, { recursive: true, force: true });

const runtimeManifest = {
  generated_at: new Date().toISOString(),
  format: "webp",
  source_manifest: "单路猎人_P0_可用图片素材/manifest.json",
  total_assets: outputAssets.length,
  assets: outputAssets,
};

await writeFile(join(outputDir, "manifest.json"), `${JSON.stringify(runtimeManifest, null, 2)}\n`);

const totalBytes = outputAssets.reduce((sum, asset) => sum + asset.bytes, 0);
console.log(
  JSON.stringify(
    {
      outputDir,
      totalAssets: outputAssets.length,
      totalBytes,
      totalMB: Number((totalBytes / 1024 / 1024).toFixed(2)),
    },
    null,
    2,
  ),
);

function targetFor(asset) {
  const override = overrides[asset.asset_id];
  if (override?.width && override?.height) {
    return {
      width: override.width,
      height: override.height,
      mode: override.mode ?? "contain",
      quality: override.quality ?? 80,
    };
  }

  const group = inferGroup(asset);
  const max = override?.max ?? sizeByGroup[group] ?? 160;
  const [sourceWidth, sourceHeight] = asset.target_size;
  const ratio = Math.min(max / sourceWidth, max / sourceHeight, 1);
  return {
    width: Math.max(1, Math.round(sourceWidth * ratio)),
    height: Math.max(1, Math.round(sourceHeight * ratio)),
    mode: "contain",
    quality: override?.quality ?? (group === "ui" || group === "skill" ? 84 : 80),
  };
}

function inferGroup(asset) {
  if (asset.path.startsWith("01_backgrounds")) return "bg";
  if (asset.path.startsWith("02_characters")) return "character";
  if (asset.path.startsWith("03_enemies")) return "enemy";
  if (asset.path.includes("chest") || asset.path.includes("mimic")) return "chest";
  if (asset.path.includes("pickup")) return "pickup";
  if (asset.path.startsWith("05_bosses")) return "boss";
  if (asset.path.includes("completed_items")) return "item";
  if (asset.path.includes("materials")) return "material";
  if (asset.path.startsWith("07_skills")) return "skill";
  if (asset.path.startsWith("08_vfx")) return "vfx";
  if (asset.path.startsWith("09_ui")) return "ui";
  return "enemy";
}

async function convertToPng(source, tempPath, target) {
  await mkdir(dirname(tempPath), { recursive: true });
  if (target.mode === "cover") {
    await execFile("magick", [
      source,
      "-resize",
      `${target.width}x${target.height}^`,
      "-gravity",
      "center",
      "-extent",
      `${target.width}x${target.height}`,
      tempPath,
    ]);
    return;
  }

  await execFile("magick", [source, "-resize", `${target.width}x${target.height}`, tempPath]);
}
