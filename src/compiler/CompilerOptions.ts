import { ErrorHandler } from "../engine/Error";
import { IFileHandler } from "./IFileHandler";

export class CompilerOptions {
  constructor(
    public readonly sourceFilename: string | null = null,
    public readonly pluginNames: string[] = [],
    public readonly countAllVisits: boolean = false,
    public readonly errorHandler: ErrorHandler | null = null,
    public readonly fileHandler: IFileHandler | null = null
  ) {}
}
