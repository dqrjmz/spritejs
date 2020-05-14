import Path from './path';
import ownerDocument from '../document';
import Attr from '../attribute/rect';

export default class Rect extends Path {
  static Attr = Attr;

  /* override */
  /**
   * 是否可见
   */
  get isVisible() {
    // 矩形的高宽
    const {width, height} = this.attributes;
    // 高，宽都大于0
    return width > 0 && height > 0 && super.isVisible;
  }
}

ownerDocument.registerNode(Rect, 'rect');