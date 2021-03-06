import rgba from 'color-rgba';

/**
 * 渐变
 */
export class Gradient {
  /**
   * 矢量 颜色
   * @param {Array} vector  
   * @param {Array} colors [{offset,color}]
   */
  constructor({vector, colors}) {
    // 非数组，数组长度不为4，6，3时
    if(!Array.isArray(vector) || (vector.length !== 4 && vector.length !== 6 && vector.length !== 3)) {
      throw new TypeError('Invalid gradient');
    }
    // 初始化 Array
    this.vector = vector;
    // 初始化颜色数组和偏移量
    this.colors = colors.map(({offset, color}) => {
      return {offset, color: parseColor(color)};
    });
  }

  /**
   * @returns {string} 
   */
  toString() {
    return JSON.stringify({vector: this.vector, colors: this.colors});
  }
}

/**
 * 是否试透明颜色
 * @param {*} color 
 */
export function isTransparent(color) {
  // 非渐变类实例
  if(color instanceof Gradient) return false;
  // 为undefined 或者 null
  if(color == null) return true;
  // 
  return rgba(color)[3] === 0;
}

/**
 * 解析颜色
 * @param {*} color 
 */
export function parseColor(color) {
  // if(Array.isArray(color)) return color;
  // 颜色为 null undefined
  if(color == null) return color;
  // 颜色不存在，即为透明
  if(!color) color = 'transparent';
  // 颜色即为渐变类实例
  if(color instanceof Gradient) return color;
  // 颜色解析值
  const ret = rgba(color);
  // 不存在或者 长度不存在或者为0 ret为数组
  if(!ret || !ret.length) throw new TypeError('Invalid color value.');
  // 组合颜色
  return `rgba(${ret.join()})`;
}

function applyMeshGradient(mesh, type, color) {
  const vectorOffset = mesh.boundingBox[0];
  if(color.vector) {
    let {vector, colors} = color;
    if(vector.length === 4) {
      vector = [vector[0] + vectorOffset[0],
        vector[1] + vectorOffset[1],
        vector[2] + vectorOffset[0],
        vector[3] + vectorOffset[1]];
      mesh.setLinearGradient({vector, colors, type});
    } else if(vector.length === 3) {
      vector = [vector[0] + vectorOffset[0],
        vector[1] + vectorOffset[1],
        vector[2]];
      mesh.setCircularGradient({vector, colors, type});
    } else {
      vector = [vector[0] + vectorOffset[0],
        vector[1] + vectorOffset[1],
        vector[2],
        vector[3] + vectorOffset[0],
        vector[4] + vectorOffset[1],
        vector[5]];
      mesh.setRadialGradient({vector, colors, type});
    }
  } else if(mesh.gradient && mesh.gradient[type]) {
    delete mesh.gradient[type];
    delete mesh.uniforms.u_radialGradientVector;
  }
}

export function setFillColor(mesh, {color: fillColor, rule = 'nonzero'}) {
  applyMeshGradient(mesh, 'fill', fillColor);
  if(!fillColor.vector) {
    mesh.setFill({color: fillColor, rule});
  }
  return mesh;
}

export function setStrokeColor(mesh,
  {color: strokeColor, lineWidth, lineCap, lineJoin, lineDash, lineDashOffset, miterLimit, roundSegments}) {
  applyMeshGradient(mesh, 'stroke', strokeColor);
  if(strokeColor.vector) {
    strokeColor = [0, 0, 0, 1];
  }
  mesh.setStroke({
    color: strokeColor,
    thickness: lineWidth,
    cap: lineCap,
    join: lineJoin,
    miterLimit,
    lineDash,
    lineDashOffset,
    roundSegments,
  });
}

/**
 * 颜色类
 */
export class Color extends Array {
  /**
   * 
   * @param {*} r red
   * @param {*} g green
   * @param {*} b blue 
   * @param {*} a alpha
   */
  constructor(r = 0, g = 0, b = 0, a = 0) {
    // 是否为数组
    if(Array.isArray(r)) {
      // 通过数组传递也是可以的
      [r, g, b, a] = r;
    }
    // 通过字符串传递也是可以的
    if(typeof r === 'string') {
      // 解析颜色字符串，得出每个颜色值
      [r, g, b, a] = rgba(r);
      r /= 255;
      g /= 255;
      b /= 255;
    }
    super(r, g, b, a);
    return this;
  }

  /**
   * 获取颜色中的红
   */
  get r() {
    // 四舍五入
    return Math.round(this[0] * 255);
  }

  /**
   * 设置颜色中的红
   */
  set r(v) {
    this[0] = v / 255;
  }

  /**
   * 获取绿色
   */
  get g() {
    return Math.round(this[1] * 255);
  }

  set g(v) {
    this[1] = v / 255;
  }

  /**
   * 获取蓝色值
   */
  get b() {
    return Math.round(this[2] * 255);
  }

  set b(v) {
    this[2] = v / 255;
  }

  /**
   * 获取透明度
   */
  get a() {
    return this[3];
  }

  set a(v) {
    this[3] = v;
  }

  /**
   * 获取hex类型颜色 #ffff34
   */
  get hex() {
    // 将10进制数组转换为16进制，去16进制数（不带前缀的
    const r = `0${this.r.toString(16)}`.slice(-2);
    const g = `0${this.g.toString(16)}`.slice(-2);
    const b = `0${this.b.toString(16)}`.slice(-2);
    let a;
    // 透明度小于1
    if(this.a < 1) {
      // 设置a
      a = Math.round(this[3] * 255);
      // 
      a = `0${a.toString(16)}`.slice(-2);
    }
    return `#${r}${g}${b}${a || ''}`;
  }

  /**
   * 获取rgba 类型颜色
   */
  get rgba() {
    return `rgba(${this.r},${this.g},${this.b},${this.a})`;
  }

  /**
   * 
   * @param {*} color 
   */
  fromColor(color) {
    // 颜色为字符串类型
    if(typeof color === 'string') {
      // 解析颜色值
      color = rgba(color);
      // 颜色
      color[0] /= 255;
      color[1] /= 255;
      color[2] /= 255;
    }
    /**
     * 设置颜色组成部分的值
     */
    this[0] = color[0];
    this[1] = color[1];
    this[2] = color[2];
    this[3] = color[3];
    // 返回颜色数组
    return this;
  }
}