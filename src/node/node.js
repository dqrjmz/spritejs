import {mat2d} from 'gl-matrix';
import Attr from '../attribute/node';
import Animation from '../animation';
import ownerDocument from '../document';
import SpriteEvent from '../event/event';
import {parseFilterString, applyFilters} from '../utils/filter';
import applyRenderEvent from '../utils/render_event';

// （用户自定义的）修改后的节点的属性
const changedAttrs = Symbol.for('spritejs_changedAttrs');
// 默认节点属性
const attributes = Symbol.for('spritejs_attributes');
// 分辨率
const _resolution = Symbol('resolution');
// 动画
const _animations = Symbol('animations');

// 事件监听器
const _eventListeners = Symbol('eventListeners');
// 捕获型的事件监听器
const _captureEventListeners = Symbol('captureEventListeners');
const _filters = Symbol('filters');
const _display = Symbol('display');

const _program = Symbol('program');
const _shaderAttrs = Symbol('shaderAttrs');
const _uniforms = Symbol('uniforms');

/**
 * 所有节点的父类
 */
export default class Node {
  // 节点属性
  static Attr = Attr;

  /**
   * 
   * @param {Object} attrs 节点初始化的属性集合
   */
  constructor(attrs = {}) {
    // 节点的属性类 初始化默认参数（节点的默认属性
    this.attributes = new this.constructor.Attr(this);
    // 默认分辨率
    this[_resolution] = {width: 300, height: 150};
    // 合并用户选中
    Object.assign(this.attributes, attrs);
    // if(Object.seal) {
    //   Object.seal(this.attributes);
    // }
    // 初始化一个唯一的动画集合
    this[_animations] = new Set();
    // 冒泡型
    this[_eventListeners] = {};
    // 捕获型
    this[_captureEventListeners] = {};
  }

  /**
   * 当前节点的祖先
   */
  get ancestors() {
    // 获取节点的父节点
    let parent = this.parent;

    const ret = [];
    // 父节点存在时
    while(parent) {
      // 将父节点添加到ret数组中
      ret.push(parent);
      // 获取父节点的父节点
      parent = parent.parent;
    }
    // 返回获取的父节点数组（祖先节点数组
    return ret;
  }

  // 获取动画
  get animations() {
    return this[_animations];
  }

  /**
   * 过滤器
   */
  get filters() {
    // 是否存在过滤器 或者 是否存在父类并且父类是否存在过滤器
    return this[_filters] || (this.parent && this.parent.filters);
  }

  /**
   * 节点是否可见
   */
  get isVisible() {
    return false;
  }

  /**
   * 节点所在层实例
   */
  get layer() {
    // 是否存在父类
    if(this.parent) return this.parent.layer;
    return null;
  }

  /**
   * 本地矩阵
   */
  get localMatrix() {
    const m = this.transformMatrix;
    const {x, y} = this.attributes;
    m[4] += x;
    m[5] += y;
    return m;
  }

  /**
   * 节点的透明度
   */
  get opacity() {
    // 获取属性的opacity属性
    let opacity = this.attributes.opacity;
    // 父节点 && 父节点的opacity属性是否存在
    if(this.parent && this.parent.opacity != null) {
      // 当前节点乘以父节点的opacity属性的值
      opacity *= this.parent.opacity;
    }
    return opacity;
  }

  // 获取父节点
  get parentNode() {
    return this.parent;
  }

  // 获取下一个兄弟节点
  get nextSibling() {
    return this.getNodeNearBy(1);
  }

  // 获取上一个兄弟节点
  get previousSibling() {
    return this.getNodeNearBy(-1);
  }

  get program() {
    return this[_program];
  }

  /* get parent defined by connect method */
  /**
   * 获取渲染器
   */
  get renderer() {
    if(this.parent) return this.parent.renderer;
    return null;
  }

  get renderMatrix() {
    if(this.__cacheRenderMatrix) return this.__cacheRenderMatrix;
    let m = this.localMatrix;
    const parent = this.parent;
    if(parent) {
      const renderMatrix = parent.__cacheRenderMatrix || parent.renderMatrix;
      if(renderMatrix) {
        m = mat2d(renderMatrix) * mat2d(m);
      }
    }
    return m;
  }

