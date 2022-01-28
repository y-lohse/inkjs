export interface IFileHandler {
  readonly ResolveInkFilename: (filename: string) => string;
  readonly LoadInkFileContents: (filename: string) => string;
}
