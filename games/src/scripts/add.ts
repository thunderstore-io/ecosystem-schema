import { GameDefinition, GameModmanDefinition } from "../models.js";
import { v4 as uuid } from "uuid";
import fs from "fs";
import * as yaml from "js-yaml";
import { input, checkbox, confirm, select } from "@inquirer/prompts";
import _ from "lodash";
import { AUTOLIST_PACKAGE_CHOICES } from "../schema/autolistPackages.js";
import * as Default from "../schema/defaults.js";
import { GAME_TYPE_CHOICES } from "../schema/instanceTypes.js";
import { PACKAGE_LOADER_CHOICES } from "../schema/packageLoaders.js";
import { PLATFORM_CHOICES } from "../schema/platforms.js";

const isNotEmpty = (x: string) => !!(x.trim());

const pascalCase = (x: string) => x.charAt(0).toUpperCase() + _.camelCase(x.slice(1));

const definitionFilePath = (identifier: string) => `./data/${identifier}.yml`;

async function runAddCommand() {
  const displayName = await input({
    message: "Display name for the community",
    validate: isNotEmpty,
  });
  const identifier = await input({
    message: "Identifier for the community (slug)",
    default: _.kebabCase(displayName),
    validate: (val) => {
      const path = `./data/${val}.yml`;
      if (fs.existsSync(definitionFilePath(val))) {
        return `${definitionFilePath(val)} already exists. Edit the existing file to avoid overwriting it.`;
      }

      return !!val && val == _.kebabCase(val);      
  }});
  const discordUrl = await input({
    message: "Discord URL for the community (optional)",
    default: "",
  });
  const wikiUrl = await input({
    message: "Wiki URL for the community (optional)",
    default: "",
  });
  const shortDescription = await input({
    message: "Short description for the community (optional)",
    default: "",
    validate: (val) => val.length < 513,
  });

  const autolistPackageIds = await checkbox({
    message: "Automatically list package",
    choices: AUTOLIST_PACKAGE_CHOICES,
  });

  const managerSupport = await confirm({
    message: "Add mod manager support (TSMM/r2modman)?",
    default: true,
  });

  // Override exeNames type since prompts lib doesn't support returning string[].
  type PromptedFields = "gameInstanceType" | "distributions" | "steamFolderName" | "dataFolderName" | "packageLoader";
  type PromptedR2 = Pick<GameModmanDefinition, PromptedFields> & {exeNames: string};
  let r2modman: PromptedR2|null = null;

  if (managerSupport) {
    r2modman = {
      gameInstanceType: await select({
        message: "Select type",
        choices: GAME_TYPE_CHOICES,
      }),

      distributions: [{
        platform: await select({
          message: "Which store is the game available on?",
          choices: PLATFORM_CHOICES,
        }),
        identifier: await input({
          message: "Game's identifier on the selected store (optional for Oculus, Origin, and Other)",
        }),
      }],

      steamFolderName: await input({
        message: "Steam folder name (e.g. from SteamDB)",
        default: displayName,
        validate: isNotEmpty,
      }),
      dataFolderName: await input({
        message: "Data folder name (e.g. from SteamDB)",
        default: `${displayName}_Data`,
        validate: isNotEmpty,
      }),
      exeNames: await input({
        message: "Executable name (comma separated list)",
        default: `${displayName}.exe`,
        validate: isNotEmpty
      }),
      packageLoader: await select({
        message: "Package loader",
        choices: PACKAGE_LOADER_CHOICES,
      }),
    };
  }

  const game: GameDefinition = {
    uuid: uuid(),
    label: identifier,
    meta: {
      displayName,
      iconUrl: `${_.kebabCase(displayName)}.webp`,
    },
    distributions: [],
    r2modman: null,
    thunderstore: {
      displayName,
      categories: Default.CATEGORIES,
      sections: Default.SECTIONS,
      wikiUrl: wikiUrl || undefined,
      discordUrl: discordUrl || undefined,
      autolistPackageIds: autolistPackageIds || undefined,
      shortDescription: shortDescription || undefined,
    },
  };

  if (r2modman) {
    game.r2modman = [{
      ...r2modman,
      meta: {...game.meta},
      settingsIdentifier: pascalCase(displayName),
      internalFolderName: pascalCase(displayName),
      exeNames: r2modman.exeNames.split(",").map((name) => name.trim()),

      packageIndex: `https://thunderstore.io/c/${identifier}/api/v1/package-listing-index/`,
      gameSelectionDisplayMode: "visible",
      additionalSearchStrings: [],
      installRules: r2modman.packageLoader === "bepinex" ? Default.BEPINEX_INSTALL_RULES : [],
      relativeFileExclusions: null,
    }];
  }

  fs.writeFileSync(
    definitionFilePath(identifier),
    yaml.dump(game, {
      quotingType: '"',
      forceQuotes: true,
    })
  );

  console.log(`data/${identifier}.yml definition file was created and can be manually edited before submitting a PR.`);

  if (r2modman?.packageLoader === "bepinex") {
    console.log("Default BepInEx mod install rules have been added to the game definition file.");
  }
}

// TODO: Add await if/when top level await is supported without
//       "type": "module" inclusion in package.json or after
//       json-diff-kit supports it.
runAddCommand();
