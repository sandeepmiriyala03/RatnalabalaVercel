import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cargoName = process.platform === "win32" ? "cargo.exe" : "cargo";
const userCargo = join(homedir(), ".cargo", "bin", cargoName);
const cargo = existsSync(userCargo) ? userCargo : "cargo";

execFileSync(cargo, [
  "build",
  "--manifest-path",
  join(root, "rust", "telugu-akshara", "Cargo.toml"),
  "--target",
  "wasm32-unknown-unknown",
  "--release",
], { cwd: root, stdio: "inherit" });

const wasmSource = join(
  root,
  "rust",
  "telugu-akshara",
  "target",
  "wasm32-unknown-unknown",
  "release",
  "telugu_akshara.wasm",
);
const wasmDirectory = join(root, "public", "wasm");
mkdirSync(wasmDirectory, { recursive: true });
copyFileSync(wasmSource, join(wasmDirectory, "telugu_akshara.wasm"));