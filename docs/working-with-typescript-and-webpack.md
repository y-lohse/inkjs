# Working with TypeScript and Webpack

Version 2.1.0 introduces support for handling ink files directly without having to convert them to JSON first.

This guide explains how to adjust projects using TypeScript and Webpack (common when working with React) to make use of this.

## Webpack

In Webpack 5, static resources are loaded with [Asset Modules](https://webpack.js.org/guides/asset-modules/).

Here we load `.ink` files and inline their content into the script. This is most useful for programs which unconditionally use a single Ink file.

```javascript
rules: [
	{
		test: /\.ink$/i,
		type: 'asset/source',
	},
	// ... and then the rest of your rules
];
```

We can then `import` (or `require`) the ink file and compile it.

```typescript
import * as Inkjs from 'inkjs';
import data from '../assets/myStory.ink';

const inkStory = new Inkjs.Compiler(data).Compile();
```

If you are working in JavaScript, then that is all you need.

### TypeScript

If you are working in TypeScript then you will probably see an error message like:

> Cannot find module '../assets/myStory.ink' or its corresponding type declarations.

You need to declare your types for the `.ink` file. This is done using a [Declaration File](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html).

Create one, such as `global.d.ts` in the top level of your source code, which reads like this:

```typescript
declare module '*.ink' {
	const value: string;
	export default value;
}
```

This says that when you import an `.ink` file, you will get a string.

This should work, but you might need to adjust your `tsconfig.json` file to tell it where to find `global.d.ts`:

```json
{
  compiler: {
  ...
  },
  include: ["path/to/global.d.ts"]
}
```

Credit to [felixmosh's Stackoverflow answer](https://stackoverflow.com/a/66176397/19068) for providing my reference for this TypeScript.
