"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _clsx = require("clsx");
var _hooks = require("../_util/hooks");
var _PurePanel = require("../_util/PurePanel");
var _reactNode = require("../_util/reactNode");
var _configProvider = require("../config-provider");
var _PurePanel2 = require("../popover/PurePanel");
var _panelRender = _interopRequireDefault(require("./panelRender"));
var _style = _interopRequireDefault(require("./style"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const PurePanel = props => {
  const {
    prefixCls: customizePrefixCls,
    current = 0,
    total = 6,
    className,
    style,
    type,
    closable,
    closeIcon,
    ...restProps
  } = props;
  const {
    getPrefixCls
  } = React.useContext(_configProvider.ConfigContext);
  const prefixCls = getPrefixCls('tour', customizePrefixCls);
  const [hashId, cssVarCls] = (0, _style.default)(prefixCls);
  const [mergedClosable, mergedCloseIcon] = (0, _hooks.useClosable)({
    closable,
    closeIcon
  }, null, {
    closable: true,
    closeIconRender: icon => /*#__PURE__*/React.isValidElement(icon) ? (0, _reactNode.cloneElement)(icon, {
      className: (0, _clsx.clsx)(icon.props?.className, `${prefixCls}-close-icon`)
    }) : icon
  });
  return /*#__PURE__*/React.createElement(_PurePanel2.RawPurePanel, {
    prefixCls: prefixCls,
    hashId: hashId,
    className: (0, _clsx.clsx)(className, `${prefixCls}-pure`, type && `${prefixCls}-${type}`, cssVarCls),
    style: style
  }, /*#__PURE__*/React.createElement(_panelRender.default, {
    stepProps: {
      ...restProps,
      prefixCls,
      total,
      closable: mergedClosable ? {
        closeIcon: mergedCloseIcon
      } : undefined
    },
    current: current,
    type: type
  }));
};
var _default = exports.default = (0, _PurePanel.withPureRenderTheme)(PurePanel);