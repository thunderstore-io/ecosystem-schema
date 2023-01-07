# Games

This module contains the game definitions for the Thunderstore
ecosystem.

## Usage

### Extract r2modman definitions

```
yarn run extract
```

### Build game definitions into json

```
yarn run build
```

### Generate a new game definition yml

```
yarn run add {gamename}
```

## Goals

- IDs are permanent and should not be deleted from newer version of the schema
- CI pipeline should check and guarantee the above
- All versions should be retained in history
- YAML is only an intermediate format, it should be generated with TypesCript
- YAML is built into JSON for distribution
