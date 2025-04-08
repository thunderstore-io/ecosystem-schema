import { GameInstanceType } from "../r2modmanPlus/src/model/game/GameInstanceType.js";
import {
  DisplayType,
  DistributionPlatform,
  GameType,
  ModmanInstallRule,
  ModmanModLoaderPackage,
  ModmanPackageLoader,
  ModmanTrackingMethod,
} from "./models.js";
import { StorePlatform } from "../r2modmanPlus/src/model/game/StorePlatform.js";
import { GameSelectionDisplayMode } from "../r2modmanPlus/src/model/game/GameSelectionDisplayMode.js";
import { PackageLoader } from "../r2modmanPlus/src/model/installing/PackageLoader.js";
import { RuleSubtype } from "../r2modmanPlus/src/r2mm/installing/InstallationRules.js";
import ModLoaderPackageMapping from "../r2modmanPlus/src/model/installing/ModLoaderPackageMapping.js";

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
    case "PACKAGE_ZIP":
      return "package-zip";
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
    case PackageLoader.GODOT_ML:
      return "godot";
    case PackageLoader.ANCIENT_DUNGEON_VR:
      return "ancient-dungeon-vr";
    case PackageLoader.SHIMLOADER:
      return "shimloader";
    case PackageLoader.LOVELY:
      return "lovely";
    case PackageLoader.RETURN_OF_MODDING:
      return "return-of-modding";
    case PackageLoader.GDWEAVE:
      return "gdweave";
    case PackageLoader.RECURSIVE_MELON_LOADER:
      return "melonloader-recursive";
  }
}
