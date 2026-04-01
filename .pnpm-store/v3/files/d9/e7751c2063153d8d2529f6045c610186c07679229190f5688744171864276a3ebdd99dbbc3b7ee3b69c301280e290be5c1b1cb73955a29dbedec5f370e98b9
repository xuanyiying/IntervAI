"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useDelay;
var React = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
var _raf = _interopRequireDefault(require("@rc-component/util/lib/raf"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function useDelay(callback) {
  const idRef = React.useRef(0);
  const clearRaf = () => {
    _raf.default.cancel(idRef.current);
  };
  React.useEffect(() => clearRaf, []);
  const triggerFn = (0, _util.useEvent)(() => {
    clearRaf();
    idRef.current = (0, _raf.default)(callback);
  });
  return triggerFn;
}