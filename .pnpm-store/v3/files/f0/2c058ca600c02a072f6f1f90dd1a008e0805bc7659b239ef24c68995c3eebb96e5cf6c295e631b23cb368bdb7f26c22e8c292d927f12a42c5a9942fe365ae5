"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
var _warning = require("../../_util/warning");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function filter(items) {
  return items.filter(item => item);
}
function useLegacyItems(items, children) {
  if (process.env.NODE_ENV !== 'production') {
    const warning = (0, _warning.devUseWarning)('Tabs');
    warning.deprecated(!children, 'Tabs.TabPane', 'items');
  }
  if (items) {
    return items.map(item => ({
      ...item,
      destroyOnHidden: item.destroyOnHidden ?? item.destroyInactiveTabPane
    }));
  }
  const childrenItems = (0, _util.toArray)(children).map(node => {
    if (/*#__PURE__*/React.isValidElement(node)) {
      const {
        key,
        props
      } = node;
      const {
        tab,
        ...restProps
      } = props || {};
      const item = {
        key: String(key),
        ...restProps,
        label: tab
      };
      return item;
    }
    return null;
  });
  return filter(childrenItems);
}
var _default = exports.default = useLegacyItems;