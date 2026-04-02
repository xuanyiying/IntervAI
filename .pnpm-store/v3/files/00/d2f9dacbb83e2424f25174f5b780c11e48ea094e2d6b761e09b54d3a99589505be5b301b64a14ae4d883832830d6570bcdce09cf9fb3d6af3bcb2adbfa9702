"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = useModeColor;
var React = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
var _locale = require("../../locale");
var _util2 = require("../util");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * Combine the `color` and `mode` to make sure sync of state.
 */
function useModeColor(defaultValue, value, mode) {
  const [locale] = (0, _locale.useLocale)('ColorPicker');
  // ======================== Base ========================
  // Color
  const [mergedColor, setMergedColor] = (0, _util.useControlledState)(defaultValue, value);
  // Mode
  const [modeState, setModeState] = React.useState('single');
  const [modeOptionList, modeSet] = React.useMemo(() => {
    const list = (Array.isArray(mode) ? mode : [mode]).filter(m => m);
    if (!list.length) {
      list.push('single');
    }
    const modes = new Set(list);
    const optionList = [];
    const pushOption = (modeType, localeTxt) => {
      if (modes.has(modeType)) {
        optionList.push({
          label: localeTxt,
          value: modeType
        });
      }
    };
    pushOption('single', locale.singleColor);
    pushOption('gradient', locale.gradientColor);
    return [optionList, modes];
  }, [mode, locale.singleColor, locale.gradientColor]);
  // ======================== Post ========================
  // We need align `mode` with `color` state
  // >>>>> Color
  const [cacheColor, setCacheColor] = React.useState(null);
  const setColor = (0, _util.useEvent)(nextColor => {
    setCacheColor(nextColor);
    setMergedColor(nextColor);
  });
  const postColor = React.useMemo(() => {
    const colorObj = (0, _util2.generateColor)(mergedColor || '');
    // Use `cacheColor` in case the color is `cleared`
    return colorObj.equals(cacheColor) ? cacheColor : colorObj;
  }, [mergedColor, cacheColor]);
  // >>>>> Mode
  const postMode = React.useMemo(() => {
    if (modeSet.has(modeState)) {
      return modeState;
    }
    return modeOptionList[0]?.value;
  }, [modeSet, modeState, modeOptionList]);
  // ======================= Effect =======================
  // Dynamic update mode when color change
  React.useEffect(() => {
    setModeState(postColor.isGradient() ? 'gradient' : 'single');
  }, [postColor]);
  // ======================= Return =======================
  return [postColor, setColor, postMode, setModeState, modeOptionList];
}