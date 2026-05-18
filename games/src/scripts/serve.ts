import fs from "fs";
import http from "http";
import { buildSchemaJson } from "../schema/builder.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ecosystemJsonSchema } from "../schema/validator";

const PORT = Number(process.env.PORT) || 1337;
const OUT_DIR = "./dist";
const ASSETS_DIR = "./assets";

const CONTENT_TYPES: Record<string, string> = {
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function buildSchemaFiles() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR);
  }
  const toJson = (x: any) => JSON.stringify(x, undefined, 2);
  fs.writeFileSync(`${OUT_DIR}/latest.json`, toJson(buildSchemaJson()));
  fs.writeFileSync(
    `${OUT_DIR}/latest.schema.json`,
    toJson(zodToJsonSchema(ecosystemJsonSchema, "thunderstore"))
  );
}

function serveFile(res: http.ServerResponse, filepath: string) {
  if (!fs.existsSync(filepath) || !fs.statSync(filepath).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  const dot = filepath.lastIndexOf(".");
  const ext = dot >= 0 ? filepath.slice(dot).toLowerCase() : "";
  res.writeHead(200, {
    "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
  });
  fs.createReadStream(filepath).pipe(res);
}

function handle(req: http.IncomingMessage, res: http.ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end();
    return;
  }

  const pathname = new URL(req.url || "/", "http://localhost").pathname;

  if (pathname === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  if (pathname === "/latest.json") {
    serveFile(res, `${OUT_DIR}/latest.json`);
    return;
  }
  if (pathname === "/latest.schema.json") {
    serveFile(res, `${OUT_DIR}/latest.schema.json`);
    return;
  }
  if (pathname.startsWith("/assets/") && !pathname.includes("..")) {
    serveFile(res, `.${decodeURIComponent(pathname)}`);
    return;
  }

  res.writeHead(404);
  res.end();
}

function runServeCommand() {
  buildSchemaFiles();
  const server = http.createServer(handle);
  server.listen(PORT, () => {
    console.log(`Serving schema and assets on http://localhost:${PORT}`);
    console.log(`  GET /healthz`);
    console.log(`  GET /latest.json`);
    console.log(`  GET /latest.schema.json`);
    console.log(`  GET /assets/<game>/<file>`);
  });
}

runServeCommand();
