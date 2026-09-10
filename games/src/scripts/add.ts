/** Create a game definition interactively or from command-line options. */
import { input, checkbox, confirm, select } from "@inquirer/prompts";
import _ from "lodash";
import { parseArgs } from "node:util";
import { DistributionPlatformValues, GameDistributionDefinition, GameTypeValues } from "../models.js";
import { AUTOLIST_PACKAGE_CHOICES } from "../schema/autolistPackages.js";
import { GAME_TYPE_CHOICES } from "../schema/instanceTypes.js";
import { PACKAGE_LOADER_CHOICES, requiresDataFolder } from "../schema/packageLoaders.js";
import { PLATFORM_CHOICES } from "../schema/platforms.js";
import {
  createDistribution,
  createGameDefinition,
  existingDefinition,
  NewGameOptions,
  splitList,
  validateSlug,
  writeGameDefinition,
} from "../schema/newGame.js";

const loaderChoices = PACKAGE_LOADER_CHOICES.filter(choice => choice.value !== "melonloader");
const isNotEmpty = (value: string) => !!value.trim();

function printHelp() {
  console.log(`
Usage: yarn run add [options]

With no arguments, asks interactive questions. With any options, --name is required.

Community:
  -n, --name <name>            Display name
      --slug <identifier>      Kebab-case slug (defaults to the name in kebab-case)
      --description <text>     Exact store short description, at most 512 characters
      --discord <url>          Community Discord URL, requires --discord-consent
      --discord-consent        Server moderators have agreed to modding traffic
      --wiki <url>             Community wiki URL
      --assets                 Ship all four webps, write asset paths and listed: true
      --thunderstore-only      Do not add mod manager support

Distribution:
  -i, --store-id <id>          Store identifier (--steam-id is an alias)
  -p, --platform <platform>    Default: steam
                               Values: ${DistributionPlatformValues.join(", ")}
      --distribution <p[=id]>  Repeat for additional stores, or use instead of -p/-i
                               IDs may be omitted for oculus-store, origin, other

Mod manager (provide all installation fields and at least one distribution):
  -f, --steam-folder <name>    Verified install folder, including any nested exe path
  -d, --data-folder <name>     Verified data folder, use "" when not applicable
  -e, --exe <names>           Verified executable names, comma-separated for all OSes
  -l, --loader <loader>       ${loaderChoices.map(choice => choice.value).join(", ")}
                               melonloader is an alias for recursive-melonloader
  -t, --type <type>           ${GameTypeValues.join(", ")} (default: game)
  -s, --search-strings <text>  Alternative search names, comma-separated
  -a, --autolist <ids>        Standard package IDs, comma-separated. Custom packs go
                               in misc/modloader-packages.yml, not in this option.
  -h, --help                  Show this help

Examples (run from games/):
  yarn run add
  yarn run add --name "Example Game" --steam-id 12345 \\
    --steam-folder "Example Game" --data-folder "Example_Data" \\
    --exe "Example.exe" --loader bepinex --autolist BepInEx-BepInExPack --assets
  yarn run add --name "Other Game" --platform other --steam-folder "Other Game" \\
    --data-folder "Other_Data" --exe "Other.exe" --loader bepinex
  yarn run add --name "Site Only" --steam-id 12345 --thunderstore-only

Assets: games/assets/<slug>/<slug>-{icon-192x192,cover-360x480,bg-1920x1080,bg-1920x620}.webp
Without --assets, iconUrl is null and listed/thunderstore.meta are omitted.
Use --assets only when shipping all four images. Run yarn run validate before submitting.
Verify engine, Unity runtime and executable bitness before selecting an autolist pack.
`);
}

