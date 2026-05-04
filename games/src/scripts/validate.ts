import * as fs from "fs";
import { buildSchemaJson } from "../schema/builder.js";
import { validateSchemaJson } from "../schema/validator.js";

const REQUIRED_VARIANTS = [
  // "bg-1920x620.webp",
  // "bg-1920x1080.webp",
  "cover-360x480.webp",
  // "icon-192x192.webp",
];

function validateAssetDirectories() {
  const root = "./assets";
  const missing: string[] = [];
  fs.readdirSync(root).forEach((dir) => {
    const full = `${root}/${dir}`;
    if (!fs.statSync(full).isDirectory()) return;
    REQUIRED_VARIANTS.forEach((variant) => {
      const filename = `${dir}-${variant}`;
      if (!fs.existsSync(`${full}/${filename}`)) {
        missing.push(`${dir}/${filename}`);
      }
    });
  });
  if (missing.length > 0) {
    throw new Error(
      `Missing required asset variants:\n\n${missing.join("\n")}`
    );
  }
}

async function runValidateCommand() {
  validateSchemaJson(buildSchemaJson());
  validateAssetDirectories();
  console.log("Schema validated successfully!");
}

// TODO: Add await if/when top level await is supported without
//       "type": "module" inclusion in package.json or after
//       json-diff-kit supports it.
runValidateCommand();
