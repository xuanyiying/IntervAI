"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = scrollTo;
var _raf = _interopRequireDefault(require("@rc-component/util/lib/raf"));
var _easings = require("./easings");
var _getScroll = _interopRequireWildcard(require("./getScroll"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function scrollTo(y, options = {}) {
  const {
    getContainer = () => window,
    callback,
    duration = 450
  } = options;
  const container = getContainer();
  const scrollTop = (0, _getScroll.default)(container);
  const startTime = Date.now();
  const frameFunc = () => {
    const timestamp = Date.now();
    const time = timestamp - startTime;
    const nextScrollTop = (0, _easings.easeInOutCubic)(time > duration ? duration : time, scrollTop, y, duration);
    if ((0, _getScroll.isWindow)(container)) {
      container.scrollTo(window.pageXOffset, nextScrollTop);
    } else if (container instanceof Document || container.constructor.name === 'HTMLDocument') {
      container.documentElement.scrollTop = nextScrollTop;
    } else {
      container.scrollTop = nextScrollTop;
    }
    if (time < duration) {
      (0, _raf.default)(frameFunc);
    } else if (typeof callback === 'function') {
      callback();
    }
  };
  (0, _raf.default)(frameFunc);
}