import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const faviconPreferred = path.join(root, "public", "favicon.png");
const logoNav = path.join(root, "public", "logo-nav.png");

/** Output sizes — large sources look sharper on HiDPI tabs / home screen. */
const TAB_ICON = 256;
const APPLE_ICON = 512;
/** Scale art up before fitting (logo-derived assets are sparse). Dedicated favicon art is usually tighter. */
const ZOOM_LOGO = 1.62;
const ZOOM_FAVICON = 1.12;

/** Looser than logo script — rescaled favicons blur edges; peel fringe / leftover plate. */
const ICON_PEEL_TOLERANCE = 58;

/**
 * Iterative edge flood (same idea as knockout-logo-background) on final RGBA buffer.
 */
function peelIconFringe(data, w, h) {
  const ch = 4;
  function tolSquared(plate) {
    const lum = 0.299 * plate[0] + 0.587 * plate[1] + 0.114 * plate[2];
    let t = ICON_PEEL_TOLERANCE;
    if (lum > 200) t = Math.max(t, 88);
    else if (lum < 40) t = Math.max(t, 72);
    return t * t;
  }
  function matches(r, g, b, plate, t2) {
    const dr = r - plate[0];
    const dg = g - plate[1];
    const db = b - plate[2];
    return dr * dr + dg * dg + db * db <= t2;
  }

  const maxPasses = 28;
  for (let pass = 0; pass < maxPasses; pass++) {
    let er = 0,
      eg = 0,
      eb = 0,
      nEdge = 0;
    for (let x = 0; x < w; x++) {
      for (const y of [0, h - 1]) {
        const i = (y * w + x) * ch;
        if (data[i + 3] < 12) continue;
        er += data[i];
        eg += data[i + 1];
        eb += data[i + 2];
        nEdge++;
      }
    }
    for (let y = 1; y < h - 1; y++) {
      for (const x of [0, w - 1]) {
        const i = (y * w + x) * ch;
        if (data[i + 3] < 12) continue;
        er += data[i];
        eg += data[i + 1];
        eb += data[i + 2];
        nEdge++;
      }
    }

    if (nEdge === 0) break;

    const plate = [er / nEdge, eg / nEdge, eb / nEdge];
    const t2 = tolSquared(plate);

    const seen = new Uint8Array(w * h);
    const qx = [];
    const qy = [];

    function enqueue(x, y) {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const idx = y * w + x;
      if (seen[idx]) return;
      const p = idx * ch;
      if (data[p + 3] < 12) return;
      if (!matches(data[p], data[p + 1], data[p + 2], plate, t2)) return;
      seen[idx] = 1;
      qx.push(x);
      qy.push(y);
    }

    for (let x = 0; x < w; x++) {
      enqueue(x, 0);
      enqueue(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      enqueue(0, y);
      enqueue(w - 1, y);
    }

    let removed = 0;
    let qi = 0;
    while (qi < qx.length) {
      const x = qx[qi];
      const y = qy[qi];
      qi++;
      const i = (y * w + x) * ch;
      data[i + 3] = 0;
      removed++;
      enqueue(x + 1, y);
      enqueue(x - 1, y);
      enqueue(x, y + 1);
      enqueue(x, y - 1);
    }

    if (removed === 0) break;
  }

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 18) data[i + 3] = 0;
  }
}

/**
 * Remove grey/white checkerboard and neutral margins (edge flood through low-chroma pixels only).
 * Coloured Om / artwork stays; red/orange has chroma and is not treated as backdrop.
 */
function peelAchromaticBackdrop(data, w, h) {
  const ch = 4;
  function isBackdrop(r, g, b) {
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    if (mx - mn > 36) return false;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 22) return false;
    return true;
  }

  const seen = new Uint8Array(w * h);
  const qx = [];
  const qy = [];

  function enqueue(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = y * w + x;
    if (seen[idx]) return;
    const p = idx * ch;
    if (data[p + 3] < 14) return;
    if (!isBackdrop(data[p], data[p + 1], data[p + 2])) return;
    seen[idx] = 1;
    qx.push(x);
    qy.push(y);
  }

  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  let qi = 0;
  while (qi < qx.length) {
    const x = qx[qi];
    const y = qy[qi];
    qi++;
    const i = (y * w + x) * ch;
    data[i + 3] = 0;
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 18) data[i + 3] = 0;
  }
}

async function achromaticPeelBuffer(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) return buf;
  peelAchromaticBackdrop(data, info.width, info.height);
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

function resolveIconSource() {
  if (fs.existsSync(faviconPreferred))
    return {
      path: faviconPreferred,
      label: "public/favicon.png",
      kind: "favicon",
    };
  if (fs.existsSync(logoNav))
    return { path: logoNav, label: "public/logo-nav.png", kind: "logo" };
  return null;
}

async function prepareZoomedSource(buf, zoom) {
  const trimmed = await sharp(buf).ensureAlpha().trim({ threshold: 8 }).png().toBuffer();
  const m = await sharp(trimmed).metadata();
  if (!m.width || !m.height) return trimmed;
  const w = Math.max(1, Math.round(m.width * zoom));
  const h = Math.max(1, Math.round(m.height * zoom));
  return sharp(trimmed)
    .resize(w, h, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
}

async function writeIcon(sourceBuf, size, outPath) {
  const { data, info } = await sharp(sourceBuf)
    .resize(size, size, {
      fit: "contain",
      position: "centre",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  peelIconFringe(data, info.width, info.height);

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function main() {
  const src = resolveIconSource();
  if (!src) {
    console.log(
      "Favicon: skipped (no public/favicon.png or public/logo-nav.png). Add public/favicon.png and run: npm run icons — or npm run logo (needs public/logo.png) then npm run icons",
    );
    process.exit(0);
  }

  let raw = await sharp(src.path).ensureAlpha().png().toBuffer();
  if (src.kind === "favicon") {
    raw = await achromaticPeelBuffer(raw);
  }

  const zoom =
    src.kind === "favicon" ? ZOOM_FAVICON : ZOOM_LOGO;
  const zoomed = await prepareZoomedSource(raw, zoom);

  await writeIcon(zoomed, TAB_ICON, path.join(root, "src", "app", "icon.png"));
  await writeIcon(zoomed, APPLE_ICON, path.join(root, "src", "app", "apple-icon.png"));

  console.log(
    `Wrote icon.png (${TAB_ICON}×${TAB_ICON}) and apple-icon.png (${APPLE_ICON}×${APPLE_ICON}) from ${src.label} (zoom ${zoom}×)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
