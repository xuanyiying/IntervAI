"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _resizeObserver = _interopRequireDefault(require("@rc-component/resize-observer"));
var _clsx = require("clsx");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const MasonryItem = /*#__PURE__*/_react.default.forwardRef((props, ref) => {
  const {
    item,
    style,
    prefixCls,
    itemRender,
    className,
    index,
    column,
    onResize
  } = props;
  const itemPrefix = `${prefixCls}-item`;
  // ====================== Render ======================
  const renderNode = (0, _react.useMemo)(() => {
    return item.children ?? itemRender?.({
      ...item,
      index,
      column
    });
  }, [item, itemRender, column, index]);
  let returnNode = /*#__PURE__*/_react.default.createElement("div", {
    ref: ref,
    style: style,
    className: (0, _clsx.clsx)(itemPrefix, className)
  }, renderNode);
  // Listen for resize
  if (onResize) {
    returnNode = /*#__PURE__*/_react.default.createElement(_resizeObserver.default, {
      onResize: onResize
    }, returnNode);
  }
  return returnNode;
});
if (process.env.NODE_ENV !== 'production') {
  MasonryItem.displayName = 'MasonryItem';
}
var _default = exports.default = MasonryItem;