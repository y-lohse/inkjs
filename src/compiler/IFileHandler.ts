export interface IFileHandler {
  readonly ResolveInkFilename: (
    filename: string,
    sourceFilename?: string | null
  ) => string;
  readonly LoadInkFileContents: (
    filename: string,
    sourceFilename?: string | null
  ) => string;
}

// Looking for DefaultFileHandler? POSIXFileHandler replaces it in inkjs.
