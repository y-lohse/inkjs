# Differences with the C# Compiler

## Handling `INCLUDE`s

The C# compiler is intented to always be used on a file system and thus the question of how files are included follow a classic pattern.  
Nevertheless, when using the compiler inside a browser, the concept of "file" is a blurry one.   
Inkjs provides 2 file handlers :
* A POSIX file handler : similar to the one used in the C# compiler that will look for files in folders
* A JSON file handler : expects a JSON object of the form
```
{
    "filename1.ink": "INCLUDE filename2.ink",
    "filename2.ink": "This content is included",
}
```

## Float and ints

As the JSON format and javascript in general do not differentiate between float and integers, the inkjs runtime is known to behave differently from the C# runtime when dealing with floating point operations.

The Ink language parser nevertheless enforces this typing and, when played directly from the output of the compiler (as opposed to exporting to JSON and then loading it), the Story object will actually behave like in the C# Runtime.

This may lead to slight differences during play.  
This [issue is known](https://github.com/y-lohse/inkjs/issues/934) and will be addressed in subsequent release.

## Named classes/types

As a major difference from the C# compiler, the Parsed Hierarchy classes are not publicly exposed and their name may be obscured when using the minified version of inkjs-full.  
You'll have to rely on their `.typeName` property.
