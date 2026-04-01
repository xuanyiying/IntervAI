"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _menu = require("@rc-component/menu");
var _clsx = require("clsx");
var _configProvider = require("../config-provider");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const MenuDivider = props => {
  const {
    prefixCls: customizePrefixCls,
    className,
    dashed,
    ...restProps
  } = props;
  const {
    getPrefixCls
  } = React.useContext(_configProvider.ConfigContext);
  const prefixCls = getPrefixCls('menu', customizePrefixCls);
  const classString = (0, _clsx.clsx)({
    [`${prefixCls}-item-divider-dashed`]: !!dashed
  }, className);
  return /*#__PURE__*/React.createElement(_menu.Divider, {
    className: classString,
    ...restProps
  });
};
var _default = exports.default = MenuDivider;