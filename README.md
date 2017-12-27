# inkjs

[![Travis](https://img.shields.io/travis/y-lohse/inkjs.svg)](https://github.com/y-lohse/inkjs)
[![npm](https://img.shields.io/npm/v/inkjs.svg)]()

This is a javascript port of inkle's [ink](https://github.com/inkle/ink), a scripting language for writing interactive narrative. 

inkjs is fully compatible with the original version, has zero dependency and works in all browsers and node.js. Please have a look at [the demo](http://yannick-lohse.fr/inkjs/)!

- [How to install](#installation)
- [Quickstart in the browser](#quickstart)
- [Working with a JSON file in the browser](#working-with-a-json-file)
- [With Node.js](#using-nodejs)
- [Differences with the C# API](#differences-with-the-c-api)

## Installation

Grab the `ink.js` file from the [latest release](https://github.com/y-lohse/inkjs/releases).

For npm users, install with `npm install inkjs --save`. Or for bower, `bower install inkjs`.  
There's a (lighter) ES2015 version available if you only target platforms with basic ES 2015 support.  
Both `ink.js` and `ink-es2015.js` use Universal Module Definition (UMD), so you can use it with [RequireJS](http://requirejs.org/) or basically any other module loader.
If you don't know what any of this means, don't worry, just include `ink.js` with a regular script tag and everything will work fine.


## Quickstart

The simplest way to get started with inkjs is to use the [serverless boilerplate](https://github.com/y-lohse/inkjs/blob/master/templates/browser_serverless/) in the [templates folder](https://github.com/y-lohse/inkjs/blob/master/templates/). Replace the placeholder story in `story.js` with your own and open `index.html`!

Here's what happens behind the scenes: inkjs gives you access to a global object named `inkjs` which has a property called `Story`. This is the main class we interact with.

We simply create a new story by calling `var story = new inkjs.Story(storyContent);` — the variable `storyContent` is defined in the `story.js` file. After that, we can use `story.Continue()` and `story.currentChoices` as described in the [the official documentation](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#getting-started-with-the-runtime-api).

## Working with a JSON file

If you frequently need to update your story, pasting the content into `story.js` will probably get tedious. So another option is to dynamically load the JSON file for your story. Unfortunately, your browser won't let you do that because of [CORS policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS), which means you need a web server to do this. You could do this without much hassle with [node.js](https://www.npmjs.com/package/http-server) or [python](http://www.linuxjournal.com/content/tech-tip-really-simple-http-server-python) for example.

Once the server is running, use the [other boilerplate](https://github.com/y-lohse/inkjs/blob/master/templates/browser_with_server) and place your story content inside `story.json`. Behind the scenes, the only difference is that we load the JSON file via ajax before creating the story:

```
fetch('story.json')
.then(function(response){
	return response.text();
})
.then(function(storyContent){
	story = new inkjs.Story(storyContent);
	continueStory();
});
```

## Using node.js

You can find some boilerplate code for node.js [here](https://github.com/y-lohse/inkjs/blob/master/templates/nodejs).

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

From there on, you can follow [the official documentation](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#getting-started-with-the-runtime-api).


## Differences with the C# API

There are a few very minor API differences between ink C# and inkjs:

### [Getting and setting ink variables](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#settinggetting-ink-variables).

On platforms that do not support [ES2015 Proxies](https://kangax.github.io/compat-table/es6/) (basically node.js v5, IE 11, Safari 9 and everything below), you can't directly read and write variables to the story state. Instead you will have to use the `$` function:


```
_inkStory.variablesState.$("player_health", 100);
//instead of _inkStory.variablesState["player_health"] = 100;

var health = _inkStory.variablesState.$("player_health");
//instead of var health = _inkStory.variablesState["player_health"];
```

### Getting the output text when calling `EvaluateFunction`

`EvaluateFunction()` lets you evaluate an ink function from within your javascript. The "normal" call is the same than in C#:

```
var result = EvaluateFunction("my_ink_function", ["arg1", "arg2"]);
//result is the return value of my_ink_function("arg1", "arg2")
```

However, if you also wish to retrieve the text that `my_ink_function` output, you need to call itlike this:

```
var result = EvaluateFunction("my_ink_function", ["arg1", "arg2"], true);
//now result is an object with two properties:
// result.returned is the return value of my_ink_function("arg1", "arg2")
// result.output is the text that was written to the output while the function was evaluated
```
