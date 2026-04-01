"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const StatisticNumber = props => {
  const {
    value,
    formatter,
    precision,
    decimalSeparator,
    groupSeparator = '',
    prefixCls
  } = props;
  let valueNode;
  if (typeof formatter === 'function') {
    // Customize formatter
    valueNode = formatter(value);
  } else {
    // Internal formatter
    const val = String(value);
    const cells = val.match(/^(-?)(\d*)(\.(\d+))?$/);
    // Process if illegal number
    if (!cells || val === '-') {
      valueNode = val;
    } else {
      const negative = cells[1];
      let int = cells[2] || '0';
      let decimal = cells[4] || '';
      int = int.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
      if (typeof precision === 'number') {
        decimal = decimal.padEnd(precision, '0').slice(0, precision > 0 ? precision : 0);
      }
      if (decimal) {
        decimal = `${decimalSeparator}${decimal}`;
      }
      valueNode = [/*#__PURE__*/React.createElement("span", {
        key: "int",
        className: `${prefixCls}-content-value-int`
      }, negative, int), decimal && (/*#__PURE__*/React.createElement("span", {
        key: "decimal",
        className: `${prefixCls}-content-value-decimal`
      }, decimal))];
    }
  }
  return /*#__PURE__*/React.createElement("span", {
    className: `${prefixCls}-content-value`
  }, valueNode);
};
var _default = exports.default = StatisticNumber;