# inkjs

This is a javascript port of inkle's [ink](https://github.com/inkle/ink), a scripting language for writing interactive narrative. Please have a look at [the demo](http://yannick-lohse.fr/inkjs/)!

inkjs should support pretty much everything the original version does. If you find any bugs, please report them here! The code has zero dependencies and it should work in node and all evergreen browsers.

## Getting started *browser version*

### Installation

Grab the most convenient format for you from the [release page](https://github.com/y-lohse/inkjs/releases). If in doubt, use the iife version.

It's also available on bower: `bower install inkjs`

### Loading inkjs

If you're using the IIFE version, add the script to your page and it will create aglobal object called `inkjs`. If you're using the AMD/UMD version, you need to require the package using your prefered mechanism.

The `inkjs` has a property called `Story`. This is the main class we will interact with.

### Loading a json file

First you need to turn your ink file into a json file [as described here](https://github.com/inkle/ink#using-inklecate-on-the-command-line).  You can then load the json file using an ajax request. You can use jquery or a simple fetch:

```
fetch('path/to/ink_file.json')
.then(function(response){
	return response.text();
})
.then(function(ink){
	//ink now contains your ink_file.json
});
```

Please note that if you are viewing your html page using the `file://` protocol (ie. you just double clicked the html file), you may run into [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) problems. In that case, you may want to load it using an html file input or directly embed the json into your page.

### Starting a story

Bringing it all together, we get something like this:

```
fetch('path/to/ink_file.json')
.then(function(response){
	return response.text();
})
.then(function(ink){
	//create a story
	var inkStory = new inkjs.Story(ink);
	
	//run it
	var content = inkStory.ContinueMaximally();
	//add the content on the page
	document.querySelector('#display').html = content;
	
	//etc
});
```

From there on, you can follow [the official guide](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#getting-started-with-the-runtime-api). All functions are named exactly the same.

For an example implementation, you can refer to the source code of the demo page [here](https://github.com/y-lohse/inkjs/blob/gh-pages/index.html).

## Getting started *node version*

### Installation

Install using npm: `npm install inkjs`.

### Loading inkjs

Require the module: `var Story = require('inkjs').Story;`.

### Loading a json file

You can load the json file using a simple call to `require`:

```
var json = require('./ink_file.json');
```

You can also load it using `fs`. In that case, please note that inklecate outputs a json file encoded **with** BOM, and node isn't very good at handling that.

```
var fs = require('fs');
var json = fs.readFileSync('./ink_file.json', 'UTF-8').replace(/^\uFEFF/, '');//strips the BOM
```

### Starting a story

Now that you have a `Story` object and a json file, it's time to bring it all together:

```
var inkStory = new Story(json);

console.log(inkStory.ContinueMaximally());
//etc
```

From there on, you can follow [the official guide](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#getting-started-with-the-runtime-api). All functions are named exactly the same.

For an example implementation, you can refer to the source code of the test file [here](https://github.com/y-lohse/inkjs/blob/master/test/simple.js).

## Compatibility with older node and browser versions

Generally speaking, everything should work just fine on any modern-ish browser and in node v4 or above. The only thing you should be careful about is if you're [getting and setting ink variables](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#settinggetting-ink-variables). In anything that does not [support Proxies](https://kangax.github.io/compat-table/es6/) (basically node v5, IE 11, Safari 9 and everything below), you can't directly read and write variables to the story state. Instead you will have to use the `$` function:

```
_inkStory.variablesState.$("player_health", 100);

var health = _inkStory.variablesState.$("player_health");
```


