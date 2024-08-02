import { Story, Compiler } from 'inkjs/full';

const inkStory = `
Once upon a time...

 * There were two choices.
 * There were four lines of content.

- They lived happily ever after.
    -> END
`

let story: InstanceType<typeof Story>;

let compiler: InstanceType<typeof Compiler> = new Compiler(inkStory);

 story = compiler.Compile()

let text = story.Continue()

console.log(text)
