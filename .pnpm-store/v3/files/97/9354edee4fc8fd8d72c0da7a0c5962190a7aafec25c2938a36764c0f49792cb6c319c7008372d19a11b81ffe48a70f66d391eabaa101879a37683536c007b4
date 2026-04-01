"use strict";
"use client";

/* eslint-disable react/no-array-index-key */
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _clsx = require("clsx");
var _configProvider = require("../config-provider");
var _BackTop = _interopRequireDefault(require("./BackTop"));
var _FloatButton = _interopRequireWildcard(require("./FloatButton"));
var _FloatButtonGroup = _interopRequireDefault(require("./FloatButtonGroup"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const PureFloatButton = ({
  backTop,
  ...props
}) => backTop ? /*#__PURE__*/React.createElement(_BackTop.default, {
  ...props,
  visibilityHeight: 0
}) : /*#__PURE__*/React.createElement(_FloatButton.default, {
  ...props
});
/** @private Internal Component. Do not use in your production. */
const PurePanel = ({
  className,
  items,
  classNames: cls,
  styles,
  prefixCls: customizePrefixCls,
  ...restProps
}) => {
  const {
    getPrefixCls
  } = React.useContext(_configProvider.ConfigContext);
  const prefixCls = getPrefixCls(_FloatButton.floatButtonPrefixCls, customizePrefixCls);
  const pureCls = `${prefixCls}-pure`;
  if (items) {
    return /*#__PURE__*/React.createElement(_FloatButtonGroup.default, {
      className: (0, _clsx.clsx)(className, pureCls),
      classNames: cls,
      styles: styles,
      ...restProps
    }, items.map((item, index) => (/*#__PURE__*/React.createElement(PureFloatButton, {
      key: index,
      ...item
    }))));
  }
  return /*#__PURE__*/React.createElement(PureFloatButton, {
    className: (0, _clsx.clsx)(className, pureCls),
    classNames: cls,
    styles: styles,
    ...restProps
  });
};
var _default = exports.default = PurePanel;