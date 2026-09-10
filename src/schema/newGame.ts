import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import _ from "lodash";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import {
  DistributionPlatformValues,
  GameDefinition,
  GameDistributionDefinition,
  GameModmanDefinition,
  GameTypeValues,
  ModmanPackageLoaderValues,
  ThunderstoreCommunityMeta,
} from "../models.js";
import { isAutolistPackageValid } from "./autolistPackages.js";
import { requiresDataFolder } from "./packageLoaders.js";
import * as Default from "./defaults.js";
import { gameSchema } from "./validator.js";

export interface NewGameOptions {
  name: string;
  slug?: string;
  distributions?: GameDistributionDefinition[];
  steamFolder?: string;
  dataFolder?: string;
  exe?: string;
  loader?: string;
  type?: string;
  discord?: string;
  discordConsent?: boolean;
  wiki?: string;
  autolist?: string;
  searchStrings?: string;
  description?: string;
  assets?: boolean;
  thunderstoreOnly?: boolean;
}

export function splitList(value = ""): string[] {
  return value.split(",").map(item => item.trim()).filter(Boolean);
}

export function validateSlug(identifier: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(identifier);
}

export function createDistribution(platform: string, identifier?: string | null): GameDistributionDefinition {
  const store = z.enum(DistributionPlatformValues).parse(platform);
  const storeId = identifier?.trim() || null;
  const requiresId = ["steam", "steam-direct", "epic-games-store", "xbox-game-pass"].includes(store);

  if (requiresId && !storeId) {
    throw new Error(`A store identifier is required for ${store}.`);
  }

  return { platform: store, identifier: storeId };
}

function createModmanDefinition(options: NewGameOptions, game: GameDefinition): GameModmanDefinition | null {
  const loaderName = options.loader === "melonloader" ? "recursive-melonloader" : options.loader;
  const loader = z.enum(ModmanPackageLoaderValues).exclude(["melonloader"]).optional().parse(loaderName);
  const gameType = z.enum(GameTypeValues).parse(options.type ?? "game");
  const hasLoader = loader !== undefined && loader !== "none";
  const hasInstallOptions = [
    options.steamFolder,
    options.dataFolder,
    options.exe,
    options.type,
    options.searchStrings,
  ].some(value => value !== undefined);
  const managerRequested = hasLoader || hasInstallOptions;

  if (options.thunderstoreOnly && managerRequested) {
    throw new Error("Do not combine --thunderstore-only with mod manager installation options.");
  }

  if (!managerRequested) {
    return null;
  }

  const distributions = game.distributions ?? [];
  const exeNames = splitList(options.exe);

  if (!distributions.length || !loader) {
    throw new Error("Mod manager support requires a distribution and --loader.");
  }

  if (options.steamFolder === undefined || options.dataFolder === undefined) {
    throw new Error("Provide --steam-folder and --data-folder. Use an empty string when not applicable.");
  }

  if (!exeNames.length) {
    throw new Error("Provide at least one executable with --exe.");
  }

  const usesSteam = distributions.some(d => d.platform === "steam" || d.platform === "steam-direct");

  if (usesSteam && !options.steamFolder.trim()) {
    throw new Error("Steam distributions require a non-empty installation folder.");
  }

  if (requiresDataFolder(loader) && !options.dataFolder.trim()) {
    throw new Error(`A verified data folder is required for ${loader}.`);
  }

  const folderName = _.upperFirst(_.camelCase(game.meta.displayName));

  return {
    gameInstanceType: gameType,
    distributions,
    steamFolderName: options.steamFolder,
    dataFolderName: options.dataFolder,
    exeNames,
    packageLoader: loader,
    meta: { ...game.meta },
    settingsIdentifier: folderName,
    internalFolderName: folderName,
    packageIndex: `https://thunderstore.io/c/${game.label}/api/v1/package-listing-index/`,
    gameSelectionDisplayMode: "visible",
    additionalSearchStrings: splitList(options.searchStrings),
    installRules: _.cloneDeep(Default.INSTALL_RULES[loader]),
    relativeFileExclusions: loader === "northstar" ? [...Default.NORTHSTAR_FILE_EXCLUSIONS] : null,
  };
}

export function createGameDefinition(options: NewGameOptions): GameDefinition {
  const displayName = options.name.trim();
  const identifier = options.slug ?? _.kebabCase(displayName);
  const autolistPackageIds = splitList(options.autolist);

  if (!displayName) {
    throw new Error("A non-empty game name is required.");
  }

  if (!validateSlug(identifier)) {
    throw new Error(`Invalid slug: ${identifier}. Must be kebab-case.`);
  }

  if (options.description && options.description.length > 512) {
    throw new Error("Description must be at most 512 characters.");
  }

  if (options.discord && !options.discordConsent) {
    throw new Error("Verify the Discord server's consent before supplying its URL, then use --discord-consent.");
  }

  for (const packageId of autolistPackageIds) {
    if (!isAutolistPackageValid(packageId)) {
      throw new Error(`Invalid autolist package: ${packageId}. Register custom packs in misc/modloader-packages.yml instead.`);
    }
  }

  let assets: ThunderstoreCommunityMeta | undefined;

  if (options.assets) {
    const prefix = `${identifier}/${identifier}`;

    assets = {
      icon: `${prefix}-icon-192x192.webp`,
      cover: `${prefix}-cover-360x480.webp`,
      background: `${prefix}-bg-1920x1080.webp`,
      hero: `${prefix}-bg-1920x620.webp`,
    };
  }

  const game: GameDefinition = {
    uuid: uuid(),
    label: identifier,
    meta: {
      displayName,
      iconUrl: assets?.cover ?? null,
    },
    distributions: options.distributions ?? [],
    r2modman: null,
    thunderstore: {
      displayName,
      listed: options.assets ? true : undefined,
      meta: assets,
      categories: _.cloneDeep(Default.CATEGORIES),
      sections: _.cloneDeep(Default.SECTIONS),
      wikiUrl: options.wiki || undefined,
      discordUrl: options.discord || undefined,
      autolistPackageIds: autolistPackageIds.length ? autolistPackageIds : undefined,
      shortDescription: options.description || undefined,
    },
  };

  const modman = createModmanDefinition(options, game);

  if (modman) {
    game.r2modman = [modman];
    game.distributions = [];
  }

  gameSchema.parse(game);
  return game;
}

export function existingDefinition(identifier: string, dataDirectory = "./data"): string | undefined {
  const paths = [
    path.join(dataDirectory, `${identifier}.yml`),
    path.join(dataDirectory, "generated", `${identifier}.yml`),
  ];

  return paths.find(file => fs.existsSync(file));
}

export function writeGameDefinition(game: GameDefinition, dataDirectory = "./data"): string {
  if (!validateSlug(game.label)) {
    throw new Error(`Invalid slug: ${game.label}.`);
  }

  const existing = existingDefinition(game.label, dataDirectory);

  if (existing) {
    throw new Error(`${existing} already exists. Edit the existing definition instead.`);
  }

  const file = path.join(dataDirectory, `${game.label}.yml`);
  const content = yaml.dump(game, {
    quotingType: '"',
    forceQuotes: true,
    noRefs: true,
  });

  fs.writeFileSync(file, content, { flag: "wx" });
  return file;
}
