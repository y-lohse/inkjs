import { Story, InkList } from './engine/Story'
import { Compiler } from './compiler/Compiler'

declare interface Inkjs {
    Story: typeof Story
    InkList: typeof InkList
    Compiler: typeof Compiler
}

declare let inkjs: Inkjs
export = inkjs
export default inkjs