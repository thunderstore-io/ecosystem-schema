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
