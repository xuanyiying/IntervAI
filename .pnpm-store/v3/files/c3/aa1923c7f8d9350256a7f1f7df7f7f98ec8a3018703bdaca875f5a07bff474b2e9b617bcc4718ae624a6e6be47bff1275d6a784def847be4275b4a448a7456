"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _StarFilled = _interopRequireDefault(require("@ant-design/icons/StarFilled"));
var _rate = _interopRequireDefault(require("@rc-component/rate"));
var _clsx = require("clsx");
var _context = require("../config-provider/context");
var _DisabledContext = _interopRequireDefault(require("../config-provider/DisabledContext"));
var _tooltip = _interopRequireDefault(require("../tooltip"));
var _style = _interopRequireDefault(require("./style"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const isTooltipProps = item => {
  return typeof item === 'object' && item !== null;
};
const Rate = /*#__PURE__*/React.forwardRef((props, ref) => {
  const {
    prefixCls,
    className,
    rootClassName,
    style,
    tooltips,
    character = /*#__PURE__*/React.createElement(_StarFilled.default, null),
    disabled: customDisabled,
    size = 'middle',
    ...rest
  } = props;
  const characterRender = (node, {
    index
  }) => {
    if (!tooltips) {
      return node;
    }
    const tooltipsItem = tooltips[index];
    if (isTooltipProps(tooltipsItem)) {
      return /*#__PURE__*/React.createElement(_tooltip.default, {
        ...tooltipsItem
      }, node);
    }
    return /*#__PURE__*/React.createElement(_tooltip.default, {
      title: tooltipsItem
    }, node);
  };
  const {
    getPrefixCls,
    direction,
    className: contextClassName,
    style: contextStyle
  } = (0, _context.useComponentConfig)('rate');
  const ratePrefixCls = getPrefixCls('rate', prefixCls);
  // Style
  const [hashId, cssVarCls] = (0, _style.default)(ratePrefixCls);
  const mergedStyle = {
    ...contextStyle,
    ...style
  };
  // ===================== Disabled =====================
  const disabled = React.useContext(_DisabledContext.default);
  const mergedDisabled = customDisabled ?? disabled;
  return /*#__PURE__*/React.createElement(_rate.default, {
    ref: ref,
    character: character,
    characterRender: characterRender,
    disabled: mergedDisabled,
    ...rest,
    className: (0, _clsx.clsx)(`${ratePrefixCls}-${size}`, className, rootClassName, hashId, cssVarCls, contextClassName),
    style: mergedStyle,
    prefixCls: ratePrefixCls,
    direction: direction
  });
});
if (process.env.NODE_ENV !== 'production') {
  Rate.displayName = 'Rate';
}
var _default = exports.default = Rate;