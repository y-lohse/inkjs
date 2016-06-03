# inkjs

This is a javascript port of inkle's [ink](https://github.com/inkle/ink), a scripting language for writing interactive narrative.

The port is still very young and only the basic ink features are working, but the rest should follow soon. Please have a look at [the demo](http://yannick-lohse.fr/inkjs/)!

### How do I use this?

Before I explain what you can do with this port and how, I'd like to point out that there's still a lot to be done and that any help is appreciated. Please have a look at [the issues](https://github.com/y-lohse/inkjs/issues) and feel free to grab one.

### Ok cool, now how do I use this…

#### …in Node

Install the package using `npm install inkjs`.

#### …in the browser

There are a number of ways you might want to use the package in the browser. The easiest way is to grab the [compiled script](http://yannick-lohse.fr/inkjs/ink.iife.js) from the demo and just include it wherever you want to use it.

It should be made available on bower any time soon. If you'd rather use it with [RequireJS](http://requirejs.org/) or something similar, I'm afraid you'll have to build it for yourself at the moment.

### And then?

Once you grab a hold of the module, it exposes a `Story` class. It should work like [the reference implementation](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md).

In node, you would do something like this:

```
var Story = require('inkjs').Story;
var fs = require('fs');

var inkFile = fs.readFileSync('inkfile.json', 'UTF-8');
var s = new Story(inkFile);
```

Or in the browser, you'd do:

```
var Story = inkjs.Story;
fetch('inkfile.json')
.then(response => {
	return response.text();
})
.then(data => {
	var s = new Story(data);
});
```

After that, just use the API as described in the reference documentation. The function are nammed exactly the same.

**Please note** that the `Story` constructor excpects a `string`, and not an actual JSON object. At least for now.

### So can I just run any ink file?

First off, you need a compiled ink file. This is done using [inklecate](https://github.com/inkle/ink#using-inklecate-on-the-command-line).

Ok now, eventually, yes, you'll be abble to run any ink files. Here's the state of supported features:

- [x] Simple output
- [x] Choices
- [x] Knots
- [x] Diverts
- [x] Glue
- [x] Branching
- [x] Stiches
- [x] Gather
- [ ] Fallback, Sticky and Conditional choices
- [x] Variables
- [ ] Conditions
- [ ] Logic
- [ ] Math
- [x] Functions
- [ ] Game queries

Integration:

- [ ] Saving and loading
- [ ] Jumping to a scene
- [ ] Setting/getting ink variables
- [ ] Read/Visit counts
- [ ] Variable observers
- [ ] Exernal functions

### I need a custom build

Right now you'll need to fork the repo, then run `npm install & npm run build`. This will create a `dist` folder with the compiled file in various formats. This process is using [rollup.js](http://rollupjs.org/) so if you need another format or want to change the output in some way, you can tweak the `Gruntfile.js` which is where the compilation options are. 

### I'd like to help with coding, is there something I should know?

The whole codebase is very similar to the reference implementation. Because of that, I stripped away pretty much all the original comments. If you want to read the source to get familiar with the codebase, the C# version is probably a better choice.

There are only a couple of things that can't (to the best of my knowledge) be done in js, and it's mostly casting. The original code makes heavy use of casts such as `myContainer = thatOtherThingy as Container`, which are not an option is JS. These calls are usually replaced by `thatOtherThingy instanceof Container` which seem to do the job. I've left the original ones commented everywhere, just in case.
The lone exception to that is `INamedInterface`, since there are no interfaces in JS at all. So that class is actually never used and whenever it is needed, I'm using duck-typing instead. This might be a problem at some point.

You'll also notice that I do a lot of borderline moronic calls, such as extra variable assignments. They are mostly there to keep the codebase as similar as possible to the reference, please leave them in place. Once everything is working and we have a test suite, we can start making things a bit more javascript-y. 
