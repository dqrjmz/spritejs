import Event from './event';

/**
 * 
 * @param {*} originalEvent 事件对象（dom 级别的
 * @param {*} param1 
 */
export default function createPointerEvents(originalEvent, {offsetTop = 0, offsetLeft = 0, displayRatio = 1} = {}) {
  let x,
    y;
    // 
  const originalCoordinates = [];

  // 获取目标对象的尺寸
  const {left, top, width: viewportWidth, height: viewportHeight} = originalEvent.target.getBoundingClientRect();
  // dom目标对象的宽度
  const resolutionWidth = originalEvent.target.width;
  // dom目标对象的高度
  const resolutionHeight = originalEvent.target.height;

  // 获取触摸事件的所有触摸点
  const pointers = originalEvent.changedTouches || [originalEvent];
  // 遍历每个触摸点信息
  for(let i = 0; i < pointers.length; i++) {
    // 触摸点
    const pointer = pointers[i];
    // 触摸点的唯一标识符
    const identifier = pointer.identifier;
    // 触摸点坐标
    const {clientX, clientY} = pointer;
    if(clientX != null && clientY != null) {
      // 记录触摸点信息（距离canvas的左边距）
      originalCoordinates.push({
        // 距离canvas左边的距离
        x: Math.round((clientX | 0) - left),
        // 距离canvas上边的距离
        y: Math.round((clientY | 0) - top),
        // 触摸点标识符
        identifier,
      });
    }
  }
  if(originalCoordinates.length <= 0) originalCoordinates.push({x, y});

  const ret = [];
  originalCoordinates.forEach((originalCoordinate) => {
    // x,y轴存在
    if(originalCoordinate.x != null && originalCoordinate.y != null) {
      // 
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