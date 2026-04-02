"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _clsx = require("clsx");
var _hooks = require("../../_util/hooks");
var _context = require("../../config-provider/context");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const useMergedPickerSemantic = (pickerType, classNames, styles, popupClassName, popupStyle, mergedProps) => {
  const {
    classNames: contextClassNames,
    styles: contextStyles
  } = (0, _context.useComponentConfig)(pickerType);
  const [mergedClassNames, mergedStyles] = (0, _hooks.useMergeSemantic)([contextClassNames, classNames], [contextStyles, styles], {
    props: mergedProps
  }, {
    popup: {
      _default: 'root'
    }
  });
  return React.useMemo(() => {
    // ClassNames
    const filledClassNames = {
      ...mergedClassNames,
      popup: {
        ...mergedClassNames.popup,
        root: (0, _clsx.clsx)(mergedClassNames.popup?.root, popupClassName)
      }
    };
    // Styles
    const filledStyles = {
      ...mergedStyles,
      popup: {
        ...mergedStyles.popup,
        root: {
          ...mergedStyles.popup?.root,
          ...popupStyle
        }
      }
    };
    // Return
    return [filledClassNames, filledStyles];
  }, [mergedClassNames, mergedStyles, popupClassName, popupStyle]);
};
var _default = exports.default = useMergedPickerSemantic;