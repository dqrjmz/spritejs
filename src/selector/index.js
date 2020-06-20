/* istanbul ignore file */
import {parseColor} from '../utils/color';
import ownerDocument from '../document';

const CSSselect = require('css-select');

/**
 * 
 * @param {*} elem 
 */
function isTag(elem) {
  // 节点类型是1，为标签元素 或者是sprite自己的节点
  return elem.nodeType === 1 || ownerDocument.isSpriteNode(elem.nodeName);
}

/**
 * 获取元素的子节点
 * @param {*} elem 节点
 */
function getChildren(elem) {
  // 将子节点转换为数组
  return Array.from(elem.childNodes || []);
}

/**
 * 获取元素的父节点
 * @param {*} elem 
 */
function getParent(elem) {
  // 节点是否为sprite自身的节点（通过节点的名称进行判断）
  if(ownerDocument.isSpriteNode(elem.nodeName)) {
    // 节点的父节点 || canvas节点 || 容器节点
    return elem.parent || elem.canvas || elem.container;
  }
  // 非sprite自身节点， 返回节点的父节点
  return elem.parentElement;
}

/**
 * 删除子节点集合
 * @param {*} nodes 
 */
function removeSubsets(nodes) {
  // 节点的长度
  let idx = nodes.length,
    node,
    ancestor,
    replace;

  // Check if each node (or one of its ancestors) is already contained in the
  // array.
  // 遍历节点
  while(--idx > -1) {
    // 祖先节点
    node = ancestor = nodes[idx];

    // Temporarily remove the node under consideration
    // 清除数组中的节点
    nodes[idx] = null;
    replace = true;

    // 获取节点的祖先，当没有父节点时候退出
    while(ancestor) {
      // 节点数组中存在这个节点
      if(nodes.indexOf(ancestor) > -1) {
        replace = false;
        // 删除
        nodes.splice(idx, 1);
        break;
      }
      // 获取父节点
      ancestor = getParent(ancestor);
    }

    // If the node has been found to be unique, re-insert it.
    if(replace) {
      nodes[idx] = node;
    }
  }

  return nodes;
}

/**
 * 适配器：用在现有接口和不兼容类之间的适配
 */
const adapter = {
  isTag,
  /**
   * 
   * @param {*} test 
   * @param {*} elems 
   */
  existsOne(test, elems) {
    return elems.some((elem) => {
      return isTag(elem)
        ? test(elem) || adapter.existsOne(test, getChildren(elem))
        : false;
    });
  },
  /**
   * 获取兄弟节点
   * @param {*} elem 
   */
  getSiblings(elem) {
    // 先回去父节点
    const parent = getParent(elem);
    // 获取父节点的子节点
    return parent && getChildren(parent);
  },
  getChildren,
  getParent,
  // 获取节点上的，指定属性名的属性值
  getAttributeValue(elem, name) {
    // 节点类型 && 属性名
    if(elem.nodeType === 1 && name === 'class' || name === 'id') {
      // 直接返回
      return elem[name];
    }
    if(this.hasAttrib(elem, name)) {
      let val = elem.attributes[name];
      if(Array.isArray(val)) {
        val = `[${val.join()}]`;
      }
      return String(val);
    }
  },
  hasAttrib(elem, name) {
    return elem.attributes[name] != null;
  },
  removeSubsets,
  getName(elem) {
    return elem.tagName ? elem.tagName.toLowerCase() : null;
  },
  findOne: function findOne(test, arr) {
    let elem = null;

    for(let i = 0, l = arr.length; i < l && !elem; i++) {
      if(test(arr[i])) {
        elem = arr[i];
      } else {
        const childs = getChildren(arr[i]);
        if(childs && childs.length > 0) {
          elem = findOne(test, childs);
        }
      }
    }

    return elem;
  },
  findAll: function findAll(test, elems) {
    let result = [];
    for(let i = 0, j = elems.length; i < j; i++) {
      if(!isTag(elems[i])) continue;  // eslint-disable-line
      if(test(elems[i])) result.push(elems[i]);
      const childs = getChildren(elems[i]);
      if(childs) result = result.concat(findAll(test, childs));
    }
    return result;
  },
  getText: function getText(elem) {
    if(Array.isArray(elem)) return elem.map(getText).join('');

    if(isTag(elem)) return getText(getChildren(elem));

    if(elem.nodeType === 3) return elem.nodeValue;

    if(ownerDocument.isSpriteNode(elem.nodeName)) return elem.text;

    return '';
  },
};

/**
 * 
 * @param {*} query 查询符号
 */
function resolveQuery(query) {
  if(typeof query !== 'string') return query;
  let matches = query.match(/\[(bgcolor|fillColor|strokeColor|color)\s*=\s*['"]?\w+['"]?\]/g);
  if(matches) {
    matches = matches.map((matched) => {
      const kv = matched.slice(1, -1).split('=');
      const color = parseColor(kv[1].replace(/['"]/g, ''));
      return [matched, `[${kv[0]}="${color}"]`];
    });
    matches.forEach(([r, p]) => {
      query = query.replace(r, p);
    });
  }
  matches = query.match(/\[\w+\s*=\s*['"]\[.+?\]['"]\]/g);
  if(matches) {
    matches = matches.map((matched) => {
      const kv = matched.slice(1, -1).split('=');
      const arr = kv[1].slice(2, -2).split(/,/g).map(k => k.trim());
      return [matched, `[${kv[0]}="[${arr}]"]`];
    });
    matches.forEach(([r, p]) => {
      query = query.replace(r, p);
    });
  }
  return query;
}
/**
 * 
 * @param {*} query 
 * @param {*} elems 
 */
export function querySelectorAll(query, elems) {
  return CSSselect.selectAll(resolveQuery(query), elems, {adapter});
}

export function querySelector(query, elems) {
  return CSSselect.selectOne(resolveQuery(query), elems, {adapter});
}

export function isMatched(elem, query) {
  return CSSselect.is(elem, resolveQuery(query), {adapter});
}

export function compile(query) {
  return CSSselect.compile(resolveQuery(query), {adapter});
}
