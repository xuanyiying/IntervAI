"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useSingletonCache;
var React = _interopRequireWildcard(require("react"));
var _isEqual = _interopRequireDefault(require("@rc-component/util/lib/isEqual"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * Singleton cache will only take latest `cacheParams` as key
 * and return the result for callback matching.
 */
function useSingletonCache() {
  const cacheRef = React.useRef([null, null]);
  const getCache = (cacheKeys, callback) => {
    const filteredKeys = cacheKeys.map(item => item instanceof HTMLElement || Number.isNaN(item) ? '' : item);
    if (!(0, _isEqual.default)(cacheRef.current[0], filteredKeys)) {
      cacheRef.current = [filteredKeys, callback()];
    }
    return cacheRef.current[1];
  };
  return getCache;
}