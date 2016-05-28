# jsink

This is a javascript port of [ink](https://github.com/inkle/ink). It's still super-alpha but the basics are working.

### How do I use this?

Before I explain what you can do with this port and how, I'd like to aks for some help. These things in particular would be great:

- Write a test suite. There is [a reference one](https://github.com/inkle/ink/tree/master/tests) that would be great to have here too, but even manual tests are welcome right now.
- Publish on some package managers (mostly npm & bower)
- Write a player in a browser
- Port the inklecate compiler to js (big thing)
- Use npm scripts for building instead of grunt, and minify the output

### Ok cool, now how do I use this?

Right now things are a bit rough. You need to clone this repo, then `npm install & grunt rollup`. This will create a folder called `dist` with two files in it.
The `.cjs` version is for CommonJS and you'd mostly use that width Node. The `.amd` version is for the browser and is used with a module loader, for example [RequireJS](http://requirejs.org/).

Once you grab a hold of the module, it exposes a `Story` class. It should work like [the reference implementation](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md).

### So I can just run any ink files?

Right now, this port supports choices and diverts. A few other things *might* accidentally work but I haven't tried yet. Regardless, it should'nt take too long until everything works like the C# version.

### What's up with all this module loading?

The code is written using ES6 synthax, which is really useful for a lot of things. Sadly this requires a "compiling" step before it can actually be used. There's probably a way to make it work without RequireJS but I haven't looked into it.

### I'd like to help with coding, is there something I should know?

The whole codebase is very similar to the reference implementation. Because of that, I stripped away pretty much all the original comments. If you want to read the source to get familiar with the codebase, the C# version is probably a better choice.

There are only a couple of things that can't (to the best of my knowledge) be done in js, and it's mostly casting. The original code makes heavy use of casts such as `myContainer = thatOtherThingy as Container`, which are not an option is JS. These calls are usually replaced by `thatOtherThingy instanceof Container` which seem to do the job. I've left the original ones commented everywhere, just in case.
The lone exception to that is `INamedInterface`, since there are no interfaces in JS at all. So that class is actually never used and whenever it is needed, I'm using duck-typing instead. This might be a problem at some point.

You'll also notice that I do a lot of borderline moronic calls, such as extra variable assignments. They are mostly there to keep the codebase as similar as possible to the reference, please leave them in place. Once everything is working and we have a test suite, we can start making things a bit more javascript-y. 

The only exception to that rule is the large amount of functions that use the public members of their class instead of the private ones. If you know what I mean, feel free to change that.