export type ModmanTrackingMethod =
  | "state"
  | "subdir"
  | "subdir-no-flatten"
  | null;
export type ModmanPackageLoader = "bepinex" | "melonloader" | "northstar";

export type DistributionPlatform =
  | "steam"
  | "steam-direct"
  | "egs"
  | "oculus"
  | "origin"
  | "xbox-game-pass"
  | "other";
export type GameType = "game" | "server";
export type DisplayType = "visible" | "hidden";

export interface GameDistributionDefinition {
  platform: DistributionPlatform;
  identifier?: string;
}

export interface ModmanModLoaderPackage {
  packageId: string;
  rootFolder: string;
  loader: ModmanPackageLoader;
}
export interface ModmanInstallRule {
  route: string;
  trackingMethod: ModmanTrackingMethod;
  children?: ModmanInstallRule[];
  defaultFileExtensions?: string[];
  isDefaultLocation?: boolean;
}

export interface GameModmanDefinition {
  internalFolderName: string;
  dataFolderName: string;
  settingsIdentifier: string;
  packageIndex: string;
  exclusionsUrl: string;
  steamFolderName: string;
  exeNames: string[];
  gameInstancetype: "game" | "server";
  gameSelectionDisplayMode: "visible" | "hidden";
  modLoaderPackages: ModmanModLoaderPackage[];
  installRules: ModmanInstallRule[];
  relativeFileExclusions?: string[];
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

export interface GameDefinition {
  uuid: string;
  label: string;
  meta: {
    displayName: string;
    iconUrl: string;
  };
  distributions?: GameDistributionDefinition[];
  r2modman?: GameModmanDefinition;
  thunderstore?: ThunderstoreCommunityDefinition;
}

export interface PackageInstallerDefinition {
  name: string;
  description: string;
}
