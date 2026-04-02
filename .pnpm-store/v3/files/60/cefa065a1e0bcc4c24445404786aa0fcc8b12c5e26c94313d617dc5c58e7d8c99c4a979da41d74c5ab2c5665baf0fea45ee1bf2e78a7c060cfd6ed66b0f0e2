"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.GroupSizeContext = void 0;
var React = _interopRequireWildcard(require("react"));
var _clsx = require("clsx");
var _warning = require("../_util/warning");
var _configProvider = require("../config-provider");
var _internal = require("../theme/internal");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const GroupSizeContext = exports.GroupSizeContext = /*#__PURE__*/React.createContext(undefined);
const ButtonGroup = props => {
  const {
    getPrefixCls,
    direction
  } = React.useContext(_configProvider.ConfigContext);
  const {
    prefixCls: customizePrefixCls,
    size,
    className,
    ...others
  } = props;
  const prefixCls = getPrefixCls('btn-group', customizePrefixCls);
  const [,, hashId] = (0, _internal.useToken)();
  const sizeCls = React.useMemo(() => {
    switch (size) {
      case 'large':
        return 'lg';
      case 'small':
        return 'sm';
      default:
        return '';
    }
  }, [size]);
  if (process.env.NODE_ENV !== 'production') {
    const warning = (0, _warning.devUseWarning)('Button.Group');
    warning.deprecated(false, 'Button.Group', 'Space.Compact');
    process.env.NODE_ENV !== "production" ? warning(!size || ['large', 'small', 'middle'].includes(size), 'usage', 'Invalid prop `size`.') : void 0;
  }
  const classes = (0, _clsx.clsx)(prefixCls, {
    [`${prefixCls}-${sizeCls}`]: sizeCls,
    [`${prefixCls}-rtl`]: direction === 'rtl'
  }, className, hashId);
  return /*#__PURE__*/React.createElement(GroupSizeContext.Provider, {
    value: size
  }, /*#__PURE__*/React.createElement("div", {
    ...others,
    className: classes
  }));
};
var _default = exports.default = ButtonGroup;