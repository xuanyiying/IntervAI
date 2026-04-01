"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Indicator;
var React = _interopRequireWildcard(require("react"));
var _clsx = require("clsx");
var _reactNode = require("../../_util/reactNode");
var _Looper = _interopRequireDefault(require("./Looper"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function Indicator(props) {
  const {
    prefixCls,
    indicator,
    percent,
    className,
    style
  } = props;
  const dotClassName = `${prefixCls}-dot`;
  if (indicator && /*#__PURE__*/React.isValidElement(indicator)) {
    return (0, _reactNode.cloneElement)(indicator, currentProps => ({
      className: (0, _clsx.clsx)(currentProps.className, dotClassName, className),
      style: {
        ...currentProps.style,
        ...style
      },
      percent
    }));
  }
  return /*#__PURE__*/React.createElement(_Looper.default, {
    prefixCls: prefixCls,
    percent: percent,
    className: className,
    style: style
  });
}