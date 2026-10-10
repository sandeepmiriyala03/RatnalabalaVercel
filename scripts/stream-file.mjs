#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const HELP = `Usage: node scripts/stream-file.mjs <file> [options]

Print a text file to the terminal one line at a time.

Options:
  -n, --line-numbers   Prefix each line with an aligned line number
  -d, --delay <ms>     Delay between lines in milliseconds (default: 0)
  -h, --help           Show this help message

Examples:
  node scripts/stream-file.mjs package.json
  node scripts/stream-file.mjs README.md --line-numbers --delay 40
`;

function parseArgs(args) {
  let filePath;
  let lineNumbers = false;
  let delayMs = 0;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }
    if (arg === "--line-numbers" || arg === "-n") {
      lineNumbers = true;
      continue;
    }
    if (arg === "--delay" || arg === "-d") {
      const value = args[index + 1];
      if (value === undefined || !/^\d+$/.test(value)) {
        throw new Error(`Expected a non-negative integer after ${arg}.`);
      }
      delayMs = Number(value);
      if (!Number.isSafeInteger(delayMs)) {
        throw new Error("Delay must be a safe integer number of milliseconds.");
      }
      index += 1;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (filePath !== undefined) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    filePath = arg;
  }

  if (!filePath) {
    throw new Error("A target file path is required.");
  }

  return { filePath, lineNumbers, delayMs, help: false };
}

async function writeLine(line) {
  if (process.stdout.write(`${line}\n`)) {
    return;
  }

  await new Promise((resolveDrain, reject) => {
    process.stdout.once("drain", resolveDrain);
    process.stdout.once("error", reject);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(HELP);
    return;
  }

  const absolutePath = resolve(options.filePath);
  const contents = await readFile(absolutePath, "utf8");
  const lines = contents.split(/\r?\n/);

  // A final newline terminates the last line; it is not an extra line to print.
  if (lines.length > 1 && lines.at(-1) === "") {
    lines.pop();
  }

  const numberWidth = String(lines.length).length;
  for (let index = 0; index < lines.length; index += 1) {
    const prefix = options.lineNumbers
      ? `${String(index + 1).padStart(numberWidth, " ")} | `
      : "";
    await writeLine(`${prefix}${lines[index]}`);

    if (options.delayMs > 0 && index < lines.length - 1) {
      await sleep(options.delayMs);
    }
  }
}

main().catch((error) => {
  console.error(`stream-file: ${error.message}`);
  process.exitCode = 1;
});
