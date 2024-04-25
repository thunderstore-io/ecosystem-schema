import { buildSchemaJson } from "../schema/builder";
import { getLatestSchemaUrl } from "../config";
import { assertForStatus } from "../utils/requests";
import {
  CommunitySchemaType,
  SchemaType,
  validateSchemaJson,
} from "../schema/validator";

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

async function runDiffCommand() {
  const previous = validateSchemaJson(await fetchPreviousSchema());
  const current = validateSchemaJson(buildSchemaJson());

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

  console.log("Schema diffed successfully!");
}

await runDiffCommand();
