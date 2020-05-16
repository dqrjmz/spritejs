import {ENV} from '@mesh.js/core';
import {requestAnimationFrame} from '../utils/animation-frame';
import Node from './node';
import Layer from './layer';
import LayerWorker from './layer-worker';
import Group from './group';
import createPointerEvents from '../event/pointer-events';
import Event from '../event/event';
import {loadTexture, loadFrames} from '../utils/texture';
import ownerDocument from '../document';

const _enteredTargets = Symbol('enteredTargets');

function wrapLayer(layer) {
  // append dom element
  layer.id = layer.id || `_layer${Math.random().toString(36).slice(2, 12)}`;
  if(!layer.dataset) {
    layer.dataset = {};
  }
  layer.dataset.layerId = layer.id;
  // fixed layer replacer
  layer.connect = (parent, zOrder) => {
    layer.parent = parent;
    Object.defineProperty(layer, 'zOrder', {
      value: zOrder,
      writable: false,
      configurable: true,
    });
  };
  layer.disconnect = (parent) => {
    delete layer.zOrder;
  };
  layer.canvas = layer;
  layer.getResolution = () => { return {width: 0, height: 0} };
  layer.setResolution = () => false;
  layer.options = {handleEvent: false};
  return layer;
}

function getRefCanvas(scene, layer) {
  const children = scene.children;
  let ref = null;
  for(let i = 0; i < children.length; i++) {
    const child = children[i];
    if(layer === child || ref != null) {
      ref = child;
    }
    if(ref && ref !== layer && !ref.offscreen) {
      return ref.canvas;
    }
  }
  return null;
}

function drawImage(layer, offscreenLayer) {
  const [left, top] = layer.renderOffset;
  const {width, height} = layer.getResolution();
  const displayRatio = layer.displayRatio;
  layer.renderer.drawImage(offscreenLayer.canvas, -left / displayRatio, -top / displayRatio, width / displayRatio, height / displayRatio);
}

// 触摸事件捕获的目标对象
const touchEventCapturedTargets = {};
function delegateEvents(scene) {
  const events = ['mousedown', 'mouseup', 'mousemove', 'mousewheel', 'wheel',
    'touchstart', 'touchend', 'touchmove', 'touchcancel',
    'click', 'dblclick', 'longpress', 'tap'];

  // 场景容器
  const container = scene.container;
  // 场景参数
  const {left, top, displayRatio} = scene.options;

  // 给容器添加鼠标事件
  container.addEventListener('mouseleave', (event) => {
    // 目标集合 Set,不重复
    const enteredTargets = scene[_enteredTargets];
    // 存在
    if(enteredTargets.size) {
      const leaveEvent = new Event('mouseleave');
      leaveEvent.setOriginalEvent(event);
      [...enteredTargets].forEach((target) => {
        target.dispatchEvent(leaveEvent);
      });
      scene[_enteredTargets].clear();
    }
  }, {passive: true});

  // 遍历事件 变量： 事件类型
  events.forEach((eventType) => {
    // 给容器添加事件 变量：事件类型 事件对象
    container.addEventListener(eventType, (event) => {
      // 情景的排序子元素
      const layers = scene.orderedChildren;
      // 对dom事件对象进行包装 变量： 事件对象 场景左边的偏移量 场景上边的偏移量 设备像素比
      const pointerEvents = createPointerEvents(event, {offsetLeft: left, offsetTop: top, displayRatio});
      // 遍历每个事件对象 变量： 
      pointerEvents.forEach((evt) => {
        // evt.scene = scene;
        // 获取事件的标识符号
        const id = evt.identifier;
        // 获取事件类型
        if(evt.type === 'touchmove' || evt.type === 'touchend') {
          // 根据事件表示符id获取被捕获的节点对象
          const capturedTarget = touchEventCapturedTargets[id];
          // 分发事件给节点
          if(capturedTarget) capturedTarget.dispatchEvent(evt);
          // 触摸结束 删除当前触摸点对象
          if(evt.type === 'touchend') delete touchEventCapturedTargets[id];
        } else {
          // 遍历
          for(let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            if(layer.options.handleEvent !== false) {
              const ret = layer.dispatchPointerEvent(evt);
              if(ret && evt.target !== layer) break;
              else evt.cancelBubble = false; // prepare passing to next layer
            }
          }
          if(evt.target === layers[0]) {
            // trigger event on top layer
            for(let i = layers.length - 1; i >= 0; i--) {
              const layer = layers[i];
              if(layer.options.handleEvent !== false) {
                evt.target = layer;
                break;
              }
            }
          }
        }
        // 当前的触摸对象
        const target = evt.target;
        if(evt.type === 'touchstart') {
          // 觸摸點的目標對象
          touchEventCapturedTargets[id] = evt.target; // set captured event target
        }
        if(evt.type === 'mousemove') {
          const enteredTargets = scene[_enteredTargets];
          let enterSet;

          if(target) {
            const ancestors = target.ancestors || [];
            enterSet = new Set([target, ...ancestors]);
          } else {
            enterSet = new Set();
          }

          const entries = Object.entries(event);
          if(!enteredTargets.has(target)) {
            if(target) {
              const enterEvent = new Event('mouseenter');
              enterEvent.setOriginalEvent(event);
              entries.forEach(([key, value]) => {
                enterEvent[key] = value;
              });

              enteredTargets.add(target);
              target.dispatchEvent(enterEvent);
              const ancestors = target.ancestors;

              if(ancestors) {
                ancestors.forEach((ancestor) => {
                  if(ancestor instanceof Node && !enteredTargets.has(ancestor)) {
                    enteredTargets.add(ancestor);
                    ancestor.dispatchEvent(enterEvent);
                  }
                });
              }
            }
          }

          const leaveEvent = new Event('mouseleave');
          leaveEvent.setOriginalEvent(event);
          entries.forEach(([key, value]) => {
            leaveEvent[key] = value;
          });
          [...enteredTargets].forEach((target) => {
            if(!enterSet.has(target)) {
              enteredTargets.delete(target);
              target.dispatchEvent(leaveEvent);
            }
          });
        }
      });
    }, {passive: true});
  });
}

