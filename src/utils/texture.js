import {ENV} from '@mesh.js/core';
import {compareValue} from './attribute_value';

const loadedTextures = {};

/**
 * 
 * @param {*} src 资源地址
 * @param {*} alias 
 */
export function loadTexture(src, alias) {
  // 纹理的缓存是否存在， 存在就立即返回
  if(loadedTextures[src]) return loadedTextures[src];
  // 加载图片
  const img = ENV.loadImage(src, {alias, useImageBitmap: false});
  // 加载成功返回图片实例， 不成功，返回图片地址
  return img != null ? img : src;
}

/**
 * 应用纹理
 * @param {*} node 节点
 * @param {*} image 图片
 * @param {*} updateContours 
 */
export async function applyTexture(node, image, updateContours) {
  // 图片
  let textureImage = image;
  // 字符串，说明是地址
  if(typeof image === 'string') {
    // 重新加载
    textureImage = loadTexture(image);
  }
  // 纹理存在 && 是Promise实例
  if(textureImage && typeof textureImage.then === 'function') {
    // 异步加载
    textureImage = await textureImage;
  }

  // 图片等于节点属性的纹理
  if(image === node.attributes.texture) {
    // 纹理 并且存在 图片
    if(textureImage && textureImage.image) {
      // 存在纹理的方形
      if(textureImage.sourceRect) {
        node.attributes.sourceRect = textureImage.sourceRect;
      }
      // 
      node.textureImageRotated = !!textureImage.rotated;
      textureImage = textureImage.image;
    }

    const {width, height, textureRect} = node.attributes;

    const oldImage = node.textureImage;
    node.textureImage = textureImage;

    if(updateContours && oldImage !== textureImage && !textureRect && (width == null || height == null)) {
      node.updateContours();
    }
    node.forceUpdate();
  }
  return textureImage;
}

const _textureMap = Symbol('textureMap');

export function createTexture(image, renderer) {
  renderer[_textureMap] = renderer[_textureMap] || new Map();
  if(renderer[_textureMap].has(image)) {
    return renderer[_textureMap].get(image);
  }
  const texture = renderer.createTexture(image);
  if(!/^blob:/.test(image.src) && typeof image.getContext !== 'function') {
    // no cache blobs
    renderer[_textureMap].set(image, texture);
  }
  return texture;
}

export function deleteTexture(image, renderer) {
  if(renderer[_textureMap] && renderer[_textureMap].has(image)) {
    const texture = renderer[_textureMap].get(image);
    renderer.deleteTexture(texture);
    renderer[_textureMap].delete(image);
    return true;
  }
  return false;
}

const _textureContext = Symbol('textureContext');
/**
 * 
 * @param {*} node 节点
 * @param {*} mesh 网格
 */
export function drawTexture(node, mesh) {
  // 
  const textureImage = node.textureImage instanceof String // for wechat miniprogram
    ? String(node.textureImage) : node.textureImage;
  const textureImageRotated = node.textureImageRotated;
  const texture = mesh.texture;
  const renderer = node.renderer;
  if(textureImage) {
    const contentRect = node.originalContentRect;
    let textureRect = node.attributes.textureRect;
    const textureRepeat = node.attributes.textureRepeat;
    const sourceRect = node.attributes.sourceRect;

    if(!texture
      || node[_textureContext] && node[_textureContext] !== renderer
      || texture.image !== textureImage
      || texture.options.repeat !== textureRepeat
      || !compareValue(texture.options.rect, textureRect)
      || !compareValue(texture.options.srcRect, sourceRect)) {
      const newTexture = createTexture(textureImage, renderer);
      if(textureRect) {
        textureRect[0] += contentRect[0];
        textureRect[1] += contentRect[1];
      } else {
        textureRect = contentRect;
      }
      let oldTexture = null;
      if(texture && !renderer[_textureMap].has(texture.image) && (!texture.options || !texture.options.hidden)) {
        oldTexture = mesh.uniforms.u_texSampler;
      }
      mesh.setTexture(newTexture, {
        rect: textureRect,
        repeat: textureRepeat,
        srcRect: sourceRect,
        rotated: textureImageRotated,
      });
      // delete uncached texture
      if(oldTexture && oldTexture.delete) {
        oldTexture.delete();
      }
      node[_textureContext] = renderer;
    }
  } else if(texture) {
    let oldTexture = null;
    if(!renderer[_textureMap].has(texture.image) && (!texture.options || !texture.options.hidden)) {
      oldTexture = mesh.uniforms.u_texSampler;
    }
    mesh.setTexture(null);
    // delete uncached texture
    if(oldTexture && oldTexture.delete) {
      oldTexture.delete();
    }
  }
}

/**
  u3d-json compatible: https://www.codeandweb.com/texturepacker
  {
    frames: {
      key: {
        frame: {x, y, w, h},
        trimmed: ...,
        rotated: true|false,
        spriteSourceSize: {x, y, w, h},
        sourceSize: {w, h}
      }
    }
  }
  */
export async function loadFrames(src, frameData) {
  if(typeof frameData === 'string') {
    const response = await fetch(frameData, {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
    });
    frameData = await response.json();
  }

  // 加载纹理
  const texture = await loadTexture(src);
  const frames = frameData.frames;

  Object.entries(frames).forEach(([key, frame]) => {
    const {x, y, w, h} = frame.frame;
    let sourceRect = [x, y, w, h];
    const rotated = frame.rotated;

    if(rotated) {
      sourceRect = [sourceRect[0], sourceRect[1], sourceRect[3], sourceRect[2]];
    }

    loadedTextures[key] = {
      image: texture,
      sourceRect,
      rotated,
    };
  });

  return texture;
}