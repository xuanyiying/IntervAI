"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useFormWarning;
var React = _interopRequireWildcard(require("react"));
var _warning = require("../../_util/warning");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const names = {};
function useFormWarning({
  name
}) {
  const warning = (0, _warning.devUseWarning)('Form');
  React.useEffect(() => {
    if (name) {
      names[name] = (names[name] || 0) + 1;
      process.env.NODE_ENV !== "production" ? warning(names[name] <= 1, 'usage', 'There exist multiple Form with same `name`.') : void 0;
      return () => {
        names[name] -= 1;
      };
    }
  }, [name]);
}