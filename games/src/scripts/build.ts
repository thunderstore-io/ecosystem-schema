import { loadGameDefinitions } from "../load";
import { GameDefinition, ThunderstoreCommunityDefinition } from "../models";
import fs from "fs";
import _ from "lodash";

const { manual, generated } = loadGameDefinitions();

const mergedDefinitions = new Map<string, GameDefinition>();
for (const game of generated) {
  if (mergedDefinitions.has(game.uuid)) {
    throw new Error(`Game definition with duplicate UUID: ${game.uuid}`);
  }
  mergedDefinitions.set(game.uuid, game);
}
for (const game of manual) {
  if (mergedDefinitions.has(game.uuid)) {
    const other = mergedDefinitions.get(game.uuid)!;
    if (other.label != game.label) {
      throw new Error(
        "Unable to merge game definition with matching UUID but differing labels: \n\n" +
          `UUID: ${game.uuid}\n` +
          `Label 1: ${game.label}\n` +
          `Label 2: ${game.label}\n\n`
      );
    }
    const merged = _.merge({}, other, game);
    mergedDefinitions.set(merged.uuid, merged);
  } else {
    mergedDefinitions.set(game.uuid, game);
  }
}

const games = new Map<string, GameDefinition>();
const communities = new Map<string, ThunderstoreCommunityDefinition>();

for (const game of mergedDefinitions.values()) {
  if (games.has(game.label)) {
    throw new Error(`Game definition with duplicate label: ${game.label}`);
  }
  if (game.thunderstore !== undefined) {
    if (communities.has(game.label)) {
      throw new Error(
        `Community definition with duplicate label: ${game.label}`
      );
    }
    communities.set(game.label, game.thunderstore);
  }
  games.set(game.label, game);
}

const result = {
  schemaVersion: "0.0.11",
  games: Object.fromEntries(games),
  communities: Object.fromEntries(communities),
};

const outdir = "./dist";
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}
const jsoned = JSON.stringify(result, undefined, 2);
fs.writeFileSync(`${outdir}/latest.json`, jsoned);
