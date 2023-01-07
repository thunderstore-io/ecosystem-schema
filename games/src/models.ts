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

export interface GameR2modmanDefinition {
  internalFolderName: string;
  dataFolderName: string;
  settingsIdentifier: string;
  packageIndex: string;
  exclusionsUrl: string;
  steamFolderName: string;
  exeNames: string[];
  gameInstancetype: "game" | "server";
  gameSelectionDisplayMode: "visible" | "hidden";
}

export interface GameThunderstoreDefinition {
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
}

export interface GameDefinition {
  uuid: string;
  label: string;
  meta: {
    displayName: string;
    iconUrl: string;
  };
  distributions: GameDistributionDefinition[];
  r2modman: GameR2modmanDefinition;
  thunderstore?: GameThunderstoreDefinition;
}
