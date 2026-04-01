"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
var _copy = _interopRequireDefault(require("../../_util/copy"));
var _toList = _interopRequireDefault(require("../../_util/toList"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const useCopyClick = ({
  copyConfig,
  children
}) => {
  const [copied, setCopied] = React.useState(false);
  const [copyLoading, setCopyLoading] = React.useState(false);
  const copyIdRef = React.useRef(null);
  const cleanCopyId = () => {
    if (copyIdRef.current) {
      clearTimeout(copyIdRef.current);
    }
  };
  const copyOptions = {};
  if (copyConfig.format) {
    copyOptions.format = copyConfig.format;
  }
  React.useEffect(() => cleanCopyId, []);
  // Keep copy action up to date
  const onClick = (0, _util.useEvent)(async e => {
    e?.preventDefault();
    e?.stopPropagation();
    setCopyLoading(true);
    try {
      const text = typeof copyConfig.text === 'function' ? await copyConfig.text() : copyConfig.text;
      await (0, _copy.default)(text || (0, _toList.default)(children, true).join('') || '', copyOptions);
      setCopyLoading(false);
      setCopied(true);
      // Trigger tips update
      cleanCopyId();
      copyIdRef.current = setTimeout(() => {
        setCopied(false);
      }, 3000);
      copyConfig.onCopy?.(e);
    } catch (error) {
      setCopyLoading(false);
      throw error;
    }
  });
  return {
    copied,
    copyLoading,
    onClick
  };
};
var _default = exports.default = useCopyClick;