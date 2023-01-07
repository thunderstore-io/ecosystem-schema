import { GameInstanceType } from "../r2modmanPlus/src/model/game/GameInstanceType";
import { DisplayType, DistributionPlatform, GameType } from "./models";
import { StorePlatform } from "../r2modmanPlus/src/model/game/StorePlatform";
import { GameSelectionDisplayMode } from "../r2modmanPlus/src/model/game/GameSelectionDisplayMode";

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
