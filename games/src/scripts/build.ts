import { loadGameDefinitions } from "../load";
import { GameDefinition } from "../models";
import fs from "fs";

const existingDefinitions = loadGameDefinitions();

const games = new Map<string, GameDefinition>();
for (const game of existingDefinitions) {
  if (games.has(game.label)) {
    throw new Error(`Game definition with duplicate label: ${game.label}`);
  }
  games.set(game.label, game);
}

const result = {
  schemaVersion: "0.0.1",
  games: Object.fromEntries(games),
};

const outdir = "./dist";
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}
fs.writeFileSync(`${outdir}/games.json`, JSON.stringify(result, undefined, 2));
