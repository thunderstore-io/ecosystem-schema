import { ModmanInstallRule } from "../models";

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

export const CATEGORIES = {
  mods: { label: "Mods" },
  modpacks: { label: "Modpacks" },
  tools: { label: "Tools" },
  libraries: { label: "Libraries" },
  misc: { label: "Misc" },
  audio: { label: "Audio" },
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
