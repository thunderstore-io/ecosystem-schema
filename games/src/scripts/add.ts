import { GameDefinition } from "../models";
import { v4 as uuid } from "uuid";
import fs from "fs";
import * as yaml from "js-yaml";

const name = process.argv[2];
if (!name) {
  throw new Error("Missing argument: name");
}

const game: GameDefinition = {
  uuid: uuid(),
  label: name,
  meta: {
    displayName: name,
    iconUrl: "None",
  },
  distributions: [],
  legacy: {
    internalFolderName: name,
    dataFolderName: name,
    settingsIdentifier: name,
    packageIndex: `https://thunderstore.io/c/${name}/api/v1/package/`,
    exclusionsUrl:
      "https://raw.githubusercontent.com/ebkr/r2modmanPlus/master/modExclusions.md",
    steamFolderName: name,
    exeNames: [`${name}.exe`],
    gameInstancetype: "game",
    gameSelectionDisplayMode: "visible",
  },
};

const path = `./data/${name}.yml`;
if (fs.existsSync(path)) {
  throw new Error(`${path} already exists`);
}
fs.writeFileSync(
  path,
  yaml.dump(game, {
    quotingType: '"',
    forceQuotes: true,
  })
);
