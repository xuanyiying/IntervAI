"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.genSubStyleComponent = exports.genStyleHooks = exports.genCssVar = exports.genComponentStyleHook = void 0;
var _react = require("react");
var _cssinjsUtils = require("@ant-design/cssinjs-utils");
var _context = require("../../config-provider/context");
var _style = require("../../style");
var _useToken = _interopRequireWildcard(require("../useToken"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const {
  genStyleHooks,
  genComponentStyleHook,
  genSubStyleComponent
} = (0, _cssinjsUtils.genStyleUtils)({
  usePrefix: () => {
    const {
      getPrefixCls,
      iconPrefixCls
    } = (0, _react.useContext)(_context.ConfigContext);
    const rootPrefixCls = getPrefixCls();
    return {
      rootPrefixCls,
      iconPrefixCls
    };
  },
  useToken: () => {
    const [theme, realToken, hashId, token, cssVar, zeroRuntime] = (0, _useToken.default)();
    return {
      theme,
      realToken,
      hashId,
      token,
      cssVar,
      zeroRuntime
    };
  },
  useCSP: () => {
    const {
      csp
    } = (0, _react.useContext)(_context.ConfigContext);
    return csp ?? {};
  },
  getResetStyles: (token, config) => {
    const linkStyle = (0, _style.genLinkStyle)(token);
    return [linkStyle, {
      '&': linkStyle
    }, (0, _style.genIconStyle)(config?.prefix.iconPrefixCls ?? _context.defaultIconPrefixCls)];
  },
  getCommonStyle: _style.genCommonStyle,
  getCompUnitless: () => _useToken.unitless
});
exports.genSubStyleComponent = genSubStyleComponent;
exports.genComponentStyleHook = genComponentStyleHook;
exports.genStyleHooks = genStyleHooks;
const genCssVar = (antCls, componentAbbr) => {
  const cssPrefix = `--${antCls.replace('.', '')}-${componentAbbr}-`;
  return (name, withVar = false) => {
    const raw = `${cssPrefix}${name}`;
    return withVar ? `var(${raw})` : raw;
  };
};
exports.genCssVar = genCssVar;