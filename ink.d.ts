import { Story, InkList } from './engine/Story'
import { Compiler } from './compiler/Compiler'
import { CompilerOptions } from './compiler/CompilerOptions'

declare interface Inkjs {
    Story: typeof Story
    InkList: typeof InkList
    Compiler: typeof Compiler
    CompilerOptions: typeof CompilerOptions
}

declare let inkjs: Inkjs
export = inkjs
export default inkjs