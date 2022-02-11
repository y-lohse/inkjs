import { Compiler } from '../src/compiler/Compiler';
import { CompilerOptions } from '../src/compiler/CompilerOptions';
import { Story } from '../src/engine/Story';
import { PosixFileHandler } from '../src/compiler/FileHandler/PosixFileHandler';

const countAllVisit = process.argv.includes("-c");
const play = process.argv.includes("-p");

const fileHandler = new PosixFileHandler(process.argv[2]);
const mainInk = fileHandler.LoadInkFileContents(process.argv[2]);

const options = new CompilerOptions(
    process.argv[2], [], countAllVisit, null, fileHandler
)

const c = new Compiler(mainInk, options)
const rstory = c.Compile();

const jsonStory = rstory.ToJson()
console.log(jsonStory)

if(jsonStory && play){
    const story = new Story(jsonStory);
    while(story.canContinue){
        console.log(story.Continue())
    }
    for (let ci=0; ci<story.currentChoices.length; ++ci) {
    const choice = story.currentChoices[ci];
    console.log(`${choice.index+1}: ${choice.text}\n`)
    }
}