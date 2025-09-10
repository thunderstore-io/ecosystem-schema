export const ModmanTrackingMethodValues = [
  "state",
  "subdir",
  "subdir-no-flatten",
  "package-zip",
  "none",
] as const;
export type ModmanTrackingMethod = typeof ModmanTrackingMethodValues[number];

export const ModmanPackageLoaderValues = [
  "bepinex",
  "melonloader",
  "northstar",
  "godotml",
  "shimloader",
  "lovely",
  "return-of-modding",
  "gdweave",
  "recursive-melonloader",
  "bepisloader",
  "none",
] as const;
export type ModmanPackageLoader = typeof ModmanPackageLoaderValues[number];

export const DistributionPlatformValues = [
  "steam",
  "steam-direct",
  "epic-games-store",
  "oculus-store",
  "origin",
  "xbox-game-pass",
  "other",
] as const;
export type DistributionPlatform = typeof DistributionPlatformValues[number];

export const GameTypeValues = ["game", "server"] as const;
export type GameType = typeof GameTypeValues[number];

export const DisplayTypeValues = ["visible", "hidden"] as const;
export type DisplayType = typeof DisplayTypeValues[number];

export interface GameDistributionDefinition {
  platform: DistributionPlatform;
  identifier: string | null;
}

export interface ModmanModLoaderPackage {
  packageId: string;
  rootFolder: string;
  loader: ModmanPackageLoader;
}
export interface ModmanInstallRule {
  route: string;
  trackingMethod: ModmanTrackingMethod;
  subRoutes?: ModmanInstallRule[];
  defaultFileExtensions?: string[];
  isDefaultLocation: boolean;
}

export interface GameModmanDefinition {
  meta: GameDefinitionMeta;
  internalFolderName: string;
  dataFolderName: string;
  distributions?: GameDistributionDefinition[];
  settingsIdentifier: string;
  packageIndex: string;
  steamFolderName: string;
  exeNames: string[];
  gameInstanceType: GameType;
  gameSelectionDisplayMode: DisplayType;
  additionalSearchStrings: string[];
  packageLoader: ModmanPackageLoader;
  installRules: ModmanInstallRule[];
  relativeFileExclusions: string[] | null;
}

export interface ThunderstoreCommunityDefinition {
  displayName: string;
  categories?: { [key: string]: { label: string } };
  sections?: {
    [key: string]: {
      name: string;
      excludeCategories?: string[];
      requireCategories?: string[];
    };
  };
  discordUrl?: string;
  wikiUrl?: string;
  autolistPackageIds?: string[];
  shortDescription?: string;
}

type GameDefinitionMeta = {
  displayName: string;
  iconUrl?: string | null;
};

export interface GameDefinition {
  uuid: string;
  label: string;
  meta: GameDefinitionMeta;
  distributions?: GameDistributionDefinition[];
  r2modman?: GameModmanDefinition[] | null;
  thunderstore?: ThunderstoreCommunityDefinition;
}

export interface PackageInstallerDefinition {
  name: string;
  description: string;
}
