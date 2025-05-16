import GameManager from "../../r2modmanPlus/src/model/game/GameManager.js";
import { v4 as uuid } from "uuid";
import * as yaml from "js-yaml";
import * as fs from "fs";
import { GameDefinition, GameModmanDefinition } from "../models.js";
import {
  convertDisplayMode,
  convertGameType,
  convertInstallRule,
  convertModLoaderPackageMapping,
  convertPlatform,
} from "../utils.js";
import { loadGameDefinitions } from "../load.js";
import {
  ALL_MODLOADER_MAPPINGS,
  GAME_NAME,
} from "../../r2modmanPlus/src/r2mm/installing/profile_installers/ModLoaderVariantRecord.js";
import InstallationRuleApplicator from "../../r2modmanPlus/src/r2mm/installing/default_installation_rules/InstallationRuleApplicator.js";
import InstallationRules from "../../r2modmanPlus/src/r2mm/installing/InstallationRules.js";
import { GetInstallerIdForLoader } from "../../r2modmanPlus/src/model/installing/PackageLoader";

const { generated, manual } = loadGameDefinitions();
const labelToUuid = new Map<string, string>();
const settingsIdentifierToUuid = new Map<string, string>();
for (const def of generated) {
  if (def.r2modman) {
    let entries = def.r2modman;
    if (!Array.isArray(entries)) {
      entries = [entries];
    }

    for (const entry of entries) {
      settingsIdentifierToUuid.set(entry.settingsIdentifier, def.uuid);
    }
  }
  labelToUuid.set(def.label, def.uuid);
}
for (const def of manual) {
  if (def.r2modman) {
    let entries = def.r2modman;
    if (!Array.isArray(entries)) {
      entries = [entries];
    }
    for (const entry of entries) {
      settingsIdentifierToUuid.set(entry.settingsIdentifier, def.uuid);
    }
  }
  labelToUuid.set(def.label, def.uuid);
}

function getUuid(label: string, settingsIdentifier: string): string {
  return (
    settingsIdentifierToUuid.get(settingsIdentifier) ??
    labelToUuid.get(label) ??
    uuid()
  );
}

const oldPackegeListRe = new RegExp(
  /https:\/\/([\w\-]+).thunderstore.io\/api\/v1\/package-listing-index\//
);
const newPackegeListRe = new RegExp(
  /https:\/\/thunderstore.io\/c\/([\w\-]+)\/api\/v1\/package-listing-index\//
);

const extractThunderstoreCommunity = (thunderstoreUrl: string): string => {
  let matches = thunderstoreUrl.match(oldPackegeListRe)?.[1];
  matches = matches ?? thunderstoreUrl.match(newPackegeListRe)?.[1];
  if (!matches) {
    throw new Error(
      `Unable to extract community from thunderstore url: ${thunderstoreUrl}`
    );
  }
  return matches;
};

InstallationRuleApplicator.apply();
const extractRules = (
  game: GAME_NAME
): {
  installRules: GameModmanDefinition["installRules"];
  relativeFileExclusions: GameModmanDefinition["relativeFileExclusions"];
} => {
  const rules = InstallationRules.RULES.find((x) => x.gameName == game);
  return {
    installRules: (rules?.rules ?? []).map(convertInstallRule),
    relativeFileExclusions: rules?.relativeFileExclusions ?? null,
  };
};

const gamesByCommunityId = new Map<string, GameDefinition[]>();

for (const x of GameManager.gameList) {
  if (x.thunderstoreUrl.includes("thunderstore.dev")) {
    continue;
  }
  let identifier = extractThunderstoreCommunity(x.thunderstoreUrl);
  const definitions = gamesByCommunityId.get(identifier) || [];

  const distributions = x.storePlatformMetadata.map((p) => ({
    platform: convertPlatform(p.storePlatform),
    identifier: p.storeIdentifier ?? null,
  }));
  const meta = {
    displayName: x.displayName,
    iconUrl: x.gameImage,
  };

  const game = {
    uuid: getUuid(identifier, x.settingsIdentifier),
    label: identifier,
    meta,
    distributions,
    r2modman: [
      {
        meta,
        internalFolderName: x.internalFolderName,
        dataFolderName: x.dataFolderName,
        distributions,
        settingsIdentifier: x.settingsIdentifier,
        packageIndex: x.thunderstoreUrl,
        steamFolderName: x.steamFolderName.replaceAll("\\", "/"),
        exeNames: x.exeName,
        gameInstanceType: convertGameType(x.instanceType),
        gameSelectionDisplayMode: convertDisplayMode(x.displayMode),
        additionalSearchStrings: x.additionalSearchStrings,
        packageLoader: GetInstallerIdForLoader(x.packageLoader),
        ...extractRules(x.internalFolderName),
      },
    ],
  };
  definitions.push(game);

  gamesByCommunityId.set(identifier, definitions);
}

const games: GameDefinition[] = [];

for (const definitions of gamesByCommunityId.values()) {
  if (definitions.length < 1) {
    continue;
  }
  const result = definitions[0];
  for (const entry of definitions.slice(1)) {
    if (!entry.r2modman) {
      continue;
    }
    if (!result.r2modman) {
      result.r2modman = [];
    }
    result.r2modman.push(...entry.r2modman);

    if (entry.distributions) {
      if (!result.distributions) {
        result.distributions = [];
      }
      result.distributions.push(...entry.distributions);
    }
  }
  games.push(result);
}

fs.writeFileSync(
  "./misc/modloader-packages.yml",
  yaml.dump(ALL_MODLOADER_MAPPINGS.map(convertModLoaderPackageMapping), {
    quotingType: '"',
    forceQuotes: true,
  })
);

for (const game of games) {
  fs.writeFileSync(
    `./data/generated/${game.label}.yml`,
    yaml.dump(game, {
      quotingType: '"',
      forceQuotes: true,
      noRefs: true,
    })
  );
}
