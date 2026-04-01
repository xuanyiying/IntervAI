"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _isVisible = _interopRequireDefault(require("@rc-component/util/lib/Dom/isVisible"));
var _ref = require("@rc-component/util/lib/ref");
var _clsx = require("clsx");
var _configProvider = require("../../config-provider");
var _reactNode = require("../reactNode");
var _style = _interopRequireDefault(require("./style"));
var _useWave = _interopRequireDefault(require("./useWave"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const Wave = props => {
  const {
    children,
    disabled,
    component,
    colorSource
  } = props;
  const {
    getPrefixCls
  } = (0, _react.useContext)(_configProvider.ConfigContext);
  const containerRef = (0, _react.useRef)(null);
  // ============================== Style ===============================
  const prefixCls = getPrefixCls('wave');
  const [, hashId] = (0, _style.default)(prefixCls);
  // =============================== Wave ===============================
  const showWave = (0, _useWave.default)(containerRef, (0, _clsx.clsx)(prefixCls, hashId), component, colorSource);
  // ============================== Effect ==============================
  _react.default.useEffect(() => {
    const node = containerRef.current;
    if (!node || node.nodeType !== window.Node.ELEMENT_NODE || disabled) {
      return;
    }
    // Click handler
    const onClick = e => {
      // Fix radio button click twice
      if (!(0, _isVisible.default)(e.target) ||
      // No need wave
      !node.getAttribute || node.getAttribute('disabled') || node.disabled || node.className.includes('disabled') && !node.className.includes('disabled:') || node.getAttribute('aria-disabled') === 'true' || node.className.includes('-leave')) {
        return;
      }
      showWave(e);
    };
    // Bind events
    node.addEventListener('click', onClick, true);
    return () => {
      node.removeEventListener('click', onClick, true);
    };
  }, [disabled]);
  // ============================== Render ==============================
  if (! /*#__PURE__*/_react.default.isValidElement(children)) {
    return children ?? null;
  }
  const ref = (0, _ref.supportRef)(children) ? (0, _ref.composeRef)((0, _ref.getNodeRef)(children), containerRef) : containerRef;
  return (0, _reactNode.cloneElement)(children, {
    ref
  });
};
if (process.env.NODE_ENV !== 'production') {
  Wave.displayName = 'Wave';
}
var _default = exports.default = Wave;