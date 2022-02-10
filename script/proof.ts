
import { Compiler } from "../src/compiler/Compiler"
import * as path from "path";
import * as fs from "fs";
import { Story } from "../src/engine/Story";
import { diff } from "jest-diff";

let baselinePath = path.join(
    getRootDir(),
    "tests",
    "ink-proof"
  );


function testAll(from: number, to: number){
    const report = {
        'ok': 0,
        'compile': 0,
        'runtime': 0,
        'transcript': 0
    }

    for (let ii = from; ii <= to; ii++) {    
        const {meta, story, input, transcript} = iterRead(ii);
        process.stdout.write(`${fullTestId(ii)} ${meta.oneLineDescription}: `);
        let compiled: string| void;
        try {
            compiled = compile(story);
            debugger;
            if(!compiled) {
                throw new Error(`Test ${ii}`);
            }
        } catch (error) {
            process.stdout.write(`🚨 Compile error : ${error}\n`);
            throw error;
            
            report.compile++
            continue;
        }
        let ran = '';
        try {
            ran = run(compiled, input);
        } catch (error) {
            process.stdout.write(`⚙️ Runtime error : ${error}\n`);
            report.runtime++
            continue;
        }

        if(ran == transcript){
            process.stdout.write('✅');
            report.ok++
        }else{
            process.stdout.write('✍🏻');
            process.stdout.write(showDiff(transcript, ran));
            report.transcript++

        }
        
        process.stdout.write("\n");
    }    
    process.stdout.write("\n\n====== Report =====\n");
    process.stdout.write(`✅ success: ${report.ok}\n`);
    process.stdout.write(`🚨 fail to compile: ${report.compile}\n`);
    process.stdout.write(`⚙️  fail to run: ${report.runtime}\n`);
    process.stdout.write(`✍🏻 fail to transcript: ${report.transcript}\n`);
    
}

function compile(inputString: string): string | void{
    const c = new Compiler(inputString);
    const rstory = c.Compile();
    return rstory.ToJson();
}

function run(compiledString: string, input: number[]){
    let transcript = '';
    const story = new Story(compiledString);

    do{
        while(story.canContinue){
            const nextText = story.Continue()
            transcript+= nextText;
        }

        if(story.currentChoices.length > 0){
            transcript+= '\n';
            for (let ci=0; ci<story.currentChoices.length; ++ci) {
                const choice = story.currentChoices[ci];
                
                transcript += `${choice.index+1}: ${choice.text}\n`
            }
            transcript+= '?> ';
            const nextChoice = input.shift();
            if(!nextChoice) throw new Error("Not enough choices");
            story.ChooseChoiceIndex(nextChoice);
        }else{
            break;
        }
    }while(true);

    return transcript;
}
function fullTestId(n: number){
    return `I${String(n).padStart(3,'0')}`
}
function iterRead(n: number){
    const testFolder = path.join(baselinePath, fullTestId(n));
    const meta = JSON.parse(fs.readFileSync(path.join(testFolder,'metadata.json'), "utf-8"));
    const story = fs.readFileSync(path.join(testFolder,'story.ink'), "utf-8");
    const input = fs.readFileSync(path.join(testFolder,'input.txt'), "utf-8").split('\n').map(n => parseInt(n, 10) - 1);
    const transcript = fs.readFileSync(path.join(testFolder,'transcript.txt'), "utf-8");

    return {
        meta,
        story,
        input,
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

const [fromTest, toTest] = [parseInt(process.argv[2]), parseInt(process.argv[3])] as [number|undefined, number|undefined]

testAll(fromTest || 1, toTest || fromTest || 135)
