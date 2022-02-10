import { Compiler } from '../src/compiler/Compiler';
import { CompilerOptions } from '../src/compiler/CompilerOptions';
import { Story } from '../src/engine/Story';

// const c = new Compiler(`Hello, world!`)
// const c = new Compiler(`Once upon a time...

// * There were two choices.
// * There were four lines of content.

// - They lived happily ever after.
//    -> END
// `)
// const c = new Compiler(`VAR hp = 2
// {hp}`)

const c = new Compiler(`-> main
=== main ===
Should you cross the river?

*   [Yes]
*   [No]
**  [Fight back]
**  [Flee]
- -> END
`)
const rstory = c.Compile();

debugger;
const jsonStory = rstory.ToJson()
console.log(jsonStory)

if(jsonStory){
    const story = new Story(jsonStory);
    while(story.canContinue){
        console.log(story.Continue())
    }
    for (let ci=0; ci<story.currentChoices.length; ++ci) {
    const choice = story.currentChoices[ci];
    console.log(`${choice.index+1}: ${choice.text}\n`)
    }
}