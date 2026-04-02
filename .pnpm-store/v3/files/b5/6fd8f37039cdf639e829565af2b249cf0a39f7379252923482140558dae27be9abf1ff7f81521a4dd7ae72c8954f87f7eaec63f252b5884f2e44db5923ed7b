"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
var _reactNode = require("../_util/reactNode");
var _Statistic = _interopRequireDefault(require("./Statistic"));
var _utils = require("./utils");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const UPDATE_INTERVAL = 1000 / 60;
function getTime(value) {
  return new Date(value).getTime();
}
const StatisticTimer = props => {
  const {
    value,
    format = 'HH:mm:ss',
    onChange,
    onFinish,
    type,
    ...rest
  } = props;
  const down = type === 'countdown';
  // We reuse state here to do same as `forceUpdate`
  const [showTime, setShowTime] = React.useState(null);
  // ======================== Update ========================
  const update = (0, _util.useEvent)(() => {
    const now = Date.now();
    const timestamp = getTime(value);
    setShowTime({});
    const timeDiff = !down ? now - timestamp : timestamp - now;
    onChange?.(timeDiff);
    // Only countdown will trigger `onFinish`
    if (down && timestamp < now) {
      onFinish?.();
      return false;
    }
    return true;
  });
  // Effect trigger
  React.useEffect(() => {
    let intervalId;
    const tick = () => {
      if (!update()) {
        window.clearInterval(intervalId);
      }
    };
    const startTimer = () => {
      intervalId = window.setInterval(tick, UPDATE_INTERVAL);
    };
    const stopTimer = () => {
      window.clearInterval(intervalId);
    };
    startTimer();
    return () => {
      stopTimer();
    };
  }, [value, down]);
  React.useEffect(() => {
    setShowTime({});
  }, []);
  // ======================== Format ========================
  const formatter = (formatValue, config) => showTime ? (0, _utils.formatCounter)(formatValue, {
    ...config,
    format
  }, down) : '-';
  const valueRender = node => (0, _reactNode.cloneElement)(node, {
    title: undefined
  });
  // ======================== Render ========================
  return /*#__PURE__*/React.createElement(_Statistic.default, {
    ...rest,
    value: value,
    valueRender: valueRender,
    formatter: formatter
  });
};
var _default = exports.default = StatisticTimer;