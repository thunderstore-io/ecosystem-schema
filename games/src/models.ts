export type ModmanTrackingMethod =
  | "state"
  | "subdir"
  | "subdir-no-flatten"
  | "package-zip"
  | "none";
export type ModmanPackageLoader =
  | "bepinex"
  | "melonloader"
  | "northstar"
  | "godotml"
  | "ancient-dungeon-vr"
  | "shimloader"
  | "lovely"
  | "return-of-modding"
  | "gdweave"
  | "melonloader-recursive";

export type DistributionPlatform =
  | "steam"
  | "steam-direct"
  | "epic-games-store"
  | "oculus"
  | "origin"
  | "xbox-game-pass"
  | "other";
export type GameType = "game" | "server";
export type DisplayType = "visible" | "hidden";

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
  isDefaultLocation?: boolean;
}

export interface GameModmanDefinition {
  internalFolderName: string;
  dataFolderName: string;
  settingsIdentifier: string;
  packageIndex: string;
  // exclusionsUrl: string;
  steamFolderName: string;
  exeNames: string[];
  gameInstanceType: "game" | "server";
  gameSelectionDisplayMode: "visible" | "hidden";
  // modLoaderPackages: ModmanModLoaderPackage[];
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

export interface GameDefinition {
  uuid: string;
  label: string;
  meta: {
    displayName: string;
    iconUrl?: string | null;
  };
  distributions?: GameDistributionDefinition[];
  r2modman?: GameModmanDefinition | null;
  thunderstore?: ThunderstoreCommunityDefinition;
}

export interface PackageInstallerDefinition {
  name: string;
  description: string;
}
