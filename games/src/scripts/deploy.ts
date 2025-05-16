import fs from "fs";
import {
  getDeployApiKey,
  getDeployApiUrl,
  getDeployUrlForData,
  getDeployUrlForSchema,
} from "../config.js";
import { assertForStatus } from "../utils/requests.js";

async function doUpload(args: { filepath: string; url: string }) {
  const { filepath, url } = args;

  if (!fs.existsSync(filepath)) {
    throw new Error(`Unable to deploy: no file found at ${filepath}`);
  }

  const response = await fetch(url, {
    method: "POST",
    body: fs.readFileSync(filepath),
    headers: {
      Authorization: getDeployApiKey(),
    },
  });
  await assertForStatus(response);
  console.log(await response.text());
}

async function runDeployCommand() {
  const outdir = "./dist";
  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir);
  }

  const dataPath = `${outdir}/latest.json`;
  const schemaPath = `${outdir}/latest.schema.json`;
  const uploads = [
    {
      filepath: dataPath,
      url: getDeployApiUrl(),
    },
    {
      filepath: dataPath,
      url: getDeployUrlForData(),
    },
    {
      filepath: schemaPath,
      url: getDeployUrlForSchema(),
    },
  ];

  for (const target of uploads) {
    await doUpload(target);
  }

  // TODO: Swap to parallel uploads once serverside race condition fixed
  // const promises = uploads.map(doUpload);
  // await await Promise.all(promises);

  console.log("Deployed successfully!");
}

// TODO: Add await if/when top level await is supported without
//       "type": "module" inclusion in package.json or after removal of
//       r2modmanPlus submodule from the repo.
runDeployCommand();
