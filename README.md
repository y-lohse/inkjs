# inkjs

This is a javascript port of inkle's [ink](https://github.com/inkle/ink), a scripting language for writing interactive narrative. Please have a look at [the demo](http://yannick-lohse.fr/inkjs/)!

inkjs should support pretty much everything the original version does. If you find any bugs, please report them here! The code has zero dependencies and it should work in node and all evergreen browsers.

### How do I use this…

#### …in Node?

Install the package using `npm install inkjs`.

#### …in the browser?

There are a number of ways you might want to use the package in the browser. The easiest way is to grab the [compiled script](http://yannick-lohse.fr/inkjs/ink.iife.js) from the demo and just include it wherever you want to use it.

It's also available on bower: `bower install inkjs`

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

After that, just use the API as described in the reference documentation. The functions are nammed exactly the same.

#### Caveats (temporary) (hopefully)

- If you're using Node, make sure you convert the json file's encoding into UTF-8 without BOM. Inklecate outputs a file with BOM, but Node's `fs` doesn't strip it. You may also load the file like so: `fs.readFileSync('inkfile.json', 'UTF-8').replace(/^\uFEFF/, '')`.
- Getting and setting variables works slightly differently than the C# version at the moment. Where normally you would do `_inkStory.variablesState["player_health"] = 100`, you need to use `_inkStory.variablesState.$("player_health") = 100` here. The `$` function is a getter and a setter.

### I want to use AMD / UMD / RequireJS / some other flavour

Right now you'll need to fork the repo, then run `npm install & npm run build`. This will create a `dist` folder with the compiled file in various formats. This process is using [rollup.js](http://rollupjs.org/) so if you need another format or want to change the output in some way, you can tweak the `Gruntfile.js` which is where the compilation options are.