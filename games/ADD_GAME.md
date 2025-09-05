# Adding Support For New Games

## The Process

To add a new game to Thunderstore, follow these steps:

1. Join the [Thunderstore's Discord server](https://discord.thunderstore.io/) and create a new post in the #game-requests channel. Follow the Post Guidelines and answer all questions to the best of your ability.
2. If the game request is greenlit for addition, the game's information must be added to the ecosystem schema (this repository). This is usually handled by the Thunderstore staff. For more information, see the [Creating a PR](#creating-a-pr) section below.
3. Once the PR is approved and merged, Thunderstore staff will finalize adding the community and notify about it in the #game-requests channel. At this point, mods can be uploaded to and downloaded from [the Thunderstore website](https://thunderstore.io).
4. Once the PR is approved and merged, Thunderstore staff will add support for the game in the [Thunderstore Mod Manager](https://www.overwolf.com/app/thunderstore-thunderstore_mod_manager). This may take some time, as releases are usually done once or twice per week. You will be notified of the release in the #game-requests channel.

## Creating a PR

To start creating a PR, run the provider game addition script:

```bash
yarn install
yarn run add
```

This begins an interactive prompt that asks a series of questions about the game and generates a .yml file based on the answers. For most BepInEx and MelonLoader games that's enough, and a PR can be created for the .yml file.

In some cases, you'll need to manually edit the .yml file to ensure proper support for the game. Refer to the documentation below for details on each field.

## YAML File Fields

- **uuid**: A unique, auto-generated identifier for the game, used for internal validation.
- **label**: A human-readable game identifier in kebab-case.

### Meta Field

- **displayName**: The game's name, used for display in clients.
- **iconUrl**: The filename of the game's cover image.

### Distributions Array

Distributions refer to stores/platforms where the game is legally available.

- **platform**: The identifier of the store, see `DistributionPlatformValues` in [models.ts](src/models.ts) for the options
- **identifier**: The game's identifier on the given store. E.g. Steam IDs can be found on [SteamDB](https://steamdb.info/). This field is not used by all platforms.

### R2modman Array

This array contains the information required to add support for the game in r2modman and Thunderstore Mod Manager. Usually, only one entry is needed, but multiple can be provided for games with multiple versions or a dedicated server.

- **gameInstanceType**: Use `"game"` for games or `"server"` for dedicated servers.
- **distributions**: See [Distributions Array](#distributions-array).
- **steamFolderName**: The subfolder used by Steam for the game. This is used to locate the game directory. Use an empty string for non-Steam platforms.
- **dataFolderName**: Required for Unreal Engine games that rely on _unreal-shimloader_.
- **exeNames**: An array of executable names for all supported platforms (and in r2modman's case, OSes). For the "other" and "steam-direct" platforms, the first executable in the array is used to launch the game.
- **packageLoader**: The package (mod) loader used by the mod manager for this game. Only one loader is supported per game. See `ModmanPackageLoaderValues` in [models.ts](src/models.ts) for the options.
- **meta**: See [Meta field](#meta-field).
- **settingsIdentifier**: A unique identifier used internally by the mod managers.
- **internalFolderName**: A subfolder used by the mod managers to store game-related data, such as mod caches and profiles.
  - This should be the same for both `"game"` and `"server"` instance types of the same game.
- **packageIndex**: The Thunderstore API endpoint URL for the community's package listing
- **gameSelectionDisplayMode**: Use `"visible"` if the game should be available on the mod managers, otherwise use `"hidden"`
- **additionalSearchStrings**: Alternative  names that should return the game when filtering the game list (e.g. acronyms like "RoR2")
- **relativeFieldExclusions**: Used to exclude specific files, such as `manifest.json`, to mitigate conflict abuse in state-based installations.

#### InstallRules Array

These rules manage where files are placed within the profile folder, based on their file extensions. The rules are based on where the package loader used by the game expects to find the files. These are mostly used by BepInEx and legacy MelonLoader games, as well as GodotML and Northstar. Other package loaders ignore these and instead follow hardcoded conventions for file locations.

- **route**: The path, relative to the profile folder, where matching files will be placed.
- **isDefaultLocation**: Indicates whether this rule applies to files that don't match any extension-based rules.
- **defaultFileExtensions**: Defines which file extensions this rule applies to.
- **trackingMethod**: Defines the strategy used for conflict management and uninstallation:
  - `"subdir"`: Places files in their own namespaced folder inside of the `route`. 
    - Flattens content into the root of the namespaced folder unless content is inside an `override` folder.
    - If there is content in an override folder, the relevant content is moved as-packaged into the corresponding folder.
  - `"subdir-no-flatten"`: Places files in their own namespaced folder inside of the `route`. The file structure is not flattened. Override folders still behave the same.
  - `"state"`: Places files as-is in the `route`, while keeping track which files belong to which mods and managing conflicts.
  - `"package-zip"`: Places the zip directly into the `route`. Renames the zip to match `<Mod Name>.ts.zip`. Used for loaders which can load the zip directly.
  - `"none"`: Places files as-is into the `route`. These files do not have conflict management and cannot be managed further (e.g. no disable/uninstall behaviour). Ideal for config files.
- **subRoutes**: An array of InstallRule objects. Each `subRoute`'s `route` is joined with that of its parent allowing more granular control and clear organization of the routes, while avoiding repetition.

### Thunderstore Field

- **displayName**: Game's name for display purposes on the website.
- **autolistPackageId**: Allows automatically listing specific packages like a mod loader on the community. See [autoListPackages.ts](src/schema/autolistPackages.ts) for the options.

#### Categories Array

Categories (or tags) are used to filter and organize packages. In general, communities can define these as they see fit. However, note that the `modpacks` category may be used by clients to distinguish modpacks from regular mods.

- **name of the object**: A computer-friendly name for the category.
- **label**: A human-readable label for the category.

#### Sections Array

Sections are a higher-level organizational tool used to group packages based on their categories.

- **name of the object**: A computer-friendly name for the section.
- **name**: A human-readable label for the section.
- **excludeCategories**: An array of category names (not labels). A package is excluded from the section if it belongs to any of these categories.
- **requireCategories**: An array of category names (not labels). A package is included in the section if it belongs to any of these categories.

If a section defines both `requireCategories` and `excludeCategories`, a package must satisfy the `requireCategories` condition **and** must **not** satisfy the `excludeCategories` condition in order to be included in the section.

## Modloader Packages

For most games a suitable modloader package has already been registered. However, if the game requires a custom modloader package, it must be registered separately in the [modloader-packages.yml](misc/modloader-packages.yml).

- **packageId**: Package's dependency string in the Thunderstore ecosystem.
- **rootFolder**: The subfolder where the files are located to be extracted into the profile folder. Used for BepInEx.
- **loader**: PackageLoader's identifier string, see `ModmanPackageLoaderValues` in [models.ts](src/models.ts) for the options.
