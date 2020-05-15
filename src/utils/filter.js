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

  const filterReg = /^(?:(url|blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|opacity|saturate|sepia)\(([^()]+)\))+$/i;
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
  mesh.clearFilter();
  if(filters) {
    filters.forEach(({type, args}) => {
      let method = type;
      if(method === 'drop-shadow') method = 'dropShadow';
      else if(method === 'hue-rotate') method = 'hueRotate';
      mesh[method](...args);
    });
  }
}