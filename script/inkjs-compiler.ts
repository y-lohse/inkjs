import { Compiler } from '../src/compiler/Compiler';
import { CompilerOptions } from '../src/compiler/CompilerOptions';
import { Story } from '../src/engine/Story';
import { PosixFileHandler } from '../src/compiler/FileHandler/PosixFileHandler';
var readline = require('readline');
var path = require('path');

import * as fs from "fs";
import { ErrorHandler } from '../src/engine/Error';

const help = process.argv.includes("-h");
if(help){
process.stdout.write(`
Usage: inkjs-compiler <options> <ink file>
   -o <filename>:   Output file name
   -c:              Count all visits to knots, stitches and weave points, not
                    just those referenced by TURNS_SINCE and read counts.
   -p:              Play mode
`);
process.exit(0);
}

const countAllVisit = process.argv.includes("-c");
const play = process.argv.includes("-p") || process.argv.includes("-k");
const write = !process.argv.includes("-k") && !process.argv.includes("-p");
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

const fileHandler = new PosixFileHandler(path.dirname(inputFile));
const mainInk = fileHandler.LoadInkFileContents(inputFile);

const errorHandler: ErrorHandler = (message, errorType) => {
    process.stderr.write(message + "\n");
};
const options = new CompilerOptions(
    inputFile, [], countAllVisit, errorHandler, fileHandler
)

const c = new Compiler(mainInk, options);
const rstory = c.Compile();
if (!rstory) {
    process.stderr.write("*** Compilation failed ***\n");
    process.exit(1);
}

const jsonStory = rstory.ToJson()

if(jsonStory && write){
    const BOM = '\u{feff}';
    fs.writeFileSync(outputfile, BOM+jsonStory);
}

if(jsonStory && play){
    const rl = readline.createInterface({
        input: process.stdin, //or fileStream
        output: process.stdout
      });

    const prompt = () => {
        return new Promise<string>((resolve, reject) => {
            rl.question('?> ', (answer: string) => {
            resolve(answer)
            })
        })
    }

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
                process.stdout.write( `${i+1}: ${choice.text}` );
                if(    story.currentChoices[i].tags !== null 
                    && story.currentChoices[i].tags!.length > 0){
                    process.stdout.write( " # tags: " + story.currentChoices[i].tags!.join(", ") );
                }
                process.stdout.write("\n")
            }
            process.stdout.write("?> ");
            do{
                const answer: string = await prompt();
                if(answer.startsWith("->")){
                    const target = answer.slice(2).trim()
                    try{
                        story.ChoosePathString(target)
                        break;
                    }catch(e: unknown){
                        if (e instanceof Error) {
                            process.stdout.write(e.message + '\n');
                        }
                    }
                }else{
                    const choiceIndex = parseInt(answer) - 1;
                    try{
                        story.ChooseChoiceIndex(choiceIndex);
                        break;
                    }catch(e: unknown){
                        if (e instanceof Error) {
                            process.stdout.write(e.message + '\n');
                        }
                    }
                }
            }while(true);
        }while(true);

    }
    play().then(()=>{
        process.stdout.write("DONE.\n")
        process.exit(0);
    });

}