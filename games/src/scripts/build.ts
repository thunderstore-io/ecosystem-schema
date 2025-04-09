import fs from "fs";
import { buildSchemaJson } from "../schema/builder.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ecosystemJsonSchema } from "../schema/validator";

function runBuildCommand() {
  const outdir = "./dist";
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir);
  }
  const result = buildSchemaJson();
  const toJson = (x: any) => JSON.stringify(x, undefined, 2);
  fs.writeFileSync(`${outdir}/latest.json`, toJson(result));

  const jsonSchema = zodToJsonSchema(ecosystemJsonSchema, "thunderstore");
  fs.writeFileSync(`${outdir}/latest.schema.json`, toJson(jsonSchema));
}

runBuildCommand();
