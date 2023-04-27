import { IFileHandler } from "../IFileHandler";
import * as path from "path";
import * as fs from "fs";

// This class replaces upstream's DefaultFileHandler.
export class PosixFileHandler implements IFileHandler {
  constructor(public readonly rootPath: string = "") {}

  readonly ResolveInkFilename = (filename: string): string => {
    return path.resolve(process.cwd(), this.rootPath, filename);
  };

  readonly LoadInkFileContents = (filename: string): string => {
    return fs.readFileSync(filename, "utf-8");
  };
}
