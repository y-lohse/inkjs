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
var inkjs = require('inkjs/full');
var { PosixFileHandler } = require('inkjs/compiler/FileHandler/PosixFileHandler');

const inkFile = fs.readFileSync(`${PATH_TO_STORY_FOLDER}/main.ink`, 'UTF-8').replace(/^\uFEFF/, '');
const fileHandler = new PosixFileHandler(`${PATH_TO_STORY_FOLDER}/`);
const errorHandler = (message, errorType) => {
   console.log(message + "\n");
}
const story = new inkjs.Compiler(inkFile, {fileHandler, errorHandler}).Compile();
//story.Continue()
```


## Named classes/types

As a major difference from the C# compiler, the Parsed Hierarchy classes are not publicly exposed and their name may be obscured when using the minified version of inkjs-full.  
You'll have to rely on their `.typeName` property.

Some typename are specific to this library :   
* Constant declaration : `CONST` instead of `Constant`
* List declaration : `LIST` instead of `VAR`
* List definition (container) : `ListDefinition` instead of `List definition`
