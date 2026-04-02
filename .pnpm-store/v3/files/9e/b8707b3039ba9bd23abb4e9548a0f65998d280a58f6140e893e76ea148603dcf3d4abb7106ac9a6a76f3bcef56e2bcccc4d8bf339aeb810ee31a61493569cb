"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useItems;
var React = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
var _responsiveObserver = require("../../_util/responsiveObserver");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
// Convert children into items
const transChildren2Items = childNodes => (0, _util.toArray)(childNodes).map(node => ({
  ...node?.props,
  key: node.key
}));
function useItems(screens, items, children) {
  const mergedItems = React.useMemo(() =>
  // Take `items` first or convert `children` into items
  items || transChildren2Items(children), [items, children]);
  const responsiveItems = React.useMemo(() => mergedItems.map(({
    span,
    ...restItem
  }) => {
    if (span === 'filled') {
      return {
        ...restItem,
        filled: true
      };
    }
    return {
      ...restItem,
      span: typeof span === 'number' ? span : (0, _responsiveObserver.matchScreen)(screens, span)
    };
  }), [mergedItems, screens]);
  return responsiveItems;
}