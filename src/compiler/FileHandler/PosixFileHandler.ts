import { IFileHandler } from "../IFileHandler";
import * as path from "path";
import * as fs from "fs";

// This class replaces upstream's DefaultFileHandler.
export class PosixFileHandler implements IFileHandler {
  constructor(public readonly rootPath?: string) {}

  readonly ResolveInkFilename = (filename: string): string => {
    if (this.rootPath !== undefined && this.rootPath !== "") {
      return path.join(this.rootPath, filename.replace(this.rootPath, ""));
    } else {
      let workingDir = process.cwd();
      return path.join(workingDir, filename.replace(workingDir, ""));
    }
  };

  readonly LoadInkFileContents = (filename: string): string => {
    return fs.readFileSync(filename, "utf-8");
  };
}
