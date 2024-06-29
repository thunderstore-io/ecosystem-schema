import { GameDefinition } from "../models";
import { v4 as uuid } from "uuid";
import fs from "fs";
import * as yaml from "js-yaml";
import { input } from "@inquirer/prompts";
import _ from "lodash";

const displayName = await input({
  message: "Display name for the community",
  validate: (val) => !!val,
});
const identifier = await input({
  message: "Identifier for the community (slug)",
  default: _.kebabCase(displayName),
  validate: (val) => !!val && val == _.kebabCase(val),
});
const discordUrl = await input({
  message: "Discord URL for the community (optional)",
  default: "",
});
const wikiUrl = await input({
  message: "Wiki URL for the community (optional)",
  default: "",
});

console.log("Enter a package ID (ex: BepInEx-BepInExPack) to automatically list it for the community");

const autolistPackageIds: string[] = [];
while (true) {
  const userInput = await input({
    message: "Package ID (optional):",
    default: "",
  });

  if (!userInput.trim()) {
    break;
  }

  if(userInput.includes(',') || userInput.includes(' ')) {
    console.log("Invalid package ID! Enter one package ID at a time!");
  }
  else if(!userInput.includes('-'))
  {
    console.log("Invalid package ID! The package ID should be in this format: {namespace}-{name}");
  }
  else
  {
    autolistPackageIds.push(userInput);
  }
}




const game: GameDefinition = {
  uuid: uuid(),
  label: identifier,
  meta: {
    displayName,
    iconUrl: "None",
  },
  distributions: [],
  // TODO: Enable once consumers implemented
  // r2modman: {
  //   internalFolderName: name,
  //   dataFolderName: name,
  //   settingsIdentifier: name,
  //   packageIndex: `https://thunderstore.io/c/${name}/api/v1/package/`,
  //   exclusionsUrl:
  //     "https://raw.githubusercontent.com/ebkr/r2modmanPlus/master/modExclusions.md",
  //   steamFolderName: name,
  //   exeNames: [`${name}.exe`],
  //   gameInstancetype: "game",
  //   gameSelectionDisplayMode: "visible",
  //   modLoaderPackages: [],
  //   installRules: [],
  // },
  thunderstore: {
    displayName,
    categories: {
      mods: { label: "Mods" },
      modpacks: { label: "Modpacks" },
      tools: { label: "Tools" },
      libraries: { label: "Libraries" },
      misc: { label: "Misc" },
      audio: { label: "Audio" },
    },
    sections: {
      mods: {
        name: "Mods",
        excludeCategories: ["modpacks"],
      },
      modpacks: {
        name: "Modpacks",
        requireCategories: ["modpacks"],
      },
    },
    wikiUrl: wikiUrl || undefined,
    discordUrl: discordUrl || undefined,
    autolistPackageIds: autolistPackageIds || undefined,
  },
};

const path = `./data/${identifier}.yml`;
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
