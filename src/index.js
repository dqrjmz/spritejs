import {ENV} from '@mesh.js/core';
/**
  ENV: {
    Container,
    createCanvas,
    loadImage,
  }
 */
// 导入动画函数，开启动画，取消动画
import {requestAnimationFrame, cancelAnimationFrame} from './utils/animation-frame';
// sprite中的内置节点
import Node from './node/node';
import Cloud from './node/cloud';
import Block from './node/block';
import Sprite from './node/sprite';
import Path from './node/path';
import Rect from './node/rect';
import Triangle from './node/triangle';
import Parallel from './node/parallel';
import Regular from './node/regular';
import Star from './node/star';
import Ellipse from './node/ellipse';
import Arc from './node/arc';
import Ring from './node/ring';
import Polyline from './node/polyline';
import Label from './node/label';
import Group from './node/group';
import Layer from './node/layer';
import SpriteSvg from './node/spritesvg';
import LayerWorker from './node/layer-worker';
import Scene from './node/scene';
import ownerDocument from './document';

// 工具函数 （解析颜色字符串，渐变，颜色
import {parseColor, Gradient, Color} from './utils/color';
// 其他尺寸单位转 px, 转数组， 转字符串 ， 转数值
import {sizeToPixel, toArray, toString, toNumber} from './utils/attribute_value';

// 创建自定义节点
const createElement = ownerDocument.createElement;
// 判断当前节点是否为sprite节点
const isSpriteNode = ownerDocument.isSpriteNode;
// 注册自定义节点到sprite
const registerNode = ownerDocument.registerNode;

const helpers = {parseColor, sizeToPixel, toArray, toString, toNumber};

export {
  Arc,
  Block,
  Cloud,
  Color,
  Ellipse,
  Gradient,
  Group,
  Label,
  Layer,
  LayerWorker,
  Node,
  Parallel,
  Path,
  Polyline,
  Rect,
  Regular,
  Ring,
  Scene,
  Sprite,
  SpriteSvg,
  Star,
  Triangle,

  helpers,

  createElement,
  isSpriteNode,
  registerNode,
  requestAnimationFrame,
  cancelAnimationFrame,

  ENV,
};