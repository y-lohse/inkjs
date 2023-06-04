# Differences with the C# Compiler

## Handling `INCLUDE`s

The C# compiler is intented to always be used on a file system and thus the question of how files are included follow a classic pattern.  
Nevertheless, when using the compiler inside a browser, the concept of "file" is a blurry one.   
Inkjs provides 2 file handlers :
* A JSON file handler : it is included by default : it expects a JSON object representing all the files of the project of the form :
```json
{
    "filename1.ink": "INCLUDE filename2.ink",
    "filename2.ink": "This content is included",
}
```

* A POSIX file handler : delivered as a separate `inkjs-full-posixhandler.js` file that must be included/required : similar to the one used in the C# compiler that will look for files in folders. Example when installing the package from npm :

```javascript
var Inkjs = require('inkjs');
var { PosixFileHandler } = require('inkjs/compiler/FileHandler/PosixFileHandler');

const inkFile = fs.readFileSync(`${PATH_TO_STORY_FOLDER}/main.ink`, 'UTF-8').replace(/^\uFEFF/, '');
const fileHandler = new PosixFileHandler(`${PATH_TO_STORY_FOLDER}/`);
const errorHandler = (message, errorType) => {
   console.log(message + "\n");
}
const story = new Inkjs.Compiler(inkFile, {fileHandler, errorHandler}).Compile();
//story.Continue()
```

## Float and ints

As the JSON format and javascript in general do not differentiate between float and integers, the inkjs runtime is known to behave differently from the C# runtime when dealing with floating point operations.

The Ink language parser nevertheless enforces this typing and, when played directly from the output of the compiler (as opposed to exporting to JSON and then loading it), the Story object will actually behave like in the C# Runtime.

This may lead to slight differences during play.  
This [issue is known](https://github.com/y-lohse/inkjs/issues/934) and will be addressed in subsequent release.

## Named classes/types

As a major difference from the C# compiler, the Parsed Hierarchy classes are not publicly exposed and their name may be obscured when using the minified version of inkjs-full.  
You'll have to rely on their `.typeName` property.

Some typename are specific to this library :   
* Constant declaration : `CONST` instead of `Constant`
* List declaration : `LIST` instead of `VAR`
* List definition (container) : `ListDefinition` instead of `List definition`
