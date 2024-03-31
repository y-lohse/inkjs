import { Story, InkList } from './src/engine/Story'
import { Compiler } from './src/compiler/Compiler'
import { CompilerOptions } from './src/compiler/CompilerOptions'
import { PosixFileHandler } from './src/compiler/FileHandler/PosixFileHandler'
import { JsonFileHandler } from './src/compiler/FileHandler/JsonFileHandler'

declare interface Inkjs {
    Story: typeof Story
    InkList: typeof InkList
    Compiler: typeof Compiler
    CompilerOptions: typeof CompilerOptions
    PosixFileHandler: typeof PosixFileHandler
    JsonFileHandler: typeof JsonFileHandler
}

declare let inkjs: Inkjs
export default inkjs
