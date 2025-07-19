import { buildSchemaJson } from "../schema/builder.js";
import { getLatestSchemaUrl } from "../config.js";
import { assertForStatus } from "../utils/requests.js";
import {
  CommunitySchemaType,
  SchemaType,
  validateSchemaJson,
} from "../schema/validator.js";
import Differ, { DiffResult, UndefinedBehavior } from "json-diff-kit/differ";

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

function getLinePrefix(line: DiffResult): string {
  switch (line.type) {
    case "equal":
      return " ";
    case "remove":
      return "-";
    case "add":
      return "+";
    case "modify":
      return "~";
  }
}

const decorate = (line: DiffResult) => {
  const sign = getLinePrefix(line);
  const indent = "  ".repeat(line.level);
  const comma = line.comma ? "," : "";
  return `${sign} ${indent}${line.text}${comma}`;
};

class DiffTreeNode {
  private readonly stack: (DiffResult | DiffTreeNode)[] = [];
  private readonly level: number;
  private hasChanges: boolean;
  private head: DiffTreeNode | undefined;

  constructor(level: number) {
    this.level = level;
    this.hasChanges = false;
  }

  public push(line: DiffResult) {
    if (line.level == this.level) {
      if (this.head) {
        this.stack.push(this.head);
        this.head = undefined;
      }
      this.stack.push(line);
    } else {
      if (line.level > this.level) {
        if (!this.head) {
          this.head = new DiffTreeNode(line.level);
        }
        this.head.push(line);
      } else {
        throw new Error(
          "Unexpected level change (lost more than 1 level at once)"
        );
      }
    }
    if (!this.hasChanges && line.type !== "equal") {
      this.hasChanges = true;
    }
  }

  public renderChanged(): string[] {
    if (!this.hasChanges) {
      return [];
    }
    const output: string[] = [];
    this.stack.forEach((line, lineId) => {
      if (line instanceof DiffTreeNode) {
        output.push(...line.renderChanged());
      } else {
        if (line.type !== "equal") {
          output.push(decorate(line));
        } else {
          let nextLine = this.stack[lineId + 1];
          if (nextLine instanceof DiffTreeNode && nextLine.hasChanges) {
            output.push(decorate(line));
          }
          let prevLine = this.stack[lineId - 1];
          if (prevLine instanceof DiffTreeNode && prevLine.hasChanges) {
            output.push(decorate(line));
          }
        }
      }
    });
    return output;
  }
}

const renderDiff = (content: readonly [DiffResult[], DiffResult[]]) => {
  const [linesLeft, linesRight] = content;
  const length = linesLeft.length;

  const diffTree = new DiffTreeNode(0);

  for (let i = 0; i < length; i++) {
    const left = linesLeft[i];
    const right = linesRight[i];
    if (left.type === "equal" && right.type === "equal") {
      diffTree.push(left);
    } else {
      if (left.text) diffTree.push(left);
      if (right.text) diffTree.push(right);
    }
  }

  const output = diffTree.renderChanged();
  return output.join("\n");
};

const GAME_RELABELS = new Map<string, string>([
  ["dsp", "dyson-sphere-program"],
  ["belowzero", "subnautica-below-zero"],
  ["risk-of-rain2", "riskofrain2"],
]);

async function runDiffCommand() {
  const previous = await fetchPreviousSchema();
  const current = validateSchemaJson(buildSchemaJson());

  const differ = new Differ({
    arrayDiffMethod: "lcs",
    detectCircular: true,
    recursiveEqual: true,
    undefinedBehavior: UndefinedBehavior.throw,
    showModifications: false,
  });

  const diff = differ.diff(previous, current);
  console.log(renderDiff(diff));

  for (const [key, value] of GAME_RELABELS) {
    if (previous.games[key]) {
      previous.games[value] = previous.games[key];
      previous.games[value].label = value;
      delete previous.games[key];
    }
    if (current.games[key]) {
      throw new Error(
        `Detected illegal usage of game with key '${key}' in the new schema. ` +
          `This key has already been used in the past and has since been renamed to '${value}'.`
      );
    }
  }

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
//       "type": "module" inclusion in package.json or after
//       json-diff-kit supports it.
runDiffCommand();