  get worldScaling() {
    const m = this.renderMatrix;
    return [Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3])];
  }

  get worldRotation() {
    const m = this.renderMatrix;
    return Math.atan2(m[1], m[3]);
  }

  get worldPosition() {
    const m = this.renderMatrix;
    return [m[4], m[5]];
  }

  get uniforms() {
    return this[_uniforms];
  }

  /* get zOrder defined by connect method */

  /* attributes */

  get className() {
    return this.attributes.className;
  }

  set className(value) {
    this.attributes.className = value;
  }

  get id() {
    return this.attributes.id;
  }

  set id(value) {
    this.attributes.id = value;
  }

  get name() {
    return this.attributes.name;
  }

  set name(value) {
    this.attributes.name = value;
  }

  get zIndex() {
    return this.attributes.zIndex;
  }

  set zIndex(value) {
    this.attributes.zIndex = value;
  }

  get mesh() {
    return null;
  }

  get shaderAttrs() {
    return this[_shaderAttrs] || {};
  }

  /**
   * 激活动画
   */
  activateAnimations() {
    // 获取图层节点
    const layer = this.layer;
    // 图层节点存在
    if(layer) {
      // 获取动画
      const animations = this[_animations];
      // 给每一个动画执行执行
      animations.forEach((animation) => {
        animation.baseTimeline = layer.timeline;
        animation.play();
        animation.finished.then(() => {
          animations.delete(animation);
        });
      });
      // 获取子节点
      const children = this.children;
      if(children) {
        children.forEach((child) => {
          // 激活子节点的动画
          if(child.activateAnimations) child.activateAnimations();
        });
      }
    }
  }

  /**
   * 给元素添加事件，收集事件监听器
   * @param {*} type 事件类型
   * @param {*} listener 监听器
   * @param {*} options 选项
   */
  addEventListener(type, listener, options = {}) {
    // 捕获或者冒泡
    if(typeof options === 'boolean') options = {capture: options};
    // 捕获， 一次性 
    const {capture, once} = options;
    // 不同类型的事件， 不是捕获就是冒泡 Symbol类型的属性
    const eventListeners = capture ? _captureEventListeners : _eventListeners;
    // Symbol值 是否存在这种事件的监听队列 （存在某种事件类型的监听器队列，数组类型
    this[eventListeners][type] = this[eventListeners][type] || [];
    this[eventListeners][type].push({listener, once});

    return this;
  }

  /**
   * 动画函数
   * @param {*} frames 帧数
   * @param {*} timing 动画时间 节奏
   */
  animate(frames, timing) {
    // 创建一个动画
    const animation = new Animation(this, frames, timing);
    // 存在效果， 合并效果
    if(this.effects) animation.applyEffects(this.effects);
    // 存在层
    if(this.layer) {
      // 
      animation.baseTimeline = this.layer.timeline;
      // 开始播放动画
      animation.play();
      // 动画结束
      animation.finished.then(() => {
        this[_animations].delete(animation);
      });
    }
    // 加入动画容器
    this[_animations].add(animation);
    return animation;
  }

  /**
   * 给节点设置属性
   * @param  {...any} args 参数对象
   */
  attr(...args) {
    // 没有设置属性， 返回默认的
    if(args.length === 0) return this.attributes[attributes];
    // 多余1个属性
    if(args.length > 1) {
      let [key, value] = args;
      if(typeof value === 'function') {
        value = value(this.attr(key));
      }
      this.setAttribute(key, value);
      return this;
    }
    // 第一个值为字符串
    if(typeof args[0] === 'string') {

      return this.getAttribute(args[0]);
    }
    Object.assign(this.attributes, args[0]);
    return this;
  }

  // 克隆节点
  cloneNode() {
    // 创建一个新节点（利用当前对象的构造函数
    const cloned = new this.constructor();
    // 获取当前节点的配置属性
    const attrs = this.attributes[changedAttrs];
    // 重新给克隆节点设置属性
    cloned.attr(attrs);
    // 返回新节点
    return cloned;
  }

  /**
   * 
   * @param {*} parent sprite节点对象
   * @param {*} zOrder 
   */
  connect(parent, zOrder) {
    // 当前节点设置父节点属性
    Object.defineProperty(this, 'parent', {
      value: parent,
      writable: false,
      configurable: true,
    });
    // 设置层级
    Object.defineProperty(this, 'zOrder', {
      value: zOrder,
      writable: false,
      configurable: true,
    });
    if(parent.timeline) this.activateAnimations();
    this.setResolution(parent.getResolution());
    this.forceUpdate();
    this.dispatchEvent({type: 'append', detail: {parent, zOrder}});
  }

  /**
   * 判断当前节点到祖先节点中是否存在相同节点
   * @param {*} node 
   */
  contains(node) {
    while(node && this !== node) {
      node = node.parent;
    }
    return !!node;
  }
  /**
   * 废弃动画
   */
  deactivateAnimations() {
    // 将动画一次取消
    this[_animations].forEach(animation => animation.cancel());
    // 获取子节点
    const children = this.children;
    if(children) {
      // 将子节点的动画一次取消
      children.forEach((child) => {
        if(child.deactivateAnimations) child.deactivateAnimations();
      });
    }
  }

  disconnect() {
    const {parent, zOrder} = this;
    delete this.parent;
    delete this.zOrder;
    // 废弃动画
    this.deactivateAnimations();
    // 
    this.dispatchEvent({type: 'remove', detail: {parent, zOrder}});
    if(parent) parent.forceUpdate();
  }

  /**
   * 分发事件
   * @param {*} event 事件对象
   */
  dispatchEvent(event) {
    // 不是sprite事件对象
    if(!(event instanceof SpriteEvent)) {
      // 创建sprite事件对象
      event = new SpriteEvent(event);
    }
    // 添加事件对象的目标对象
    event.target = this;
    // 获取事件类型
    const type = event.type;
    // 添加目标元素
    const elements = [this];
    // 获取当前节点的父节点
    let parent = this.parent;
    // 冒泡事件 && 父节点都在
    while(event.bubbles && parent) {
      // 将父节点添加到元素中
      elements.push(parent);
      // 获取父节点的父节点
      parent = parent.parent;
    }

    // capture phase
    // 捕获事件， 从大到小元素
    for(let i = elements.length - 1; i >= 0; i--) {
      // 取出元素
      const element = elements[i];
      // 取出监听函数
      const listeners = element[_captureEventListeners] && element[_captureEventListeners][type];
      // 是否存在
      if(listeners && listeners.length) {
        // 遍历
        listeners.forEach(({listener, once}) => {
          // 调用监听函数
          listener.call(this, event);
          // 只绑定一次的或，调用之后，移除掉
          if(once) elements.removeEventListener(listener);
        });
      }
      // 不冒泡，直接执行一次退出
      if(!event.bubbles && event.cancelBubble) break;
    }
    // bubbling
    // 不取消冒泡
    if(!event.cancelBubble) {
      // 遍历事件涉及的相关元素
      for(let i = 0; i < elements.length; i++) {
        // 获取相关元素
        const element = elements[i];
        // 获取元素的监听函数
        const listeners = element[_eventListeners] && element[_eventListeners][type];
        // 存在监听函数
        if(listeners && listeners.length) {
          // 遍历监听函数
          listeners.forEach(({listener, once}) => {
            // 出发监听
            listener.call(this, event);
            if(once) elements.removeEventListener(listener);
          });
        }
        if(!event.bubbles || event.cancelBubble) break;
      }
    }
  }

  dispatchPointerEvent(event) {
    // 获取触摸点的x，y左边
    const {x, y} = event;
    if(this.isPointCollision(x, y)) {
      this.dispatchEvent(event);
      return true;
    }
    return false;
  }

  /**
   * 绘制2d网格
   * @param {*} meshes 
   */
  draw(meshes = []) {
    const mesh = this.mesh;

    if(mesh) {
      applyFilters(mesh, this.filters);
      meshes.push(mesh);
      if(this[_program]) {
        mesh.setProgram(this[_program]);
        const shaderAttrs = this[_shaderAttrs];
        if(shaderAttrs) {
          Object.entries(shaderAttrs).forEach(([key, setter]) => {
            mesh.setAttribute(key, setter);
          });
        }
        const uniforms = this[_uniforms];
        if(this[_uniforms]) {
          const _uniform = {};
          Object.entries(uniforms).forEach(([key, value]) => {
            if(typeof value === 'function') {
              value = value(this, key);
            }
            _uniform[key] = value;
          });
          mesh.setUniforms(_uniform);
        }
      }
      applyRenderEvent(this, mesh);
    }
    return meshes;
  }

  /**
   * 强制更新
   */
  forceUpdate() {
    // 父节点也进行强制更新
    if(this.parent) this.parent.forceUpdate();
  }

  /**
   * 获取节点的属性值
   * @param {*} key 
   */
  getAttribute(key) {
    return this.attributes[key];
  }

  /**
   * 获取节点上的事件监听，区分捕获，冒泡
   * @param {*} type 
   * @param {*} param1 
   */
  getListeners(type, {capture = false} = {}) {
    const eventListeners = capture ? _captureEventListeners : _eventListeners;
    return [...(this[eventListeners][type] || [])];
  }

  /**
   * 获取下一个当前节点的下一个节点
   */
  getNodeNearBy(distance = 1) {
    if(!this.parent) return null;
    if(distance === 0) return this;
    const children = this.parent.children;
    const idx = children.indexOf(this);
    return children[idx + distance];
  }

  getWorldPosition(offsetX, offsetY) {
    const m = this.renderMatrix;
    const x = offsetX * m[0] + offsetY * m[2] + m[4];
    const y = offsetX * m[1] + offsetY * m[3] + m[5];
    return [x, y];
  }

  getOffsetPosition(x, y) {
    const m = mat2d.invert(this.renderMatrix);
    const offsetX = x * m[0] + y * m[2] + m[4];
    const offsetY = x * m[1] + y * m[3] + m[5];
    return [offsetX, offsetY];
  }

  getResolution() {
    return {...this[_resolution]};
  }

  isPointCollision(x, y) {
    if(!this.mesh) return false;
    const pointerEvents = this.attributes.pointerEvents;
    if(pointerEvents === 'none') return false;
    if(pointerEvents !== 'all' && !this.isVisible) return false;
    let which = 'both';
    if(pointerEvents === 'visibleFill') which = 'fill';
    if(pointerEvents === 'visibleStroke') which = 'stroke';
    return this.mesh.isPointCollision(x, y, which);
  }

  /**
   * 
   * @param {*} key 属性名
   * @param {*} newValue 属性值
   * @param {*} oldValue 老属性值
   */
  onPropertyChange(key, newValue, oldValue) {
    if(key !== 'id' && key !== 'name' && key !== 'className' && key !== 'pointerEvents' && key !== 'passEvents') {
      this.forceUpdate();
    }
    if(key === 'filter') {
      this[_filters] = parseFilterString(newValue);
    }
    if(key === 'zIndex' && this.parent) {
      this.parent.reorder();
    }
  }

  setAttribute(key, value) {
    if(key === 'attrs') {
      this.attr(value);
    }
    this.attributes[key] = value;
  }

  setMouseCapture() {
    if(this.layer) {
      this.layer.__mouseCapturedTarget = this;
    }
  }

  // layer.renderer.createProgram(fragmentShader, vertexShader, attributeOptions)
  setProgram(program) {
    this[_program] = program;
    this.forceUpdate();
  }

  setShaderAttribute(attrName, setter) {
    this[_shaderAttrs] = this[_shaderAttrs] || {};
    this[_shaderAttrs][attrName] = setter;
    this.forceUpdate();
  }

  setUniforms(uniforms) {
    this[_uniforms] = this[_uniforms] || {};
    Object.assign(this[_uniforms], uniforms);
    this.forceUpdate();
  }

  /**
   * 设置分辨率
   * @param {*} param0 
   */
  setResolution({width, height}) {
    // 获取分辨率
    const {width: w, height: h} = this[_resolution];
    // 和当前设置的分辨率是否一致
    if(w !== width || h !== height) {
      // 不一致，重新设置为指定的
      this[_resolution] = {width, height};
      // this.updateContours();
      // 强制更新
      this.forceUpdate();
      // 分发分辨率修改事件
      this.dispatchEvent({type: 'resolutionchange', detail: {width, height}});
    }
  }

  show() {
    if(this.attributes.display === 'none') {
      this.attributes.display = this[_display] || '';
    }
  }

  hide() {
    if(this.attributes.display !== 'none') {
      this[_display] = this.attributes.display;
      this.attributes.display = 'none';
    }
  }

  releaseMouseCapture() {
    if(this.layer && this.layer.__mouseCapturedTarget === this) {
      this.layer.__mouseCapturedTarget = null;
    }
  }

  /**
   * 删除节点
   */
  remove() {
    // 节点存在父级 && 有removeChild方法
    if(this.parent && this.parent.removeChild) {
      // 将节点删除掉
      this.parent.removeChild(this);
      return true;
    }
    return false;
  }

  /**
   * 移除所有监听器
   * @param {*} type 事件类型
   * @param {*} options 
   */
  removeAllListeners(type, options = {}) {
    if(typeof options === 'boolean') options = {capture: options};
    const capture = options.capture;

    const eventListeners = capture ? _captureEventListeners : _eventListeners;

    if(this[eventListeners][type]) {
      // 清空
      this[eventListeners][type] = [];
    }
    return this;
  }
  /**
   * 移除html元素特性
   * @param {*} key html元素特性
   */
  removeAttribute(key) {
    this.setAttribute(key, null);
  }

  /**
   * 移除事件监听
   * @param {*} type 事件类型
   * @param {*} listener 监听器
   * @param {*} options 选项
   */
  removeEventListener(type, listener, options = {}) {
    if(typeof options === 'boolean') options = {capture: options};
    const capture = options.capture;

    const eventListeners = capture ? _captureEventListeners : _eventListeners;

    if(this[eventListeners][type]) {
      // 某种事件的监听器集合
      const listeners = this[eventListeners][type];
      if(listeners) {
        // 一个一个将监听器引用删除
        for(let i = 0; i < listeners.length; i++) {
          const {listener: _listener} = listeners[i];
          if(_listener === listener) {
            this[eventListeners][type].splice(i, 1);
            break;
          }
        }
      }
    }

    return this;
  }

  /**
   * 过渡动画
   * @param {*} sec 时间间隔
   * @param {*} easing 运动类型 ，匀速，匀加速等
   */
  transition(sec, easing = 'linear') {
    const that = this,
      _animation = Symbol('animation');

    easing = easing || 'linear';

    let delay = 0;
    if(typeof sec === 'object') {
      delay = sec.delay || 0;
      sec = sec.duration;
    }

    return {
      [_animation]: null,
      cancel(preserveState = false) {
        const animation = this[_animation];
        if(animation) {
          animation.cancel(preserveState);
        }
      },
      end() {
        const animation = this[_animation];
        if(animation && (animation.playState === 'running' || animation.playState === 'pending')) {
          animation.finish();
        }
      },
      reverse() {
        const animation = this[_animation];
        if(animation) {
          if(animation.playState === 'running' || animation.playState === 'pending') {
            animation.playbackRate = -animation.playbackRate;
          } else {
            const direction = animation.timing.direction;
            animation.timing.direction = direction === 'reverse' ? 'normal' : 'reverse';
            animation.play();
          }
        }
        return animation.finished;
      },
      /**
       * 1. 两个参数时，是值传递一个属性
       * 2. prop位对象时，是属性集合
       * @param {*} prop 
       * @param {*} val 
       */
      attr(prop, val) {
        // 结束动画
        this.end();
        // 整理属性
        if(typeof prop === 'string') {
          prop = {[prop]: val};
        }
        Object.entries(prop).forEach(([key, value]) => {
          if(typeof value === 'function') {
            prop[key] = value(that.attr(key));
          }
        });
        this[_animation] = that.animate([prop], {
          duration: sec * 1000,
          delay: delay * 1000,
          fill: 'forwards',
          easing,
        });
        return this[_animation].finished;
      },
    };
  }

  updateContours() {
    // override
  }
}

ownerDocument.registerNode(Node, 'node');