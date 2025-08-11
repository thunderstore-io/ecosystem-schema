# Games

This module contains the game definitions for the Thunderstore
ecosystem.

## Usage

### Generate a new game definition YAML

```
yarn run add
```

### Build game definitions into JSON

```
yarn run build
```

JSON file containing all the data, as well as JSON Schema file defining
the structure of the data will be placed in `dist/` folder.

### Deploy the latest generated schema

This requires the `DEPLOY_API_KEY` and `DEPLOY_API_URL` configuration options to
be set. See [Configuring](#configuring) for more details.

```
yarn run deploy
```

Note that the CI pipeline will do this automatically when changes are merged.

## Configuring

Configuration can be provided as environment variables or by adding a `.env`
file at the root of the project (next to `package.json`).

Available configuration options are as follows:

| Name                | Default Value | Description                                                                     |
|---------------------|---------------|---------------------------------------------------------------------------------|
| `DEPLOY_API_URL`    |               | API url where the built schema is posted                                        |
| `DEPLOY_API_KEY`    |               | API key used with `DEPLOY_API_URL`                                              |
| `LATEST_SCHEMA_URL` |               | API url where the latest schema is located at (to diff against when validating) |

## Goals

- IDs are permanent and should not be deleted from newer version of the schema
- CI pipeline should check and guarantee the above
- All versions should be retained in history
- YAML is only an intermediate format, it should be generated with TypesCript
- YAML is built into JSON for distribution
