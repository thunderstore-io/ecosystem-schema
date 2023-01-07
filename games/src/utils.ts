import { GameInstanceType } from "../r2modmanPlus/src/model/game/GameInstanceType";
import {
  DisplayType,
  DistributionPlatform,
  GameType,
  ModmanInstallRule,
  ModmanModLoaderPackage,
  ModmanPackageLoader,
  ModmanTrackingMethod,
} from "./models";
import { StorePlatform } from "../r2modmanPlus/src/model/game/StorePlatform";
import { GameSelectionDisplayMode } from "../r2modmanPlus/src/model/game/GameSelectionDisplayMode";
import { PackageLoader } from "../r2modmanPlus/src/model/installing/PackageLoader";
import { RuleSubtype } from "../r2modmanPlus/src/r2mm/installing/InstallationRules";
import ModLoaderPackageMapping from "../r2modmanPlus/src/model/installing/ModLoaderPackageMapping";

export function convertPlatform(platform: StorePlatform): DistributionPlatform {
  switch (platform) {
    case StorePlatform.STEAM:
      return "steam";
    case StorePlatform.STEAM_DIRECT:
      return "steam-direct";
    case StorePlatform.EPIC_GAMES_STORE:
      return "egs";
    case StorePlatform.OCULUS_STORE:
      return "oculus";
    case StorePlatform.ORIGIN:
      return "origin";
    case StorePlatform.XBOX_GAME_PASS:
      return "xbox-game-pass";
    case StorePlatform.OTHER:
      return "other";
  }
}

export function convertGameType(gameType: GameInstanceType): GameType {
  switch (gameType) {
    case GameInstanceType.GAME:
      return "game";
    case GameInstanceType.SERVER:
      return "server";
  }
}

export function convertDisplayMode(
  displayMode: GameSelectionDisplayMode
): DisplayType {
  switch (displayMode) {
    case GameSelectionDisplayMode.HIDDEN:
      return "hidden";
    case GameSelectionDisplayMode.VISIBLE:
      return "visible";
  }
}

export function convertModLoaderPackageMapping(
  mapping: ModLoaderPackageMapping
): ModmanModLoaderPackage {
  return {
    packageId: mapping.packageName,
    rootFolder: mapping.rootFolder,
    loader: convertPackageLoader(mapping.loaderType),
  };
}

export function convertInstallRule(
  installRule: RuleSubtype
): ModmanInstallRule {
  return {
    route: installRule.route.split("\\").join("/"),
    trackingMethod: convertTrackingMethod(installRule.trackingMethod),
    children:
      installRule.subRoutes.length > 0
        ? installRule.subRoutes.map(convertInstallRule)
        : undefined,
    defaultFileExtensions:
      installRule.defaultFileExtensions.length > 0
        ? installRule.defaultFileExtensions
        : undefined,
    isDefaultLocation: installRule.isDefaultLocation,
  };
}

export function convertTrackingMethod(
  trackingMethod: RuleSubtype["trackingMethod"]
): ModmanTrackingMethod {
  switch (trackingMethod) {
    case "SUBDIR":
      return "subdir";
    case "NONE":
      return null;
    case "STATE":
      return "state";
    case "SUBDIR_NO_FLATTEN":
      return "subdir-no-flatten";
  }
}

export function convertPackageLoader(
  packageLoader: PackageLoader
): ModmanPackageLoader {
  switch (packageLoader) {
    case PackageLoader.BEPINEX:
      return "bepinex";
    case PackageLoader.MELON_LOADER:
      return "melonloader";
    case PackageLoader.NORTHSTAR:
      return "northstar";
  }
}
