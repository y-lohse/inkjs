import { Compiler } from '../src/compiler/Compiler';

//const c = new Compiler("hello world");
const c = new Compiler(`
Once upon a time...

* There were two choices.
* There were four lines of content.

- They lived happily ever after.
-> END

`)
console.log(c)

const res = c.Compile();
console.log(res)