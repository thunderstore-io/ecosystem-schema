# Adding Support For New Games

## The Process

To add a new game to Thunderstore, follow these steps:

1. Join the [Thunderstore's Discord server](https://discord.thunderstore.io/) and create a new post in the #game-requests channel. Follow the Post Guidelines and answer all questions to the best of your ability.
2. If the game request is greenlit for addition, the game's information must be added to the ecosystem schema (this repository). This is usually handled by the Thunderstore staff. For more information, see the [Creating a PR](#creating-a-pr) section below.
3. Once the PR is approved and merged, Thunderstore staff will finalize adding the community and notify about it in the #game-requests channel. At this point, mods can be uploaded to and downloaded from [the Thunderstore website](https://thunderstore.io).
4. Once the PR is approved and merged, Thunderstore staff will add support for the game in the [Thunderstore Mod Manager](https://www.overwolf.com/app/thunderstore-thunderstore_mod_manager). This may take some time, as releases are usually done once or twice per week. You will be notified of the release in the #game-requests channel.

## Creating a PR

To start creating a PR, run the provided game addition script from `games/`:

```bash
yarn install
yarn run add
```

With no arguments, the script asks interactive questions and generates a .yml file. It supports standard loader install rules, multiple store distributions, optional assets, and Thunderstore-only communities. It refuses to replace existing manual or generated entries.

For non-interactive use, run `yarn run add --help`. For example:

```bash
yarn run add \
  --name "Example Game" \
  --steam-id 12345 \
  --steam-folder "Example Game" \
  --data-folder "Actual_Data" \
  --exe "Actual.exe,Actual.app" \
  --loader bepinex \
  --autolist BepInEx-BepInExPack \
  --assets
```

- Use verified install folders, data folders, and executables from the actual build or SteamDB. Include any nested executable directory in `steamFolderName` using forward slashes. For launcher-wrapped games, verify whether `steam-direct` is needed to preserve loader arguments.
- Check other storefronts, for example through IsThereAnyDeal. Add verified stores with repeated `--distribution platform=identifier` options. These can replace or supplement `--platform` and `--store-id` (`--steam-id` is an alias). Oculus, Origin, and Other can omit the identifier, which is written as `null`.
- Mod manager entries require a distribution, loader, install folder, data folder, and executable names. Use `--data-folder ""` for loaders without a data folder, such as GodotML. Missing fields cause an error rather than silently dropping mod manager support.
- Use `--thunderstore-only` without installation options for unsupported engines. `--loader none` by itself also creates a site-only entry, while supplying a complete installation configuration with `none` enables the mod manager's direct-copy installer.
- New MelonLoader entries use `recursive-melonloader` (v0.7.0+). The CLI normalizes `--loader melonloader` to that value. Existing legacy entries are unchanged.
- Before selecting a BepInEx autolist package, verify Mono versus IL2CPP and the executable's bitness. The standard Mono pack is x64. Custom packs, including per-game x86 packs and UMM configurations, must be registered in `misc/modloader-packages.yml`, not added to `autolistPackageIds`.
- Only supply `--discord` after server moderators consent to modding traffic. Confirm that with `--discord-consent`. The interactive flow leaves the URL out if consent is not confirmed.

### Assets

We recommend that you omit assets unless absolutely necessary, we will provide them.

Without `--assets`, both `meta.iconUrl` fields are `null`, and `thunderstore.listed` and `thunderstore.meta` are omitted. With `--assets`, both icon URLs point at the cover, `listed: true` is set, and the four community asset paths are included. Ship these files under `games/assets/<slug>/`:

| Filename | Dimensions |
|----------|------------|
| `<slug>-icon-192x192.webp` | 192×192 |
| `<slug>-cover-360x480.webp` | 360×480 |
| `<slug>-bg-1920x1080.webp` | 1920×1080 |
| `<slug>-bg-1920x620.webp` | 1920×620 |

The script generates paths, not images. Inspect the images and crops before submitting. Do not put new entries in `.legacy-allowlist`. If assets are supplied later, edit the existing YAML's asset fields rather than rerunning the add command.

Review the generated YAML for game-specific installation requirements, then run `yarn run validate`. This checks the schema and actual asset dimensions before a PR is created. Refer to the field documentation below for manual adjustments.

## YAML File Fields

- **uuid**: A unique, auto-generated identifier for the game, used for internal validation.
- **label**: A human-readable game identifier in kebab-case.

### Meta Field

- **displayName**: The game's name, used for display in clients.
- **iconUrl**: The cover image path relative to `games/assets/`, or `null` when assets are pending.

### Distributions Array

Distributions refer to stores/platforms where the game is legally available.

- **platform**: The identifier of the store, see `DistributionPlatformValues` in [models.ts](src/models.ts) for the options
- **identifier**: The game's identifier on the given store. E.g. Steam IDs can be found on [SteamDB](https://steamdb.info/). This field is not used by all platforms.

### R2modman Array

This array contains the information required to add support for the game in r2modman and Thunderstore Mod Manager. Usually, only one entry is needed, but multiple can be provided for games with multiple versions or a dedicated server.

- **gameInstanceType**: Use `"game"` for games or `"server"` for dedicated servers.
- **distributions**: See [Distributions Array](#distributions-array).
- **steamFolderName**: The game's installation folder. For nested layouts, append the executable's directory with forward slashes, such as `The Lab/TheLab/win64`. For non-Steam games, use the natural install folder name, or an empty string when unused.
- **dataFolderName**: The verified Unity data folder or Unreal game content folder. Use an empty string for loaders where this does not apply.
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

#### Override folders
You can find the most common override folders here: https://wiki.thunderstore.io/mods/packaging-your-mods

All paths have an override folder. To identify one:
- Look at the route definition
- The last part of the path can be considered an override folder. The example below shows the `plugins` override definition.
  - ```
    - route: "BepInEx/plugins"
    defaultFileExtensions: []
    trackingMethod: "subdir"
    subRoutes: []
    isDefaultLocation: true
    ```
- Sub routes work the same, so a route defined like: 
  ```
    - route: "BepInEx"
    defaultFileExtensions: []
    trackingMethod: "subdir"
    subRoutes: [
      - route: "plugins"
      defaultFileExtensions: []
      trackingMethod: "subdir"
      subRoutes: []
      isDefaultLocation: true
    ]
    isDefaultLocation: false
    ```
    actually has two override folders (`BepInEx` and `plugins`). 
    
#### Notes

We want to avoid writing directly to the BepInEx folder and so we should only specify the direct paths 
to prevent it being used as an override folder.

### Thunderstore Field

- **displayName**: Game's name for display purposes on the website.
- **autolistPackageIds**: Standard packages to automatically list in the community. See [autolistPackages.ts](src/schema/autolistPackages.ts) for the options. Custom game-specific loader packs are registered separately, not autolisted.
- **listed**: Whether the community is listed on Thunderstore. The add script sets this to `true` when assets ship.
- **meta**: Paths to the `icon`, `cover`, `background`, and `hero` images, relative to `games/assets/`.

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
