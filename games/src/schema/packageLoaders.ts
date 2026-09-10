import { ModmanPackageLoader } from "../models";

interface PackageLoaderChoice {
  value: ModmanPackageLoader;
  name: string;
}

export function requiresDataFolder(loader: string): boolean {
  return ["bepinex", "shimloader", "umm", "recursive-melonloader"].includes(loader);
}

export const PACKAGE_LOADER_CHOICES: PackageLoaderChoice[] = [
  {
    value: "bepinex",
    name: "BepInEx",
  },
  {
    value: "recursive-melonloader",
    name: "MelonLoader (v0.7.0+)",
  },
  {
    value: "melonloader",
    name: "MelonLoader (legacy)",
  },
  {
    value: "shimloader",
    name: "Unreal Shimloader",
  },
  {
    value: "godotml",
    name: "Godot Mod Loader",
  },
  {
    value: "return-of-modding",
    name: "Return Of Modding",
  },
  {
    value: 'bepisloader',
    name: "Bepisloader",
  },
  {
    value: "northstar",
    name: "Northstar",
  },
  {
    value: "lovely",
    name: "Lovely",
  },
  {
    value: "gdweave",
    name: "GDWeave",
  },
  {
    value: "umm",
    name: "Unity Mod Manager",
  },
  {
    value: "rivet",
    name: "Rivet",
  },
  {
    value: "none",
    name: "None",
  },
];
