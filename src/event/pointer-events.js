import Event from './event';

/**
 * 
 * @param {*} originalEvent 事件对象
 * @param {*} param1 
 */
export default function createPointerEvents(originalEvent, {offsetTop = 0, offsetLeft = 0, displayRatio = 1} = {}) {
  let x,
    y;
  const originalCoordinates = [];

  // 获取目标对象的尺寸
  const {left, top, width: viewportWidth, height: viewportHeight} = originalEvent.target.getBoundingClientRect();
  // 目标对象的html width特性
  const resolutionWidth = originalEvent.target.width;
  const resolutionHeight = originalEvent.target.height;

  // 获取事件触摸的手指
  const pointers = originalEvent.changedTouches || [originalEvent];
  // 遍历每个手指信息
  for(let i = 0; i < pointers.length; i++) {
    // 手指
    const pointer = pointers[i];
    // 
    const identifier = pointer.identifier;
    // 手指坐标
    const {clientX, clientY} = pointer;
    if(clientX != null && clientY != null) {
      // 记录手指信息（距离canvas的左边距）
      originalCoordinates.push({
        x: Math.round((clientX | 0) - left),
        y: Math.round((clientY | 0) - top),
        identifier,
      });
    }
  }
  if(originalCoordinates.length <= 0) originalCoordinates.push({x, y});

  const ret = [];
  originalCoordinates.forEach((originalCoordinate) => {
    if(originalCoordinate.x != null && originalCoordinate.y != null) {
      x = (originalCoordinate.x * resolutionWidth / viewportWidth - offsetLeft) / displayRatio;
      y = (originalCoordinate.y * resolutionHeight / viewportHeight - offsetTop) / displayRatio;
    }
    // 事件对象，根据原始事件对象创建（自定义事件对象
    const event = new Event(originalEvent);

    // 定义事件对象，计算后的事件对象的坐标信息等；
    Object.defineProperties(event, {
      layerX: {
        value: x,
      },
      layerY: {
        value: y,
      },
      originalX: {
        value: originalCoordinate.x,
      },
      originalY: {
        value: originalCoordinate.y,
      },
      x: {
        value: x,
      },
      y: {
        value: y,
      },
      identifier: {
        value: originalCoordinate.identifier,
      },
    });

    // ret中
    ret.push(event);
  });

  return ret;
}