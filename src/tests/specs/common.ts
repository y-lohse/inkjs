import * as path from "path";
import * as fs from "fs";
import { Story } from "../../engine/Story";

const rootDir = path.resolve(__dirname, "..", "..", "..");
const baselinePath = path.join(rootDir, "src", "tests", "inkfiles", "compiled");

export function loadInkFile(filename: string, category: string) {
  filename = filename + ".ink.json";

  let filePath: string;
  if (category) {
    filePath = path.join(baselinePath, category, filename);
  } else {
    filePath = path.join(baselinePath, filename);
  }

  let content = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, ""); // Strip the BOM.

  let inkPath = getInkPath();
  if (inkPath) {
    // inkPath -> loading distributable file.
    let inkjs = require(inkPath); // eslint-disable-line @typescript-eslint/no-var-requires
    return new inkjs.Story(content) as Story;
  } else {
    // No inkPath -> it's intended to be run through ts-node.
    return new Story(content);
  }
}

export function getInkPath() {
  switch (process.env.INK_TEST) {
    case "dist":
      return path.join(rootDir, "dist", "ink-es2015.js");
    case "legacy":
      return path.join(rootDir, "dist", "ink.js");
    default:
      return; // No ENV, so no inkPath.
  }
}
