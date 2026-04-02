"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useItemRef;
var React = _interopRequireWildcard(require("react"));
var _ref = require("@rc-component/util/lib/ref");
var _context = require("../context");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function useItemRef() {
  const {
    itemRef
  } = React.useContext(_context.FormContext);
  const cacheRef = React.useRef({});
  function getRef(name, children) {
    // Outer caller already check the `supportRef`
    const childrenRef = children && typeof children === 'object' && (0, _ref.getNodeRef)(children);
    const nameStr = name.join('_');
    if (cacheRef.current.name !== nameStr || cacheRef.current.originRef !== childrenRef) {
      cacheRef.current.name = nameStr;
      cacheRef.current.originRef = childrenRef;
      cacheRef.current.ref = (0, _ref.composeRef)(itemRef(name), childrenRef);
    }
    return cacheRef.current.ref;
  }
  return getRef;
}