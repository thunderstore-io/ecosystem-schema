# Thunderstore ecosystem schema

This repository contains ecosystem-wide schema definitions, such as game IDs
and their associated metadata.

## Getting started

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

## Repository layout

- `data/`: Game and community definitions
- `assets/`: Game icons, covers, and backgrounds
- `installers/`: Package installer definitions
- `misc/`: Mod loader package registrations
- `src/`: Schema models, validation, and scripts

## Usage

### Check changes

```bash
yarn run lint
yarn test
yarn run validate
```

### Build game definitions into JSON

```bash
yarn run build
```

The combined definitions and their JSON Schema are written to
`dist/latest.json` and `dist/latest.schema.json`.

### Serve the schema and assets locally

```bash
yarn run serve
```

Builds the schema, then serves the schema and asset files on
`http://localhost:1337`. The port can be overridden via the `PORT`
environment variable.

### Deploy the latest generated schema

This requires the `DEPLOY_API_KEY` and `DEPLOY_API_URL` configuration options to
be set. See [Configuring](#configuring) for more details.

```bash
yarn run deploy
```

The CI pipeline does this automatically when changes are merged into `master`.

## Configuring

Configuration can be provided as environment variables or by adding a `.env`
file at the repository root, next to `package.json`.

| Name | Description |
|------|-------------|
| `DEPLOY_API_URL` | API URL where the built schema is posted |
| `DEPLOY_API_KEY` | API key used with `DEPLOY_API_URL` |
| `LATEST_SCHEMA_URL` | API URL where the latest schema is located, for comparing changes |

## Goals

- IDs are permanent and should not be deleted from newer versions of the schema
- CI pipeline should check and guarantee the above
- All versions should be retained in history
- YAML is only an intermediate format, it should be generated with TypeScript
- YAML is built into JSON for distribution
