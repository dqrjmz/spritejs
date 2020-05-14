const _type = Symbol('type');
const _bubbles = Symbol('bubbles');
const _originalEvent = Symbol('originalEvent');
const _detail = Symbol('detail');

// 事件对象
export default class Event {
  /**
   * 
   * @param {*} originalEvent 原始事件
   * @param {*} param1 配置
   */
  constructor(originalEvent, {bubbles = null} = {}) {
    // 必须是字符换类型
    if(typeof originalEvent === 'string') {
      // 添加到私有_type属性
      this[_type] = originalEvent;
      // 是否冒泡
      this[_bubbles] = !!bubbles;
    } else {
      // 原始事件对象）的类型
      this[_type] = originalEvent.type;
      // 原始事件对象
      this[_originalEvent] = originalEvent;
      this[_bubbles] = bubbles != null ? !!bubbles : !!originalEvent.bubbles;
      // 事件对象详情
      if(originalEvent.detail) {
        this[_detail] = originalEvent.detail;
      }
    }
    // 事件类型属性不存在
    if(!this[_type]) throw new TypeError('Invalid event type.');
    // 取消冒泡
    this.cancelBubble = false;
  }

  // 设置原始事件对象
  setOriginalEvent(originalEvent) {
    this[_originalEvent] = originalEvent;
  }

  get originalEvent() {
    return this[_originalEvent];
  }

  get type() {
    return this[_type];
  }

  get bubbles() {
    return this[_bubbles];
  }

  get detail() {
    return this[_detail];
  }

  stopPropagation() {
    this.cancelBubble = true;
  }
}