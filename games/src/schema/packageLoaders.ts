import { ModmanPackageLoader } from "../models";

interface PackageLoaderChoice {
  value: ModmanPackageLoader;
  name: string;
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
    value: "none",
    name: "None",
  },
];
