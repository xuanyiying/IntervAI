"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _warning = require("../_util/warning");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * Warning for ConfigProviderProps.
 * This will be empty function in production.
 */
const PropWarning = /*#__PURE__*/React.memo(({
  dropdownMatchSelectWidth
}) => {
  const warning = (0, _warning.devUseWarning)('ConfigProvider');
  warning.deprecated(dropdownMatchSelectWidth === undefined, 'dropdownMatchSelectWidth', 'popupMatchSelectWidth');
  return null;
});
if (process.env.NODE_ENV !== 'production') {
  PropWarning.displayName = 'PropWarning';
}
var _default = exports.default = process.env.NODE_ENV !== 'production' ? PropWarning : () => null;