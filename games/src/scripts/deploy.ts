import fs from "fs";
import { getDeployApiKey, getDeployApiUrl } from "../config";

const outdir = "./dist";
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}
const filepath = `${outdir}/latest.json`;

if (!fs.existsSync(filepath)) {
  throw new Error(`Unable to deploy: no file found at ${filepath}`);
}

const apiUrl = getDeployApiUrl();

const response = await fetch(apiUrl, {
  method: "POST",
  body: fs.readFileSync(filepath),
  headers: {
    Authorization: getDeployApiKey(),
  },
});

if (response.status !== 200) {
  console.error(await response.text());
  throw new Error(
    `Deployment API returned a non-200 status code: ${response.status}`
  );
} else {
  console.log("Successfully deployed!");
  console.log(await response.text());
}
