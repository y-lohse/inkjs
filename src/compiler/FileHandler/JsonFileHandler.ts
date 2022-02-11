import { IFileHandler } from "../IFileHandler";

export class JsonFileHandler implements IFileHandler {
  constructor(public readonly fileHierarchy: Record<string, string>) {}

  readonly ResolveInkFilename = (filename: string): string => {
    if (Object.keys(this.fileHierarchy).includes(filename)) return filename;
    throw new Error(
      `Cannot locate ${filename}. Are you trying a relative import ? This is not yet implemented.`
    );
  };

  readonly LoadInkFileContents = (filename: string): string => {
    if (Object.keys(this.fileHierarchy).includes(filename)) {
      return this.fileHierarchy[filename];
    } else {
      throw new Error(`Cannot open ${filename}.`);
    }
  };
}
