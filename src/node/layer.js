// 为了可视化而生的图形系统
import {Renderer, ENV, Figure2D, Mesh2D} from '@mesh.js/core';
// 一个抽象的动画接口的实现
import {Timeline} from 'sprite-animator';
import {requestAnimationFrame, cancelAnimationFrame} from '../utils/animation-frame';
import Group from './group';
import ownerDocument from '../document';
import {deleteTexture} from '../utils/texture';

// 默认的参数
const defaultOptions = {
  antialias: true,
  // 自定义渲染器
  autoRender: true,
  // 
  alpha: true, // for wx-miniprogram
};

const _autoRender = Symbol('autoRender');
const _renderer = Symbol('renderer');
const _timeline = Symbol('timeline');

const _prepareRender = Symbol('prepareRender');
const _tickRender = Symbol('tickRender');

const _pass = Symbol('pass');
const _fbo = Symbol('fbo');
const _tickers = Symbol('tickers');

// 层节点
export default class Layer extends Group {
  /**
   * 
   * @param {*} options 初始化时的参数
   */
  constructor(options = {}) {
    // 初始化父类
    super();
    // 没有canvas,现存的canvas dom对象
    if(!options.canvas) {
      // 获取分辨率 （父类的获取分辨率方法
      const {width, height} = this.getResolution();
      // 创建canvas
      const canvas = ENV.createCanvas(width, height, {
        offscreen: !!options.offscreen, //是否离屏
        id: options.id, // 
        extra: options.extra,
      });
      // 设置canvas样式
      if(canvas.style) canvas.style.position = 'absolute';
      // 设置canvas data属性
      if(canvas.dataset) canvas.dataset.layerId = options.id;
      // 设置上下文类型
      if(canvas.contextType) options.contextType = canvas.contextType;
      options.canvas = canvas;
    }
    // canvas 获取dom 对象 
    const canvas = options.canvas;
    // 合并初始化layer参数
    const opts = Object.assign({}, defaultOptions, options);
    // 存在自动渲染器
    this[_autoRender] = opts.autoRender;
    // 删除
    delete options.autoRender;
    // 获取渲染器，创建 2d 图像的渲染器构造函数
    const _Renderer = opts.Renderer || Renderer;
    // 创建渲染器实例，在_renderer 属性
    this[_renderer] = new _Renderer(canvas, opts);
    // canvas是否为webgl上下文
    if(canvas.__gl__) {
      // fix blendFunc for node-canvas-webgl
      const gl = canvas.__gl__;
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    // 创建选项参数赋值的属性
    this.options = options;
    // 获取选项参数中的id ,创建层的标识id
    this.id = options.id;
    this[_pass] = [];
    // 设置分辨率
    this.setResolution(canvas);
    // 创建canvas dom 节点的引用属性
    this.canvas = canvas;
    // 
    this[_timeline] = new Timeline();
    // 被鼠标捕获的目标
    this.__mouseCapturedTarget = null;
  }

  get autoRender() {
    return this[_autoRender];
  }

  /**
   * 设备像素比
   */
  get displayRatio() {
    if(this.parent && this.parent.options) {
      return this.parent.options.displayRatio;
    }
    return 1.0;
  }

  get height() {
    const {height} = this.getResolution();
    return height / this.displayRatio;
  }

  get gl() {
    if(this.renderer.glRenderer) {
      return this.renderer.glRenderer.gl;
    }
    return null;
  }

  /* override */
  /**
   * 获取节点所在层
   */
  get layer() {
    return this;
  }

  get offscreen() {
    return !!this.options.offscreen || this.canvas._offscreen;
  }

  get pass() {
    return this[_pass];
  }

  get prepareRender() {
    return this[_prepareRender] ? this[_prepareRender] : Promise.resolve();
  }

  /* override */
  get renderer() {
    return this[_renderer];
  }

  get renderOffset() {
    if(this.parent && this.parent.options) {
      const {left, top} = this.parent.options;
      return [left, top];
    }
    return [this.options.left | 0, this.options.top | 0];
  }

  get timeline() {
    return this[_timeline];
  }

  get width() {
    const {width} = this.getResolution();
    return width / this.displayRatio;
  }

  // isPointCollision(x, y) {
  //   return true;
  // }

  addPass({vertex, fragment, options, uniforms} = {}) {
    if(this.renderer.glRenderer) {
      const {width, height} = this.getResolution();
      const program = this.renderer.createPassProgram({vertex, fragment, options});
      // 创建2d图形
      const figure = new Figure2D();
      // 创建方形
      figure.rect(0, 0, width / this.displayRatio, height / this.displayRatio);
      // 
      const mesh = new Mesh2D(figure);
      mesh.setUniforms(uniforms);
      mesh.setProgram(program);
      this[_pass].push(mesh);
      this.forceUpdate();
      return mesh;
    }
    return null;
  }

  // delete unused texture to release memory.
  deleteTexture(image) {
    return deleteTexture(image, this.renderer);
  }

  /* override */
  dispatchPointerEvent(event) {
    // 事件类型
    const type = event.type;
    // 鼠标事件
    if(type === 'mousedown' || type === 'mouseup' || type === 'mousemove') {
      // 当前捕获目标
      const capturedTarget = this.__mouseCapturedTarget;
      if(capturedTarget) {
        // 
        if(capturedTarget.layer === this) {
          // 当前元素分发事件
          capturedTarget.dispatchEvent(event);
          return true;
        }
        this.__mouseCapturedTarget = null;
      }
    }
    return super.dispatchPointerEvent(event);
  }

  /* override */
  forceUpdate() {
    // 
    if(!this[_prepareRender]) {
      if(this.parent && this.parent.hasOffscreenCanvas) {
        this.parent.forceUpdate();
        let _resolve = null;
        const prepareRender = new Promise((resolve) => {
          _resolve = resolve;
        });
        prepareRender._resolve = _resolve;
        this[_prepareRender] = prepareRender;
      } else {
        let _resolve = null;
        let _requestID = null;
        const prepareRender = new Promise((resolve) => {
          _resolve = resolve;

          if(this[_autoRender]) {
            _requestID = requestAnimationFrame(() => {
              delete prepareRender._requestID;
              this.render();
            });
          }
        });

        prepareRender._resolve = _resolve;
        prepareRender._requestID = _requestID;

        this[_prepareRender] = prepareRender;
      }
    }
  }

  getFBO() {
    const renderer = this.renderer.glRenderer;
    const {width, height} = this.getResolution();
    if(renderer && (!this[_fbo] || this[_fbo].width !== width || this[_fbo].height !== height)) {
      this[_fbo] = {
        width,
        height,
        target: renderer.createFBO(),
        buffer: renderer.createFBO(),
        swap() {
          [this.target, this.buffer] = [this.buffer, this.target];
        },
      };
      return this[_fbo];
    }
    return this[_fbo] ? this[_fbo] : null;
  }

  /* override */
  onPropertyChange(key, newValue, oldValue) {
    super.onPropertyChange(key, newValue, oldValue);
    if(key === 'zIndex') {
      this.canvas.style.zIndex = newValue;
    }
  }

  _prepareRenderFinished() {
    if(this[_prepareRender]) {
      if(this[_prepareRender]._requestID) {
        cancelAnimationFrame(this[_prepareRender]._requestID);
      }
      this[_prepareRender]._resolve();
      delete this[_prepareRender];
    }
  }

  render({clear = true} = {}) {
    const fbo = this[_pass].length ? this.getFBO() : null;
    if(fbo) {
      this.renderer.glRenderer.bindFBO(fbo.target);
    }
    // 清除画布
    if(clear) this[_renderer].clear();
    // 渲染引擎
    const meshes = this.draw();
    if(meshes && meshes.length) {
      this.renderer.drawMeshes(meshes);
      if(this.canvas.draw) this.canvas.draw();
    }
    if(fbo) {
      const renderer = this.renderer.glRenderer;
      const len = this[_pass].length;
      const {width, height} = this.getResolution();
      const rect = [0, 0, width / this.displayRatio, height / this.displayRatio];
      this[_pass].forEach((pass, idx) => {
        pass.blend = true;
        pass.setTexture(fbo.target.texture, {rect});
        if(idx === len - 1) renderer.bindFBO(null);
        else {
          fbo.swap();
          renderer.bindFBO(fbo.target);
        }
        this[_renderer].clear();
        this.renderer.drawMeshes([pass]);
      });
    }
    this._prepareRenderFinished();
  }

  /* override */
  setResolution({width, height}) {
    // 获取渲染器
    const renderer = this.renderer;
    // 渲染矩阵
    const m = renderer.globalTransformMatrix;
    const offsetLeft = m[4];
    const offsetTop = m[5];
    const previousDisplayRatio = m[0];
    // 获取分辨率大小
    const {width: w, height: h} = this.getResolution();
    // 根据设置的长，宽，重新设置分辨率
    if(w !== width || h !== height) {
      super.setResolution({width, height});
      // 获取canvas dom对象
      if(this.canvas) {
        // 获取canvas dom的 尺寸
        this.canvas.width = width;
        this.canvas.height = height;
        // 
        if(renderer.updateResolution) renderer.updateResolution();
      }
      this.attributes.size = [width, height];
      if(this[_pass].length) {
        this[_pass].forEach((pass) => {
          const figure = new Figure2D();
          figure.rect(0, 0, width / this.displayRatio, height / this.displayRatio);
          pass.contours = figure.contours;
        });
      }
      // this.dispatchEvent({type: 'resolutionchange', width, height});
    }
    const [left, top] = this.renderOffset;
    const displayRatio = this.displayRatio;
    if(offsetLeft !== left || offsetTop !== top || previousDisplayRatio !== displayRatio) {
      // console.log(displayRatio, this.parent);
      renderer.setGlobalTransform(displayRatio, 0, 0, displayRatio, left, top);
      this.forceUpdate();
    }
  }

  /**
   * tick(handler, {originTime = 0, playbackRate = 1.0, duration = Infinity})
   * @param {*} handler
   * @param {*} options
   */
  tick(handler = null, {duration = Infinity, ...timelineOptions} = {}) {
    // this._prepareRenderFinished();
    const t = this.timeline.fork(timelineOptions);
    const layer = this;

    this[_tickers] = this[_tickers] || [];
    this[_tickers].push({handler, duration});

    const update = () => {
      let _resolve = null;
      let _requestID = null;
      const _update = () => {
        // const ret = handler ? handler(t.currentTime, p) : null;
        const ret = this[_tickers].map(({handler, duration}) => {
          const p = Math.min(1.0, t.currentTime / duration);
          const value = handler ? handler(t.currentTime, p) : null;
          return {value, p};
        });
        if(layer[_autoRender] && !layer[_tickRender]) {
          layer[_tickRender] = Promise.resolve().then(() => {
            layer.render();
            delete layer[_tickRender];
            for(let i = ret.length - 1; i >= 0; i--) {
              const {value, p} = ret[i];
              if(value === false || p >= 1.0) {
                this[_tickers].splice(i, 1);
              }
            }
            if(this[_tickers].length > 0) {
              update();
            }
          });
        }
      };

      if(this[_prepareRender] && this[_prepareRender]._type !== 'ticker') {
        cancelAnimationFrame(this[_prepareRender]._requestID);
        delete this[_prepareRender];
      }

      if(!this[_prepareRender]) {
        const prepareRender = new Promise((resolve) => {
          _resolve = resolve;
          _requestID = requestAnimationFrame(_update);
        });
        prepareRender._resolve = _resolve;
        prepareRender._requestID = _requestID;
        prepareRender._type = 'ticker';

        this[_prepareRender] = prepareRender;
      }
    };

    update();
  }

  toGlobalPos(x, y) {
    const {width, height} = this.getResolution();
    const offset = this.renderOffset;
    const viewport = [this.canvas.clientWidth, this.canvas.clientHeight];

    x = x * viewport[0] / width + offset[0];
    y = y * viewport[1] / height + offset[1];

    const displayRatio = this.displayRatio;

    return [x * displayRatio, y * displayRatio];
  }

  toLocalPos(x, y) {
    const {width, height} = this.getResolution();
    const offset = this.renderOffset;
    const viewport = [this.canvas.clientWidth, this.canvas.clientHeight];
    x = x * width / viewport[0] - offset[0];
    y = y * height / viewport[1] - offset[1];

    const displayRatio = this.displayRatio;

    return [x / displayRatio, y / displayRatio];
  }
}

ownerDocument.registerNode(Layer, 'layer');