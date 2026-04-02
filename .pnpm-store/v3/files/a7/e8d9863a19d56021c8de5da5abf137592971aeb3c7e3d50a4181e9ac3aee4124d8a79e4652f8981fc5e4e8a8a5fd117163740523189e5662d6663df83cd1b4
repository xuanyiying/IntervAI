"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _clsx = require("clsx");
var _utils = require("./utils");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const Steps = props => {
  const {
    classNames,
    styles,
    size,
    steps,
    rounding: customRounding = Math.round,
    percent = 0,
    strokeWidth = 8,
    strokeColor,
    railColor,
    trailColor,
    prefixCls,
    children
  } = props;
  const current = customRounding(steps * (percent / 100));
  const stepWidth = size === 'small' ? 2 : 14;
  const mergedSize = size ?? [stepWidth, strokeWidth];
  const [width, height] = (0, _utils.getSize)(mergedSize, 'step', {
    steps,
    strokeWidth
  });
  const unitWidth = width / steps;
  const styledSteps = Array.from({
    length: steps
  });
  const mergedRailColor = railColor ?? trailColor;
  for (let i = 0; i < steps; i++) {
    const color = Array.isArray(strokeColor) ? strokeColor[i] : strokeColor;
    styledSteps[i] = /*#__PURE__*/React.createElement("div", {
      key: i,
      className: (0, _clsx.clsx)(`${prefixCls}-steps-item`, {
        [`${prefixCls}-steps-item-active`]: i <= current - 1
      }, classNames.track),
      style: {
        backgroundColor: i <= current - 1 ? color : mergedRailColor,
        width: unitWidth,
        height,
        ...styles.track
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: (0, _clsx.clsx)(`${prefixCls}-steps-body`, classNames.body),
    style: styles.body
  }, styledSteps, children);
};
var _default = exports.default = Steps;