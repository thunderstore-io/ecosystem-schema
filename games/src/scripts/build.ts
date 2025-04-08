import fs from "fs";
import { buildSchemaJson } from "../schema/builder.js";

function runBuildCommand() {
  const outdir = "./dist";
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir);
  }
  const result = buildSchemaJson();
  const jsoned = JSON.stringify(result, undefined, 2);
  fs.writeFileSync(`${outdir}/latest.json`, jsoned);
}

runBuildCommand();
