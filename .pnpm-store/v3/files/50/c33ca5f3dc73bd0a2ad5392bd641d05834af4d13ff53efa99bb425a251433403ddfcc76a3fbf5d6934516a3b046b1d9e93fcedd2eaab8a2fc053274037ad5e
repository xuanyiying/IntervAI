"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = MotionWrapper;
var React = _interopRequireWildcard(require("react"));
var _motion = require("@rc-component/motion");
var _internal = require("../theme/internal");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const MotionCacheContext = /*#__PURE__*/React.createContext(true);
if (process.env.NODE_ENV !== 'production') {
  MotionCacheContext.displayName = 'MotionCacheContext';
}
function MotionWrapper(props) {
  const parentMotion = React.useContext(MotionCacheContext);
  const {
    children
  } = props;
  const [, token] = (0, _internal.useToken)();
  const {
    motion
  } = token;
  const needWrapMotionProviderRef = React.useRef(false);
  needWrapMotionProviderRef.current || (needWrapMotionProviderRef.current = parentMotion !== motion);
  if (needWrapMotionProviderRef.current) {
    return /*#__PURE__*/React.createElement(MotionCacheContext.Provider, {
      value: motion
    }, /*#__PURE__*/React.createElement(_motion.Provider, {
      motion: motion
    }, children));
  }
  return children;
}