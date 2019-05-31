import { Story, InkList } from './engine/Story'

declare interface Inkjs {
    Story: Story
    InkList: InkList
}

declare let inkjs: Inkjs
export = inkjs
