"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _clsx = require("clsx");
var _context = require("../config-provider/context");
var _style = _interopRequireDefault(require("./style"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const Typography = /*#__PURE__*/React.forwardRef((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    component: Component = 'article',
    className,
    rootClassName,
    children,
    direction: typographyDirection,
    style,
    ...restProps
  } = props;
  const {
    getPrefixCls,
    direction: contextDirection,
    className: contextClassName,
    style: contextStyle
  } = (0, _context.useComponentConfig)('typography');
  const direction = typographyDirection ?? contextDirection;
  const prefixCls = getPrefixCls('typography', customizePrefixCls);
  // Style
  const [hashId, cssVarCls] = (0, _style.default)(prefixCls);
  const componentClassName = (0, _clsx.clsx)(prefixCls, contextClassName, {
    [`${prefixCls}-rtl`]: direction === 'rtl'
  }, className, rootClassName, hashId, cssVarCls);
  const mergedStyle = {
    ...contextStyle,
    ...style
  };
  return (
    /*#__PURE__*/
    // @ts-expect-error: Expression produces a union type that is too complex to represent.
    React.createElement(Component, {
      className: componentClassName,
      style: mergedStyle,
      ref: ref,
      ...restProps
    }, children)
  );
});
if (process.env.NODE_ENV !== 'production') {
  Typography.displayName = 'Typography';
}
var _default = exports.default = Typography;