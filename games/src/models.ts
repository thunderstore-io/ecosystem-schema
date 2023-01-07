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

export interface GameLegacyDefinition {
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

export interface GameDefinition {
  uuid: string;
  label: string;
  meta: {
    displayName: string;
    iconUrl: string;
  };
  distributions: GameDistributionDefinition[];
  legacy: GameLegacyDefinition;
}
