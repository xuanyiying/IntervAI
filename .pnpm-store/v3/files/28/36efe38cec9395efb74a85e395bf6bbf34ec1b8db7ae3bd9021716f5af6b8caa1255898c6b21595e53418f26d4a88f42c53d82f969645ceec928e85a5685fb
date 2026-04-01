"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useItems;
var React = _interopRequireWildcard(require("react"));
var _icons = require("@ant-design/icons");
var _util = require("@rc-component/util");
var _clsx = require("clsx");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function useItems(prefixCls, mode, items, children, pending, pendingDot) {
  const itemCls = `${prefixCls}-item`;
  // Merge items and children
  const parseItems = React.useMemo(() => {
    return Array.isArray(items) ? items : (0, _util.toArray)(children).map(ele => ({
      ...ele.props
    }));
  }, [items, children]);
  // convert legacy type
  return React.useMemo(() => {
    const mergedItems = parseItems.map((item, index) => {
      const {
        label,
        children,
        title,
        content,
        color,
        className,
        style,
        icon,
        dot,
        placement,
        position,
        loading,
        ...restProps
      } = item;
      let mergedStyle = style;
      let mergedClassName = className;
      // Color
      if (color) {
        if (['blue', 'red', 'green', 'gray'].includes(color)) {
          mergedClassName = (0, _clsx.clsx)(className, `${itemCls}-color-${color}`);
        } else {
          mergedStyle = {
            '--steps-item-icon-dot-color': color,
            ...style
          };
        }
      }
      // Placement
      const mergedPlacement = placement ?? position ?? (mode === 'alternate' ? index % 2 === 0 ? 'start' : 'end' : mode);
      mergedClassName = (0, _clsx.clsx)(mergedClassName, `${itemCls}-placement-${mergedPlacement}`);
      // Icon
      let mergedIcon = icon ?? dot;
      if (!mergedIcon && loading) {
        mergedIcon = /*#__PURE__*/React.createElement(_icons.LoadingOutlined, null);
      }
      return {
        ...restProps,
        title: title ?? label,
        content: content ?? children,
        style: mergedStyle,
        className: mergedClassName,
        icon: mergedIcon,
        status: loading ? 'process' : 'finish'
      };
    });
    if (pending) {
      mergedItems.push({
        icon: pendingDot ?? /*#__PURE__*/React.createElement(_icons.LoadingOutlined, null),
        content: pending,
        status: 'process'
      });
    }
    return mergedItems;
  }, [parseItems, pending, pendingDot, itemCls, mode]);
}