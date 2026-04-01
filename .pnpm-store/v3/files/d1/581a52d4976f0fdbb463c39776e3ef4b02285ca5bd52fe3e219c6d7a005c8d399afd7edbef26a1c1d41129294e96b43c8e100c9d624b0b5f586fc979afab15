"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.SizeContextProvider = void 0;
var React = _interopRequireWildcard(require("react"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const SizeContext = /*#__PURE__*/React.createContext(undefined);
const SizeContextProvider = ({
  children,
  size
}) => {
  const originSize = React.useContext(SizeContext);
  return /*#__PURE__*/React.createElement(SizeContext.Provider, {
    value: size || originSize
  }, children);
};
exports.SizeContextProvider = SizeContextProvider;
var _default = exports.default = SizeContext;