import { DistributionPlatform } from "../models";

interface PlatformChoice {
  value: DistributionPlatform;
  name: string;
}

export const PLATFORM_CHOICES: PlatformChoice[] = [
  {
    value: "steam",
    name: "Steam",
  },
  {
    value: "steam-direct",
    name: "Steam (bypass Steam for launching the game)",
  },
  {
    value: "epic-games-store",
    name: "Epic Games Store",
  },
  {
    value: "oculus-store",
    name: "Oculus Store",
  },
  {
    value: "origin",
    name: "EA Desktop / Origin",
  },
  {
    value: "xbox-game-pass",
    name: "Xbox Game Pass",
  },
  {
    value: "other",
    name: "Other",
  },
];
