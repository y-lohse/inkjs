# ![inkjs](media/inkjs.png)

![build](https://github.com/y-lohse/inkjs/workflows/Build/badge.svg)
[![npm](https://img.shields.io/npm/v/inkjs.svg)](https://www.npmjs.com/package/inkjs)
[![codecov](https://codecov.io/gh/y-lohse/inkjs/branch/master/graph/badge.svg)](https://codecov.io/gh/y-lohse/inkjs)

This is a javascript port of inkle's [ink](https://github.com/inkle/ink), a scripting language for writing interactive narrative.

inkjs is fully compatible with the original version, has zero dependency and works in all browsers and node.js. Please have a look at [the demo](http://yannick-lohse.fr/inkjs/)!

## Table of content

- [](#)
	- [Table of content](#table-of-content)
	- [Installation](#installation)
	- [Quickstart](#quickstart)
	- [Working with a JSON file](#working-with-a-json-file)
	- [Using node.js](#using-nodejs)
		- [Loading inkjs](#loading-inkjs)
		- [Loading a json file](#loading-a-json-file)
		- [Starting a story](#starting-a-story)
	- [Differences with the C# API](#differences-with-the-c-api)
		- [Getting and setting ink variables](#getting-and-setting-ink-variables)
		- [Getting the output text when calling `EvaluateFunction`](#getting-the-output-text-when-calling-evaluatefunction)
	- [Using TypeScript](#using-typescript)
	- [Compiler](#compiler)
		- [inkjs-compiler.js](#inkjs-compilerjs)
		- [online compiler](#online-compiler)
		- [Differences with the C# Compiler](#differences-with-the-c-compiler)
	- [Compatibility table](#compatibility-table)

## Installation

Install using `npm install inkjs`.

If you are not using npm you can grab the latest release directly from [here](https://unpkg.com/inkjs). Simply include that file with a script tag and you'll be on your way!

For projects targeting older browsers that have no support for ES2015 features, a (heavier but) more backward compatible version is also exposed. Grab it by either:

- `import ink from 'inkjs/dist/ink.js`
- Directly downloading the file from [here](https://unpkg.com/inkjs@1.11.0/dist/ink.js)

## Quickstart

The simplest way to get started with inkjs is to use the [serverless boilerplate](https://github.com/y-lohse/inkjs/blob/master/templates/browser_serverless/) in the [templates folder](https://github.com/y-lohse/inkjs/blob/master/templates/). Replace the placeholder story in `story.js` with your own and open `index.html`!

Here's what happens behind the scenes: inkjs gives you access to a global object named `inkjs` which has a property called `Story`. This is the main class we interact with.

We simply create a new story by calling `var story = new inkjs.Story(storyContent);` — the variable `storyContent` is defined in the `story.js` file. After that, we can use `story.Continue()` and `story.currentChoices` as described in the [the official documentation](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#getting-started-with-the-runtime-api).

## Working with a JSON file

If you frequently need to update your story, pasting the content into `story.js` will probably get tedious. So another option is to dynamically load the JSON file for your story. Unfortunately, your browser won't let you do that because of [CORS policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS), which means you need a web server to do this. You could do this without much hassle with [node.js](https://www.npmjs.com/package/http-server) or [python](http://www.linuxjournal.com/content/tech-tip-really-simple-http-server-python) for example.

Once the server is running, use the [other boilerplate](https://github.com/y-lohse/inkjs/blob/master/templates/browser_with_server) and place your story content inside `story.json`. Behind the scenes, the only difference is that we load the JSON file via ajax before creating the story:

```javascript
fetch('story.json')
	.then(function (response) {
		return response.text();
	})
	.then(function (storyContent) {
		story = new inkjs.Story(storyContent);
		continueStory();
	});
```

## Using node.js

You can find some boilerplate code for node.js [here](https://github.com/y-lohse/inkjs/blob/master/templates/nodejs).

### Loading inkjs

#### require

You can require the module: 
```javascript 
var Story = require('inkjs').Story;
```

#### import
You can use import style: 
```javascript
import { Story } from 'inkjs';
`

### Loading a json file

You can load the json file using a simple call to `require`:

```javascript
var json = require('./ink_file.json');
```

You can also load it using `fs`. In that case, please note that inklecate outputs a json file encoded **with** BOM, and node isn't very good at handling that.

```javascript
var fs = require('fs');
var json = fs.readFileSync('./ink_file.json', 'UTF-8').replace(/^\uFEFF/, ''); //strips the BOM
```

### Starting a story

Now that you have a `Story` object and a json file, it's time to bring it all together:

```javascript
var inkStory = new Story(json);

console.log(inkStory.ContinueMaximally());
//etc
```

From there on, you can follow [the official documentation](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#getting-started-with-the-runtime-api).

## Differences with the C# API

There are a few very minor API differences between ink C# and inkjs:

### [Getting and setting ink variables](https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md#settinggetting-ink-variables)

On platforms that do not support [ES2015 Proxies](https://kangax.github.io/compat-table/es6/) (basically node.js v5, IE 11, Safari 9 and everything below), you can't directly read and write variables to the story state. Instead you will have to use the `$` function:

```javascript
_inkStory.variablesState.$('player_health', 100);
//instead of _inkStory.variablesState["player_health"] = 100;

var health = _inkStory.variablesState.$('player_health');
//instead of var health = _inkStory.variablesState["player_health"];
```

### Getting the output text when calling `EvaluateFunction`

`EvaluateFunction()` lets you evaluate an ink function from within your javascript. The "normal" call is the same than in C#:

```javascript
var result = EvaluateFunction('my_ink_function', ['arg1', 'arg2']);
//result is the return value of my_ink_function("arg1", "arg2")
```

However, if you also wish to retrieve the text that `my_ink_function` output, you need to call it like this:

```javascript
var result = EvaluateFunction('my_ink_function', ['arg1', 'arg2'], true);
//now result is an object with two properties:
// result.returned is the return value of my_ink_function("arg1", "arg2")
// result.output is the text that was written to the output while the function was evaluated
```

## Compiler

### inkjs-compiler.js

```shell
$ node inkjs-compiler.js -h

Usage: inkjs-compiler <options> <ink or json file>
   -o <filename>:   Output file name
   -c:              Count all visits to knots, stitches and weave points, not
                    just those referenced by TURNS_SINCE and read counts.
   -p:              Play mode (automatic if a json file is passed as argument)
   -s:              Print stats about story including word count in JSON format
   -k:              Keep inklecate running in play mode even after story is complete

```

If you install the package globally it is available as the `inkjs-compiler` command.  
Alternatively, you can call it using `npx inkjs`

### online compiler

```javascript
const inkjs = require("inkjs/full") //the `full` submodule contains the Compiler
const story = new inkjs.Compiler(`Hello World`).Compile();
// story is an inkjs.Story that can be played right away

const jsonBytecode = story.ToJson();
// the generated json can be further re-used
```

You can use this in combination with [Webpack and TypeScript](docs/working-with-typescript-and-webpack.md).

### Differences with the C# Compiler

See [Differences with the C# Compiler](docs/compiler-differences.md).

## Using TypeScript

Inkjs is also packaged to be usable with typescript imports, the main classes (`Story`, `InkList`, `Compiler`) are available under the `/types`submodule.

```ts
import { Story, Compiler } from 'inkjs/types'; // shortcut

let story: Story;
let compiler: Compiler;
```

It is also possible to import deeply nested classes if needed

```ts
import { Story } from 'inkjs/engine/Story';
import { Compiler } from 'inkjs/compiler/Compiler';

import { Choice } from 'inkjs/engine/Choice'
import { Identifier } from 'inkjs/compiler/Parser/ParsedHierarchy/Identifier';

```

## Compatibility table

| _inklecate_ version | _inkjs_ version | _json_ version |
| :-----------------: | :-------------: | :------------: |
|    0.3.5 – 0.4.0    |  1.0.0 – 1.1.0  |       18       |
|    0.4.1 – 0.5.0    |  1.1.1 – 1.1.3  |                |
|        0.5.1        |      1.2.0      |                |
|        0.6.0        |      1.3.0      |                |
|        0.6.1        |  1.4.0 – 1.4.1  |                |
|        0.6.2        |      1.4.2      |                |
|        0.6.3        |      1.4.3      |                |
|        0.6.4        |  1.4.4 – 1.4.6  |                |
|        0.7.0        |  1.5.0 – 1.5.1  |                |
|        0.7.1        |      1.5.2      |                |
|    0.7.2 – 0.7.4    |      1.6.0      |                |
|    0.8.0 – 0.8.1    |  1.7.1 – 1.7.2  |                |
|        0.8.2        |  1.8.0 – 1.9.0  |                |
|        0.8.3        | 1.10.0 – 1.10.5 |                |
|        0.9.0        |     1.11.0      |       19       |
|        1.0.0        |  2.0.0 - 2.1.0  |       20       |
|        1.1.1        |      2.2.*      |       21       |
|        1.2.0        |      2.3.0      |                |