/**
 * 设置视口
 * @param {*} options 选项
 * @param {*} canvas 画布
 */
function setViewport(options, canvas) {
  // 画布存在， 样式存在
  if(canvas && canvas.style) {
    // 结构选项
    let {width, height, mode, container} = options;
    // 结构容器尺寸
    const {clientWidth, clientHeight} = container;

    width = width || clientWidth;
    height = height || clientHeight;

    // 视口模式
    if(mode === 'static') {
      // 设置画布样式大小
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // canvas.style.top = '50%';
      // canvas.style.left = '50%';
      // canvas.style.transform = 'translate(-50%, -50%)';
      // canvas.style.webkitTransform = 'translate(-50%, -50%)';
    } else {
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      canvas.style.transform = '';
      canvas.style.webkitTransform = '';
    }
  }
}

const _offscreenLayerCount = Symbol('offscreenLayerCount');

export default class Scene extends Group {
  /**
    width
    height
    mode: 'static', 'scale', 'stickyWidth', 'stickyHeight', 'stickyTop', 'stickyBottom', 'stickyLeft', 'stickyRight'
   */
  constructor(options = {}) {
    super();
    // 是否传入绘图容器
    if(!options.container) {
      // 环境容器属性Container为函数
      if(typeof ENV.Container === 'function') {
        // 内部创建一个容器对象
        options.container = new ENV.Container(options.width || 300, options.height || 150);
      } else {
        throw new Error('No container specified.');
      }
    }
    // 设置容器的引用
    this.container = options.container;
    // 容器是否存在样式
    if(this.container.style) {
      // 没有设置overflow样式，进行设置
      if(!this.container.style.overflow) {
        this.container.style.overflow = 'hidden';
      }
      // 没有设置position时，进行设置
      if(!this.container.style.position) {
        this.container.style.position = 'relative';
      }
    }
    // 这是选项引用
    this.options = options;
    // 获取展示比率
    options.displayRatio = options.displayRatio || 1.0;
    // 获取场景模型
    options.mode = options.mode || 'scale';
    // 场景位置（坐标，x,y轴）
    options.left = 0;
    options.top = 0;
    // 是否自动重新改动尺寸
    options.autoResize = options.autoResize !== false;
    
    if(options.autoResize) {
      // window,web平台下
      if(global.addEventListener) {
        const that = this;
        // 监听视口的大小变动
        global.addEventListener('resize', function listener() {
          if(typeof document !== 'undefined' && document.contains(that.container)) {
            that.resize();
          } else {
            global.removeEventListener('resize', listener);
          }
        });
      }
    }

    // 初始化目标对象集合
    this[_enteredTargets] = new Set();
    this.setResolution(options);
    // 初始化事件系统
    delegateEvents(this);
    // 离开屏层数量
    this[_offscreenLayerCount] = 0;
  }

