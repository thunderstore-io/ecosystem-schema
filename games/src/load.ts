import * as fs from "fs";
import * as yaml from "js-yaml";
import { GameDefinition, PackageInstallerDefinition } from "./models.js";
import { lstatSync } from "fs";

function loadYamlFromDir<T>(path: string) {
  // TODO: Add schema validation
  return fs
    .readdirSync(path)
    .filter((x) => lstatSync(`${path}/${x}`).isFile())
    .map((x) => {
      return {
        key: x.split(".")[0],
        data: yaml.load(
          fs.readFileSync(`${path}/${x}`, { encoding: "utf-8" })
        ) as T,
      };
    });
}

export function loadGameDefinitions(): {
  manual: GameDefinition[];
  generated: GameDefinition[];
} {
  const generated = loadYamlFromDir<GameDefinition>("./data/generated").map(
    (x) => x.data
  );
  const manual = loadYamlFromDir<GameDefinition>("./data").map((x) => x.data);
  return { generated, manual };
}

export function loadInstallerDefinitions(): {
  key: string;
  data: PackageInstallerDefinition;
}[] {
  return loadYamlFromDir<PackageInstallerDefinition>("./installers");
}
