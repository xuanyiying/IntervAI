"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _clsx = require("clsx");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const UnitNumber = props => {
  const {
    prefixCls,
    value,
    current,
    offset = 0
  } = props;
  let style;
  if (offset) {
    style = {
      position: 'absolute',
      top: `${offset}00%`,
      left: 0
    };
  }
  return /*#__PURE__*/React.createElement("span", {
    style: style,
    className: (0, _clsx.clsx)(`${prefixCls}-only-unit`, {
      current
    })
  }, value);
};
function getOffset(start, end, unit) {
  let index = start;
  let offset = 0;
  while ((index + 10) % 10 !== end) {
    index += unit;
    offset += unit;
  }
  return offset;
}
const SingleNumber = props => {
  const {
    prefixCls,
    count: originCount,
    value: originValue
  } = props;
  const value = Number(originValue);
  const count = Math.abs(originCount);
  const [prevValue, setPrevValue] = React.useState(value);
  const [prevCount, setPrevCount] = React.useState(count);
  // ============================= Events =============================
  const onTransitionEnd = () => {
    setPrevValue(value);
    setPrevCount(count);
  };
  // Fallback if transition events are not supported
  React.useEffect(() => {
    const timer = setTimeout(onTransitionEnd, 1000);
    return () => clearTimeout(timer);
  }, [value]);
  // ============================= Render =============================
  // Render unit list
  let unitNodes;
  let offsetStyle;
  if (prevValue === value || Number.isNaN(value) || Number.isNaN(prevValue)) {
    // Nothing to change
    unitNodes = [/*#__PURE__*/React.createElement(UnitNumber, {
      ...props,
      key: value,
      current: true
    })];
    offsetStyle = {
      transition: 'none'
    };
  } else {
    unitNodes = [];
    // Fill basic number units
    const end = value + 10;
    const unitNumberList = [];
    for (let index = value; index <= end; index += 1) {
      unitNumberList.push(index);
    }
    const unit = prevCount < count ? 1 : -1;
    // Fill with number unit nodes
    const prevIndex = unitNumberList.findIndex(n => n % 10 === prevValue);
    // Cut list
    const cutUnitNumberList = unit < 0 ? unitNumberList.slice(0, prevIndex + 1) : unitNumberList.slice(prevIndex);
    unitNodes = cutUnitNumberList.map((n, index) => {
      const singleUnit = n % 10;
      return /*#__PURE__*/React.createElement(UnitNumber, {
        ...props,
        key: n,
        value: singleUnit,
        offset: unit < 0 ? index - prevIndex : index,
        current: index === prevIndex
      });
    });
    // Calculate container offset value
    offsetStyle = {
      transform: `translateY(${-getOffset(prevValue, value, unit)}00%)`
    };
  }
  return /*#__PURE__*/React.createElement("span", {
    className: `${prefixCls}-only`,
    style: offsetStyle,
    onTransitionEnd: onTransitionEnd
  }, unitNodes);
};
var _default = exports.default = SingleNumber;