  get hasOffscreenCanvas() {
    return this[_offscreenLayerCount] > 0;
  }

  set displayRatio(value) {
    const oldValue = this.options.displayRatio;
    if(oldValue !== value) {
      this.options.displayRatio = value;
      this.resize();
    }
  }

  get displayRatio() {
    return this.options.displayRatio;
  }

  set height(value) {
    const oldValue = this.options.height;
    if(oldValue !== value) {
      this.options.height = value;
      this.resize();
    }
  }

  get height() {
    return this.options.height;
  }

  set mode(value) {
    const oldValue = this.options.mode;
    if(oldValue !== value) {
      this.options.mode = value;
      this.resize();
    }
  }

  get mode() {
    return this.options.mode;
  }

  set width(value) {
    const oldValue = this.options.width;
    if(oldValue !== value) {
      this.options.width = value;
      this.resize();
    }
  }

  get width() {
    return this.options.width;
  }

  /* override */
  appendChild(layer) {
    if(!(layer instanceof Layer) && !(layer instanceof LayerWorker)) {
      wrapLayer(layer);
    }
    const ret = super.appendChild(layer);
    const canvas = layer.canvas;
    if(!layer.offscreen) {
      this.container.appendChild(canvas);
    } else {
      this[_offscreenLayerCount]++;
    }
    setViewport(this.options, canvas);
    layer.setResolution(this.getResolution());
    return ret;
  }

  /* override */
  forceUpdate() {
    if(this.hasOffscreenCanvas && !this._requestID) {
      this._requestID = requestAnimationFrame(() => {
        delete this._requestID;
        this.render();
      });
    }
  }

  /* override */
  insertBefore(layer, ref) {
    if(!(layer instanceof Layer) && !(layer instanceof LayerWorker)) {
      wrapLayer(layer);
    }
    const ret = super.insertBefore(layer, ref);
    const canvas = layer.canvas;

    if(!layer.offscreen) {
      const refChild = getRefCanvas(this, layer);
      this.container.insertBefore(canvas, refChild);
    }
    setViewport(this.options, canvas);
    layer.setResolution(this.getResolution());
    return ret;
  }

  /**
   * 层
   * @param {*} id 
   * @param {*} options 
   */
  layer(id = 'default', options = {}) {
    // 合并参数
    options = Object.assign({}, this.options, options);
    // 设置id
    options.id = id;
    // 获取排序过的层
    const layers = this.orderedChildren;
    // 根据id找到要找的层
    for(let i = 0; i < layers.length; i++) {
      if(layers[i].id === id) return layers[i];
    }

    // 是否在woker中
    const worker = options.worker;
    let layer;
    // 存在woker
    if(worker) {
      // 实例化woker层
      layer = new LayerWorker(options);
    } else {
      // 实例化层节点
      layer = new Layer(options);
      // layer.id = id;
    }
    // 将层节点加入到场景中
    this.appendChild(layer);
    return layer;
  }

  /**
   * 预加载资源
   * @param  {...any} resources 资源地址
   */
  async preload(...resources) {
    const loaded = [],
      tasks = [],
      ret = [];

    for(let i = 0; i < resources.length; i++) {
      const res = resources[i];
      let task;
      // 加载
      if(typeof res === 'string') {
        task = loadTexture(res);
      } else if(Array.isArray(res)) {
        task = loadFrames(...res);
      } else {
        const {id, src} = res;
        task = loadTexture(src, id);
      }
      /* istanbul ignore if  */
      if(!(task instanceof Promise)) {
        task = Promise.resolve(task);
      }

      tasks.push(task.then((r) => {
        loaded.push(r);
        ret[i] = r;
        const preloadEvent = new Event({type: 'preload', detail: {current: r, loaded, resources}});
        this.dispatchEvent(preloadEvent);
      }));
    }

    await Promise.all(tasks);
    return ret;
  }

