// 保存内置节点元素的容器
const nodeMap = new Map();

/**
 * 创建元素
 * @param {*} nodeName 节点名称
 * @param {*} attrs 节点特性
 * @param {*} children 子节点
 */
function createElement(nodeName, attrs = {}, children = []) {
  // 节点名称转为小写
  nodeName = nodeName.toLowerCase();
  // 获取节点是否存在
  const Element = nodeMap.get(nodeName);
  // 元素不存在，说明是无效的节点
  if(!Element) throw new TypeError(`Invalid node: ${nodeName}`);
  // 根据属性创建节点
  const elem = new Element(attrs);
  // 将子节点添加到当前节点中
  children.forEach((child) => {
    elem.appendChild(child);
  });
  return elem;
}

const ownerDocument = {
  /**
   * 注册内部节点
   * @param {*} Node 节点类（不是实例
   * @param {*} nodeName 节点名称
   * @param {*} nodeType 节点类型
   */
  registerNode(Node, nodeName, nodeType = 100) {
    // 将节点名称转换为小写
    nodeName = nodeName.toLowerCase();
    // 查看节点是否已经被注册
    if(nodeMap.has(nodeName)) throw new TypeError(`Cannot registerNode, ${nodeName} has been taken.`);
    // 将节点类，记录进缓存
    nodeMap.set(nodeName, Node);
    // 给节点类原型对象定义属性
    Object.defineProperties(Node.prototype, {
      // 节点的类型
      nodeType: {
        value: nodeType,
      },
      // 标签名称（必须是小写
      tagName: {
        value: nodeName.toUpperCase(),
      },
      // 节点名称
      nodeName: {
        value: nodeName,
      },
      // 自身文档
      ownerDocument: {
        value: ownerDocument,
      },
      // 节点的命名空间
      namespaceURI: {
        value: `http://spritejs.org/${nodeName}`,
      },
    });
  },
  createElement,
  createElementNS(uri, name) {
    return createElement(name);
  },
  /**
   * 是否是Sprite内部节点
   * @param {*} nodeName 节点名称
   */
  isSpriteNode(nodeName) {
    return nodeMap.has(nodeName.toLowerCase());
  },
};

export default ownerDocument;