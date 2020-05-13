const nodeMap = new Map();

function createElement(nodeName, attrs = {}, children = []) {
  nodeName = nodeName.toLowerCase();
  const Element = nodeMap.get(nodeName);
  if(!Element) throw new TypeError(`Invalid node: ${nodeName}`);
  const elem = new Element(attrs);
  children.forEach((child) => {
    elem.appendChild(child);
  });
  return elem;
}

const ownerDocument = {
  /**
   * 
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
      nodeType: {
        value: nodeType,
      },
      tagName: {
        value: nodeName.toUpperCase(),
      },
      nodeName: {
        value: nodeName,
      },
      ownerDocument: {
        value: ownerDocument,
      },
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