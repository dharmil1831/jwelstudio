/**
 * Build favicon + PWA + Android launcher icons from the JP emblem.
 * Run: node scripts/generate-icons.mjs
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public", "brand", "jwelpixel-emblem-v4.png");
const mist = { r: 232, g: 224, b: 240, alpha: 1 }; // brand Mist #e8e0f0

async function squareIcon(size, { padRatio = 0.12, background = mist } = {}) {
  const inner = Math.round(size * (1 - padRatio * 2));
  const emblem = await sharp(source)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: emblem, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function writePng(rel, size, opts) {
  const out = path.join(root, rel);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(await squareIcon(size, opts)).toFile(out);
  console.log("wrote", rel);
}

async function writeIco() {
  // Multi-size ICO: 16 + 32 + 48 as PNG-compressed ICO header.
  const sizes = [16, 32, 48];
  const images = [];
  for (const size of sizes) {
    images.push(await squareIcon(size, { padRatio: 0.08 }));
  }

  const headerSize = 6 + 16 * images.length;
  let offset = headerSize;
  const entries = [];
  const payloads = [];

  for (let i = 0; i < images.length; i++) {
    const png = images[i];
    const size = sizes[i];
    entries.push({ size, png, offset });
    offset += png.length;
    payloads.push(png);
  }

  const buf = Buffer.alloc(offset);
  buf.writeUInt16LE(0, 0);
  buf.writeUInt16LE(1, 2);
  buf.writeUInt16LE(images.length, 4);

  let entryAt = 6;
  for (const entry of entries) {
    buf.writeUInt8(entry.size === 256 ? 0 : entry.size, entryAt);
    buf.writeUInt8(entry.size === 256 ? 0 : entry.size, entryAt + 1);
    buf.writeUInt8(0, entryAt + 2);
    buf.writeUInt8(0, entryAt + 3);
    buf.writeUInt16LE(1, entryAt + 4);
    buf.writeUInt16LE(32, entryAt + 6);
    buf.writeUInt32LE(entry.png.length, entryAt + 8);
    buf.writeUInt32LE(entry.offset, entryAt + 12);
    entryAt += 16;
  }

  for (const entry of entries) {
    entry.png.copy(buf, entry.offset);
  }

  const out = path.join(root, "public", "favicon.ico");
  await writeFile(out, buf);
  console.log("wrote public/favicon.ico");
}

async function main() {
  // Next.js App Router metadata icons
  await writePng("app/icon.png", 512, { padRatio: 0.1 });
  await writePng("app/apple-icon.png", 180, { padRatio: 0.1 });

  // Browser + PWA
  await writeIco();
  await writePng("public/icons/icon-192.png", 192, { padRatio: 0.12 });
  await writePng("public/icons/icon-512.png", 512, { padRatio: 0.18 }); // maskable safe zone
  await writePng("public/icons/apple-touch-icon.png", 180, { padRatio: 0.1 });

  // Android adaptive foreground (transparent) + legacy launchers
  const densities = [
    ["mdpi", 48, 108],
    ["hdpi", 72, 162],
    ["xhdpi", 96, 216],
    ["xxhdpi", 144, 324],
    ["xxxhdpi", 192, 432],
  ];

  for (const [density, legacy, adaptive] of densities) {
    const legacyPath = path.join(
      root,
      "android",
      "app",
      "src",
      "main",
      "res",
      `mipmap-${density}`,
      "ic_launcher.png",
    );
    const roundPath = path.join(
      root,
      "android",
      "app",
      "src",
      "main",
      "res",
      `mipmap-${density}`,
      "ic_launcher_round.png",
    );
    const fgPath = path.join(
      root,
      "android",
      "app",
      "src",
      "main",
      "res",
      `mipmap-${density}`,
      "ic_launcher_foreground.png",
    );

    await mkdir(path.dirname(legacyPath), { recursive: true });
    await sharp(await squareIcon(legacy, { padRatio: 0.12, background: mist })).toFile(legacyPath);
    await sharp(await squareIcon(legacy, { padRatio: 0.12, background: mist })).toFile(roundPath);

    const inner = Math.round(adaptive * 0.55);
    const emblem = await sharp(source)
      .resize(inner, inner, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    await sharp({
      create: {
        width: adaptive,
        height: adaptive,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: emblem, gravity: "centre" }])
      .png()
      .toFile(fgPath);

    console.log("wrote android mipmap-" + density);
  }

  // Play Store / marketing master
  await writePng("public/icons/play-store-512.png", 512, { padRatio: 0.12 });

  await writeFile(
    path.join(root, "public", "icons", "README.txt"),
    [
      "Generated from public/brand/jwelpixel-emblem-v4.png",
      "Run: node scripts/generate-icons.mjs",
      "",
      "icon-192.png / icon-512.png — PWA",
      "apple-touch-icon.png — iOS home screen",
      "play-store-512.png — Play Console listing",
      "../favicon.ico — browser tab",
      "../../app/icon.png — Next.js favicon",
      "../../app/apple-icon.png — Next.js Apple icon",
      "",
    ].join("\n"),
  );

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
