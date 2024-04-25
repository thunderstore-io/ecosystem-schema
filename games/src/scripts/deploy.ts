import fs from "fs";
import { getDeployApiKey, getDeployApiUrl } from "../config";
import { assertForStatus } from "../utils/requests";

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

await assertForStatus(response);

console.log("Successfully deployed!");
console.log(await response.text());
