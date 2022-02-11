import { IFileHandler } from "../IFileHandler";
import * as path from "path";
import * as fs from "fs";

export class PosixFileHandler implements IFileHandler {

    public readonly rootPath: string;
    constructor(rootPath: string){
        this.rootPath = path.dirname(rootPath);
    }

    readonly ResolveInkFilename = (filename: string): string =>
    {
        return path.join(this.rootPath, filename.replace(this.rootPath, ''));
    }

    readonly LoadInkFileContents = (filename: string): string =>
    {
        return fs.readFileSync(filename, "utf-8");
    }

}