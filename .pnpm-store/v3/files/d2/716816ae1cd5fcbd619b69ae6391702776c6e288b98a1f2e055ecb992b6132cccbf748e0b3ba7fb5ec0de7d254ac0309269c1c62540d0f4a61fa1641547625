"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _tooltip = require("@rc-component/tooltip");
var _clsx = require("clsx");
var _hooks = require("../_util/hooks");
var _configProvider = require("../config-provider");
var _useCSSVarCls = _interopRequireDefault(require("../config-provider/hooks/useCSSVarCls"));
var _style = _interopRequireDefault(require("./style"));
var _util = require("./util");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/** @private Internal Component. Do not use in your production. */
const PurePanel = props => {
  const {
    prefixCls: customizePrefixCls,
    className,
    placement = 'top',
    title,
    color,
    overlayInnerStyle,
    classNames,
    styles
  } = props;
  const {
    getPrefixCls
  } = React.useContext(_configProvider.ConfigContext);
  const prefixCls = getPrefixCls('tooltip', customizePrefixCls);
  const rootCls = (0, _useCSSVarCls.default)(prefixCls);
  const [hashId, cssVarCls] = (0, _style.default)(prefixCls, rootCls);
  // Color
  const colorInfo = (0, _util.parseColor)(prefixCls, color);
  const arrowContentStyle = colorInfo.arrowStyle;
  const innerStyles = React.useMemo(() => {
    const mergedStyle = {
      ...overlayInnerStyle,
      ...colorInfo.overlayStyle
    };
    return {
      container: mergedStyle
    };
  }, [overlayInnerStyle, colorInfo.overlayStyle]);
  const mergedProps = {
    ...props,
    placement
  };
  const [mergedClassNames, mergedStyles] = (0, _hooks.useMergeSemantic)([classNames], [innerStyles, styles], {
    props: mergedProps
  });
  const rootClassName = (0, _clsx.clsx)(rootCls, hashId, cssVarCls, prefixCls, `${prefixCls}-pure`, `${prefixCls}-placement-${placement}`, className, colorInfo.className);
  return /*#__PURE__*/React.createElement("div", {
    className: rootClassName,
    style: arrowContentStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: `${prefixCls}-arrow`
  }), /*#__PURE__*/React.createElement(_tooltip.Popup, {
    ...props,
    className: hashId,
    prefixCls: prefixCls,
    classNames: mergedClassNames,
    styles: mergedStyles
  }, title));
};
var _default = exports.default = PurePanel;