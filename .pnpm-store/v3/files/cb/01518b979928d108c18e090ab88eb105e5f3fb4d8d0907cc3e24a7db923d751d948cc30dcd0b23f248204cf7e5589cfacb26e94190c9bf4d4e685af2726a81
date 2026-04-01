"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
var _raf = _interopRequireDefault(require("@rc-component/util/lib/raf"));
var _configProvider = require("../../config-provider");
var _useToken = _interopRequireDefault(require("../../theme/useToken"));
var _interface = require("./interface");
var _WaveEffect = _interopRequireDefault(require("./WaveEffect"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const useWave = (nodeRef, className, component, colorSource) => {
  const {
    wave
  } = React.useContext(_configProvider.ConfigContext);
  const [, token, hashId] = (0, _useToken.default)();
  const showWave = (0, _util.useEvent)(event => {
    const node = nodeRef.current;
    if (wave?.disabled || !node) {
      return;
    }
    const targetNode = node.querySelector(`.${_interface.TARGET_CLS}`) || node;
    const {
      showEffect
    } = wave || {};
    // Customize wave effect
    (showEffect || _WaveEffect.default)(targetNode, {
      className,
      token,
      component,
      event,
      hashId,
      colorSource
    });
  });
  const rafId = React.useRef(null);
  // Merge trigger event into one for each frame
  const showDebounceWave = event => {
    _raf.default.cancel(rafId.current);
    rafId.current = (0, _raf.default)(() => {
      showWave(event);
    });
  };
  return showDebounceWave;
};
var _default = exports.default = useWave;