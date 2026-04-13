import fs from "fs";
import { SchemaType, validateSchemaJson } from "../schema/validator.js";

function readSchemaFromFile(filepath: string): SchemaType {
  if (!fs.existsSync(filepath)) {
    throw new Error(`Invalid invocation: Schema file [${filepath}] does not exist`);
  }

  const raw = fs.readFileSync(filepath, "utf-8");
  const parsed = JSON.parse(raw);
  return validateSchemaJson(parsed);
}

function assertNoRemovedGameKeys(previous: SchemaType, current: SchemaType): void {
  const previousKeys = Object.keys(previous.games);
  const currentKeys = new Set(Object.keys(current.games));
  const removedKeys = previousKeys.filter((key) => !currentKeys.has(key)).sort();

  if (removedKeys.length > 0) {
    throw new Error(
        `
        Rule: Cannot remove game keys from the schema.
        Violation: [${removedKeys.join(", ")}].
        Resolution: To hide an entry, change the visibility.
        `.trim()
    );
  }
}

function runCheckGameKeyRemovalsCommand(): void {
  const [previousPath, currentPath] = process.argv.slice(2);
  if (!previousPath || !currentPath) {
    throw new Error("Usage: yarn run check:game-keys <previous-schema-path> <current-schema-path>");
  }

  const previous = readSchemaFromFile(previousPath);
  const current = readSchemaFromFile(currentPath);

  assertNoRemovedGameKeys(previous, current);
}

runCheckGameKeyRemovalsCommand();

