import GameManager from "../../r2modmanPlus/src/model/game/GameManager";
import { v4 as uuid } from "uuid";
import * as yaml from "js-yaml";
import * as fs from "fs";
import { GameDefinition } from "../models";
import {
  convertDisplayMode,
  convertGameType,
  convertInstallRule,
  convertModLoaderPackageMapping,
  convertPlatform,
} from "../utils";
import { loadGameDefinitions } from "../load";
import {
  GAME_NAME,
  MOD_LOADER_VARIANTS,
} from "../../r2modmanPlus/src/r2mm/installing/profile_installers/ModLoaderVariantRecord";
import InstallationRuleApplicator from "../../r2modmanPlus/src/r2mm/installing/default_installation_rules/InstallationRuleApplicator";
import InstallationRules from "../../r2modmanPlus/src/r2mm/installing/InstallationRules";

const { generated } = loadGameDefinitions();
const settingsIdentifierToUuid = new Map<string, string>();
for (const def of generated) {
  settingsIdentifierToUuid.set(def.r2modman.settingsIdentifier, def.uuid);
}

const oldPackegeListRe = new RegExp(
  /https:\/\/([\w\-]+).thunderstore.io\/api\/v1\/package\//
);
const newPackegeListRe = new RegExp(
  /https:\/\/thunderstore.io\/c\/([\w\-]+)\/api\/v1\/package\//
);

const extractThunderstoreCommunity = (thunderstoreUrl: string): string => {
  let matches = thunderstoreUrl.match(oldPackegeListRe)?.[1];
  matches = matches ?? thunderstoreUrl.match(newPackegeListRe)?.[1];
  return matches ?? "risk-of-rain2";
};

InstallationRuleApplicator.apply();
const extractRules = (
  game: GAME_NAME
): {
  installRules: GameDefinition["r2modman"]["installRules"];
  relativeFileExclusions: GameDefinition["r2modman"]["relativeFileExclusions"];
} => {
  const rules = InstallationRules.RULES.find((x) => x.gameName == game);
  return {
    installRules: (rules?.rules ?? []).map(convertInstallRule),
    relativeFileExclusions: rules?.relativeFileExclusions ?? [],
  };
};

const games: GameDefinition[] = GameManager.gameList.map((x) => ({
  uuid: settingsIdentifierToUuid.get(x.settingsIdentifier) ?? uuid(),
  label: extractThunderstoreCommunity(x.thunderstoreUrl),
  meta: {
    displayName: x.displayName,
    iconUrl: x.gameImage,
  },
  distributions: x.storePlatformMetadata.map((p) => ({
    platform: convertPlatform(p.storePlatform),
    identifier: p.storeIdentifier,
  })),
  r2modman: {
    internalFolderName: x.internalFolderName,
    dataFolderName: x.dataFolderName,
    settingsIdentifier: x.settingsIdentifier,
    packageIndex: x.thunderstoreUrl,
    exclusionsUrl: x.exclusionsUrl,
    steamFolderName: x.steamFolderName,
    exeNames: x.exeName,
    gameInstancetype: convertGameType(x.instanceType),
    gameSelectionDisplayMode: convertDisplayMode(x.displayMode),
    modLoaderPackages: MOD_LOADER_VARIANTS[x.internalFolderName].map(
      convertModLoaderPackageMapping
    ),
    ...extractRules(x.internalFolderName),
  },
}));

for (const game of games) {
  fs.writeFileSync(
    `./data/generated/${game.label}.yml`,
    yaml.dump(game, {
      quotingType: '"',
      forceQuotes: true,
    })
  );
}
