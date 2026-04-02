"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _util = require("../util");
var _ColorSteppers = _interopRequireDefault(require("./ColorSteppers"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const ColorRgbInput = ({
  prefixCls,
  value,
  onChange
}) => {
  const colorRgbInputPrefixCls = `${prefixCls}-rgb-input`;
  const [internalValue, setInternalValue] = (0, _react.useState)(() => (0, _util.generateColor)(value || '#000'));
  const rgbValue = value || internalValue;
  const handleRgbChange = (step, type) => {
    const rgb = rgbValue.toRgb();
    rgb[type] = step || 0;
    const genColor = (0, _util.generateColor)(rgb);
    setInternalValue(genColor);
    onChange?.(genColor);
  };
  return /*#__PURE__*/_react.default.createElement("div", {
    className: colorRgbInputPrefixCls
  }, /*#__PURE__*/_react.default.createElement(_ColorSteppers.default, {
    max: 255,
    min: 0,
    value: Number(rgbValue.toRgb().r),
    prefixCls: prefixCls,
    className: colorRgbInputPrefixCls,
    onChange: step => handleRgbChange(Number(step), 'r')
  }), /*#__PURE__*/_react.default.createElement(_ColorSteppers.default, {
    max: 255,
    min: 0,
    value: Number(rgbValue.toRgb().g),
    prefixCls: prefixCls,
    className: colorRgbInputPrefixCls,
    onChange: step => handleRgbChange(Number(step), 'g')
  }), /*#__PURE__*/_react.default.createElement(_ColorSteppers.default, {
    max: 255,
    min: 0,
    value: Number(rgbValue.toRgb().b),
    prefixCls: prefixCls,
    className: colorRgbInputPrefixCls,
    onChange: step => handleRgbChange(Number(step), 'b')
  }));
};
var _default = exports.default = ColorRgbInput;