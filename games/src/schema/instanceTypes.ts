import { GameType } from "../models";

interface GameTypeChoice {
  value: GameType;
  name: string;
}

export const GAME_TYPE_CHOICES: GameTypeChoice[] = [
  {
    value: "game",
    name: "Game",
  },
  {
    value: "server",
    name: "Dedicated server",
  },
];
