// import { PRNG } from '../src/engine/PRNG';



// const clamp = (minInt: number, maxInt: number) => (next: number) => {
//     let randomRange = maxInt - minInt + 1;
//     let chosenValue = (next % randomRange) + minInt;
//     return chosenValue;
// }

// const listClamp = (count: number) => (next: number) => next % count;


// //const clamper = clamp(0,7);
// const clamper = listClamp(7);
// const n = 0

// for (let i = n; i < n + 100; i++) {
//     const random = new PRNG(i)
//     const nextRandom = random.next()
//     let chosen = clamper(nextRandom);
//     console.log(nextRandom, chosen);
// }


import { Compiler } from '../src/compiler/Compiler';

const mainInk = `
{~1|2|3|4|5|6|7}
LIST lst = (a),(b),(c),(d),(e),(f),(g)
{LIST_RANDOM(lst)}
`;

const c = new Compiler(mainInk)
const rstory = c.Compile();

while(rstory.canContinue){
    const t = rstory.Continue();
    console.log(t);
}