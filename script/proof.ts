
import { Compiler } from "../src/compiler/Compiler"
import * as path from "path";
import * as fs from "fs";
import { Story } from "../src/engine/Story";
import { diff } from "jest-diff";
import { PosixFileHandler } from "../src/compiler/FileHandler/PosixFileHandler";
import { CompilerOptions } from "../src/compiler/CompilerOptions";

let baselinePath = path.join(
    getRootDir(),
    "src",
    "tests",
    "ink-proof"
  );

let stopOnError = false;

function testAll(from: number, to: number){
    const report = {
        'ok': 0,
        'compile': 0,
        'runtime': 0,
        'transcript': 0
    }

    for (let ii = from; ii <= to; ii++) {    
        const {meta, story, input, filename, transcript} = iterRead(ii);
        process.stdout.write(`${fullTestId(ii)} ${meta.oneLineDescription}: `);
        let compiled: string| void;
        try {
            compiled = compile(story, filename);
            if(!compiled) {
                throw new Error(`Test ${ii}`);
            }
        } catch (error) {
            process.stdout.write(`🚨 Compile error : ${error}\n`);
            if(stopOnError)
                throw error;
            
            report.compile++
            continue;
        }
        let ran_transcript = '';
        let errors = [];
        let encounterUnexpectedRuntimeError: string|false = false;
        try {
            [ran_transcript, errors] = run(compiled, input);
            if(errors.length > 0) encounterUnexpectedRuntimeError = errors.join("\n")
        } catch (error) {
            encounterUnexpectedRuntimeError = `${error}`;
        }

        if(ran_transcript == transcript){
            process.stdout.write('✅ ');
            report.ok++
        }else{

            if(meta.hide != undefined){
                process.stdout.write('✅⚠️  ');
                process.stdout.write(`${meta.hide}`)
                report.ok++
            } else if(encounterUnexpectedRuntimeError){
                process.stdout.write(`🛠 Runtime error : ${encounterUnexpectedRuntimeError}\n`);
                report.runtime++
                continue;
            } else{
                process.stdout.write('📝 ');
                process.stdout.write(showDiff(transcript, ran_transcript));
                report.transcript++
            }

        }
        
        process.stdout.write("\n");
    }    
    process.stdout.write("\n\n====== Report =====\n");
    process.stdout.write(`✅ success: ${report.ok}\n`);
    process.stdout.write(`🚨 fail to compile: ${report.compile}\n`);
    process.stdout.write(`🛠  fail to run: ${report.runtime}\n`);
    process.stdout.write(`📝 fail to transcript: ${report.transcript}\n`);
    
}

function compile(inputString: string, filename: string): string | void{
    const options = new CompilerOptions(
        filename, [], false, null, new PosixFileHandler(filename)
    )
    const c = new Compiler(inputString, options);
    const rstory = c.Compile();
    return rstory.ToJson();
}

function run(compiledString: string, input: number[]) : [string, string[]]{
    let transcript = '';
    let errors: string[] = [];
    const addToTranscript = (str: string) =>{
        transcript +=  str ;
    }
    const addToErrors = (str: string) => {
        errors.push(str)
    }
    const story = new Story(compiledString);
          story.onError = (message) => {
            addToErrors( message )
          }

    while (story.canContinue || story.currentChoices.length > 0) {
        if (story.currentChoices.length > 0) {
            transcript += "\n";
          for (let i=0; i<story.currentChoices.length; ++i) {
            const choice = story.currentChoices[i];
            addToTranscript( `${i+1}: ${choice.text}\n` );
          }
          addToTranscript( "?> " );
          const choiceIndex = input.shift();
          if(choiceIndex == undefined) break;
          story.ChooseChoiceIndex(choiceIndex);
        }
    
        if (story.currentTags && story.currentTags.length) {
            addToTranscript( "# tags: " + story.currentTags.join(", ")+ '\n' );
        }
    
        addToTranscript( story.ContinueMaximally() );
    
        if (story.currentTags && story.currentTags.length) {
            addToTranscript( "# tags: " + story.currentTags.join(", ") + '\n' );
        }
      }

    if(errors.length > 0){
        for(let e of errors){
            addToTranscript(e + "\n")
        }
    }
    
    return [transcript, errors];
}
function fullTestId(n: number){
    return `I${String(n).padStart(3,'0')}`
}
function iterRead(n: number){
    const testFolder = path.join(baselinePath, fullTestId(n));
    const meta = JSON.parse(fs.readFileSync(path.join(testFolder,'metadata.json'), "utf-8"));
    const filename = path.join(testFolder,'story.ink');
    const story = fs.readFileSync(filename, "utf-8");
    const input = fs.readFileSync(path.join(testFolder,'input.txt'), "utf-8")
                                .split('\n')
                                .map(n => parseInt(n, 10) - 1)
                                .filter( n => !isNaN(n))
                                ;
    const transcript = fs.readFileSync(path.join(testFolder,'transcript.txt'), "utf-8");

    return {
        meta,
        story,
        input,
        filename,
        transcript,
    }
}

function getRootDir() {
    return path.join(__dirname, "..",);
}

function showDiff(expected: string, received: string){
    const diffString = diff(expected, received, {expand: true});
    return (
    '\n\n' +
    (diffString && diffString.includes('- Expect')
        ? `Difference:\n\n${diffString}`
        : `Expected: ${expected}\n` +
        `Received: ${received}`)
    );
}

const shouldStopOnError = process.argv.includes("-soe");
if(shouldStopOnError){
    stopOnError = true;
    process.argv = process.argv.filter(p => p != "-soe");
}

const [fromTest, toTest] = [parseInt(process.argv[2]), parseInt(process.argv[3])] as [number|undefined, number|undefined]

testAll(fromTest || 1, toTest || fromTest || 135)
