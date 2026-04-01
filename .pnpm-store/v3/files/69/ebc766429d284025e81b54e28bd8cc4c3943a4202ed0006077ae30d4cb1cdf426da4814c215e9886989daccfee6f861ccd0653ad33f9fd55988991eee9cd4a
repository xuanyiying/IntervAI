"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.RawPurePanel = exports.Overlay = void 0;
var React = _interopRequireWildcard(require("react"));
var _tooltip = require("@rc-component/tooltip");
var _clsx = require("clsx");
var _getRenderPropValue = require("../_util/getRenderPropValue");
var _hooks = require("../_util/hooks");
var _configProvider = require("../config-provider");
var _style = _interopRequireDefault(require("./style"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const Overlay = props => {
  const {
    title,
    content,
    prefixCls,
    classNames,
    styles
  } = props;
  if (!title && !content) {
    return null;
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, title && (/*#__PURE__*/React.createElement("div", {
    className: (0, _clsx.clsx)(`${prefixCls}-title`, classNames?.title),
    style: styles?.title
  }, title)), content && (/*#__PURE__*/React.createElement("div", {
    className: (0, _clsx.clsx)(`${prefixCls}-content`, classNames?.content),
    style: styles?.content
  }, content)));
};
exports.Overlay = Overlay;
const RawPurePanel = props => {
  const {
    hashId,
    prefixCls,
    className,
    style,
    placement = 'top',
    title,
    content,
    children,
    classNames,
    styles
  } = props;
  const titleNode = (0, _getRenderPropValue.getRenderPropValue)(title);
  const contentNode = (0, _getRenderPropValue.getRenderPropValue)(content);
  const mergedProps = {
    ...props,
    placement
  };
  const [mergedClassNames, mergedStyles] = (0, _hooks.useMergeSemantic)([classNames], [styles], {
    props: mergedProps
  });
  const rootClassName = (0, _clsx.clsx)(hashId, prefixCls, `${prefixCls}-pure`, `${prefixCls}-placement-${placement}`, className);
  return /*#__PURE__*/React.createElement("div", {
    className: rootClassName,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: `${prefixCls}-arrow`
  }), /*#__PURE__*/React.createElement(_tooltip.Popup, {
    ...props,
    className: hashId,
    prefixCls: prefixCls,
    classNames: mergedClassNames,
    styles: mergedStyles
  }, children || (/*#__PURE__*/React.createElement(Overlay, {
    prefixCls: prefixCls,
    title: titleNode,
    content: contentNode,
    classNames: mergedClassNames,
    styles: mergedStyles
  }))));
};
exports.RawPurePanel = RawPurePanel;
const PurePanel = props => {
  const {
    prefixCls: customizePrefixCls,
    className,
    ...restProps
  } = props;
  const {
    getPrefixCls
  } = React.useContext(_configProvider.ConfigContext);
  const prefixCls = getPrefixCls('popover', customizePrefixCls);
  const [hashId, cssVarCls] = (0, _style.default)(prefixCls);
  return /*#__PURE__*/React.createElement(RawPurePanel, {
    ...restProps,
    prefixCls: prefixCls,
    hashId: hashId,
    className: (0, _clsx.clsx)(className, cssVarCls)
  });
};
var _default = exports.default = PurePanel;