  /* override */
  removeChild(layer) {
    const ret = super.removeChild(layer);
    if(ret) {
      layer._prepareRenderFinished();
      const canvas = layer.canvas;
      if(canvas.remove) canvas.remove();
      if(layer.offscreen) this[_offscreenLayerCount]--;
    }
    return ret;
  }

  // for offscreen mode rendering
  render() {
    const layers = this.orderedChildren;
    let hostLayer = null;
    const offscreens = [];

    for(let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const hasOffscreens = offscreens.length > 0;
      if(layer instanceof Layer && !layer.offscreen) {
        if(!layer.autoRender) {
          if(hasOffscreens) {
            console.warn('Some offscreen canvas will not be rendered.');
            offscreens.length = 0;
          }
        } else {
          hostLayer = layer;
          if(hasOffscreens) {
            layer.renderer.clear();
            for(let j = 0; j < offscreens.length; j++) {
              const ol = offscreens[j];
              ol.render();
              drawImage(layer, ol);
            }
            offscreens.length = 0;
            layer.render({clear: false});
          } else if(layer.prepareRender) {
            layer.render();
          }
        }
      } else if(layer.offscreen) {
        if(hostLayer) {
          if(layer.prepareRender) layer.render();
          drawImage(hostLayer, layer);
        } else {
          offscreens.push(layer);
        }
      } else if(layer instanceof LayerWorker && hasOffscreens) {
        console.warn('Some offscreen canvas will not be rendered.');
        offscreens.length = 0;
      }
    }
  }

  /* override */
  replaceChild(layer, ref) {
    const ret = super.replaceChild(layer, ref);
    if(ref.canvas.remove) ref.canvas.remove();
    if(ref.offscreen) this[_offscreenLayerCount]--;
    const canvas = layer.canvas;
    if(!layer.offscreen) {
      const refChild = getRefCanvas(this, layer);
      this.container.insertBefore(canvas, refChild);
    }
    setViewport(this.options, canvas);
    layer.setResolution(this.getResolution());
    return ret;
  }

  resize() {
    const options = this.options;
    this.children.forEach((layer) => {
      setViewport(options, layer.canvas);
    });
    this.setResolution(options);
    this.dispatchEvent({type: 'resize'});
  }

  /* override */
  /**
   * 设置分辨率
   * @param {*} param0 
   */
  setResolution({width, height} = {}) {
    // 容器对象dom
    const container = this.container;
    // 容器尺寸
    const {clientWidth, clientHeight} = container;
    // 设置分辨率
    if(width == null || height == null) {
      width = width == null ? clientWidth : width;
      height = height == null ? clientHeight : height;
    }

    // canvas渲染模式 device piexl ratio
    const {mode, displayRatio} = this.options;
    // 分辨率乘以dpr
    width *= displayRatio;
    height *= displayRatio;

    // 设置位置
    this.options.left = 0;
    this.options.top = 0;

    // 根据渲染模式。设置元素的宽高
    if(mode === 'stickyHeight' || mode === 'stickyLeft' || mode === 'stickyRight') {
      const w = width;
      width = clientWidth * height / clientHeight;
      if(mode === 'stickyHeight') this.options.left = 0.5 * (width - w);
      if(mode === 'stickyRight') this.options.left = width - w;
    } else if(mode === 'stickyWidth' || mode === 'stickyTop' || mode === 'stickyBottom') {
      const h = height;
      height = clientHeight * width / clientWidth;
      if(mode === 'stickyWidth') this.options.top = 0.5 * (height - h);
      if(mode === 'stickyBottom') this.options.top = height - h;
    }

    super.setResolution({width, height});
  }

  snapshot({offscreen = false} = {}) {
    const _canvas = offscreen ? 'snapshotOffScreenCanvas' : 'snapshotCanvas';
    const {width, height} = this.getResolution();
    this[_canvas] = this[_canvas] || ENV.createCanvas(width, height, {offscreen});
    const context = this[_canvas].getContext('2d');
    const layers = this.orderedChildren;

    context.clearRect(0, 0, width, height);
    for(let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if(layer.render) layer.render();
      const canvas = layer.canvas;
      if(canvas && canvas !== layer) {
        context.drawImage(canvas, 0, 0, width, height);
      }
    }
    return this[_canvas];
  }
}

// 将节点注册到内部
ownerDocument.registerNode(Scene, 'scene');