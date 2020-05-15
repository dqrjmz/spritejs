/**
 * 动画的帧数 fps frame perent second
 */

 /**
  * 返回当前时间
  */
function nowtime() {
  // performance 对象存在 now方法存在
  if(typeof performance !== 'undefined' && performance.now) {
    // 返回当前
    return performance.now();

    // process 对象存在 hrtime方法存在
  } if(typeof process !== 'undefined' && process.hrtime) {
    // 返回当前
    const [s, ns] = process.hrtime();
    return s * 1e3 + ns * 1e-6;
  }
  // 返回当前时间
  return Date.now ? Date.now() : (new Date()).getTime();
}

// 请求动画帧，取消动画帧
let requestAnimationFrame, // eslint-disable-line import/no-mutable-exports
  cancelAnimationFrame;

  // 全局对象存在
if(typeof global !== 'undefined' && typeof global.requestAnimationFrame === 'function') {
  requestAnimationFrame = global.requestAnimationFrame;
  cancelAnimationFrame = global.cancelAnimationFrame;
} else {
  // 设置定时器
  requestAnimationFrame = function (fn) {
    return setTimeout(() => {
      fn(nowtime());
    }, 16);
  };
  cancelAnimationFrame = function (id) {
    return clearTimeout(id);
  };
}

export {requestAnimationFrame, cancelAnimationFrame};