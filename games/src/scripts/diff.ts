import { buildSchemaJson } from "../schema/builder.js";
import { getLatestSchemaUrl } from "../config.js";
import { assertForStatus } from "../utils/requests.js";
import {
  CommunitySchemaType,
  SchemaType,
  validateSchemaJson,
} from "../schema/validator.js";
import Differ, { DiffResult } from "json-diff-kit/differ";

const schemaUrl = getLatestSchemaUrl();

async function fetchPreviousSchema(): Promise<any> {
  const response = await fetch(schemaUrl);
  await assertForStatus(response);
  return JSON.parse(await response.text());
}

function extractGameLabels(schema: SchemaType): string[] {
  return Object.values(schema.games).map((x) => x.label);
}

function extractGameUUIDs(schema: SchemaType): string[] {
  return Object.values(schema.games).map((x) => x.uuid);
}

function extractCommunityIds(schema: SchemaType): string[] {
  return Object.keys(schema.communities);
}

function extractCommunityCategories(community?: CommunitySchemaType): string[] {
  if (!community) return [];
  return community.categories ? Object.keys(community.categories) : [];
}

function assertNoRemovals(previous: string[], current: string[]) {
  for (const entry of previous) {
    if (current.indexOf(entry) == -1) {
      throw new Error(
        `Detected illegal removal of key '${entry}' from the schema`
      );
    }
  }
}

const decorate = (line: DiffResult) => {
  const sign = line.type === "equal" ? " " : line.type === "remove" ? "-" : "+";
  const indent = "  ".repeat(line.level);
  const comma = line.comma ? "," : "";
  return `${sign} ${indent}${line.text}${comma}`;
};

const renderDiff = (content: readonly [DiffResult[], DiffResult[]]) => {
  const [linesLeft, linesRight] = content;
  const length = linesLeft.length;
  const output: string[] = [];

  for (let i = 0; i < length; i++) {
    const left = linesLeft[i];
    const right = linesRight[i];
    if (left.type === "equal" && right.type === "equal") {
      output.push(decorate(left));
    } else {
      if (left.text) output.push(decorate(left));
      if (right.text) output.push(decorate(right));
    }
  }

  return output.join("\n");
};

async function runDiffCommand() {
  const previous = validateSchemaJson(await fetchPreviousSchema());
  const current = validateSchemaJson(buildSchemaJson());

  const differ = new Differ({
    arrayDiffMethod: "lcs",
  });

  const diff = differ.diff(previous, current);
  console.log(renderDiff(diff));

  assertNoRemovals(extractGameLabels(previous), extractGameLabels(current));
  assertNoRemovals(extractGameUUIDs(previous), extractGameUUIDs(current));
  for (const key in previous.games) {
    assertNoRemovals(
      extractCommunityCategories(previous.games[key].thunderstore),
      extractCommunityCategories(current.games[key].thunderstore)
    );
  }

  assertNoRemovals(extractCommunityIds(previous), extractCommunityIds(current));
  for (const key in previous.communities) {
    assertNoRemovals(
      extractCommunityCategories(previous.communities[key]),
      extractCommunityCategories(current.communities[key])
    );
  }
}

// TODO: Add await if/when top level await is supported without
//       "type": "module" inclusion in package.json or after removal of
//       r2modmanPlus submodule from the repo.
runDiffCommand();
