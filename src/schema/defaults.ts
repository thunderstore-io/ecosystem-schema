import { ModmanInstallRule, ModmanPackageLoader } from "../models";

export const BEPINEX_INSTALL_RULES: ModmanInstallRule[] = [
  {
    route: "BepInEx/plugins",
    isDefaultLocation: true,
    defaultFileExtensions: [".dll"],
    trackingMethod: "subdir",
    subRoutes: []
  },
  {
    route: "BepInEx/core",
    isDefaultLocation: false,
    defaultFileExtensions: [],
    trackingMethod: "subdir",
    subRoutes: []
  },
  {
    route: "BepInEx/patchers",
    isDefaultLocation: false,
    defaultFileExtensions: [],
    trackingMethod: "subdir",
    subRoutes: []
  },
  {
    route: "BepInEx/monomod",
    isDefaultLocation: false,
    defaultFileExtensions: [".mm.dll"],
    trackingMethod: "subdir",
    subRoutes: []
  },
  {
    route: "BepInEx/config",
    isDefaultLocation: false,
    defaultFileExtensions: [],
    trackingMethod: "none",
    subRoutes: []
  },
];

export const SHIMLOADER_INSTALL_RULES: ModmanInstallRule[] = [
  {
    route: "shimloader/mod",
    isDefaultLocation: true,
    defaultFileExtensions: [],
    trackingMethod: "subdir",
    subRoutes: [],
  },
  {
    route: "shimloader/pak",
    isDefaultLocation: false,
    defaultFileExtensions: [],
    trackingMethod: "subdir",
    subRoutes: [],
  },
  {
    route: "shimloader/cfg",
    isDefaultLocation: false,
    defaultFileExtensions: [],
    trackingMethod: "none",
    subRoutes: [],
  },
  {
    route: "shimloader/overlay",
    isDefaultLocation: false,
    defaultFileExtensions: [],
    trackingMethod: "subdir",
    subRoutes: [],
  },
];

export const UMM_INSTALL_RULES: ModmanInstallRule[] = [
  {
    route: "UMM/Mods",
    isDefaultLocation: true,
    defaultFileExtensions: [".dll"],
    trackingMethod: "subdir",
    subRoutes: [],
  },
];

export const GODOT_INSTALL_RULES: ModmanInstallRule[] = [
  {
    route: "mods",
    isDefaultLocation: true,
    defaultFileExtensions: [],
    trackingMethod: "package-zip",
    subRoutes: [],
  },
];

export const NORTHSTAR_INSTALL_RULES: ModmanInstallRule[] = [
  {
    route: "R2Northstar/mods",
    isDefaultLocation: false,
    defaultFileExtensions: [],
    trackingMethod: "state",
    subRoutes: [],
  },
];

export const INSTALL_RULES: Record<Exclude<ModmanPackageLoader, "melonloader">, ModmanInstallRule[]> = {
  bepinex: BEPINEX_INSTALL_RULES,
  bepisloader: BEPINEX_INSTALL_RULES,
  shimloader: SHIMLOADER_INSTALL_RULES,
  umm: UMM_INSTALL_RULES,
  godotml: GODOT_INSTALL_RULES,
  northstar: NORTHSTAR_INSTALL_RULES,
  lovely: [],
  gdweave: [],
  rivet: [],
  "return-of-modding": [],
  "recursive-melonloader": [],
  none: [],
};

export const NORTHSTAR_FILE_EXCLUSIONS = ["manifest.json", "README.md", "icon.png", "LICENCE"];

export const CATEGORIES = {
  mods: { label: "Mods" },
  modpacks: { label: "Modpacks" },
  tools: { label: "Tools" },
  libraries: { label: "Libraries" },
  misc: { label: "Misc" },
  audio: { label: "Audio" },
  "ai-generated": { label: "AI Generated" },
};

export const SECTIONS = {
  mods: {
    name: "Mods",
    excludeCategories: ["modpacks"],
  },
  modpacks: {
    name: "Modpacks",
    requireCategories: ["modpacks"],
  },
};
