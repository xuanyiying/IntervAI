"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.InternalPanel = void 0;
var _react = _interopRequireWildcard(require("react"));
var _clsx = require("clsx");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const InternalPanel = exports.InternalPanel = /*#__PURE__*/(0, _react.forwardRef)((props, ref) => {
  const {
    prefixCls,
    className,
    children,
    size,
    style = {}
  } = props;
  const panelClassName = (0, _clsx.clsx)(`${prefixCls}-panel`, {
    [`${prefixCls}-panel-hidden`]: size === 0
  }, className);
  const hasSize = size !== undefined;
  return /*#__PURE__*/_react.default.createElement("div", {
    ref: ref,
    className: panelClassName,
    style: {
      ...style,
      // Use auto when start from ssr
      flexBasis: hasSize ? size : 'auto',
      flexGrow: hasSize ? 0 : 1
    }
  }, children);
});
if (process.env.NODE_ENV !== 'production') {
  InternalPanel.displayName = 'Panel';
}
const Panel = () => null;
var _default = exports.default = Panel;