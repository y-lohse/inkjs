import { IFileHandler } from "../IFileHandler";

// This class replaces upstream's DefaultFileHandler. It doesn't perform any
// resolution and warns the user about providing a proper file handler when
// INCLUDE statements are parsed. Since the JavaScript parser can be executed in
// different environments, we let the user decide which FileHandler is best for
// their use-case. See PosixFileHandler and JsonFileHandler.
export class DefaultFileHandler implements IFileHandler {
  constructor(public readonly rootPath?: string) {}

  readonly ResolveInkFilename = (): string => {
    throw Error(
      "Can't resolve filename because no FileHandler was provided when instantiating the parser / compiler."
    );
  };

  readonly LoadInkFileContents = (): string => {
    throw Error(
      "Can't load ink content because no FileHandler was provided when instantiating the parser / compiler."
    );
  };
}
