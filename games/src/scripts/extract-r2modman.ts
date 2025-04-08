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
  GAME_NAME,
  MODLOADER_PACKAGES,
} from "../../r2modmanPlus/src/r2mm/installing/profile_installers/ModLoaderVariantRecord.js";
import InstallationRuleApplicator from "../../r2modmanPlus/src/r2mm/installing/default_installation_rules/InstallationRuleApplicator.js";
import InstallationRules from "../../r2modmanPlus/src/r2mm/installing/InstallationRules.js";
import Game from "../../r2modmanPlus/src/model/game/Game.js";
import { GetInstallerIdForLoader } from "../../r2modmanPlus/src/model/installing/PackageLoader";
import { GameInstanceType } from "../../r2modmanPlus/src/model/game/GameInstanceType";

const { generated, manual } = loadGameDefinitions();
const labelToUuid = new Map<string, string>();
const settingsIdentifierToUuid = new Map<string, string>();
for (const def of generated) {
  if (def.r2modman) {
    settingsIdentifierToUuid.set(def.r2modman.settingsIdentifier, def.uuid);
  }
  labelToUuid.set(def.label, def.uuid);
}
for (const def of manual) {
  if (def.r2modman) {
    settingsIdentifierToUuid.set(def.r2modman.settingsIdentifier, def.uuid);
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

const games: GameDefinition[] = GameManager.gameList
  .map((x: Game) => {
    if (x.thunderstoreUrl.includes("thunderstore.dev")) {
      return undefined;
    }
    let identifier = extractThunderstoreCommunity(x.thunderstoreUrl);
    if (x.instanceType == GameInstanceType.SERVER) {
      identifier = `${identifier}-server`;
      // TODO: Handle servers somehow?!
      return undefined;
    }
    return {
      uuid: getUuid(identifier, x.settingsIdentifier),
      label: identifier,
      meta: {
        displayName: x.displayName,
        iconUrl: x.gameImage,
      },
      distributions: x.storePlatformMetadata.map((p) => ({
        platform: convertPlatform(p.storePlatform),
        identifier: p.storeIdentifier ?? null,
      })),
      r2modman: {
        internalFolderName: x.internalFolderName,
        dataFolderName: x.dataFolderName,
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
    };
  })
  .filter((x) => !!x);

fs.writeFileSync(
  "./misc/modloader-packages.yml",
  yaml.dump(MODLOADER_PACKAGES.map(convertModLoaderPackageMapping), {
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
    })
  );
}
