"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _configProvider = require("../../config-provider");
var _context = require("../context");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * Compatible for legacy `bordered` prop.
 */
const useVariant = (component, variant, legacyBordered) => {
  const {
    variant: configVariant,
    [component]: componentConfig
  } = React.useContext(_configProvider.ConfigContext);
  const ctxVariant = React.useContext(_context.VariantContext);
  const configComponentVariant = componentConfig?.variant;
  let mergedVariant;
  if (typeof variant !== 'undefined') {
    mergedVariant = variant;
  } else if (legacyBordered === false) {
    mergedVariant = 'borderless';
  } else {
    // form variant > component global variant > global variant
    mergedVariant = ctxVariant ?? configComponentVariant ?? configVariant ?? 'outlined';
  }
  const enableVariantCls = _configProvider.Variants.includes(mergedVariant);
  return [mergedVariant, enableVariantCls];
};
var _default = exports.default = useVariant;