function parseCliOptions(): NewGameOptions | null {
  const { values } = parseArgs({
    options: {
      name: { type: "string", short: "n" },
      slug: { type: "string" },
      "store-id": { type: "string", short: "i" },
      "steam-id": { type: "string" },
      platform: { type: "string", short: "p" },
      distribution: { type: "string", multiple: true },
      "steam-folder": { type: "string", short: "f" },
      "data-folder": { type: "string", short: "d" },
      exe: { type: "string", short: "e" },
      loader: { type: "string", short: "l" },
      type: { type: "string", short: "t" },
      discord: { type: "string" },
      "discord-consent": { type: "boolean" },
      wiki: { type: "string" },
      autolist: { type: "string", short: "a" },
      "search-strings": { type: "string", short: "s" },
      description: { type: "string" },
      assets: { type: "boolean" },
      "thunderstore-only": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    printHelp();
    return null;
  }

  if (!values.name?.trim()) {
    throw new Error("--name is required when supplying command-line options. Use --help for usage.");
  }

  if (values["store-id"] !== undefined && values["steam-id"] !== undefined) {
    throw new Error("Use either --store-id or --steam-id, not both.");
  }

  const distributions: GameDistributionDefinition[] = [];
  const storeId = values["store-id"] ?? values["steam-id"];

  if (storeId !== undefined || values.platform !== undefined) {
    distributions.push(createDistribution(values.platform ?? "steam", storeId));
  }

  for (const distribution of values.distribution ?? []) {
    const [platform, ...identifier] = distribution.split("=");
    distributions.push(createDistribution(platform, identifier.join("=")));
  }

  return {
    name: values.name,
    slug: values.slug,
    distributions,
    steamFolder: values["steam-folder"],
    dataFolder: values["data-folder"],
    exe: values.exe,
    loader: values.loader,
    type: values.type,
    discord: values.discord,
    discordConsent: values["discord-consent"],
    wiki: values.wiki,
    autolist: values.autolist,
    searchStrings: values["search-strings"],
    description: values.description,
    assets: values.assets,
    thunderstoreOnly: values["thunderstore-only"],
  };
}

async function promptDistributions(): Promise<GameDistributionDefinition[]> {
  const distributions: GameDistributionDefinition[] = [];
  let addAnother = true;

  console.log("Check other storefronts too (for example, using IsThereAnyDeal). Only add verified distributions.");

  while (addAnother) {
    const platform = await select({
      message: "Which store is the game available on?",
      choices: PLATFORM_CHOICES,
    });

    const identifier = await input({
      message: "Game's store identifier (optional for Oculus, Origin, and Other)",
      validate: value => {
        try {
          createDistribution(platform, value);
          return true;
        } catch (error) {
          return (error as Error).message;
        }
      },
    });

    distributions.push(createDistribution(platform, identifier));

    addAnother = await confirm({
      message: "Add another store distribution?",
      default: false,
    });
  }

  return distributions;
}

async function promptOptions(): Promise<NewGameOptions> {
  const name = await input({
    message: "Display name for the community",
    validate: isNotEmpty,
  });

  const slug = await input({
    message: "Identifier for the community (slug)",
    default: _.kebabCase(name),
    validate: value => {
      if (!validateSlug(value)) {
        return "Use a non-empty kebab-case slug.";
      }

      const existing = existingDefinition(value);

      if (existing) {
        return `${existing} already exists. Edit the existing definition instead.`;
      }

      return true;
    },
  });

  let discord = await input({
    message: "Discord URL for the community (optional)",
  });
  let discordConsent = false;

  if (discord) {
    discordConsent = await confirm({
      message: "Have the server moderators agreed to receive modding traffic, including support and NSFW mod discussions?",
      default: false,
    });

    if (!discordConsent) {
      console.log("Leaving the Discord URL out until server consent is verified.");
      discord = "";
    }
  }

  const wiki = await input({
    message: "Wiki URL for the community (optional)",
  });

  const description = await input({
    message: "Exact store short description (optional)",
    validate: value => value.length <= 512 || "Maximum 512 characters.",
  });

  console.log("Verify Unity Mono/IL2CPP and executable bitness before choosing a pack. Custom packs must be registered separately.");

  const autolist = await checkbox({
    message: "Automatically list standard packages",
    choices: AUTOLIST_PACKAGE_CHOICES,
  });

  const assets = await confirm({
    message: "Ship all four asset webps (icon, cover, background, hero) in this PR?",
    default: false,
  });

  const managerSupport = await confirm({
    message: "Add mod manager support (TSMM/r2modman)?",
    default: true,
  });

  let addDistributions = managerSupport;

  if (!managerSupport) {
    addDistributions = await confirm({
      message: "Add store distributions?",
      default: true,
    });
  }

  const distributions = addDistributions ? await promptDistributions() : [];
  const options: NewGameOptions = {
    name,
    slug,
    discord,
    discordConsent,
    wiki,
    description,
    autolist: autolist.join(","),
    assets,
    distributions,
    thunderstoreOnly: !managerSupport,
  };

  if (!managerSupport) {
    return options;
  }

  options.type = await select({
    message: "Select type",
    choices: GAME_TYPE_CHOICES,
  });

  const loader = await select({
    message: "Package loader",
    choices: loaderChoices,
  });
  options.loader = loader;

  const usesSteam = distributions.some(d => d.platform === "steam" || d.platform === "steam-direct");

  options.steamFolder = await input({
    message: "Verified install folder (include any nested executable directory, use forward slashes)",
    validate: usesSteam ? isNotEmpty : undefined,
  });

  options.dataFolder = await input({
    message: "Verified data folder from the game build (leave empty if not applicable)",
    validate: requiresDataFolder(loader) ? isNotEmpty : undefined,
  });

  options.exe = await input({
    message: "Verified executable names for all supported OSes (comma-separated)",
    validate: value => splitList(value).length > 0,
  });

  options.searchStrings = await input({
    message: "Additional search strings (optional, comma-separated)",
  });

  return options;
}

async function runAddCommand() {
  const options = process.argv.length > 2 ? parseCliOptions() : await promptOptions();

  if (!options) {
    return;
  }

  const game = createGameDefinition(options);
  const file = writeGameDefinition(game);
  const modman = game.r2modman?.[0];

  console.log(`${file} was created. Review it and run yarn run validate before submitting a PR.`);

  if (options.assets) {
    console.log(`Asset paths were written. All four webps must be in games/assets/${game.label}/ before validation.`);
  } else {
    console.log("iconUrl is null and listing is not enabled. Edit the definition's asset fields once all four images are available.");
  }

  if (modman?.installRules.length) {
    console.log(`Default ${modman.packageLoader} install rules were added.`);
  }

  if (modman?.packageLoader === "umm") {
    console.log("UMM requires a game-specific pack and Config.xml. Register it in misc/modloader-packages.yml.");
  }
}

runAddCommand().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
