"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _menu = require("@rc-component/menu");
var _util = require("@rc-component/util");
var _clsx = require("clsx");
var _reactNode = require("../_util/reactNode");
var _Sider = require("../layout/Sider");
var _tooltip = _interopRequireDefault(require("../tooltip"));
var _MenuContext = _interopRequireDefault(require("./MenuContext"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const MenuItem = props => {
  const {
    className,
    children,
    icon,
    title,
    danger,
    extra
  } = props;
  const {
    prefixCls,
    firstLevel,
    direction,
    disableMenuItemTitleTooltip,
    inlineCollapsed: isInlineCollapsed,
    styles,
    classNames
  } = React.useContext(_MenuContext.default);
  const renderItemChildren = inlineCollapsed => {
    const label = children?.[0];
    const wrapNode = /*#__PURE__*/React.createElement("span", {
      className: (0, _clsx.clsx)(`${prefixCls}-title-content`, firstLevel ? classNames.itemContent : classNames.subMenu.itemContent, {
        [`${prefixCls}-title-content-with-extra`]: !!extra || extra === 0
      }),
      style: firstLevel ? styles.itemContent : styles.subMenu.itemContent
    }, children);
    // inline-collapsed.md demo 依赖 span 来隐藏文字,有 icon 属性，则内部包裹一个 span
    // ref: https://github.com/ant-design/ant-design/pull/23456
    if (!icon || /*#__PURE__*/React.isValidElement(children) && children.type === 'span') {
      if (children && inlineCollapsed && firstLevel && typeof label === 'string') {
        return /*#__PURE__*/React.createElement("div", {
          className: `${prefixCls}-inline-collapsed-noicon`
        }, label.charAt(0));
      }
    }
    return wrapNode;
  };
  const {
    siderCollapsed
  } = React.useContext(_Sider.SiderContext);
  let tooltipTitle = title;
  if (typeof title === 'undefined') {
    tooltipTitle = firstLevel ? children : '';
  } else if (title === false) {
    tooltipTitle = '';
  }
  const tooltipProps = {
    title: tooltipTitle
  };
  if (!siderCollapsed && !isInlineCollapsed) {
    tooltipProps.title = null;
    // Reset `open` to fix control mode tooltip display not correct
    // ref: https://github.com/ant-design/ant-design/issues/16742
    tooltipProps.open = false;
  }
  const childrenLength = (0, _util.toArray)(children).length;
  let returnNode = /*#__PURE__*/React.createElement(_menu.Item, {
    ...(0, _util.omit)(props, ['title', 'icon', 'danger']),
    className: (0, _clsx.clsx)(firstLevel ? classNames.item : classNames.subMenu.item, {
      [`${prefixCls}-item-danger`]: danger,
      [`${prefixCls}-item-only-child`]: (icon ? childrenLength + 1 : childrenLength) === 1
    }, className),
    style: firstLevel ? styles.item : styles.subMenu.item,
    title: typeof title === 'string' ? title : undefined
  }, (0, _reactNode.cloneElement)(icon, oriProps => ({
    className: (0, _clsx.clsx)(oriProps.className, `${prefixCls}-item-icon`, firstLevel ? classNames.itemIcon : classNames.subMenu.itemIcon),
    style: {
      ...oriProps.style,
      ...(firstLevel ? styles.itemIcon : styles.subMenu.itemIcon)
    }
  })), renderItemChildren(isInlineCollapsed));
  if (!disableMenuItemTitleTooltip) {
    returnNode = /*#__PURE__*/React.createElement(_tooltip.default, {
      ...tooltipProps,
      placement: direction === 'rtl' ? 'left' : 'right',
      classNames: {
        root: `${prefixCls}-inline-collapsed-tooltip`
      }
    }, returnNode);
  }
  return returnNode;
};
var _default = exports.default = MenuItem;