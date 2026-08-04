const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const pkg = require("../package.json");

function safeExec(cmd, fallback = "unknown") {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return fallback;
  }
}

const commitHash = safeExec("git rev-parse --short HEAD");
const commitDate = safeExec("git log -1 --format=%cI"); // ISO date of last commit

const buildInfo = {
  version: pkg.version,
  commitHash,
  commitDate,
  buildTime: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(process.cwd(), "public", "build-info.json"),
  JSON.stringify(buildInfo, null, 2)
);

console.log("✅ build-info.json generated:", buildInfo);