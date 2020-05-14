import Ellipse from './ellipse';
import {toNumber} from '../utils/attribute_value';

export default class Arc extends Ellipse {
  get radius() {
    return super.radiusX;
  }

  // 设置圆心
  set radius(value) {
    value = toNumber(value);
    super.radiusX = value;
    super.radiusY = value;
  }
}