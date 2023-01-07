import { loadGameDefinitions } from "../load";
import { GameDefinition } from "../models";
import fs from "fs";

const existingDefinitions = loadGameDefinitions();

const result = new Map<string, GameDefinition>();
for (const game of existingDefinitions) {
  if (result.has(game.label)) {
    throw new Error(`Game definition with duplicate label: ${game.label}`);
  }
  result.set(game.label, game);
}

const outdir = "./dist";
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}
fs.writeFileSync(
  `${outdir}/games.json`,
  JSON.stringify(Object.fromEntries(result), undefined, 2)
);
