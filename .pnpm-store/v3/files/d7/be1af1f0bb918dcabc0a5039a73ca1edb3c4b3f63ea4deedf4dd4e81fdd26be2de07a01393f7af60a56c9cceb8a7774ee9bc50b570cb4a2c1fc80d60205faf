"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _context = require("../context");
var _ColorPresets = _interopRequireDefault(require("./ColorPresets"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const PanelPresets = () => {
  const {
    prefixCls,
    value,
    presets,
    onChange
  } = (0, _react.useContext)(_context.PanelPresetsContext);
  return Array.isArray(presets) ? (/*#__PURE__*/_react.default.createElement(_ColorPresets.default, {
    value: value,
    presets: presets,
    prefixCls: prefixCls,
    onChange: onChange
  })) : null;
};
var _default = exports.default = PanelPresets;