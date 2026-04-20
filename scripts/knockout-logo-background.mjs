/**
 * Keys out plate colour reached from image edges only (flood fill), so interior pixels
 * that match the plate (e.g. black Om on black surround) stay opaque.
 * Source: public/logo.png (or logo.avif). Output: public/logo-nav.png — `npm run logo`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const png = path.join(root, "public", "logo.png");
const avif = path.join(root, "public", "logo.avif");
const input = fs.existsSync(png) ? png : avif;
const output = path.join(root, "public", "logo-nav.png");

/** Base Euclidean RGB distance treated as background match. */
const TOLERANCE = 48;

async function main() {
  if (!fs.existsSync(input)) {
    console.error("Missing logo source. Add public/logo.png or public/logo.avif");
    process.exit(1);
  }

  // Transparent / premultiplied edges often read as RGB 0,0,0 and break corner sampling.
  // Flatten onto white so “plate” colour matches what you see (e.g. Om on white).
  const { data, info } = await sharp(input)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  if (ch !== 4) {
    console.error("Expected RGBA, got channels:", ch);
    process.exit(1);
  }

  function toleranceForBg(br, bgCol, bb) {
    const lum = 0.299 * br + 0.587 * bgCol + 0.114 * bb;
    let t = TOLERANCE;
    if (lum > 210) t = Math.max(TOLERANCE, 78);
    else if (lum < 28) t = Math.max(TOLERANCE, 56);
    return t * t;
  }

  function matchesPlate(r, g, b, bg, tol2) {
    const dr = r - bg[0];
    const dg = g - bg[1];
    const db = b - bg[2];
    return dr * dr + dg * dg + db * db <= tol2;
  }

  /**
   * Peel successive edge “plates” (black frame, then light halo, etc.). Each pass samples
   * average RGB of opaque pixels on the image border and flood-fills that colour in from edges.
   */
  const maxPasses = 20;
  for (let pass = 0; pass < maxPasses; pass++) {
    let er = 0,
      eg = 0,
      eb = 0,
      nEdge = 0;
    for (let x = 0; x < w; x++) {
      for (const y of [0, h - 1]) {
        const i = (y * w + x) * ch;
        if (data[i + 3] < 16) continue;
        er += data[i];
        eg += data[i + 1];
        eb += data[i + 2];
        nEdge++;
      }
    }
    for (let y = 1; y < h - 1; y++) {
      for (const x of [0, w - 1]) {
        const i = (y * w + x) * ch;
        if (data[i + 3] < 16) continue;
        er += data[i];
        eg += data[i + 1];
        eb += data[i + 2];
        nEdge++;
      }
    }

    if (nEdge === 0) break;

    const plate = [er / nEdge, eg / nEdge, eb / nEdge];
    const tol2 = toleranceForBg(plate[0], plate[1], plate[2]);

    const seen = new Uint8Array(w * h);
    const qx = [];
    const qy = [];

    function enqueue(x, y) {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const idx = y * w + x;
      if (seen[idx]) return;
      const p = idx * ch;
      if (data[p + 3] < 16) return;
      if (!matchesPlate(data[p], data[p + 1], data[p + 2], plate, tol2)) return;
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

  await sharp(data, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(output);

  console.log(
    "Wrote",
    path.relative(root, output),
    "from",
    path.relative(root, input),
    "(iterative edge key, up to",
    maxPasses,
    "passes)",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
