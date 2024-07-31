import { Compiler } from 'inkjs/full';

const inkStory = `
Once upon a time...

 * There were two choices.
 * There were four lines of content.

- They lived happily ever after.
    -> END
`

const s = new Compiler(inkStory).Compile()

let text = s.Continue()

console.log(text)
