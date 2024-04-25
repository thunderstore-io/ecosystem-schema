import { buildSchemaJson } from "../schema/builder";
import { validateSchemaJson } from "../schema/validator";

async function runValidateCommand() {
  validateSchemaJson(buildSchemaJson());
  console.log("Schema validated successfully!");
}

await runValidateCommand();
