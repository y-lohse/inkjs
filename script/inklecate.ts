import { Compiler } from '../src/compiler/Compiler';
import { Story } from '../src/engine/Story';

//const c = new Compiler("hello world");
const c = new Compiler(`Hello, world!`)
console.log(c)

const rstory = c.Compile();

debugger;
const jsonStory = rstory.ToJson()
console.log(jsonStory)

if(jsonStory){
    const story = new Story(jsonStory);
    while(story.canContinue){
        console.log(story.Continue())
    }
}