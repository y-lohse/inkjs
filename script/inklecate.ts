import { Compiler } from '../src/compiler/Compiler';

//const c = new Compiler("hello world");
const c = new Compiler(`
Once upon a time...
`)
console.log(c)

const res = c.Compile();
console.log(res)