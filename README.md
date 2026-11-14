# Thunderstore Ecosystem Schema Repository

This repository is the backend to [Thunderstore](https://thunderstore.io)'s Communities. It houses all the information needed for each community, specialized for each community. 

* This Repository is managed primarily by [Ethan Green (Metherul)](https://github.com/ethangreen-dev/).
* The Repository Guide is written by [Ethan Green (Metherul)](https://github.com/ethangreen-dev/) with the help of [Chaosyr](https://github.com/Chaosyr).

## FAQ:
1. How do I add a Community to [Thunderstore](https://thunderstore.io)?
    1. For most cases you don't need to make a PR, and instead you want to join the [Thunderstore Discord](https://discord.gg/mMdFYvKxqD) and open a request with the following information under the `game-requests` forum.

    The Requirements are as follows:
    * The Link to the Community's Primary Page
        * For a Game that would be a link to the game as well as its store pages, such as a Steam Link like [Inscryption](https://store.steampowered.com/app/1092790/Inscryption).
        * If your community is not a game, wherever the community is found, for example the Content Loader "Mine Trading Cards" would be: [Curseforge: Mine Trading Cards](https://www.curseforge.com/minecraft/mc-mods/mine-trading-cards-open-source-edition), [Modrinth: Mine Trading Cards](https://modrinth.com/mod/mine-trading-cards), and [Minecraft Forum: Mine Trading Cards](https://www.minecraftforum.net/forums/mapping-and-modding-java-edition/minecraft-mods/2913625-mine-trading-cards-open-source-updated-by)
      * [IMPORTANT AND REQUIRED]: Are there any authors within the community interested in using [Thunderstore](https://thunderstore.io) for uploading their content? This can be yourself if you have mods ready for upload, or someone else in the community if you have proof they want to use [Thunderstore](https://thunderstore.io).
      * The following links are ideal if you have them, that way we can list them with your community.
        * The Discord Associated with your Community such as a Modding Discord.
        * The WIKI Associated with your Community such as a Wiki Describing a Core API or linking out to a central place to get started modding the game. Three examples are [HytaleModding](https://hytalemodding.dev/en/docs), [Inscryption Modding Wiki](https://inscryptionmodding.wiki.gg/), [InscryptionAPI Wiki](https://inscryptionmodding.github.io/InscryptionAPI/wiki/index.html)
      * What Engine (if the Community is a Game) is relevant for the Community, the exact version is ideal if you can get it.
        * If Unity whether it is am IL2CPP or Mono Game.
        * What Mod Loader(s) does the game use, this can be for example [BepInEx](https://github.com/BepInEx/BepInEx/releases), [MelonLoader](https://github.com/LavaGang/MelonLoader/releases), [GDWeave](https://github.com/NotNite/GDWeave/releases) or even something custom, but if it is custom keep in mind we may need additional time for the request because it requires new Technology.
      * Anything Else that may be relevant to the request, such as how a custom loader works, or how your community would be using Thunderstore.
2. I need a new Category for my Community, how do I request it?
    1. You can A.) Open an Issue to this Repository/PR the Changes, or B.) Mention it to us through the aforementioned Game Requests form, please reuse the existing post if available before making a new one.
3. I need something more advanced for my community, how do I request it?
    1. Similar to the last question the same options apply, but processing may take a bit longer depending on how complex of a thing your asking for.
4. How does the Ecosystem Work?
    1. See the [Ecosystem Setup](#ecosystem-setup) section.
5. How can I contribute to the Ecosystem?
    1. See the [Contributor Information](#contributor-information) for relevant details. 

## Contributor Information
The following is some useful information for someone seeking to contribute to this repository, or work with the Ecosystems directly.

### Getting started

Install Node.js 22 or newer and Yarn 1.22, then run these commands from the
repository root:

```bash
yarn install --frozen-lockfile
yarn run validate
```

To add a game, follow [Adding Support For New Games](ADD_GAME.md). The addition
script creates a YAML entry in `data/`:

```bash
yarn run add
```

### Repository layout

- `data/`: Game and community definitions
- `assets/`: Game icons, covers, and backgrounds
- `installers/`: Package installer definitions
- `misc/`: Mod loader package registrations
- `src/`: Schema models, validation, and scripts

### Usage

#### Check changes

```bash
yarn run lint
yarn test
yarn run validate
```

#### Build game definitions into JSON

```bash
yarn run build
```

The combined definitions and their JSON Schema are written to
`dist/latest.json` and `dist/latest.schema.json`.

#### Serve the schema and assets locally

```bash
yarn run serve
```

Builds the schema, then serves the schema and asset files on
`http://localhost:1337`. The port can be overridden via the `PORT`
environment variable.

#### Deploy the latest generated schema

This requires the `DEPLOY_API_KEY` and `DEPLOY_API_URL` configuration options to
be set. See [Configuring](#configuring) for more details.

```bash
yarn run deploy
```

The CI pipeline does this automatically when changes are merged into `master`.

### Configuring

Configuration can be provided as environment variables or by adding a `.env`
file at the repository root, next to `package.json`.

| Name | Description |
|------|-------------|
| `DEPLOY_API_URL` | API URL where the built schema is posted |
| `DEPLOY_API_KEY` | API key used with `DEPLOY_API_URL` |
| `LATEST_SCHEMA_URL` | API URL where the latest schema is located, for comparing changes |

### Goals

- IDs are permanent and should not be deleted from newer versions of the schema
- CI pipeline should check and guarantee the above
- All versions should be retained in history
- YAML is only an intermediate format, it should be generated with TypeScript
- YAML is built into JSON for distribution

## Ecosystem Setup
This section will expand as time goes on. However, the following is how some of the major components work, if you have finer questions ask [Ethan](https://github.com/ethangreen-dev/) or [Chaosyr](https://github.com/Chaosyr)

### The Basics
The following are some basic fields and what they do in the Ecosystem.
| Name | Internal Schema Name | What does it do? |
|:-|:-|:-:|
| UUID | `uuid` | This is the unique identifier for the community, if you need to make one visit [UUID Generator](https://www.uuidgenerator.net/). |
| Label | `label` | This is the internal name, identifier, and slug associated with the community, it must follow this [Regex](regexr.com/8otik). |

### Advanced Sections
Some of the more advanced sections are described below, the pattern from [The Basics](#the-basics) will carry from here on. 
| Name | Internal Schema Name | What does it do? |
|:-|:-|:-:|
| [Meta Data](#meta-data) | `meta` | This is shared information between other sections of the Ecosystem, such as the Mod Managers or Website. |
| [Platform Data](#platform-data) | `distibutions` | This is information related to the Community (Namely Game-Based) Ecosystem in the form of Platform's the Game/Content Loader/Other is distributed through. |
| [Mod Manager Data](#mod-manager-data) | `r2modman` | This is information related to how Mod Manager's should handle the Community in terms of installing the content. If your community already has its own Content Management system, just set this to `null`, that way Mod Managers will happily ignore it. |
| [Thunderstore Data](#thunderstore-data) | `thunderstore` | This is information related to how the Website should handle the Community, in terms of Asset's to show, Categories, Sections, Display Names etc. |

### Meta Data

### Platform Data

### Mod Manager Data

### Thunderstore Data

