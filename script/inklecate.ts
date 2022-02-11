import { Compiler } from '../src/compiler/Compiler';
import { CompilerOptions } from '../src/compiler/CompilerOptions';
import { Story } from '../src/engine/Story';

// const inputString = `Hello, world!`
// const inputString = `Once upon a time...

// * There were two choices.
// * There were four lines of content.

// - They lived happily ever after.
//    -> END
// `
// const inputString = `VAR hp = 2
// {hp}`

// const inputString = `-> main // NOT PASSING
// === main ===
// Should you cross the river?

// *   [Yes]
// *   [No]
// **  [Fight back]
// **  [Flee]
// - -> END
// `

// const inputString= `{ 7 / 3.0 }`
// const inputString= `* {false} non-choice`

// const inputString = `LIST Food = Pizza, Pasta, Curry, Paella
// LIST Currency = Pound, Euro, Dollar
// LIST Numbers = One, Two, Three, Four, Five, Six, Seven
// VAR all = ()`
// ~ all = LIST_ALL(Food) + LIST_ALL(Currency)`
// {all}`
// {LIST_RANGE(all, 2, 3)}`
// {LIST_RANGE(LIST_ALL(Numbers), Two, Six)}`
// {LIST_RANGE((Pizza, Pasta), -1, 100)} // allow out of range`

const inputString = `-> 2tests
    == 2tests ==
    ->END`

const c = new Compiler(inputString)
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