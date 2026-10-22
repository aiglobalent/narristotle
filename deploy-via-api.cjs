#!/usr/bin/env node
/* Deploy narristotle-build/public to Firebase Hosting site 'narristotle'
   via the Hosting REST API. Auth: access token from the VM's gcloud ADC.
   Learned 2026-10-21: uploads must be POSTed as the exact gzipped bytes whose
   SHA256 was populated, with ONLY Authorization + Content-Length headers —
   Content-Type / Content-Encoding headers make the upload host reject them. */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const https = require("https");
const { execSync } = require("child_process");

const ROOT = path.join(process.env.HOME, "workspace/narristotle-build/public");
const API = "https://firebasehosting.googleapis.com/v1beta1/sites/narristotle";
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
          if (res.statusCode >= 300) return reject(new Error(`${method} ${url}\nHTTP ${res.statusCode}: ${d.slice(0, 500)}`));
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
  const rel = await json("GET", `${API}/releases?pageSize=1`);
  const liveVersion = rel.releases[0].version.name;
  const ver = await json("GET", `https://firebasehosting.googleapis.com/v1beta1/${liveVersion}`);
  const config = ver.config || {};
  console.log("live version:", liveVersion, "| config keys:", Object.keys(config).join(","));

  const created = await json("POST", `${API}/versions`, { status: "CREATED", config });
  const vname = created.name;
  console.log("created:", vname);

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

  const pop = await json("POST", `https://firebasehosting.googleapis.com/v1beta1/${vname}:populateFiles`, { files });
  const required = pop.uploadRequiredHashes || [];
  console.log("uploads required:", required.length);
  for (const h of required) {
    await req("POST", `${pop.uploadUrl}/${h}`, blobs[h], { "Content-Length": blobs[h].length });
  }
  console.log("uploaded all");

  await json("PATCH", `https://firebasehosting.googleapis.com/v1beta1/${vname}?updateMask=status`, { name: vname, status: "FINALIZED" });
  console.log("finalized");
  const rel2 = await json("POST", `${API}/releases?versionName=${encodeURIComponent(vname)}`, {});
  console.log("released:", rel2.name, "| version:", rel2.version && rel2.version.name);
})().catch((e) => { console.error(e.message); process.exit(1); });
