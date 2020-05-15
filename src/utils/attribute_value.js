export function sizeToPixel(value, defaultWidth) { // eslint-disable-line complexity
  // match:匹配中正则的字符串，返回整个匹配到的 以及 每个组合正则匹配到的值
  // 返回 设置的 1px 1pt 等
  const matched = value.trim().match(/^([\d.]+)(px|pt|pc|in|cm|mm|em|ex|rem|q|vw|vh|vmax|vmin)$/);
  if(matched) {
    // 获取 数值尺寸  单位
    value = {size: parseFloat(matched[1]), unit: matched[2]};
  } else {
    // 直接返回像素单位
    value = {size: parseFloat(value), unit: 'px'};
  }
  // 获取值和单位（单位换算，将其他单位转换为 px）
  let {size, unit} = value;
  if(unit === 'pt') {
    size /= 0.75;
  } else if(unit === 'pc') {
    size *= 16;
  } else if(unit === 'in') {
    size *= 96;
  } else if(unit === 'cm') {
    size *= 96.0 / 2.54;
  } else if(unit === 'mm') {
    size *= 96.0 / 25.4;
  } else if(unit === 'em' || unit === 'rem' || unit === 'ex') {
    // 没有默认值， 样式计算方法存在 文档对象存在
    if(!defaultWidth && typeof getComputedStyle === 'function' && typeof document !== 'undefined') {
      // 获取文档的字体大小
      const root = getComputedStyle(document.documentElement).fontSize;
      // 没有即设置默认
      if(!root) defaultWidth = 16;
      // 有就进行转换在设置
      else defaultWidth = sizeToPixel(root, 16);
    }
    size *= defaultWidth;
    if(unit === 'ex') size /= 2;
  } else if(unit === 'q') {
    size *= 96.0 / 25.4 / 4;
  } else if(unit === 'vw' || unit === 'vh') {
    /* istanbul ignore else */
    if(typeof document !== 'undefined') {
      /* istanbul ignore next */
      const val = unit === 'vw' ? window.innerWidth || document.documentElement.clientWidth
        : window.innerHeight || document.documentElement.clientHeight;
      size *= val / 100;
    }
  } else if(unit === 'vmax' || unit === 'vmin') {
    /* istanbul ignore else */
    // 文档对象存在
    if(typeof document !== 'undefined') {
      /* istanbul ignore next */
      // 获取窗口的宽度，（不包含滚动条
      const width = window.innerWidth || document.documentElement.clientWidth;
      /* istanbul ignore next */
      // 获取窗口的高度，（不包含滚动条
      const height = window.innerHeight || document.documentElement.clientHeight;
      if(unit === 'vmax') {
        size *= Math.max(width, height) / 100;
      } else {
        size *= Math.min(width, height) / 100;
      }
    }
  }

  return size;
}

export function toString(value) {
  // 值为null undefined 直接返回
  if(value == null) return value;
  // 对变量进行类型转换
  return String(value);
}

/**
 * 
 * @param {*} value 数值
 */
export function toNumber(value) {
  // value 不能等于 null undefined
  if(value == null) return value;
  // 字符串
  if(typeof value === 'string') {
    // 将尺寸转换位像素
    value = sizeToPixel(value);
  }
  // 非有限数值
  if(!Number.isFinite(value)) throw new TypeError('Invalid value');
  return value;
}

/**
 * 
 * @param {*} value 
 * @param {*} parseNumber 
 */
export function toArray(value, parseNumber = false) {
  // 值为空字符串 ，直接返回null
  if(value === '') return null;
  // 为字符串 将值以 空格逗号，进行分割为数组
  if(typeof value === 'string') value = value.split(/[\s,]+/g);
  // 值为数组
  if(Array.isArray(value)) {
    // 将数组每个元素转换为数值类型
    if(parseNumber) value = value.map(toNumber);
    // 数组长度为1，直接返回
    if(value.length === 1) return value[0];
  }
  // 返回数组
  return value;
}

/**
 * 新值于老值之间的比较
 * @param {*} oldValue 
 * @param {*} newValue 
 */
export function compareValue(oldValue, newValue) {
  // 老值是否为数组 ，新值是否为数组
  if(Array.isArray(oldValue) && Array.isArray(newValue)) {
    // 数组长度不同，说明两个值不同
    if(oldValue.length !== newValue.length) return false;
    // 数组的元素有不同，说明两个值不同
    for(let i = 0; i < oldValue.length; i++) {
      if(oldValue[i] !== newValue[i]) return false;
    }
    return true;
  }
  // 老值和新值都为 null, undefined 或者两值，全等
  return (oldValue == null && newValue == null) || oldValue === newValue;
}