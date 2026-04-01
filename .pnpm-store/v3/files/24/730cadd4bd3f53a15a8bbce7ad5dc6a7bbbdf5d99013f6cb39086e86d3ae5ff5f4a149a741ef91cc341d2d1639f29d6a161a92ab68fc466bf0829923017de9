"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _Upload = _interopRequireDefault(require("./Upload"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const Dragger = /*#__PURE__*/React.forwardRef((props, ref) => {
  const {
    style,
    height,
    hasControlInside = false,
    children,
    ...restProps
  } = props;
  const mergedStyle = {
    ...style,
    height
  };
  return /*#__PURE__*/React.createElement(_Upload.default, {
    ref: ref,
    hasControlInside: hasControlInside,
    ...restProps,
    style: mergedStyle,
    type: "drag"
  }, children);
});
if (process.env.NODE_ENV !== 'production') {
  Dragger.displayName = 'Dragger';
}
var _default = exports.default = Dragger;