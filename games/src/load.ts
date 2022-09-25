import * as fs from "fs";
import * as yaml from "js-yaml";
import { GameDefinition } from "./models";

export function loadGameDefinitions(): GameDefinition[] {
  const files = fs.readdirSync("./data/generated");
  return files.map((x) => {
    // TODO: Add schema validation
    return yaml.load(
      fs.readFileSync(`./data/generated/${x}`, { encoding: "utf-8" })
    ) as GameDefinition;
  });
}
