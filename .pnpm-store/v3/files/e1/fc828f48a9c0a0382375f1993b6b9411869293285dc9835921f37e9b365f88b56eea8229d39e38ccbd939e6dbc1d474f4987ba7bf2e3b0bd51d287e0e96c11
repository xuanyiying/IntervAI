"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _LoadingOutlined = _interopRequireDefault(require("@ant-design/icons/LoadingOutlined"));
var _switch = _interopRequireDefault(require("@rc-component/switch"));
var _util = require("@rc-component/util");
var _clsx = require("clsx");
var _hooks = require("../_util/hooks");
var _wave = _interopRequireDefault(require("../_util/wave"));
var _context = require("../config-provider/context");
var _DisabledContext = _interopRequireDefault(require("../config-provider/DisabledContext"));
var _useSize = _interopRequireDefault(require("../config-provider/hooks/useSize"));
var _style = _interopRequireDefault(require("./style"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const InternalSwitch = /*#__PURE__*/React.forwardRef((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    size: customizeSize,
    disabled: customDisabled,
    loading,
    className,
    rootClassName,
    style,
    checked: checkedProp,
    value,
    defaultChecked: defaultCheckedProp,
    defaultValue,
    onChange,
    styles,
    classNames,
    ...restProps
  } = props;
  const [checked, setChecked] = (0, _util.useControlledState)(defaultCheckedProp ?? defaultValue ?? false, checkedProp ?? value);
  const {
    getPrefixCls,
    direction,
    className: contextClassName,
    style: contextStyle,
    classNames: contextClassNames,
    styles: contextStyles
  } = (0, _context.useComponentConfig)('switch');
  // ===================== Disabled =====================
  const disabled = React.useContext(_DisabledContext.default);
  const mergedDisabled = (customDisabled ?? disabled) || loading;
  const prefixCls = getPrefixCls('switch', customizePrefixCls);
  const loadingIcon = /*#__PURE__*/React.createElement("div", {
    className: `${prefixCls}-handle`
  }, loading && /*#__PURE__*/React.createElement(_LoadingOutlined.default, {
    className: `${prefixCls}-loading-icon`
  }));
  // Style
  const [hashId, cssVarCls] = (0, _style.default)(prefixCls);
  const mergedSize = (0, _useSize.default)(customizeSize);
  const mergedProps = {
    ...props,
    size: mergedSize,
    disabled: mergedDisabled
  };
  const [mergedClassNames, mergedStyles] = (0, _hooks.useMergeSemantic)([contextClassNames, classNames], [contextStyles, styles], {
    props: mergedProps
  });
  const classes = (0, _clsx.clsx)(contextClassName, {
    [`${prefixCls}-small`]: mergedSize === 'small',
    [`${prefixCls}-loading`]: loading,
    [`${prefixCls}-rtl`]: direction === 'rtl'
  }, className, rootClassName, mergedClassNames.root, hashId, cssVarCls);
  const mergedStyle = {
    ...mergedStyles.root,
    ...contextStyle,
    ...style
  };
  const changeHandler = (...args) => {
    setChecked(args[0]);
    onChange?.(...args);
  };
  return /*#__PURE__*/React.createElement(_wave.default, {
    component: "Switch",
    disabled: mergedDisabled
  }, /*#__PURE__*/React.createElement(_switch.default, {
    ...restProps,
    classNames: mergedClassNames,
    styles: mergedStyles,
    checked: checked,
    onChange: changeHandler,
    prefixCls: prefixCls,
    className: classes,
    style: mergedStyle,
    disabled: mergedDisabled,
    ref: ref,
    loadingIcon: loadingIcon
  }));
});
const Switch = InternalSwitch;
Switch.__ANT_SWITCH = true;
if (process.env.NODE_ENV !== 'production') {
  Switch.displayName = 'Switch';
}
var _default = exports.default = Switch;