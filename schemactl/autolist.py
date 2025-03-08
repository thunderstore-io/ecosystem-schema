class AutoListPackage:
    identifier: str
    description: str

    def __init__(this, identifier, description):
       this.identifier = identifier
       this.description = description

AUTOLIST_PACKAGES = {
    AutoListPackage(
        "BepInEx-BepInExPack",
        "BepInEx 5 (use this for Unity mono games)"
    ),
    AutoListPackage(
        "BepInEx-BepInExPack-IL2CPP",
        "BepInEx 6 IL2CPP (use this for Unity IL2CPP games)"
    ),
    AutoListPackage(
        "Thunderstore-unreal_shimloader",
        "Unreal Engine shimloader"
    ),
    AutoListPackage(
        "LavaGang-MelonLoader",
        "MelonLoader"
    ),
}

# Determine if the provided autolist package ID exits within AUTOLIST_PACKAGES.
def is_valid_autolist(package_id: str) -> bool:
    return len([package for package in AUTOLIST_PACKAGES if package.identifier == package_id]) != 0
