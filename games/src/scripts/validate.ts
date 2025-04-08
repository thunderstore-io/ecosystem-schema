import { buildSchemaJson } from "../schema/builder.js";
import { validateSchemaJson } from "../schema/validator.js";

async function runValidateCommand() {
  validateSchemaJson(buildSchemaJson());
  console.log("Schema validated successfully!");
}

// TODO: Add await if/when top level await is supported without
//       "type": "module" inclusion in package.json or after removal of
//       r2modmanPlus submodule from the repo.
runValidateCommand();
