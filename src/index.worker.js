import {ENV} from '@mesh.js/core';
/**
  ENV: {
    Container,
    createCanvas,
    loadImage,
  }
 */
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
import ownerDocument from './document';

import {parseColor, Gradient} from './utils/color';
import {sizeToPixel, toArray, toString, toNumber} from './utils/attribute_value';

const helpers = {parseColor, sizeToPixel, toArray, toString, toNumber};

const createElement = ownerDocument.createElement;
const isSpriteNode = ownerDocument.isSpriteNode;
const registerNode = ownerDocument.registerNode;

const layerCreated = new Promise((resolve) => {
  // 缓存图层实例
  let layer = null;
  // work线程通过事件传递消息
  self.addEventListener('message', (evt) => {
    // 根据消息的类型进行不同的处理
    if(evt.data.type === 'create') {
      // 获取事件对象中携带的数据
      const options = evt.data.options;
      // 创建一个新图层
      layer = new Layer(options);
      // 将图层实例返回
      resolve(layer);
      // 事件
    } else if(layer && evt.data.type === 'event') {
      // 给图层分发事件
      layer.dispatchPointerEvent(evt.data.event);
      // 分辨率修改事件
    } else if(evt.data.type === 'resolution_change') {
      // 事件对象
      const {width, height} = evt.data;
      // 图层重新设置分辨率
      layer.setResolution({width, height});
    }
  });
});


export {
  Arc,
  Block,
  Cloud,
  Ellipse,
  Gradient,
  Group,
  Label,
  Layer,
  Node,
  Parallel,
  Path,
  Polyline,
  Rect,
  Regular,
  Ring,
  Sprite,
  SpriteSvg,
  Star,
  Triangle,

  helpers,

  createElement,
  isSpriteNode,
  registerNode,

  layerCreated,

  ENV,
};