/**
 * 
 * @param {*} target 目标对象（节点
 * @param {*} mesh 
 */
export default function applyRenderEvent(target, mesh) {
  if(!mesh) return;
  // 获取目标对象的监听函数
  const beforeRenderHandlers = target.getListeners('beforerender');
  const afterRenderHandlers = target.getListeners('afterrender');

  // 渲染处理之前 && 没有网格的渲染之前
  if(beforeRenderHandlers.length && !mesh.beforeRender) {
    mesh.beforeRender = (context) => {
      target.dispatchEvent({
        type: 'beforerender',
        detail: {context},
      });
    };
    // 处理函数长度不存在
  } else if(!beforeRenderHandlers.length) {
    // 没有函数
    mesh.beforeRender = null;
  }

  if(afterRenderHandlers.length && !mesh.afterRender) {
    mesh.afterRender = (context) => {
      target.dispatchEvent({
        type: 'afterrender',
        detail: {context},
      });
    };
  } else if(!afterRenderHandlers.length) {
    mesh.afterRender = null;
  }
}