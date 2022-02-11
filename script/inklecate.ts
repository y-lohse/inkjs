import { Compiler } from '../src/compiler/Compiler';
import { CompilerOptions } from '../src/compiler/CompilerOptions';
import { Story } from '../src/engine/Story';
import { PosixFileHandler } from '../src/compiler/FileHandler/PosixFileHandler';
var readline = require('readline');
import * as fs from "fs";

const help = process.argv.includes("-h");
if(help){
process.stdout.write(`
Usage: inklecate <options> <ink file>
   -o <filename>:   Output file name
   -c:              Count all visits to knots, stitches and weave points, not
                    just those referenced by TURNS_SINCE and read counts.
   -p:              Play mode
`);
process.exit(0);
}

const countAllVisit = process.argv.includes("-c");
const play = process.argv.includes("-p") || process.argv.includes("-k");
const write = process.argv.includes("-k") && !process.argv.includes("-p");
const explicitOutput = process.argv.includes("-o");
let outputfile: string|null = null;
if(explicitOutput){
    const opos = process.argv.indexOf("-o") + 1;
    outputfile = process.argv.splice(opos, 1)[0];
}
process.argv = process.argv.filter(p => !['-c', '-o', '-p', '-k'].includes(p));

const inputFile = process.argv[2] || null;
if(!inputFile){
    process.stderr.write("No input file specified. -h for help\n");
    process.exit(1);
}
outputfile = outputfile || inputFile+".json";

const fileHandler = new PosixFileHandler(inputFile);
const mainInk = fileHandler.LoadInkFileContents(inputFile);

const options = new CompilerOptions(
    inputFile, [], countAllVisit, null, fileHandler
)

const c = new Compiler(mainInk, options)
const rstory = c.Compile();

const jsonStory = rstory.ToJson()

if(jsonStory && write){
    fs.writeFileSync(outputfile, jsonStory);
}

if(jsonStory && play){
    const prompt = readline.createInterface({
        input: process.stdin, //or fileStream 
        output: process.stdout
      });
    const play = async () =>{
        const story = new Story(jsonStory);

        do{
            while(story.canContinue){
                const text = story.Continue();
                process.stdout.write(text!)
                if (story.currentTags && story.currentTags.length) {
                    process.stdout.write(" # tags: " + story.currentTags.join(", ")+ '\n')
                }
            }
            process.stdout.write("\n")
            
            if(story.currentChoices.length == 0){
                return;
            }

            for (let i=0; i<story.currentChoices.length; ++i) {
                const choice = story.currentChoices[i];
                process.stdout.write( `${i+1}: ${choice.text}\n` );
            }
            process.stdout.write("?> ");
            for await (const line of prompt) {
                const choiceIndex = parseInt(line) - 1;
                story.ChooseChoiceIndex(choiceIndex);
            }
        }while(true);
        
    }
    play().then(()=>{
        process.stdout.write("\nDONE.")
        process.exit(0);
    });
    
}