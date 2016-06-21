# inkjs

This is a javascript port of inkle's [ink](https://github.com/inkle/ink), a scripting language for writing interactive narrative. Please have a look at [the demo](http://yannick-lohse.fr/inkjs/)!

inkjs should support pretty much everything the original version does. If you find any bugs, please report them here! The code has zero dependencies and it should work in node and all evergreen browsers.

### How do I use this…

#### …in Node?

Install the package using `npm install inkjs`.

#### …in the browser?

Grab the most convenient format for you from the [release page](https://github.com/y-lohse/inkjs/releases). If in doubt, use the iife version.

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