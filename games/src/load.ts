import * as fs from "fs";
import * as yaml from "js-yaml";
import { GameDefinition } from "./models";
import { lstatSync } from "fs";

export function loadGameDefinitions(): {
  manual: GameDefinition[];
  generated: GameDefinition[];
} {
  const generated = fs.readdirSync("./data/generated").map((x) => {
    // TODO: Add schema validation
    return yaml.load(
      fs.readFileSync(`./data/generated/${x}`, { encoding: "utf-8" })
    ) as GameDefinition;
  });
  const manual = fs
    .readdirSync("./data")
    .filter((x) => lstatSync(`./data/${x}`).isFile())
    .map((x) => {
      // TODO: Add schema validation
      return yaml.load(
        fs.readFileSync(`./data/${x}`, { encoding: "utf-8" })
      ) as GameDefinition;
    });
  // TODO: Add schema validation
  return { generated, manual };
}
