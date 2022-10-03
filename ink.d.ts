import { Story, InkList } from './engine/Story'
import { Compiler } from './compiler/Compiler'
import { CompilerOptions } from './compiler/CompilerOptions'
import { PosixFileHandler } from './compiler/FileHandler/PosixFileHandler'
import { JsonFileHandler } from './compiler/FileHandler/JsonFileHandler'

declare interface Inkjs {
    Story: typeof Story
    InkList: typeof InkList
    Compiler: typeof Compiler
    CompilerOptions: typeof CompilerOptions
    PosixFileHandler: typeof PosixFileHandler
    JsonFileHandler: typeof JsonFileHandler
}

declare let inkjs: Inkjs
export = inkjs
export default inkjs