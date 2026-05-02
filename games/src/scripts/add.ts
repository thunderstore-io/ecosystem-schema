import { GameDefinition, GameModmanDefinition, ModmanPackageLoader, DistributionPlatform, GameType } from "../models.js";
import { v4 as uuid } from "uuid";
import fs from "fs";
import * as yaml from "js-yaml";
import { input, checkbox, confirm, select } from "@inquirer/prompts";
import _ from "lodash";
import { parseArgs } from "node:util";
import { AUTOLIST_PACKAGE_CHOICES } from "../schema/autolistPackages.js";
import * as Default from "../schema/defaults.js";
import { GAME_TYPE_CHOICES } from "../schema/instanceTypes.js";
import { PACKAGE_LOADER_CHOICES } from "../schema/packageLoaders.js";
import { PLATFORM_CHOICES } from "../schema/platforms.js";

const isNotEmpty = (x: string) => !!(x.trim());
const ADD_SCRIPT_PACKAGE_LOADER_CHOICES = PACKAGE_LOADER_CHOICES.filter(choice => choice.value !== "melonloader");

const pascalCase = (x: string) => x.charAt(0).toUpperCase() + _.camelCase(x.slice(1));

const definitionFilePath = (identifier: string) => `./data/${identifier}.yml`;

// CLI argument parsing
interface CliArgs {
  name?: string;
  slug?: string;
  steamId?: string;
  steamFolder?: string;
  dataFolder?: string;
  exe?: string;
  loader?: string;
  platform?: string;
  type?: string;
  discord?: string;
  wiki?: string;
  autolist?: string;
  searchStrings?: string;
  description?: string;
  help?: boolean;
}

