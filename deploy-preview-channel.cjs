#!/usr/bin/env node
/* PREVIEW-ONLY deploy: narristotle-build/public to a Firebase Hosting preview
   channel (publish-queue) on site 'narristotle'. NEVER touches the live release.
   Mirrors deploy-via-api.cjs upload mechanics (gzipped SHA256, minimal headers).
   Usage: node deploy-preview-channel.cjs  (prints the preview URL at the end) */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const https = require("https");
const { execSync } = require("child_process");

const ROOT = process.env.PREVIEW_ROOT || path.join(process.env.HOME, "workspace/narristotle-build/public");
const BASE = "https://firebasehosting.googleapis.com/v1beta1";
const SITE = `${BASE}/projects/myroughdrafter/sites/narristotle`;
const CHANNEL_ID = "publish-queue";
const GCLOUD = path.join(process.env.HOME, ".local/google-cloud-sdk/bin/gcloud");
const token = execSync(`${GCLOUD} auth print-access-token`).toString().trim();

function req(method, url, body, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method,
        headers: Object.assign({ Authorization: `Bearer ${token}`, "X-Goog-User-Project": "myroughdrafter" }, headers || {}) },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          if (res.statusCode >= 300) return reject(new Error(`${method} ${url}\nHTTP ${res.statusCode}: ${d.slice(0, 800)}`));
          resolve(d ? JSON.parse(d) : {});
        });
      });
    r.on("error", reject);
    r.end(body);
  });
}
const json = (method, url, obj) => {
  const b = obj ? Buffer.from(JSON.stringify(obj)) : undefined;
  return req(method, url, b, b ? { "Content-Type": "application/json", "Content-Length": b.length } : {});
};

(async () => {
  const liveBefore = await json("GET", `${SITE}/releases?pageSize=1`);
  const liveVersionBefore = liveBefore.releases[0].version.name;
  console.log("live version BEFORE (must be unchanged at end):", liveVersionBefore);
  const ver = await json("GET", `${BASE}/${liveVersionBefore}`);
  const config = ver.config || {};

  let channel;
  try {
    channel = await json("GET", `${SITE}/channels/${CHANNEL_ID}`);
    console.log("channel exists:", channel.name);
  } catch (e) {
    console.log("creating channel:", CHANNEL_ID);
    channel = await json("POST", `${SITE}/channels?channelId=${CHANNEL_ID}`, {});
    console.log("channel created:", JSON.stringify(channel));
  }

  const created = await json("POST", `${SITE}/versions`, { status: "CREATED", config });
  const vname = created.name;
  console.log("created version:", vname);

  const files = {}, blobs = {};
  (function walk(dir) {
    for (const n of fs.readdirSync(dir)) {
      const full = path.join(dir, n);
      if (fs.statSync(full).isDirectory()) walk(full);
      else {
        const relPath = "/" + path.relative(ROOT, full);
        const gz = zlib.gzipSync(fs.readFileSync(full));
        const h = crypto.createHash("sha256").update(gz).digest("hex");
        files[relPath] = h;
        blobs[h] = gz;
      }
    }
  })(ROOT);
  console.log("files:", Object.keys(files).length);

  const pop = await json("POST", `${BASE}/${vname}:populateFiles`, { files });
  const required = pop.uploadRequiredHashes || [];
  console.log("uploads required:", required.length);
  for (const h of required) {
    await req("POST", `${pop.uploadUrl}/${h}`, blobs[h], { "Content-Length": blobs[h].length });
  }
  console.log("uploaded all");

  await json("PATCH", `${BASE}/${vname}?updateMask=status`, { name: vname, status: "FINALIZED" });
  console.log("finalized");
  const rel = await json("POST", `${SITE}/channels/${CHANNEL_ID}/releases?versionName=${encodeURIComponent(vname)}`, {});
  console.log("channel release:", JSON.stringify(rel));

  const chAfter = await json("GET", `${SITE}/channels/${CHANNEL_ID}`);
  console.log("channel after:", JSON.stringify(chAfter));
  const liveAfter = await json("GET", `${SITE}/releases?pageSize=1`);
  const liveVersionAfter = liveAfter.releases[0].version.name;
  console.log("live version AFTER:", liveVersionAfter, liveVersionAfter === liveVersionBefore ? "(UNCHANGED — good)" : "(CHANGED — BAD, investigate!)");
  if (chAfter.url) console.log("PREVIEW_URL=" + chAfter.url);
})().catch((e) => { console.error(e.message); process.exit(1); });
