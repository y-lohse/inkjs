import * as path from "path";
import * as fs from "fs";
import { Compiler, CompilerOptions } from "../../compiler/Compiler";
import { Story } from "../../engine/Story";
import { ErrorType } from "../../engine/Error";
import { PosixFileHandler } from "../../compiler/FileHandler/PosixFileHandler";
import { InkParser } from "../../compiler/Parser/InkParser";

let baselinePath = path.join(getRootDir(), "src", "tests", "inkfiles");
let jsonBaselinePath = path.join(baselinePath, "compiled");
let inkBaselinePath = path.join(baselinePath, "original");

export function loadJSONFile(filename: string, category: string) {
  let content = loadFile(jsonBaselinePath, filename + ".ink.json", category);
  return content.replace(/^\uFEFF/, ""); // Strip the BOM.
}

export function loadInkFile(filename: string, category: string) {
  return loadFile(inkBaselinePath, filename + ".ink", category);
}

export function loadFile(
  baselinePath: string,
  filename: string,
  category: string
): string {
  let filePath: string;
  if (category) {
    filePath = path.join(baselinePath, category, filename);
  } else {
    filePath = path.join(baselinePath, filename);
  }

  return fs.readFileSync(filePath, "utf-8");
}

export function createCompiler(
  content: string,
  options: CompilerOptions
): Compiler {
  let inkPath = getInkPath();
  if (inkPath) {
    // inkPath -> loading distributable file.
    let inkjs = require(inkPath); // eslint-disable-line @typescript-eslint/no-var-requires
    return new inkjs.Compiler(content) as Compiler;
  } else {
    // No inkPath -> it's intended to be run through ts-node.
    return new Compiler(content, options);
  }
}

export function createStory(content: String): Story {
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

export function isJSONRepresentationMatchingUpstream(
  json: string,
  filename: string,
  category: string
) {
  let upstreamJSON = loadJSONFile(filename, category);
  return upstreamJSON == json; // Improvement, perform a diff.
}

export function getInkPath() {
  if (process.env.INK_TEST === "dist") {
    return path.join(getRootDir(), "dist", "ink-full-es2015.js");
  } else if (process.env.INK_TEST === "legacy") {
    return path.join(getRootDir(), "dist", "ink-full.js");
  } else {
    return; // No ENV, so no inkPath.
  }
}

function getRootDir() {
  if (process.env.INK_TEST === "dist" || process.env.INK_TEST === "legacy") {
    return path.join(__dirname, "..", "..");
  } else {
    return path.join(__dirname, "..", "..", "..");
  }
}

export class TestContext {
  public story: any = undefined;
  public bytecode: any = undefined;

  public testingErrors: boolean;

  public errorMessages: Array<string> = [];
  public warningMessages: Array<string> = [];
  public authorMessages: Array<string> = [];

  constructor(testingErrors: boolean = false) {
    this.testingErrors = testingErrors;
  }

  public onError = (message: string, errorType: ErrorType) => {
    if (this.testingErrors) {
      if (errorType == ErrorType.Error) {
        this.errorMessages.push(message);
      } else if (errorType == ErrorType.Warning) {
        this.warningMessages.push(message);
      } else {
        this.authorMessages.push(message);
      }
    }
  };
}

/*
 * Simplified Test Context when testing directly from a precompiled json file
 * Useful when updating the runtime before having the compiler ready
 */
export function fromJsonTestContext(
  name: string,
  category: string,
  testingErrors: boolean = false
) {
  let context = new TestContext(testingErrors);
  let jsonContent = loadJSONFile(name, category);
  context.story = new Story(jsonContent);
  context.bytecode = context.story.ToJson();

  return context;
}

export function makeDefaultTestContext(
  name: string,
  category: string,
  countAllVisits: boolean = false,
  testingErrors: boolean = false
) {
  let context = new TestContext(testingErrors);

  let rootDir: string;
  if (category) {
    rootDir = path.join(inkBaselinePath, category);
  } else {
    rootDir = path.join(inkBaselinePath);
  }

  let fileHandler = new PosixFileHandler(rootDir);
  let ink = loadInkFile(name, category);

  let parser: InkParser;
  if (testingErrors) {
    parser = new InkParser(ink, null, context.onError, null, fileHandler);
  } else {
    parser = new InkParser(ink, null, null, null, fileHandler);
  }

  let parsedStory = parser.ParseStory();

  if (!testingErrors) {
    expect(parsedStory).not.toBeNull();
  }

  if (parsedStory == null || context.errorMessages.length > 0) {
    return context;
  }

  parsedStory.countAllVisits = countAllVisits;
  context.story = parsedStory.ExportRuntime(context.onError);

  if (!testingErrors) {
    expect(context.story).not.toBeNull();
  }

  if (context.story == null) {
    return context;
  }

  context.bytecode = context.story.ToJson();

  //TODO: Test JSON Roundtrip?

  return context;
}
