import { Story, InkList } from './engine/Story'
import { Compiler } from './compiler/Compiler'
import { CompilerOptions } from './compiler/CompilerOptions'
import { PosixFileHandler } from './compiler/FileHandler/PosixFileHandler'
import { JsonFileHandler } from './compiler/FileHandler/JsonFileHandler'

declare interface Inkjs {
    /**
     * A Story is the core class that represents a complete Ink narrative, and
     * manages runtime evaluation and state.
     */
    Story: typeof Story
 
    /**
     * The underlying type for a list item in Ink.
     */
    InkList: typeof InkList

    /**
     * Compiles Ink stories from source.
     */
    Compiler: typeof Compiler

    /**
     * Metadata options for a compiler pass.
     */
    CompilerOptions: typeof CompilerOptions

    /**
     * Resolves and loads Ink sources from a POSIX filesystem.
     */
    PosixFileHandler: typeof PosixFileHandler

    /**
     * Resolves and loads Ink sources from a JSON hierarchy.
     */
    JsonFileHandler: typeof JsonFileHandler
}

declare let inkjs: Inkjs
export default inkjs
