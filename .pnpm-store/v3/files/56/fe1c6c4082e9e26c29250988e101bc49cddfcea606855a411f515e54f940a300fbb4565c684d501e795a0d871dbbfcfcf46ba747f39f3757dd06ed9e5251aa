"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
var _select = _interopRequireDefault(require("../../select"));
var _interface = require("../interface");
var _ColorAlphaInput = _interopRequireDefault(require("./ColorAlphaInput"));
var _ColorHexInput = _interopRequireDefault(require("./ColorHexInput"));
var _ColorHsbInput = _interopRequireDefault(require("./ColorHsbInput"));
var _ColorRgbInput = _interopRequireDefault(require("./ColorRgbInput"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const selectOptions = [_interface.FORMAT_HEX, _interface.FORMAT_HSB, _interface.FORMAT_RGB].map(format => ({
  value: format,
  label: format.toUpperCase()
}));
const ColorInput = props => {
  const {
    prefixCls,
    format,
    value,
    disabledAlpha,
    onFormatChange,
    onChange,
    disabledFormat
  } = props;
  const [colorFormat, setColorFormat] = (0, _util.useControlledState)(_interface.FORMAT_HEX, format);
  const colorInputPrefixCls = `${prefixCls}-input`;
  const triggerFormatChange = newFormat => {
    setColorFormat(newFormat);
    onFormatChange?.(newFormat);
  };
  const steppersNode = (0, _react.useMemo)(() => {
    const inputProps = {
      value,
      prefixCls,
      onChange
    };
    switch (colorFormat) {
      case _interface.FORMAT_HSB:
        return /*#__PURE__*/_react.default.createElement(_ColorHsbInput.default, {
          ...inputProps
        });
      case _interface.FORMAT_RGB:
        return /*#__PURE__*/_react.default.createElement(_ColorRgbInput.default, {
          ...inputProps
        });
      // case FORMAT_HEX:
      default:
        return /*#__PURE__*/_react.default.createElement(_ColorHexInput.default, {
          ...inputProps
        });
    }
  }, [colorFormat, prefixCls, value, onChange]);
  return /*#__PURE__*/_react.default.createElement("div", {
    className: `${colorInputPrefixCls}-container`
  }, !disabledFormat && (/*#__PURE__*/_react.default.createElement(_select.default, {
    value: colorFormat,
    variant: "borderless",
    getPopupContainer: current => current,
    popupMatchSelectWidth: 68,
    placement: "bottomRight",
    onChange: triggerFormatChange,
    className: `${prefixCls}-format-select`,
    size: "small",
    options: selectOptions
  })), /*#__PURE__*/_react.default.createElement("div", {
    className: colorInputPrefixCls
  }, steppersNode), !disabledAlpha && (/*#__PURE__*/_react.default.createElement(_ColorAlphaInput.default, {
    prefixCls: prefixCls,
    value: value,
    onChange: onChange
  })));
};
var _default = exports.default = ColorInput;