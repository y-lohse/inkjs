import { Story, InkList } from './engine/Story'

declare interface Inkjs {
    Story: typeof Story
    InkList: typeof InkList
}

declare let inkjs: Inkjs
export = inkjs
