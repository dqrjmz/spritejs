import Path from './path';
import {toNumber, toArray} from '../utils/attribute_value';

const setDefault = Symbol.for('spritejs_setAttributeDefault');
const setAttribute = Symbol.for('spritejs_setAttribute');
const getAttribute = Symbol.for('spritejs_getAttribute');
const declareAlias = Symbol.for('spritejs_declareAlias');


function getPath(attr) {
  const {width, height} = attr;
  return `M${0} ${0}L${width} ${0}L${width} ${height}L${0} ${height}Z`;
}

export default class Rect extends Path {
  /**
   * 
   * @param {*} subject 
   */
  constructor(subject) {
    super(subject);

    // 基础参数，宽，高
    this[setDefault]({
      width: 0,
      height: 0,
      /* size */
    });
    this[declareAlias]('size');
  }

  // readonly
  get d() {
    return this[getAttribute]('d');
  }

  set d(value) { } // eslint-disable-line no-empty-function

  // 获取元素的宽度
  get width() {
    return this[getAttribute]('width');
  }

  // 设置元素的宽度
  set width(value) {
    // 将值转换为像素
    value = toNumber(value);
    // 给元素设置宽度值
    if(this[setAttribute]('width', value)) {
      const d = getPath(this);
      this[setAttribute]('d', d);
    }
  }

  // 获取元素的高度
  get height() {
    return this[getAttribute]('height');
  }

  // 设置元素的高度
  set height(value) {
    value = toNumber(value);
    if(this[setAttribute]('height', value)) {
      const d = getPath(this);
      this[setAttribute]('d', d);
    }
  }

  // 获取元素的尺寸，宽，高
  get size() {
    return [this.width, this.height];
  }

  // 设置元素的宽高
  set size(value) {
    value = toArray(value);
    if(!Array.isArray(value)) value = [value, value];
    this.width = value[0];
    this.height = value[1];
  }
}