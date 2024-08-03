import { Story, Compiler } from 'inkjs/compiler/Compiler';
import { Choice } from 'inkjs/engine/Choice';

const inkStory = `
Once upon a time...

 * There were two choices.
 * There were four lines of content.

- They lived happily ever after.
    -> END
`

let compiler = new Compiler(inkStory);

let story: Story = compiler.Compile()

let text = story.Continue()
let choices: Choice[] = story.currentChoices

console.log(text)
for (let c of  choices){
    console.log(` * ${c.text}`)
}