function parseCliArgs(): CliArgs {
  const { values } = parseArgs({
    options: {
      name: { type: "string", short: "n" },
      slug: { type: "string" },
      "steam-id": { type: "string", short: "i" },
      "steam-folder": { type: "string", short: "f" },
      "data-folder": { type: "string", short: "d" },
      exe: { type: "string", short: "e" },
      loader: { type: "string", short: "l" },
      platform: { type: "string", short: "p" },
      type: { type: "string", short: "t" },
      discord: { type: "string" },
      wiki: { type: "string" },
      autolist: { type: "string", short: "a" },
      "search-strings": { type: "string", short: "s" },
      description: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    strict: false,
  });

  return {
    name: values.name as string | undefined,
    slug: values.slug as string | undefined,
    steamId: values["steam-id"] as string | undefined,
    steamFolder: values["steam-folder"] as string | undefined,
    dataFolder: values["data-folder"] as string | undefined,
    exe: values.exe as string | undefined,
    loader: values.loader as string | undefined,
    platform: values.platform as string | undefined,
    type: values.type as string | undefined,
    discord: values.discord as string | undefined,
    wiki: values.wiki as string | undefined,
    autolist: values.autolist as string | undefined,
    searchStrings: values["search-strings"] as string | undefined,
    description: values.description as string | undefined,
    help: values.help as boolean | undefined,
  };
}

function printHelp() {
  console.log(`
Usage: yarn run add [options]

Required (for CLI mode):
  -n, --name <name>           Display name for the game

Game Distribution:
  -i, --steam-id <id>         Steam App ID (or store identifier)
  -p, --platform <platform>   Distribution platform (default: steam)
                              Values: steam, steam-direct, epic-games-store,
                              oculus-store, origin, xbox-game-pass, other
  -t, --type <type>           Instance type (default: game)
                              Values: game, server

Game Installation:
  -f, --steam-folder <name>   Steam installation folder name (from SteamDB installdir)
  -d, --data-folder <name>    Unity data folder name (from SteamDB depots, e.g., "GameName_Data")
  -e, --exe <names>           Executable name(s), comma-separated for multi-platform

Mod Loader:
  -l, --loader <loader>       Package loader to use
                              Values: bepinex, recursive-melonloader,
                              shimloader, godotml, return-of-modding, bepisloader, none
  -a, --autolist <ids>        Autolist package IDs, comma-separated
                              Common: BepInEx-BepInExPack, BepInEx-BepInExPack_IL2CPP,
                              LavaGang-MelonLoader, Thunderstore-unreal_shimloader

Community Info:
      --slug <identifier>     Override the auto-generated slug/identifier
      --discord <url>         Discord server URL
      --wiki <url>            Wiki URL
      --description <text>    Short description (max 512 chars)
  -s, --search-strings <str>  Additional search strings (e.g., abbreviations), comma-separated

Other:
  -h, --help                  Show this help message

Examples:
  # Full CLI mode with all r2modman fields
  yarn run add --name "Factory Planner" --steam-id 3679930 \\
    --steam-folder "Factory Planner" --data-folder "Factory Planner_Data" \\
    --exe "Factory Planner.exe" --loader bepinex --autolist "BepInEx-BepInExPack_IL2CPP"

  # With optional community info
  yarn run add --name "Project Arrhythmia" --steam-id 440310 \\
    --steam-folder "Project Arrhythmia" --data-folder "Project Arrhythmia_Data" \\
    --exe "Project Arrhythmia.exe" --loader bepinex --autolist "BepInEx-BepInExPack" \\
    --discord "https://discord.gg/xxx" --search-strings "PA"

  # Interactive mode (no args)
  yarn run add
`);
}

function validateLoader(loader: string): ModmanPackageLoader {
  const normalizedLoader = loader === "melonloader" ? "recursive-melonloader" : loader;
  const validLoaders = ADD_SCRIPT_PACKAGE_LOADER_CHOICES.map(c => c.value);

  if (!validLoaders.includes(normalizedLoader as ModmanPackageLoader)) {
    throw new Error(`Invalid loader: ${loader}. Valid options: ${validLoaders.join(", ")}`);
  }

  return normalizedLoader as ModmanPackageLoader;
}

function validatePlatform(platform: string): DistributionPlatform {
  const validPlatforms = PLATFORM_CHOICES.map(c => c.value);
  if (!validPlatforms.includes(platform as DistributionPlatform)) {
    throw new Error(`Invalid platform: ${platform}. Valid options: ${validPlatforms.join(", ")}`);
  }
  return platform as DistributionPlatform;
}

function validateGameType(type: string): GameType {
  const validTypes = GAME_TYPE_CHOICES.map(c => c.value);
  if (!validTypes.includes(type as GameType)) {
    throw new Error(`Invalid type: ${type}. Valid options: ${validTypes.join(", ")}`);
  }
  return type as GameType;
}

async function runCliMode(args: CliArgs) {
  const displayName = args.name!;
  const identifier = args.slug || _.kebabCase(displayName);

  if (identifier !== _.kebabCase(identifier)) {
    throw new Error(`Invalid slug: ${identifier}. Must be kebab-case (lowercase with hyphens).`);
  }

  if (fs.existsSync(definitionFilePath(identifier))) {
    throw new Error(`${definitionFilePath(identifier)} already exists. Edit the existing file to avoid overwriting it.`);
  }

  const discordUrl = args.discord || "";
  const wikiUrl = args.wiki || "";
  const shortDescription = args.description || "";
  const autolistPackageIds = args.autolist ? args.autolist.split(",").map(s => s.trim()) : [];
  const additionalSearchStrings = args.searchStrings ? args.searchStrings.split(",").map(s => s.trim()) : [];

  if (shortDescription && shortDescription.length > 512) {
    throw new Error(`Description too long: ${shortDescription.length} chars. Maximum is 512.`);
  }

  // Check if we have enough info for r2modman support
  const hasR2modmanArgs = args.steamId && args.steamFolder && args.dataFolder && args.exe && args.loader;

  type PromptedFields = "gameInstanceType" | "distributions" | "steamFolderName" | "dataFolderName" | "packageLoader";
  type PromptedR2 = Pick<GameModmanDefinition, PromptedFields> & {exeNames: string};
  let r2modman: PromptedR2 | null = null;

  if (hasR2modmanArgs) {
    const loader = validateLoader(args.loader!);
    const platform = validatePlatform(args.platform || "steam");
    const gameType = validateGameType(args.type || "game");

    r2modman = {
      gameInstanceType: gameType,
      distributions: [{
        platform: platform,
        identifier: args.steamId!,
      }],
      steamFolderName: args.steamFolder!,
      dataFolderName: args.dataFolder!,
      exeNames: args.exe!,
      packageLoader: loader,
    };
  }

  const game: GameDefinition = {
    uuid: uuid(),
    label: identifier,
    meta: {
      displayName,
      iconUrl: `${identifier}/cover-360x480.webp`,
    },
    distributions: [],
    r2modman: null,
    thunderstore: {
      displayName,
      categories: Default.CATEGORIES,
      sections: Default.SECTIONS,
      wikiUrl: wikiUrl || undefined,
      discordUrl: discordUrl || undefined,
      autolistPackageIds: autolistPackageIds.length > 0 ? autolistPackageIds : undefined,
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
      additionalSearchStrings,
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

async function runInteractiveMode() {
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
        choices: ADD_SCRIPT_PACKAGE_LOADER_CHOICES,
      }),
    };
  }

  const game: GameDefinition = {
    uuid: uuid(),
    label: identifier,
    meta: {
      displayName,
      iconUrl: `${identifier}/cover-360x480.webp`,
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

async function main() {
  const args = parseCliArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // If --name is provided, use CLI mode
  if (args.name) {
    await runCliMode(args);
  } else {
    await runInteractiveMode();
  }
}

main();
