"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _transKeys = require("../../_util/transKeys");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const useData = (dataSource, rowKey, targetKeys) => {
  const mergedDataSource = React.useMemo(() => (dataSource || []).map(record => {
    if (rowKey) {
      return {
        ...record,
        key: rowKey(record)
      };
    }
    return record;
  }), [dataSource, rowKey]);
  const [leftDataSource, rightDataSource] = React.useMemo(() => {
    const leftData = [];
    const rightData = Array.from({
      length: targetKeys?.length ?? 0
    });
    const targetKeysMap = (0, _transKeys.groupKeysMap)(targetKeys || []);
    mergedDataSource.forEach(record => {
      // rightData should be ordered by targetKeys
      // leftData should be ordered by dataSource
      if (targetKeysMap.has(record.key)) {
        const idx = targetKeysMap.get(record.key);
        rightData[idx] = record;
      } else {
        leftData.push(record);
      }
    });
    return [leftData, rightData];
  }, [mergedDataSource, targetKeys]);
  return [mergedDataSource, leftDataSource.filter(Boolean), rightDataSource.filter(Boolean)];
};
var _default = exports.default = useData;