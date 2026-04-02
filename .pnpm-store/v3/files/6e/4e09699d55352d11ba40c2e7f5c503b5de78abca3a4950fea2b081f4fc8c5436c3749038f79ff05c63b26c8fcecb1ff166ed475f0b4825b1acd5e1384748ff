"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _LeftOutlined = _interopRequireDefault(require("@ant-design/icons/LeftOutlined"));
var _LoadingOutlined = _interopRequireDefault(require("@ant-design/icons/LoadingOutlined"));
var _RightOutlined = _interopRequireDefault(require("@ant-design/icons/RightOutlined"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const useColumnIcons = (prefixCls, rtl, expandIcon) => {
  let mergedExpandIcon = expandIcon;
  if (!expandIcon) {
    mergedExpandIcon = rtl ? /*#__PURE__*/React.createElement(_LeftOutlined.default, null) : /*#__PURE__*/React.createElement(_RightOutlined.default, null);
  }
  const loadingIcon = React.useMemo(() => (/*#__PURE__*/React.createElement("span", {
    className: `${prefixCls}-menu-item-loading-icon`
  }, /*#__PURE__*/React.createElement(_LoadingOutlined.default, {
    spin: true
  }))), [prefixCls]);
  return React.useMemo(() => [mergedExpandIcon, loadingIcon], [mergedExpandIcon, loadingIcon]);
};
var _default = exports.default = useColumnIcons;