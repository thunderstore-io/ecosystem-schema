/** Regression tests for game definition generation. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import * as yaml from "js-yaml";
import { createDistribution, createGameDefinition, writeGameDefinition } from "./newGame.js";

const options = {
  name: "Example Game",
  distributions: [createDistribution("steam", "12345")],
  steamFolder: "Example Game/nested",
  dataFolder: "Actual_Data",
  exe: "Actual.exe, Actual.app",
  loader: "bepinex",
};

test("asset metadata is included only when assets ship", () => {
  const withoutAssets = createGameDefinition(options);

  assert.equal(withoutAssets.meta.iconUrl, null);
  assert.equal(withoutAssets.r2modman![0].meta.iconUrl, null);
  assert.equal(withoutAssets.thunderstore!.listed, undefined);
  assert.equal(withoutAssets.thunderstore!.meta, undefined);
  assert.equal(withoutAssets.thunderstore!.categories!["ai-generated"].label, "AI Generated");

  const game = createGameDefinition({ ...options, assets: true });

  assert.equal(game.meta.iconUrl, "example-game/example-game-cover-360x480.webp");
  assert.equal(game.r2modman![0].meta.iconUrl, game.meta.iconUrl);
  assert.equal(game.thunderstore!.listed, true);
  assert.deepEqual(game.thunderstore!.meta, {
    icon: "example-game/example-game-icon-192x192.webp",
    cover: "example-game/example-game-cover-360x480.webp",
    background: "example-game/example-game-bg-1920x1080.webp",
    hero: "example-game/example-game-bg-1920x620.webp",
  });
});

test("loader defaults include install rules and use modern MelonLoader", () => {
  const shimloader = createGameDefinition({ ...options, loader: "shimloader" });

  assert.deepEqual(shimloader.r2modman![0].installRules.map(rule => rule.route), [
    "shimloader/mod",
    "shimloader/pak",
    "shimloader/cfg",
    "shimloader/overlay",
  ]);

  const godot = createGameDefinition({ ...options, loader: "godotml", dataFolder: "" });
  const melonloader = createGameDefinition({ ...options, loader: "melonloader" });

  assert.equal(godot.r2modman![0].installRules[0].trackingMethod, "package-zip");
  assert.equal(melonloader.r2modman![0].packageLoader, "recursive-melonloader");
});

test("non-Steam entries accept null IDs and site-only entries preserve stores", () => {
  const distributions = [createDistribution("other")];
  const game = createGameDefinition({ ...options, distributions });

  assert.equal(game.r2modman![0].distributions![0].identifier, null);
  assert.equal(game.r2modman![0].steamFolderName, "Example Game/nested");
  assert.equal(game.r2modman![0].dataFolderName, "Actual_Data");
  assert.deepEqual(game.r2modman![0].exeNames, ["Actual.exe", "Actual.app"]);

  const siteOnly = createGameDefinition({ name: "Site Only", distributions, thunderstoreOnly: true });

  assert.equal(siteOnly.r2modman, null);
  assert.deepEqual(siteOnly.distributions, distributions);
});

test("incomplete installations and unverified community settings are rejected", () => {
  assert.throws(() => createGameDefinition({ ...options, dataFolder: undefined }), /--data-folder/);
  assert.throws(() => createGameDefinition({ ...options, autolist: "Custom-Pack" }), /Register custom packs/);
  assert.throws(() => createGameDefinition({ ...options, discord: "https://discord.gg/example" }), /consent/);
});

test("writing YAML preserves fields and never replaces an existing entry", () => {
  const scratch = path.resolve("../.scratch");
  fs.mkdirSync(scratch, { recursive: true });
  const directory = fs.mkdtempSync(path.join(scratch, "add-test-"));

  try {
    const game = createGameDefinition(options);
    const file = writeGameDefinition(game, directory);
    const content = fs.readFileSync(file, "utf8");
    const parsed = yaml.load(content) as typeof game;

    assert.equal(parsed.label, game.label);
    assert.deepEqual(parsed.r2modman, game.r2modman);
    assert.throws(() => writeGameDefinition(game, directory), /already exists/);
    assert.equal(fs.readFileSync(file, "utf8"), content);

    fs.mkdirSync(path.join(directory, "generated"));
    fs.renameSync(file, path.join(directory, "generated", "example-game.yml"));

    assert.throws(() => writeGameDefinition(game, directory), /already exists/);
    assert.equal(fs.existsSync(file), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
