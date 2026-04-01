"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const useLazyKVMap = (data, childrenColumnName, getRowKey) => {
  const mapCacheRef = React.useRef({});
  function getRecordByKey(key) {
    if (!mapCacheRef.current || mapCacheRef.current.data !== data || mapCacheRef.current.childrenColumnName !== childrenColumnName || mapCacheRef.current.getRowKey !== getRowKey) {
      const kvMap = new Map();
      function dig(records) {
        records.forEach((record, index) => {
          const rowKey = getRowKey(record, index);
          kvMap.set(rowKey, record);
          if (record && typeof record === 'object' && childrenColumnName in record) {
            dig(record[childrenColumnName] || []);
          }
        });
      }
      dig(data);
      mapCacheRef.current = {
        data,
        childrenColumnName,
        kvMap,
        getRowKey
      };
    }
    return mapCacheRef.current.kvMap?.get(key);
  }
  return [getRecordByKey];
};
var _default = exports.default = useLazyKVMap;