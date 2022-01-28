import { Tag as RuntimeTag } from '../../../engine/Tag';
import { Wrap } from './Wrap';

export class Tag extends Wrap<RuntimeTag> {
  constructor(tag: RuntimeTag) {
    super(tag)
  }
}
