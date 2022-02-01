import { IFileHandler } from "./IFileHandler";
import { readFileSync } from 'fs';

export class FileHandler implements IFileHandler{
    readonly ResolveInkFilename = (filename: string): string =>
    {
        return filename;
    };
    readonly LoadInkFileContents = (filename: string): string =>
    {
        return `
        Once upon a time...

 * There were two choices.
 * There were four lines of content.

- They lived happily ever after.
    -> END

        `
    };
}