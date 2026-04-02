"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var React = _react;
var _util = require("@rc-component/util");
var _KeyCode = _interopRequireDefault(require("@rc-component/util/lib/KeyCode"));
var _clsx = require("clsx");
var _getRenderPropValue = require("../_util/getRenderPropValue");
var _hooks = require("../_util/hooks");
var _motion = require("../_util/motion");
var _reactNode = require("../_util/reactNode");
var _context = require("../config-provider/context");
var _tooltip = _interopRequireDefault(require("../tooltip"));
var _useMergedArrow = _interopRequireDefault(require("../tooltip/hook/useMergedArrow"));
var _PurePanel = _interopRequireWildcard(require("./PurePanel"));
var _style = _interopRequireDefault(require("./style"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// CSSINJS

const InternalPopover = /*#__PURE__*/React.forwardRef((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    title,
    content,
    overlayClassName,
    placement = 'top',
    trigger = 'hover',
    children,
    mouseEnterDelay = 0.1,
    mouseLeaveDelay = 0.1,
    onOpenChange,
    overlayStyle = {},
    styles,
    classNames,
    motion,
    arrow: popoverArrow,
    ...restProps
  } = props;
  const {
    getPrefixCls,
    className: contextClassName,
    style: contextStyle,
    classNames: contextClassNames,
    styles: contextStyles,
    arrow: contextArrow
  } = (0, _context.useComponentConfig)('popover');
  const prefixCls = getPrefixCls('popover', customizePrefixCls);
  const [hashId, cssVarCls] = (0, _style.default)(prefixCls);
  const rootPrefixCls = getPrefixCls();
  const mergedArrow = (0, _useMergedArrow.default)(popoverArrow, contextArrow);
  // ============================= Styles =============================
  const mergedProps = {
    ...props,
    placement,
    trigger,
    mouseEnterDelay,
    mouseLeaveDelay,
    overlayStyle,
    styles,
    classNames
  };
  const [mergedClassNames, mergedStyles] = (0, _hooks.useMergeSemantic)([contextClassNames, classNames], [contextStyles, styles], {
    props: mergedProps
  });
  const rootClassNames = (0, _clsx.clsx)(overlayClassName, hashId, cssVarCls, contextClassName, mergedClassNames.root);
  const [open, setOpen] = (0, _util.useControlledState)(props.defaultOpen ?? false, props.open);
  const settingOpen = (value, e) => {
    setOpen(value);
    onOpenChange?.(value, e);
  };
  const onKeyDown = e => {
    if (e.keyCode === _KeyCode.default.ESC) {
      settingOpen(false, e);
    }
  };
  const onInternalOpenChange = value => {
    settingOpen(value);
  };
  const titleNode = (0, _getRenderPropValue.getRenderPropValue)(title);
  const contentNode = (0, _getRenderPropValue.getRenderPropValue)(content);
  return /*#__PURE__*/React.createElement(_tooltip.default, {
    unique: false,
    arrow: mergedArrow,
    placement: placement,
    trigger: trigger,
    mouseEnterDelay: mouseEnterDelay,
    mouseLeaveDelay: mouseLeaveDelay,
    ...restProps,
    prefixCls: prefixCls,
    classNames: {
      root: rootClassNames,
      container: mergedClassNames.container,
      arrow: mergedClassNames.arrow
    },
    styles: {
      root: {
        ...mergedStyles.root,
        ...contextStyle,
        ...overlayStyle
      },
      container: mergedStyles.container,
      arrow: mergedStyles.arrow
    },
    ref: ref,
    open: open,
    onOpenChange: onInternalOpenChange,
    overlay: titleNode || contentNode ? (/*#__PURE__*/React.createElement(_PurePanel.Overlay, {
      prefixCls: prefixCls,
      title: titleNode,
      content: contentNode,
      classNames: mergedClassNames,
      styles: mergedStyles
    })) : null,
    motion: {
      motionName: (0, _motion.getTransitionName)(rootPrefixCls, 'zoom-big', typeof motion?.motionName === 'string' ? motion?.motionName : undefined)
    },
    "data-popover-inject": true
  }, (0, _reactNode.cloneElement)(children, {
    onKeyDown: e => {
      if (/*#__PURE__*/(0, _react.isValidElement)(children)) {
        children?.props.onKeyDown?.(e);
      }
      onKeyDown(e);
    }
  }));
});
const Popover = InternalPopover;
Popover._InternalPanelDoNotUseOrYouWillBeFired = _PurePanel.default;
if (process.env.NODE_ENV !== 'production') {
  Popover.displayName = 'Popover';
}
var _default = exports.default = Popover;