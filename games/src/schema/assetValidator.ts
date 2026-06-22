import * as fs from "fs";
import { SchemaType } from "./validator.js";

const ASSETS_ROOT = "./assets";
const ALLOWLIST_PATH = `${ASSETS_ROOT}/.legacy-allowlist`;

type Variant = {
  type: "icon" | "cover" | "bg";
  width: number;
  height: number;
  required: boolean;
};

const VARIANTS: Variant[] = [
  { type: "icon", width: 192, height: 192, required: true },
  { type: "cover", width: 360, height: 480, required: true },
  { type: "bg", width: 1920, height: 1080, required: true },
  { type: "bg", width: 1920, height: 620, required: true },
  { type: "bg", width: 1080, height: 492, required: false },
  { type: "bg", width: 400, height: 534, required: false },
];

const LEGACY_REQUIRED_VARIANT = "cover-360x480.webp";

const FILENAME_PATTERN =
  /^([a-z0-9](?:-?[a-z0-9])*)-(icon|cover|bg)-(\d+)x(\d+)\.webp$/;

function loadAllowlist(): Set<string> {
  if (!fs.existsSync(ALLOWLIST_PATH)) return new Set();
  return new Set(
    fs
      .readFileSync(ALLOWLIST_PATH, "utf-8")
      .split("\n")
      .map((line) => line.replace(/#.*/, "").trim())
      .filter((line) => line.length > 0)
  );
}

function readWebpDimensions(buf: Buffer): { width: number; height: number } {
  if (buf.length < 30) throw new Error("file too short to be webp");
  if (buf.toString("ascii", 0, 4) !== "RIFF") throw new Error("not a RIFF file");
  if (buf.toString("ascii", 8, 12) !== "WEBP") throw new Error("not a WEBP file");

  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return {
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    const b1 = buf[21];
    const b2 = buf[22];
    const b3 = buf[23];
    const b4 = buf[24];
    return {
      width: (((b2 & 0x3f) << 8) | b1) + 1,
      height: (((b4 & 0x0f) << 10) | (b3 << 2) | (b2 >> 6)) + 1,
    };
  }
  if (chunk === "VP8X") {
    return {
      width: buf.readUIntLE(24, 3) + 1,
      height: buf.readUIntLE(27, 3) + 1,
    };
  }
  throw new Error(`unknown webp chunk '${chunk}'`);
}

function validateStrict(slug: string): string[] {
  const errors: string[] = [];
  const dir = `${ASSETS_ROOT}/${slug}`;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    // Schema only references webp, so non-webp companions are ignored.
    if (!file.endsWith(".webp")) continue;
    const match = file.match(FILENAME_PATTERN);
    if (!match) {
      errors.push(`${slug}/${file}: unrecognized filename`);
      continue;
    }
    const [, fileSlug, type, wStr, hStr] = match;
    if (fileSlug !== slug) {
      errors.push(
        `${slug}/${file}: filename slug '${fileSlug}' does not match folder`
      );
      continue;
    }
    const width = parseInt(wStr, 10);
    const height = parseInt(hStr, 10);
    const matchingVariant = VARIANTS.find(
      (v) => v.type === type && v.width === width && v.height === height
    );
    if (!matchingVariant) {
      errors.push(
        `${slug}/${file}: ${width}x${height} is not an allowed resolution for type '${type}'`
      );
      continue;
    }

    let dims: { width: number; height: number };
    try {
      dims = readWebpDimensions(fs.readFileSync(`${dir}/${file}`));
    } catch (e) {
      errors.push(`${slug}/${file}: ${(e as Error).message}`);
      continue;
    }
    if (dims.width !== width || dims.height !== height) {
      errors.push(
        `${slug}/${file}: pixel dimensions ${dims.width}x${dims.height} do not match filename ${width}x${height}`
      );
    }
  }

  for (const variant of VARIANTS) {
    if (!variant.required) continue;
    const expected = `${slug}-${variant.type}-${variant.width}x${variant.height}.webp`;
    if (!files.includes(expected)) {
      errors.push(`${slug}: missing required variant ${expected}`);
    }
  }

  return errors;
}

function validateLegacy(slug: string): string[] {
  const expected = `${slug}-${LEGACY_REQUIRED_VARIANT}`;
  if (!fs.existsSync(`${ASSETS_ROOT}/${slug}/${expected}`)) {
    return [`${slug}: missing ${expected} (legacy minimum)`];
  }
  return [];
}

function collectIconUrls(schema: SchemaType): { gameLabel: string; url: string }[] {
  const refs: { gameLabel: string; url: string }[] = [];
  for (const game of Object.values(schema.games)) {
    if (game.meta.iconUrl) refs.push({ gameLabel: game.label, url: game.meta.iconUrl });
    for (const entry of game.r2modman ?? []) {
      if (entry.meta.iconUrl)
        refs.push({ gameLabel: game.label, url: entry.meta.iconUrl });
    }
  }
  return refs;
}

export function validateAssets(schema: SchemaType): void {
  const allowlist = loadAllowlist();
  const errors: string[] = [];

  const dirs = fs
    .readdirSync(ASSETS_ROOT)
    .filter((name) => fs.statSync(`${ASSETS_ROOT}/${name}`).isDirectory());

  for (const slug of dirs) {
    if (allowlist.has(slug)) {
      errors.push(...validateLegacy(slug));
    } else {
      errors.push(...validateStrict(slug));
    }
  }

  // Allowlisted slugs may not have a dir yet (assets pending) but must match a real schema label.
  const schemaLabels = new Set(Object.values(schema.games).map((g) => g.label));
  for (const slug of allowlist) {
    if (!dirs.includes(slug) && !schemaLabels.has(slug)) {
      errors.push(
        `.legacy-allowlist: '${slug}' matches no asset directory or schema label`
      );
    }
  }

  // Every iconUrl in the merged schema must resolve to a file. Allowlisted slugs are exempt.
  for (const { gameLabel, url } of collectIconUrls(schema)) {
    if (allowlist.has(gameLabel)) continue;
    if (!fs.existsSync(`${ASSETS_ROOT}/${url}`)) {
      errors.push(
        `${gameLabel}: iconUrl '${url}' has no corresponding file in assets/`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Asset validation failed:\n\n${errors.join("\n")}`);
  }
}
