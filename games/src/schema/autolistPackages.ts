export const AUTOLIST_PACKAGE_CHOICES = [
  {
    value: "BepInEx-BepInExPack",
    name: "BepInEx 5 (use this for Unity mono games)",
  },
  {
    value: "BepInEx-BepInExPack_IL2CPP",
    name: "BepInEx 6 IL2CPP (use this for Unity IL2CPP games)",
  },
  {
    value: "Thunderstore-unreal_shimloader",
    name: "Unreal Engine shimloader",
  },
  {
    value: "LavaGang-MelonLoader",
    name: "MelonLoader",
  },
];

const AUTOLIST_PACKAGE_IDS = AUTOLIST_PACKAGE_CHOICES.map((x) => x.value);

export function isAutolistPackageValid(autolistPackageId: string): boolean {
  return AUTOLIST_PACKAGE_IDS.indexOf(autolistPackageId) > -1;
}
