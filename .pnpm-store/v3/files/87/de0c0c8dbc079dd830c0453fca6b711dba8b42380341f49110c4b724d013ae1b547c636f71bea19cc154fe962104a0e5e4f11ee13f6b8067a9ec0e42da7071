"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useItemRender;
exports.renderItem = renderItem;
var React = _interopRequireWildcard(require("react"));
var _pickAttrs = _interopRequireDefault(require("@rc-component/util/lib/pickAttrs"));
var _clsx = require("clsx");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function getBreadcrumbName(route, params) {
  if (route.title === undefined || route.title === null) {
    return null;
  }
  const paramsKeys = Object.keys(params).join('|');
  return typeof route.title === 'object' ? route.title : String(route.title).replace(new RegExp(`:(${paramsKeys})`, 'g'), (replacement, key) => params[key] || replacement);
}
function renderItem(prefixCls, item, children, href) {
  if (children === null || children === undefined) {
    return null;
  }
  const {
    className,
    onClick,
    ...restItem
  } = item;
  const passedProps = {
    ...(0, _pickAttrs.default)(restItem, {
      data: true,
      aria: true
    }),
    onClick
  };
  if (href !== undefined) {
    return /*#__PURE__*/React.createElement("a", {
      ...passedProps,
      className: (0, _clsx.clsx)(`${prefixCls}-link`, className),
      href: href
    }, children);
  }
  return /*#__PURE__*/React.createElement("span", {
    ...passedProps,
    className: (0, _clsx.clsx)(`${prefixCls}-link`, className)
  }, children);
}
function useItemRender(prefixCls, itemRender) {
  const mergedItemRender = (item, params, routes, path, href) => {
    if (itemRender) {
      return itemRender(item, params, routes, path);
    }
    const name = getBreadcrumbName(item, params);
    return renderItem(prefixCls, item, name, href);
  };
  return mergedItemRender;
}