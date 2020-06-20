import {toNumber} from './attribute_value';

/**
 * 解析过滤字符串
 * @param {*} filterStr 
 */
export function parseFilterString(filterStr) {
  // 去掉两边空格
  filterStr = filterStr.trim();
  // 不存在 或者值为 'none' 直接返回null
  if(!filterStr || filterStr === 'none') return null;

  // 过滤的字符串的正则
  const filterReg = /^(?:(url|blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(([^()]+)\))+$/i;
  // 开始进行匹配
  const filters = filterStr.match(/^(?:(url|blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(([^()]+)\))+$/ig);

  const ret = [];
  if(filters) {
    // 匹配到的字符
    filters.forEach((filter) => {
      // 第一个匹配到的
      const matched = filter.match(filterReg);
      // 没有即是无效过滤字符串
      if(!matched) throw new TypeError('Invalid fitler string.');
      // 
      let [, type, args] = matched;
      // 将参数以空格进行分割为数组，进行遍历
      args = args.trim().split(/\s+/g).map((n, i) => {
        let value;
        
        if(type === 'url' || type === 'drop-shadow' && i === 3) {
          value = n;
        } else {
          value = toNumber(n);
        }

        if(/%$/.test(n)) {
          value /= 100;
        }
        return value;
      });
      ret.push({type, args});
    });
  }

  return ret;
}

export function applyFilters(mesh, filters) {
  // 清除过滤器
  mesh.clearFilter();
  // 过滤器数组
  if(filters) {
    // 遍历过滤器
    filters.forEach(({type, args}) => {
      let method = type;
      // 网格
      if(method === 'drop-shadow') method = 'dropShadow';
      else if(method === 'hue-rotate') method = 'hueRotate';
      // 绘制方式
      mesh[method](...args);
    });
  }
}